import express from 'express';
import { body, param, validationResult } from 'express-validator';

import { getPool, sql } from '../db.js';
import { rlWrite } from '../middlewares/rateLimit.js';
import { ok, fail } from '../utils/responses.js';

const router = express.Router();

// Validation helper
function check(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 'Validation error', 400);
  }
  return null;
}

// -------- Survey by slug (structure) --------
router.get(
  '/surveys/:slug',
  param('slug').isString().trim().notEmpty(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;

    const { slug } = req.params;
    try {
      const pool = await getPool();

      const s = await pool
        .request()
        .input('slug', sql.NVarChar(100), slug)
        .query(
          `SELECT id, slug, title, is_active FROM dbo.surveys WHERE slug=@slug`,
        );

      if (s.recordset.length === 0) return fail(res, 'Anket bulunamadı', 404);
      const survey = s.recordset[0];
      if (!survey.is_active) return fail(res, 'Anket aktif değil', 403);

      const q = await pool
        .request()
        .input('sid', sql.Int, survey.id)
        .query(
          `SELECT id, section_id, ord, label, type, required, options_json, conditional_logic FROM dbo.questions WHERE survey_id=@sid ORDER BY ord ASC;`,
        );

      const sections = await pool
        .request()
        .input('sid', sql.Int, survey.id)
        .query(
          `SELECT id, name, ord FROM dbo.survey_sections WHERE survey_id=@sid ORDER BY ord ASC;`,
        );

      return ok(res, {
        survey,
        questions: q.recordset,
        sections: sections.recordset,
      });
    } catch (e) {
      next(e);
    }
  },
);

// -------- Submit response via Stored Procedure --------
router.post(
  '/responses',
  rlWrite,
  body('surveySlug').isString().notEmpty(),
  body('email').isEmail(),
  body('answers').isArray({ min: 1 }),
  body('token').optional({ nullable: true, checkFalsy: true }).isUUID(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;

    const { surveySlug, email, token, answers } = req.body;
    try {
      const pool = await getPool();
      await pool
        .request()
        .input('survey_slug', sql.NVarChar(100), surveySlug)
        .input('email', sql.NVarChar(320), email)
        .input('token', sql.Char(36), token || null)
        .input('answers', sql.NVarChar(sql.MAX), JSON.stringify(answers))
        .execute('dbo.sp_submit_response');
      return ok(res, { success: true }, 201);
    } catch (e) {
      // Stored procedure'den gelen hatayı next'e ilet (error handler yakalayacak)
      e.statusCode = 400;
      next(e);
    }
  },
);

// -------- Get invitation info by token --------
router.get(
  '/invitations/:token',
  param('token').isUUID(),
  async (req, res, next) => {
    const err = check(req, res);
    if (err) return;

    const { token } = req.params;
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('token', sql.Char(36), token)
        .query(
          `SELECT i.email, s.slug, s.title, i.used_at 
           FROM dbo.invitations i 
           JOIN dbo.surveys s ON s.id = i.survey_id 
           WHERE i.token = @token`,
        );

      if (result.recordset.length === 0) {
        return fail(res, 'Geçersiz davetiye', 404);
      }

      const invitation = result.recordset[0];
      if (invitation.used_at) {
        return fail(res, 'Bu davetiye daha önce kullanılmış', 400);
      }

      return ok(res, {
        email: invitation.email,
        surveySlug: invitation.slug,
        surveyTitle: invitation.title,
      });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
