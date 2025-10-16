import "dotenv/config.js";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { body, param, validationResult } from "express-validator";
import { getPool, sql } from "./db.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, max: 200 }));

function check(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
}

// -------- Surveys (list/create/update) --------
app.get("/api/surveys", async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT id, slug, title, is_active FROM dbo.surveys ORDER BY created_at DESC
    `);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/api/surveys",
  body("slug").isString().notEmpty(),
  body("title").isString().notEmpty(),
  body("isActive").isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { slug, title, isActive } = req.body;
    try {
      const pool = await getPool();
      const ins = await pool.request()
        .input("slug", sql.NVarChar(100), slug)
        .input("title", sql.NVarChar(200), title)
        .input("is_active", sql.Bit, isActive ? 1 : 0)
        .query(`INSERT INTO dbo.surveys(slug, title, is_active) OUTPUT inserted.id VALUES(@slug, @title, @is_active)`);
      res.json({ id: ins.recordset[0].id });
    } catch (e) { res.status(400).json({ message: e.message }); }
  }
);

app.put("/api/surveys/:id",
  param("id").isInt(),
  body("slug").isString().notEmpty(),
  body("title").isString().notEmpty(),
  body("isActive").isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const { slug, title, isActive } = req.body;
    try {
      const pool = await getPool();
      await pool.request()
        .input("id", sql.Int, Number(id))
        .input("slug", sql.NVarChar(100), slug)
        .input("title", sql.NVarChar(200), title)
        .input("is_active", sql.Bit, isActive ? 1 : 0)
        .query(`UPDATE dbo.surveys SET slug=@slug, title=@title, is_active=@is_active WHERE id=@id`);
      res.json({ ok: true });
    } catch (e) { res.status(400).json({ message: e.message }); }
  }
);

// -------- Delete survey --------
app.delete("/api/surveys/:id",
  param("id").isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    try {
      const pool = await getPool();
      await pool.request()
        .input("id", sql.Int, Number(id))
        .query(`DELETE FROM dbo.surveys WHERE id=@id`);
      res.json({ ok: true });
    } catch (e) { res.status(400).json({ message: e.message }); }
  }
);

// -------- Survey by slug (structure) --------
app.get("/api/surveys/:slug",
  param("slug").isString().trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { slug } = req.params;
    try {
      const pool = await getPool();

      const s = await pool.request()
        .input("slug", sql.NVarChar(100), slug)
        .query(`SELECT id, slug, title, is_active FROM dbo.surveys WHERE slug=@slug`);

      if (s.recordset.length === 0) return res.status(404).json({ message: "Anket bulunamadı" });
      const survey = s.recordset[0];
      if (!survey.is_active) return res.status(403).json({ message: "Anket aktif değil" });

      const q = await pool.request()
        .input("sid", sql.Int, survey.id)
        .query(`SELECT id, section_id, ord, label, type, required, options_json, conditional_logic FROM dbo.questions WHERE survey_id=@sid ORDER BY ord ASC;`);

      const sections = await pool.request()
        .input("sid", sql.Int, survey.id)
        .query(`SELECT id, name, ord FROM dbo.survey_sections WHERE survey_id=@sid ORDER BY ord ASC;`);

      res.json({ survey, questions: q.recordset, sections: sections.recordset });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

// -------- Survey stats by ID --------
app.get("/api/surveys/:id/stats",
  param("id").isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    try {
      const pool = await getPool();
      const stats = await pool.request()
        .input("sid", sql.Int, Number(id))
        .query(`
          SELECT 
            (SELECT COUNT(*) FROM dbo.responses WHERE survey_id=@sid) as total_responses,
            (SELECT COUNT(*) FROM dbo.questions WHERE survey_id=@sid) as total_questions,
            (SELECT COUNT(*) FROM dbo.invitations WHERE survey_id=@sid) as total_invitations,
            (SELECT COUNT(*) FROM dbo.invitations WHERE survey_id=@sid AND used_at IS NOT NULL) as used_invitations
        `);
      res.json(stats.recordset[0]);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
);

// -------- Export survey responses to XLSX --------
app.get("/api/surveys/:id/export",
  param("id").isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    try {
      const pool = await getPool();
      
      // Anket bilgisi
      const surveyRes = await pool.request()
        .input("id", sql.Int, Number(id))
        .query(`SELECT slug, title FROM dbo.surveys WHERE id=@id`);
      if (surveyRes.recordset.length === 0) return res.status(404).json({ message: "Anket bulunamadı" });
      const survey = surveyRes.recordset[0];

      // Sorular
      const questions = await pool.request()
        .input("sid", sql.Int, Number(id))
        .query(`SELECT id, ord, label FROM dbo.questions WHERE survey_id=@sid ORDER BY ord`);
      
      // Yanıtlar
      const responses = await pool.request()
        .input("sid", sql.Int, Number(id))
        .query(`
          SELECT r.id as response_id, r.email, r.submitted_at,
                 a.question_id, a.value_text
          FROM dbo.responses r
          LEFT JOIN dbo.answers a ON a.response_id = r.id
          WHERE r.survey_id=@sid
          ORDER BY r.id, a.question_id
        `);

      // Veriyi düzenle
      const responseMap = {};
      responses.recordset.forEach(row => {
        if (!responseMap[row.response_id]) {
          responseMap[row.response_id] = {
            email: row.email,
            submitted_at: row.submitted_at
          };
        }
        if (row.question_id) {
          responseMap[row.response_id][`Q${row.question_id}`] = row.value_text || "";
        }
      });

      // Excel için veri hazırla
      const wsData = [];
      const header = ["E-posta", "Gönderim Tarihi"];
      questions.recordset.forEach(q => {
        header.push(`${q.ord}. ${q.label}`);
      });
      wsData.push(header);

      Object.values(responseMap).forEach(resp => {
        const row = [resp.email, resp.submitted_at];
        questions.recordset.forEach(q => {
          row.push(resp[`Q${q.id}`] || "");
        });
        wsData.push(row);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Yanıtlar");
      
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Disposition", `attachment; filename="${survey.slug}-responses.xlsx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buffer);
    } catch (e) { 
      console.error(e);
      res.status(500).json({ message: e.message }); 
    }
  }
);

