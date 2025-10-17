import express from 'express';
import { body, validationResult } from 'express-validator';

import { generateToken } from '../middlewares/auth.js';
import { rlBruteforce } from '../middlewares/rateLimit.js';
import { ok, fail } from '../utils/responses.js';

const router = express.Router();

// Demo statik kullanıcılar (Gerçek uygulamada DB'den gelir)
const DEMO_USERS = [
  {
    id: 1,
    email: 'admin@example.com',
    password: 'admin123', // Gerçek uygulamada bcrypt hash kullanılmalı
    role: 'admin',
    name: 'Admin User',
  },
  {
    id: 2,
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
    name: 'Regular User',
  },
];

/**
 * POST /api/auth/login
 * Demo login endpoint - statik kullanıcılarla JWT döndürür
 */
router.post(
  '/login',
  rlBruteforce,
  body('email').isEmail(),
  body('password').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return fail(res, 'Invalid email or password', 400);
      }

      const { email, password } = req.body;

      // Kullanıcıyı bul
      const user = DEMO_USERS.find(
        (u) => u.email === email && u.password === password,
      );

      if (!user) {
        return fail(res, 'Invalid email or password', 401);
      }

      // JWT token oluştur
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      return ok(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
          },
        },
        200,
      );
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/auth/me
 * Mevcut kullanıcı bilgisini döndür (token gerekli)
 */
router.get('/me', async (req, res, next) => {
  try {
    // requireAuth middleware tarafından req.user doldurulmuş olmalı
    if (!req.user) {
      return fail(res, 'Unauthorized', 401);
    }

    return ok(res, {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      name: req.user.name,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
