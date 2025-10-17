import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import XLSX from 'xlsx';

import { getPool, sql } from '../db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { logger } from '../middlewares/logger.js';
import { rlWrite } from '../middlewares/rateLimit.js';
import { ok, fail } from '../utils/responses.js';
import { sendInvitationEmail } from '../utils/email.js';

const router = express.Router();

// Validation helper
function check(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((e) => `${e.path}: ${e.msg}`)
      .join(', ');
    return fail(res, errorMessages, 400);
  }
  return null;
}

// -------- Surveys (list/create/update/delete) --------
router.get('/surveys', async (req, res, next) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT 
        s.id, 
        s.slug, 
        s.title, 
        s.is_active,
        COUNT(DISTINCT r.id) AS total_responses,
        COUNT(DISTINCT i.id) AS total_invitations,
        COUNT(DISTINCT CASE WHEN i.used_at IS NOT NULL THEN i.id END) AS used_invitations
      FROM dbo.surveys s
      LEFT JOIN dbo.responses r ON r.survey_id = s.id
      LEFT JOIN dbo.invitations i ON i.survey_id = s.id
      GROUP BY s.id, s.slug, s.title, s.is_active, s.created_at
      ORDER BY s.created_at DESC
    `);
    return ok(res, r.recordset);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/surveys',
  requireAuth,
  requireRole('admin'),
  rlWrite,
  body('slug').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('isActive').isBoolean(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;
    const { slug, title, isActive } = req.body;
    try {
      const pool = await getPool();
      const ins = await pool
        .request()
        .input('slug', sql.NVarChar(100), slug)
        .input('title', sql.NVarChar(200), title)
        .input('is_active', sql.Bit, isActive ? 1 : 0)
        .query(
          `INSERT INTO dbo.surveys(slug, title, is_active) OUTPUT inserted.id VALUES(@slug, @title, @is_active)`,
        );
      return ok(res, { id: ins.recordset[0].id }, 201);
    } catch (e) {
      next(e);
    }
  },
);

router.put(
  '/surveys/:id',
  requireAuth,
  requireRole('admin'),
  rlWrite,
  param('id').isInt(),
  body('slug').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('isActive').isBoolean(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;
    const { id } = req.params;
    const { slug, title, isActive } = req.body;
    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id', sql.Int, Number(id))
        .input('slug', sql.NVarChar(100), slug)
        .input('title', sql.NVarChar(200), title)
        .input('is_active', sql.Bit, isActive ? 1 : 0)
        .query(
          `UPDATE dbo.surveys SET slug=@slug, title=@title, is_active=@is_active WHERE id=@id`,
        );
      return ok(res, { ok: true });
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  '/surveys/:id',
  requireAuth,
  requireRole('admin'),
  rlWrite,
  param('id').isInt(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;
    const { id } = req.params;
    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id', sql.Int, Number(id))
        .query(`DELETE FROM dbo.surveys WHERE id=@id`);
      return ok(res, { ok: true });
    } catch (e) {
      next(e);
    }
  },
);

// -------- Survey stats by ID --------
router.get(
  '/surveys/:id/stats',
  param('id').isInt(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;
    const { id } = req.params;
    try {
      const pool = await getPool();
      const stats = await pool.request().input('sid', sql.Int, Number(id))
        .query(`
          SELECT 
            (SELECT COUNT(*) FROM dbo.responses WHERE survey_id=@sid) as total_responses,
            (SELECT COUNT(*) FROM dbo.questions WHERE survey_id=@sid) as total_questions,
            (SELECT COUNT(*) FROM dbo.invitations WHERE survey_id=@sid) as total_invitations,
            (SELECT COUNT(*) FROM dbo.invitations WHERE survey_id=@sid AND used_at IS NOT NULL) as used_invitations
        `);
      return ok(res, stats.recordset[0]);
    } catch (e) {
      next(e);
    }
  },
);

// -------- Export survey responses to XLSX --------
router.get(
  '/surveys/:id/export',
  requireAuth,
  requireRole('admin'),
  param('id').isInt(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;
    const { id } = req.params;
    try {
      const pool = await getPool();

      // Anket bilgisi
      const surveyRes = await pool
        .request()
        .input('id', sql.Int, Number(id))
        .query(`SELECT slug, title FROM dbo.surveys WHERE id=@id`);
      if (surveyRes.recordset.length === 0)
        return fail(res, 'Anket bulunamadı', 404);
      const survey = surveyRes.recordset[0];

      // Sorular
      const questions = await pool
        .request()
        .input('sid', sql.Int, Number(id))
        .query(
          `SELECT id, ord, label FROM dbo.questions WHERE survey_id=@sid ORDER BY ord`,
        );

      // Yanıtlar
      const responses = await pool.request().input('sid', sql.Int, Number(id))
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
      responses.recordset.forEach((row) => {
        if (!responseMap[row.response_id]) {
          responseMap[row.response_id] = {
            email: row.email,
            submitted_at: row.submitted_at,
          };
        }
        if (row.question_id) {
          responseMap[row.response_id][`Q${row.question_id}`] =
            row.value_text || '';
        }
      });

      // Excel için veri hazırla
      const wsData = [];
      const header = ['E-posta', 'Gönderim Tarihi'];
      questions.recordset.forEach((q) => {
        header.push(`${q.ord}. ${q.label}`);
      });
      wsData.push(header);

      Object.values(responseMap).forEach((resp) => {
        const row = [resp.email, resp.submitted_at];
        questions.recordset.forEach((q) => {
          row.push(resp[`Q${q.id}`] || '');
        });
        wsData.push(row);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Yanıtlar');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Timestamp for unique filename
      const timestamp = new Date()
        .toISOString()
        .split('T')[0]
        .replace(/-/g, '');
      const filename = `${survey.slug}-export-${timestamp}.xlsx`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.send(buffer);
    } catch (e) {
      // Log details for debugging
      logger.error('Export failed', {
        surveyId: req.params.id,
        error: e.message,
        stack: e.stack,
        user: req.user?.email,
      });
      
      // Return generic error in production
      e.statusCode = 500;
      e.message =
        process.env.NODE_ENV === 'production'
          ? 'Export failed'
          : e.message;
      next(e);
    }
  },
);

// -------- Send Invitations --------
router.post(
  '/surveys/:id/invitations',
  requireAuth,
  requireRole('admin'),
  rlWrite,
  param('id').isInt(),
  body('emails').isArray().withMessage('emails must be an array'),
  body('emails.*').isEmail().withMessage('Invalid email format'),
  body('message').optional().isString(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;
    const { id } = req.params;
    const { emails, message } = req.body;

    try {
      const pool = await getPool();

      // Check survey exists
      const surveyRes = await pool
        .request()
        .input('id', sql.Int, Number(id))
        .query(`SELECT slug, title, is_active FROM dbo.surveys WHERE id=@id`);
      if (surveyRes.recordset.length === 0) {
        return fail(res, 'Anket bulunamadı', 404);
      }
      const survey = surveyRes.recordset[0];
      if (!survey.is_active) {
        return fail(res, 'Anket aktif değil', 400);
      }

      const invitations = [];
      const surveyUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/?survey=${survey.slug}`;
      const defaultMessage = `Merhaba,\n\n${survey.title} anketine katılmanızı rica ediyoruz.\n\nAnket linki: ${surveyUrl}&token={{TOKEN}}\n\nTeşekkürler.`;
      const emailMessage = message || defaultMessage;

      // Insert invitations
      // eslint-disable-next-line no-restricted-syntax
      for (const email of emails) {
        const token = uuidv4();
        // eslint-disable-next-line no-await-in-loop
        await pool
          .request()
          .input('survey_id', sql.Int, Number(id))
          .input('email', sql.NVarChar(320), email)
          .input('token', sql.Char(36), token)
          .query(
            `INSERT INTO dbo.invitations (survey_id, email, token) VALUES (@survey_id, @email, @token)`,
          );

        const personalizedMessage = emailMessage.replace('{{TOKEN}}', token);
        const invitationUrl = `${surveyUrl}&token=${token}`;
        invitations.push({ email, token, message: personalizedMessage });

        // Send email
        try {
          // eslint-disable-next-line no-await-in-loop
          await sendInvitationEmail({
            to: email,
            surveyTitle: survey.title,
            surveyUrl: invitationUrl,
            message: personalizedMessage,
          });
        } catch (emailError) {
          logger.error('Email send failed for invitation', {
            surveyId: id,
            email,
            error: emailError.message,
          });
          // Continue with other emails even if one fails
        }
      }

      return ok(res, {
        sent: invitations.length,
        invitations: invitations.map((inv) => ({
          email: inv.email,
          url: `${surveyUrl}&token=${inv.token}`,
        })),
      });
    } catch (e) {
      logger.error('Send invitations failed', {
        surveyId: req.params.id,
        error: e.message,
        stack: e.stack,
      });
      e.statusCode = 500;
      e.message =
        process.env.NODE_ENV === 'production'
          ? 'Failed to send invitations'
          : e.message;
      next(e);
    }
  },
);