// -------- Survey Sections CRUD --------
app.get("/api/surveys/:surveyId/sections",
  param("surveyId").isInt(),
  async (req, res) => {
    const { surveyId } = req.params;
    try {
      const pool = await getPool();
      const r = await pool.request()
        .input("sid", sql.Int, Number(surveyId))
        .query(`SELECT id, name, ord FROM dbo.survey_sections WHERE survey_id=@sid ORDER BY ord ASC`);
      res.json(r.recordset);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
);

app.post("/api/surveys/:surveyId/sections",
  param("surveyId").isInt(),
  body("name").isString().notEmpty(),
  body("ord").isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { surveyId } = req.params;
    const { name, ord } = req.body;
    try {
      const pool = await getPool();
      const ins = await pool.request()
        .input("sid", sql.Int, Number(surveyId))
        .input("name", sql.NVarChar(200), name)
        .input("ord", sql.Int, ord)
        .query(`INSERT INTO dbo.survey_sections(survey_id, name, ord) OUTPUT inserted.id VALUES(@sid, @name, @ord)`);
      res.json({ id: ins.recordset[0].id });
    } catch (e) { res.status(400).json({ message: e.message }); }
  }
);

app.delete("/api/sections/:id",
  param("id").isInt(),
  async (req, res) => {
    const { id } = req.params;
    try {
      const pool = await getPool();
      // Önce bu bölüme ait soruların section_id'sini NULL yap
      await pool.request()
        .input("secId", sql.Int, Number(id))
        .query(`UPDATE dbo.questions SET section_id=NULL WHERE section_id=@secId`);
      // Sonra bölümü sil
      await pool.request()
        .input("id", sql.Int, Number(id))
        .query(`DELETE FROM dbo.survey_sections WHERE id=@id`);
      res.json({ ok: true });
    } catch (e) { res.status(400).json({ message: e.message }); }
  }
);

// -------- Questions bulk upsert (section_id ve conditional_logic desteği eklendi) --------
app.post("/api/questions/bulk",
  body("surveyId").isInt({ min: 1 }),
  body("items").isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { surveyId, items } = req.body;
    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    try {
      await tx.begin();

      const reqTx = new sql.Request(tx);
      const existing = await reqTx
        .input("sid", sql.Int, surveyId)
        .query(`SELECT id FROM dbo.questions WHERE survey_id=@sid`);
      const existingIds = new Set(existing.recordset.map(r => r.id));
      const incomingIds = new Set(items.filter(i=>i.id>0).map(i=>i.id));

      // delete missing
      for (const id of existingIds) {
        if (!incomingIds.has(id)) {
          await new sql.Request(tx)
            .input("id", sql.Int, id)
            .query(`DELETE FROM dbo.questions WHERE id=@id`);
        }
      }
      // upsert
      for (const it of items) {
        const { id, section_id, ord, label, type, required, options_json, conditional_logic } = it;
        if (id && existingIds.has(id)) {
          await new sql.Request(tx)
            .input("id", sql.Int, id)
            .input("section_id", sql.Int, section_id || null)
            .input("ord", sql.Int, ord)
            .input("label", sql.NVarChar(400), label)
            .input("type", sql.NVarChar(20), type)
            .input("required", sql.Bit, required ? 1 : 0)
            .input("options_json", sql.NVarChar(sql.MAX), options_json)
            .input("conditional_logic", sql.NVarChar(sql.MAX), conditional_logic)
            .query(`UPDATE dbo.questions
                    SET section_id=@section_id, ord=@ord, label=@label, type=@type, required=@required, options_json=@options_json, conditional_logic=@conditional_logic
                    WHERE id=@id`);
        } else {
          await new sql.Request(tx)
            .input("sid", sql.Int, surveyId)
            .input("section_id", sql.Int, section_id || null)
            .input("ord", sql.Int, ord)
            .input("label", sql.NVarChar(400), label)
            .input("type", sql.NVarChar(20), type)
            .input("required", sql.Bit, required ? 1 : 0)
            .input("options_json", sql.NVarChar(sql.MAX), options_json)
            .input("conditional_logic", sql.NVarChar(sql.MAX), conditional_logic)
            .query(`INSERT INTO dbo.questions(survey_id, section_id, ord, label, type, required, options_json, conditional_logic)
                    VALUES(@sid, @section_id, @ord, @label, @type, @required, @options_json, @conditional_logic)`);
        }
      }

      await tx.commit();
      res.json({ ok: true });
    } catch (e) {
      try { await tx.rollback(); } catch {}
      res.status(400).json({ message: e.message });
    }
  }
);

