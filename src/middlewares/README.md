# Middlewares

Bu klasör, Express middleware'lerini içerir.

## auth.js - JWT Authentication & Authorization

### Özellikler

- ✅ **JWT Bearer Token**: `Authorization: Bearer <token>` header validation
- ✅ **Role-based Access Control**: Admin, user, vs. role kontrolü
- ✅ **Token Generation**: `generateToken()` helper fonksiyonu
- ✅ **Token Expiration**: Configurable expiry (default: 24h)
- ✅ **Error Handling**: Token expired, invalid token, vs.

### Middleware'ler

#### `requireAuth` - Authentication

Tüm isteklerde JWT token kontrolü yapar.

```javascript
import { requireAuth } from '../middlewares/auth.js';

router.post('/protected', requireAuth, async (req, res) => {
  // req.user artık kullanılabilir
  console.log(req.user.id, req.user.email, req.user.role);
});
```

**Token Format:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**req.user Content:**

```javascript
{
  id: 1,
  email: 'admin@example.com',
  role: 'admin',
  name: 'Admin User'
}
```

#### `requireRole(...roles)` - Authorization

Kullanıcının rolünü kontrol eder.

```javascript
import { requireAuth, requireRole } from '../middlewares/auth.js';

// Sadece admin'ler erişebilir
router.post('/admin-only', requireAuth, requireRole('admin'), handler);

// Admin veya moderator erişebilir
router.post(
  '/mod-access',
  requireAuth,
  requireRole('admin', 'moderator'),
  handler,
);
```

#### `generateToken(payload, expiresIn)` - Token Generation

JWT token oluşturur.

```javascript
import { generateToken } from '../middlewares/auth.js';

const token = generateToken(
  {
    id: user.id,
    email: user.email,
    role: user.role,
  },
  '7d',
); // 7 gün geçerli
```

### Environment Variables

```env
JWT_SECRET=your-secret-key-min-32-chars-long
```

⚠️ **Önemli**: Production'da güçlü bir secret key kullanın (min 32 karakter).

### Error Responses

#### 401 Unauthorized

```json
{"ok": false, "message": "Unauthorized: Token required"}
{"ok": false, "message": "Unauthorized: Invalid token"}
{"ok": false, "message": "Unauthorized: Token expired"}
```

#### 403 Forbidden

```json
{ "ok": false, "message": "Forbidden: Insufficient permissions" }
```

### Demo Login

Development için statik kullanıcılar (`routes/auth.js`):

```javascript
// Admin user
email: 'admin@example.com';
password: 'admin123';
role: 'admin';

// Regular user
email: 'user@example.com';
password: 'user123';
role: 'user';
```

**Login Endpoint:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}

Response: 200
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "role": "admin",
      "name": "Admin User"
    }
  }
}
```

### Frontend Kullanımı

```javascript
// 1. Login
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const data = await res.json();
if (data.ok) {
  localStorage.setItem('token', data.data.token);
}

// 2. Protected Request
const token = localStorage.getItem('token');
const res = await fetch('/api/surveys', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ... }),
});

// 3. Auto-logout on 401
if (res.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/admin.html';
}
```

---

## error.js - Global Error Handler

### Özellikler

- ✅ **Centralized Error Handling**: Tüm hatalar tek noktadan yönetilir
- ✅ **Environment-based Messages**: Production'da generic, dev'de detaylı
- ✅ **Structured Logging**: Pino ile detaylı error logging
- ✅ **Standard Response Format**: `{ok: false, message}`

### Kullanım

```javascript
// server.js (en son middleware olarak)
app.use(errorHandler);
```

### Error Handling Pattern

```javascript
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return ok(res, user);
  } catch (err) {
    next(err); // Error handler yakalayacak
  }
});
```

### Response Format

#### Development (NODE_ENV !== production)

```json
{
  "ok": false,
  "message": "Cannot read property 'id' of undefined"
}
```

#### Production (NODE_ENV === production)

**Client Errors (4xx):**

```json
{
  "ok": false,
  "message": "User not found"
}
```

**Server Errors (5xx):**

```json
{
  "ok": false,
  "message": "Internal server error"
}
```

### Logging

Her hata detaylı olarak loglanır:

```javascript
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
```

---

## logger.js - HTTP & Application Logging

### Özellikler

- ✅ **Morgan**: HTTP request logging (combined format)
- ✅ **Pino**: Application logging (structured JSON)
- ✅ **Pretty Print**: Development'da okunabilir, production'da JSON
- ✅ **Log Levels**: error, warn, info, debug

### Kullanım

```javascript
import { httpLogger, logger } from './middlewares/logger.js';

// HTTP logging (server.js)
app.use(httpLogger);

// Application logging
logger.info('Server started', { port: 3000 });
logger.error('Database error', { error: err.message });
logger.warn('Deprecated API called', { endpoint: '/old-api' });
```

### Log Levels

```javascript
logger.error('Critical error'); // 0 - Errors
logger.warn('Warning message'); // 1 - Warnings
logger.info('Info message'); // 2 - Info (default)
logger.debug('Debug details'); // 3 - Debug
```

Environment variable ile kontrol:

```env
LOG_LEVEL=debug  # Tüm log'ları göster
LOG_LEVEL=info   # info ve üzeri (default)
LOG_LEVEL=error  # Sadece error'lar
```

---

## rateLimit.js - Rate Limiting

### Özellikler

- ✅ **Read Limit**: GET istekleri için 200/60s
- ✅ **Write Limit**: POST/PUT/DELETE için 60/60s
- ✅ **Bruteforce Protection**: Login gibi hassas endpoint'ler için 30/60s
- ✅ **Standard Headers**: RateLimit-\* headers
- ✅ **IP-based**: Her IP için ayrı limit

### Presets

#### `rlRead` - Public Read Operations

```javascript
import { rlRead } from './middlewares/rateLimit.js';

