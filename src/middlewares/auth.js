import jwt from 'jsonwebtoken';

import { fail } from '../utils/responses.js';

import { logger } from './logger.js';

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 * JWT Bearer token validation
 */
export function requireAuth(req, res, next) {
  try {
    // Authorization header'dan token'ı al
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return fail(res, 'Unauthorized: Token required', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return fail(res, 'Unauthorized: Invalid token format', 401);
    }

    // JWT token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET);

    // Decoded user bilgisini req.user'a ekle
    req.user = decoded;

    next();
  } catch (err) {
    logger.error('JWT verification failed', {
      error: err.message,
      url: req.originalUrl,
    });

    if (err.name === 'TokenExpiredError') {
      return fail(res, 'Unauthorized: Token expired', 401);
    }

    if (err.name === 'JsonWebTokenError') {
      return fail(res, 'Unauthorized: Invalid token', 401);
    }

    return fail(res, 'Unauthorized', 401);
  }
}

/**
 * Role-based authorization middleware
 * Kullanıcının role'ünü kontrol eder
 * @param {...string} roles - İzin verilen roller
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, 'Unauthorized: No user information', 401);
    }

    if (!req.user.role) {
      return fail(res, 'Forbidden: No role assigned', 403);
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Role access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        url: req.originalUrl,
      });
      return fail(res, 'Forbidden: Insufficient permissions', 403);
    }

    next();
  };
}

/**
 * JWT token oluştur
 * @param {Object} payload - Token'a eklenecek veri
 * @param {string} expiresIn - Token geçerlilik süresi (default: 24h)
 */
export function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