// -------- Invitations (token) --------
app.post("/api/invitations",
  body("surveySlug").isString().notEmpty(),
  body("email").isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { surveySlug, email } = req.body;
    const token = uuidv4();
    try {
      const pool = await getPool();
      const s = await pool.request()
        .input("slug", sql.NVarChar(100), surveySlug)
        .query(`SELECT id FROM dbo.surveys WHERE slug=@slug`);
      if (s.recordset.length === 0) return res.status(404).json({ message: "Anket bulunamadı" });
      const surveyId = s.recordset[0].id;

      await pool.request()
        .input("sid", sql.Int, surveyId)
        .input("email", sql.NVarChar(320), email)
        .input("token", sql.Char(36), token)
        .query(`INSERT INTO dbo.invitations(survey_id, email, token) VALUES(@sid, @email, @token);`);

      res.json({ token, link: `/s/${token}` });
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
);

// -------- Submit response via Stored Procedure --------
app.post("/api/responses",
  body("surveySlug").isString().notEmpty(),
  body("email").isEmail(),
  body("answers").isArray({ min: 1 }),
  body("token").optional({ nullable: true, checkFalsy: true }).isUUID(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { surveySlug, email, token, answers } = req.body;
    try {
      const pool = await getPool();
      await pool.request()
        .input("survey_slug", sql.NVarChar(100), surveySlug)
        .input("email", sql.NVarChar(320), email)
        .input("token", sql.Char(36), token || null)
        .input("answers", sql.NVarChar(sql.MAX), JSON.stringify(answers))
        .execute("dbo.sp_submit_response");
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ ok: false, message: e.message });
    }
  }
);

// -------- Static files --------
app.use(express.static(path.join(__dirname, "..", "public")));
app.get("/s/:token", (req, res) => {
  // Rewrite to index with query ?token=
  const t = req.params.token;
  res.redirect(`/?token=${t}`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