// Global read limit (server.js)
app.use(rlRead);
```

- **Window**: 60 saniye
- **Max**: 200 istek
- **Use Case**: GET endpoint'leri, public read operations

#### `rlWrite` - Admin Write Operations

```javascript
import { rlWrite } from './middlewares/rateLimit.js';

// Admin mutate endpoint'leri
router.post('/surveys', requireAuth, requireRole('admin'), rlWrite, handler);
router.put('/surveys/:id', requireAuth, requireRole('admin'), rlWrite, handler);
router.delete(
  '/surveys/:id',
  requireAuth,
  requireRole('admin'),
  rlWrite,
  handler,
);
```

- **Window**: 60 saniye
- **Max**: 60 istek
- **Use Case**: POST/PUT/DELETE/PATCH operations

#### `rlBruteforce` - Sensitive Operations

```javascript
import { rlBruteforce } from './middlewares/rateLimit.js';

// Login endpoint
router.post('/auth/login', rlBruteforce, handler);

// Password reset
router.post('/auth/reset-password', rlBruteforce, handler);
```

- **Window**: 60 saniye
- **Max**: 30 istek
- **Use Case**: Login, password reset, sensitive auth operations
- **Skip Successful**: `false` (başarılı istekleri de say - bruteforce önleme)

### Backward Compatibility

```javascript
// Eski isimler hala çalışıyor
import { rateLimitRead, rateLimitWrite } from './middlewares/rateLimit.js';

// Yeni isimler (önerilen)
import { rlRead, rlWrite, rlBruteforce } from './middlewares/rateLimit.js';
```

### Response Headers

```http
RateLimit-Limit: 200
RateLimit-Remaining: 195
RateLimit-Reset: 1234567890
Retry-After: 45
```

### Limit Aşıldığında

```http
HTTP 429 Too Many Requests

{
  "ok": false,
  "message": "Too many requests from this IP, please try again later."
}
```

**Login için:**

```http
HTTP 429 Too Many Requests

{
  "ok": false,
  "message": "Too many login attempts from this IP, please try again later."
}
```

### Use Cases

| Endpoint Type           | Preset         | Max Requests | Window |
| ----------------------- | -------------- | ------------ | ------ |
| Public GET              | `rlRead`       | 200          | 60s    |
| Public POST (responses) | `rlWrite`      | 60           | 60s    |
| Admin POST/PUT/DELETE   | `rlWrite`      | 60           | 60s    |
| Login/Auth              | `rlBruteforce` | 30           | 60s    |
| Password Reset          | `rlBruteforce` | 30           | 60s    |

### Bruteforce Protection Strategy

**Why 30 requests?**

- Normal kullanıcı: 2-3 deneme yeterli
- Unutkan kullanıcı: 5-10 deneme makul
- 30 deneme: Bruteforce için çok az, gerçek kullanıcı için yeterli

**Best Practices:**

1. ✅ Login endpoint'ine `rlBruteforce` kullan
2. ✅ Password reset'e `rlBruteforce` kullan
3. ✅ 2FA verification'a `rlBruteforce` kullan
4. ✅ Account lockout mechanism ekle (optional)
5. ✅ CAPTCHA ekle (5+ başarısız denemeden sonra)

### Custom Rate Limits

Özel limit oluşturmak için:

```javascript
import rateLimit from 'express-rate-limit';

const customLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100,
  message: 'Custom limit message',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Sadece hatalı istekleri say
});

router.post('/custom', customLimit, handler);
```

### IP Behind Proxy

Eğer reverse proxy (nginx, CloudFlare) kullanıyorsanız:

```javascript
// server.js
app.set('trust proxy', 1);

// veya
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
```

### Skip Conditions

Belirli IP'leri atlamak için:

```javascript
const customLimit = rateLimit({
  windowMs: 60_000,
  max: 100,
  skip: (req) => {
    // Whitelist IP'ler
    return req.ip === '127.0.0.1' || req.ip === '::1';
  },
});
```

---

## Best Practices

### 1. Middleware Order (server.js)

```javascript
// 1. Security (Helmet, CORS)
app.use(helmet(...));
app.use(cors(...));

// 2. Body parsing
app.use(express.json());

// 3. Logging
app.use(httpLogger);

// 4. Rate limiting
app.use(rateLimitRead);

// 5. Routes
app.use('/api/auth', authRoutes);
app.use('/api', adminRoutes);

// 6. Static files
app.use(express.static(...));

// 7. Error handler (MUST BE LAST)
app.use(errorHandler);
```

### 2. Protected Routes

```javascript
// Admin-only routes
router.post('/admin-action', requireAuth, requireRole('admin'), handler);

// Authenticated users
router.get('/profile', requireAuth, handler);

// Public routes (no auth)
router.get('/public-data', handler);
```

### 3. Error Handling

```javascript
// Always use next(err) for async errors
async (req, res, next) => {
  try {
    // ... logic
  } catch (err) {
    next(err); // Error handler will catch
  }
}

// Set custom status codes
catch (err) {
  err.statusCode = 404; // or 400, 403, etc.
  next(err);
}
```

### 4. Logging Best Practices

```javascript
// Good: Structured logging
logger.info('User created', { userId: user.id, email: user.email });

// Bad: String-only logging
logger.info('User created: ' + user.id);

// Error logging
logger.error('Database error', {
  error: err.message,
  stack: err.stack,
  context: { userId, action: 'update' },
});
```
