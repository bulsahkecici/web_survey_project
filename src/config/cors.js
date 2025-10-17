/**
 * CORS Configuration
 * Whitelist-based origin kontrolü
 */

// İzin verilen origin'ler (exact match veya regex pattern)
const allowedOrigins = [
  'http://localhost:3000',
  // Regex örneği: tüm localhost portları
  // /^http:\/\/localhost:\d+$/,
  // Production domain örneği:
  // 'https://yourdomain.com',
  // 'https://www.yourdomain.com',
];

// Origin kontrolü (regex desteği ile)
const originValidator = (origin, callback) => {
  // Origin yoksa (Postman, curl, server-to-server) izin ver
  if (!origin) {
    return callback(null, true);
  }

  // Whitelist kontrolü
  const isAllowed = allowedOrigins.some((allowedOrigin) => {
    // Exact match
    if (allowedOrigin === origin) return true;

    // Regex pattern ise
    if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    }

    return false;
  });

  if (isAllowed) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

export const corsConfig = {
  origin: originValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // IE11 uyumluluğu için
};
