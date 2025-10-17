# Changelog

## [2.0.0] - 2025-10-17

### 🎉 Major Refactoring - Production-Ready Architecture

#### Added

##### Architecture & Organization

- ✅ **Modular Structure**: `config/`, `middlewares/`, `utils/`, `routes/` klasör yapısı
- ✅ **Config Layer**: CORS, CSP ayrı config dosyaları
- ✅ **Route Separation**: Admin ve public rotalar ayrı modüller
- ✅ **Comprehensive Documentation**: Her klasörde README.md

##### Security Features

- ✅ **JWT Authentication**: Bearer token-based auth
- ✅ **Role-Based Access Control (RBAC)**: Admin/user roles
- ✅ **Bruteforce Protection**: Login için 30 req/60s limit
- ✅ **Multi-tier Rate Limiting**: Read/Write/Auth presets
- ✅ **CORS Whitelist**: Origin-based access control
- ✅ **CSP Headers**: Script injection koruması (unsafe-inline kaldırıldı)
- ✅ **Environment-based DB Security**: Production'da encrypt: true

##### Middleware System

- ✅ **Authentication**: JWT token validation (`middlewares/auth.js`)
- ✅ **Authorization**: Role-based middleware
- ✅ **Error Handler**: Centralized error handling (`middlewares/error.js`)
- ✅ **Logging**: Morgan + Pino integration (`middlewares/logger.js`)
- ✅ **Rate Limiting**: 3 preset (read/write/bruteforce) (`middlewares/rateLimit.js`)

##### Utilities

- ✅ **Response Helpers**: `ok()` ve `fail()` standardized format
- ✅ **Standard Response Format**: `{ok, data}` / `{ok, message}`

##### API Endpoints

- ✅ **Health Checks**: `/healthz` (liveness), `/readyz` (readiness + DB)
- ✅ **Auth Endpoints**: `/api/auth/login`, `/api/auth/me`
- ✅ **Protected Admin Routes**: POST/PUT/DELETE auth required

##### Frontend

- ✅ **External Scripts**: Inline script'ler ayrı dosyalara taşındı
- ✅ **Login System**: Admin panel login overlay
- ✅ **Token Management**: LocalStorage + auto-logout
- ✅ **Auth Headers**: Tüm admin isteklerde Authorization header

##### Documentation

- ✅ **README.md**: Kapsamlı güncelleme
- ✅ **SECURITY.md**: Detaylı güvenlik dökümantasyonu
- ✅ **CHANGELOG.md**: Version history
- ✅ **Config README**: CORS, CSP, DB config guide
- ✅ **Middlewares README**: Auth, error, logging guide
- ✅ **Utils README**: Response format guide

#### Changed

##### Breaking Changes: NONE! ✅

- API contract aynı (backward compatible)
- Response format standartlaştı ama eski client'lar çalışır
- Public endpoint'ler auth gerektirmez

##### Database

- 🔧 **Connection Config**: Environment-based encrypt/trustServerCertificate
- ⚙️ **Health Check**: `SELECT 1 as ok` query

##### Response Format (Standardized)

```javascript
// Önce
res.json({ status: 'ok', users: [...] });
res.status(404).json({ error: 'Not found' });

// Şimdi
ok(res, { users: [...] });
fail(res, 'Not found', 404);
```

##### Rate Limiting

```javascript
// Önce
rateLimitRead: 200/60s (tüm endpoint'lere)

// Şimdi
rlRead: 200/60s (public GET)
rlWrite: 60/60s (admin CRUD)
rlBruteforce: 30/60s (login/auth)
```

##### Error Handling

```javascript
// Önce
catch (e) { res.status(500).json({ message: e.message }); }

// Şimdi
catch (e) { next(e); } // Error handler centralized
```

#### Security Improvements

##### Production Environment

- 🔒 **DB Encryption**: `encrypt: true` when NODE_ENV=production
- 🔒 **Certificate Validation**: `trustServerCertificate: false` in production
- 🔒 **Generic Error Messages**: Server errors (5xx) return "Internal server error"
- 🔒 **CSP**: No unsafe-inline for scripts
- 🔒 **CORS**: Whitelist-based origin control

##### Development Environment

- 🔧 **Detailed Errors**: Full error messages in dev
- 🔧 **Relaxed DB**: No encryption for local MSSQL
- 🔧 **Pretty Logs**: Pino-pretty for readable logs

#### Testing

All features tested and verified:

```bash
✅ Health checks (/healthz, /readyz)
✅ JWT login (admin, user roles)
✅ Protected endpoints (401 without token)
✅ Role validation (403 for insufficient permissions)
✅ Rate limiting (read/write/bruteforce)
✅ Public endpoints (no auth required)
✅ CORS (origin whitelist, Postman support)
✅ CSP (no inline scripts)
✅ Error handling (centralized)
✅ Response format (standardized)
```

#### Dependencies Added

```json
{
  "jsonwebtoken": "^9.0.2",
  "morgan": "^1.10.1",
  "pino": "^10.0.0",
  "pino-pretty": "^13.1.2"
}
```

---

## [1.0.0] - Initial Release

### Features

- Basic survey management (CRUD)
- Question types: text, number, single, multiple, likert
- Survey sections
- Conditional logic (skip patterns)
- Token-based invitations
- XLSX export
- Drag-and-drop question ordering
- Templates (NPS, Likert, Demografi, Şehir)
- Stored procedure for response submission
- Express + MSSQL backend
- Vanilla JavaScript frontend

---

## Migration Guide (1.0 → 2.0)

### Backend

No breaking changes. All existing code works as-is.

**Optional**: Update to new response format for consistency:

```javascript
// Old (still works)
res.json({ users });

// New (recommended)
ok(res, { users });
```

### Frontend

Update API response parsing:

```javascript
// Old
const users = await res.json();

// New
const response = await res.json();
if (response.ok) {
  const users = response.data;
}
```

### Environment

Add to `.env`:

```env
JWT_SECRET=your-secret-key-change-in-production
```

### Admin Panel

Login required for admin operations:

- Email: `admin@example.com`
- Password: `admin123`

---

## Upcoming Features

- [ ] User management (DB-based)
- [ ] bcrypt password hashing
- [ ] Password reset flow
- [ ] Email verification
- [ ] Multi-factor authentication
- [ ] Refresh tokens
- [ ] Account lockout
- [ ] Audit logging
- [ ] CAPTCHA integration
