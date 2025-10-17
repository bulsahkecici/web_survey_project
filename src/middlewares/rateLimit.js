import rateLimit from 'express-rate-limit';

/**
 * GET istekleri için rate limit: 200 istek / 60 saniye
 * Public read endpoint'leri için
 */
export const rlRead = rateLimit({
  windowMs: 60_000, // 60 saniye
  max: 200, // maksimum 200 istek
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Write (POST/PUT/DELETE) istekleri için rate limit: 60 istek / 60 saniye
 * Admin mutate endpoint'leri için
 */
export const rlWrite = rateLimit({
  windowMs: 60_000, // 60 saniye
  max: 60, // maksimum 60 istek
  message: 'Too many write requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Bruteforce koruması için sıkı rate limit: 30 istek / 60 saniye
 * Login, password reset gibi hassas endpoint'ler için
 */
export const rlBruteforce = rateLimit({
  windowMs: 60_000, // 60 saniye
  max: 30, // maksimum 30 istek
  message: 'Too many login attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Başarılı istekleri de say
});

// Backward compatibility aliases
export const rateLimitRead = rlRead;
export const rateLimitWrite = rlWrite;