// -------- Survey Sections CRUD --------
router.get(
  '/surveys/:surveyId/sections',
  param('surveyId').isInt(),
  async (req, res, next) => {
    const { surveyId } = req.params;
    try {
      const pool = await getPool();
      const r = await pool
        .request()
        .input('sid', sql.Int, Number(surveyId))
        .query(
          `SELECT id, name, ord FROM dbo.survey_sections WHERE survey_id=@sid ORDER BY ord ASC`,
        );
      return ok(res, r.recordset);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  '/surveys/:surveyId/sections',
  requireAuth,
  requireRole('admin'),
  rlWrite,
  param('surveyId').isInt(),
  body('name').isString().notEmpty(),
  body('ord').isInt(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;
    const { surveyId } = req.params;
    const { name, ord } = req.body;
    try {
      const pool = await getPool();
      const ins = await pool
        .request()
        .input('sid', sql.Int, Number(surveyId))
        .input('name', sql.NVarChar(200), name)
        .input('ord', sql.Int, ord)
        .query(
          `INSERT INTO dbo.survey_sections(survey_id, name, ord) OUTPUT inserted.id VALUES(@sid, @name, @ord)`,
        );
      return ok(res, { id: ins.recordset[0].id }, 201);
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  '/sections/:id',
  requireAuth,
  requireRole('admin'),
  rlWrite,
  param('id').isInt(),
  async (req, res, next) => {
    const { id } = req.params;
    try {
      const pool = await getPool();
      // Önce bu bölüme ait soruların section_id'sini NULL yap
      await pool
        .request()
        .input('secId', sql.Int, Number(id))
        .query(
          `UPDATE dbo.questions SET section_id=NULL WHERE section_id=@secId`,
        );
      // Sonra bölümü sil
      await pool
        .request()
        .input('id', sql.Int, Number(id))
        .query(`DELETE FROM dbo.survey_sections WHERE id=@id`);
      return ok(res, { ok: true });
    } catch (e) {
      next(e);
    }
  },
);

// -------- Questions bulk upsert --------
router.post(
  '/questions/bulk',
  requireAuth,
  requireRole('admin'),
  rlWrite,
  body('surveyId').isInt({ min: 1 }),
  body('items').isArray(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;

    const { surveyId, items } = req.body;
    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    try {
      await tx.begin();

      const reqTx = new sql.Request(tx);
      const existing = await reqTx
        .input('sid', sql.Int, surveyId)
        .query(`SELECT id FROM dbo.questions WHERE survey_id=@sid`);
      const existingIds = new Set(existing.recordset.map((r) => r.id));
      const incomingIds = new Set(
        items.filter((i) => i.id > 0).map((i) => i.id),
      );

      // delete missing (sequential - transaction içinde paralel query deadlock riski)
      // eslint-disable-next-line no-restricted-syntax
      for (const id of existingIds) {
        if (!incomingIds.has(id)) {
          // eslint-disable-next-line no-await-in-loop
          await new sql.Request(tx)
            .input('id', sql.Int, id)
            .query(`DELETE FROM dbo.questions WHERE id=@id`);
        }
      }

      // upsert (sequential - transaction safety)
      // eslint-disable-next-line no-restricted-syntax
      for (const it of items) {
        const {
          id,
          section_id: sectionId,
          ord,
          label,
          type,
          required,
          options_json: optionsJson,
          conditional_logic: conditionalLogic,
        } = it;
        if (id && existingIds.has(id)) {
          // eslint-disable-next-line no-await-in-loop
          await new sql.Request(tx)
            .input('id', sql.Int, id)
            .input('section_id', sql.Int, sectionId || null)
            .input('ord', sql.Int, ord)
            .input('label', sql.NVarChar(400), label)
            .input('type', sql.NVarChar(20), type)
            .input('required', sql.Bit, required ? 1 : 0)
            .input('options_json', sql.NVarChar(sql.MAX), optionsJson)
            .input('conditional_logic', sql.NVarChar(sql.MAX), conditionalLogic)
            .query(`UPDATE dbo.questions
                    SET section_id=@section_id, ord=@ord, label=@label, type=@type, required=@required, options_json=@options_json, conditional_logic=@conditional_logic
                    WHERE id=@id`);
        } else {
          // eslint-disable-next-line no-await-in-loop
          await new sql.Request(tx)
            .input('sid', sql.Int, surveyId)
            .input('section_id', sql.Int, sectionId || null)
            .input('ord', sql.Int, ord)
            .input('label', sql.NVarChar(400), label)
            .input('type', sql.NVarChar(20), type)
            .input('required', sql.Bit, required ? 1 : 0)
            .input('options_json', sql.NVarChar(sql.MAX), optionsJson)
            .input('conditional_logic', sql.NVarChar(sql.MAX), conditionalLogic)
            .query(`INSERT INTO dbo.questions(survey_id, section_id, ord, label, type, required, options_json, conditional_logic)
                    VALUES(@sid, @section_id, @ord, @label, @type, @required, @options_json, @conditional_logic)`);
        }
      }

      await tx.commit();
      return ok(res, { ok: true });
    } catch (e) {
      try {
        await tx.rollback();
      } catch {
        // Rollback failed, ignore
      }
      next(e);
    }
  },
);

// -------- Invitations (token) --------
router.post(
  '/invitations',
  requireAuth,
  requireRole('admin'),
  rlWrite,
  body('surveySlug').isString().notEmpty(),
  body('email').isEmail(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;

    const { surveySlug, email } = req.body;
    const token = uuidv4();
    try {
      const pool = await getPool();
      const s = await pool
        .request()
        .input('slug', sql.NVarChar(100), surveySlug)
        .query(`SELECT id FROM dbo.surveys WHERE slug=@slug`);
      if (s.recordset.length === 0) return fail(res, 'Anket bulunamadı', 404);
      const surveyId = s.recordset[0].id;

      await pool
        .request()
        .input('sid', sql.Int, surveyId)
        .input('email', sql.NVarChar(320), email)
        .input('token', sql.Char(36), token)
        .query(
          `INSERT INTO dbo.invitations(survey_id, email, token) VALUES(@sid, @email, @token);`,
        );

      return ok(res, { token, link: `/s/${token}` }, 201);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
