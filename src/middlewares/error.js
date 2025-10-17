import { fail } from '../utils/responses.js';

import { logger } from './logger.js';

/**
 * Global error handler middleware
 * Tüm hataları standart formata dönüştürür: { ok: false, message }
 * Production'da genel mesaj, development'da detaylı mesaj döner
 */
export function errorHandler(err, req, res, _next) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Hatayı detaylı şekilde logla (her ortamda)
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Status code belirle
  const statusCode = err.statusCode || err.status || 500;

  // Message belirle (production'da genel, dev'de detaylı)
  let message = 'Internal server error';
  if (!isProduction) {
    // Development: Detaylı hata mesajı
    message = err.message || 'Internal server error';
  } else if (statusCode < 500) {
    // Production: Client hataları (4xx) için mesajı göster
    message = err.message || 'Bad request';
  }
  // Production + Server hataları (5xx): Generic mesaj

  return fail(res, message, statusCode);
}
