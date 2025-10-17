# Security Documentation

## Authentication & Authorization

### JWT Authentication

Tüm admin endpoint'leri JWT (JSON Web Token) ile korunmaktadır.

#### Token Alma

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

#### Token Kullanımı

Tüm admin işlemlerinde token gönderilmelidir:

```http
POST /api/surveys
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "slug": "new-survey",
  "title": "My Survey",
  "isActive": true
}
```

### Role-Based Access Control (RBAC)

#### Roller

- **admin**: Tüm admin işlemlere erişim (CRUD)
- **user**: Sadece okuma erişimi (gelecekte eklenebilir)

#### Protected Endpoints

Aşağıdaki endpoint'ler **requireAuth + requireRole('admin')** ile korunmaktadır:

```
POST   /api/surveys
PUT    /api/surveys/:id
DELETE /api/surveys/:id
GET    /api/surveys/:id/export            # ✅ XLSX export (admin only)
POST   /api/surveys/:id/invitations        # ✅ Davetiye gönderme
POST   /api/surveys/:surveyId/sections
DELETE /api/sections/:id
POST   /api/questions/bulk
```

#### Public Endpoints (Auth Gerekmez)

```
GET    /healthz                        # Liveness check
GET    /readyz                         # Readiness check (DB)
GET    /api/surveys                    # Anket listesi
GET    /api/surveys/:slug              # Anket detayı
GET    /api/surveys/:id/stats          # İstatistikler
GET    /api/invitations/:token         # ✅ Davetiye bilgisi
POST   /api/responses                  # Anket yanıtı (optional token)
```

### Security Features

#### 1. Token Security

- ✅ **HMAC SHA-256**: Signature algoritması
- ✅ **Expiration**: Token'lar 24 saat geçerli
- ✅ **Secret Key**: Environment variable (JWT_SECRET)
- ✅ **Validation**: Her istekte token doğrulanır

#### 2. Error Handling

**401 Unauthorized:**

- Token yok
- Token invalid
- Token expired

**403 Forbidden:**

- Token geçerli ama role yetersiz
- User role ile admin endpoint'e erişim

#### 3. Auto-Logout

Frontend otomatik logout yapar:

- Token expired olduğunda
- 401 response alındığında
- Logout butonu ile manuel

## Email Security

### SMTP Configuration

Email gönderimi için SMTP bilgileri `.env` dosyasında:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=<app-password>              # ⚠️ Hassas bilgi!
SMTP_FROM="Anket Sistemi <your-email@gmail.com>"
BASE_URL=http://localhost:3000
```

**Güvenlik:**

- ✅ Gmail için App Password kullan (asla ana şifre değil)
- ✅ SendGrid/Mailgun gibi servisler için API Key
- ✅ `.env` dosyasını Git'e commit etme
- ✅ Production'da farklı SMTP credentials
- ✅ Rate limiting (email spam önleme)

**Detaylı Kurulum:** [`docs/EMAIL_SETUP.md`](docs/EMAIL_SETUP.md)

### Invitation Tokens

Davetiyeler UUID v4 ile oluşturulur:

- ✅ **128-bit random**: Tahmin edilemez
- ✅ **Tek kullanımlık**: `used_at` kaydedilir
- ✅ **Email match**: Token'ın email'i ile form email'i eşleşmeli
- ✅ **Auto-fill**: Frontend email'i otomatik doldurur (readonly)
- ✅ **Kişisel**: Başka email kullana maz

### Environment Variables

⚠️ **KRITIK**: `.env` dosyasını ASLA Git'e commit etmeyin!

```bash
# .gitignore kontrolü
cat .gitignore | grep .env  # ✅ .env satırı var

# Git status kontrolü
git status  # ❌ .env gösterilmemeli
```

**Setup:**

```bash
# 1. .env.example'dan kopyala
cp .env.example .env

# 2. Düzenle
nano .env  # veya favorite editor
```

**Required Variables:**

```env
PORT=3000
NODE_ENV=development

MSSQL_USER=sa
MSSQL_PASSWORD=<STRONG_PASSWORD>
MSSQL_SERVER=localhost
MSSQL_DB=survey_db
MSSQL_PORT=1433

JWT_SECRET=<STRONG_SECRET_MIN_32_CHARS>

# SMTP Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=<app-password>
SMTP_FROM="Anket Sistemi <your-email@gmail.com>"

# Base URL (for email links)
BASE_URL=http://localhost:3000

# Optional
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

**Generate Strong Secrets:**

```bash
# JWT Secret (recommended)
openssl rand -base64 32
# Output: xK8pQ2mN9vR3sT6uW1yB4cD7eF0gH5iJ2kL8mN1oP4qR3s=

# Alternative: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Demo Users (Development Only)

⚠️ **Önemli**: Bu kullanıcılar sadece development/demo amaçlıdır.

```javascript
// src/routes/auth.js
const DEMO_USERS = [
  {
    id: 1,
    email: 'admin@example.com',
    password: 'admin123', // Plain text (SADECE DEMO)
    role: 'admin',
  },
  {
    id: 2,
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
  },
];
```

### Production Migration

Production'da:

1. ✅ **Kullanıcıları DB'de sakla**

   ```sql
   CREATE TABLE users (
     id INT PRIMARY KEY,
     email NVARCHAR(320) UNIQUE,
     password_hash NVARCHAR(255),
     role NVARCHAR(20),
     created_at DATETIME2
   );
   ```

2. ✅ **bcrypt ile hash**

   ```javascript
   import bcrypt from 'bcrypt';

   const hash = await bcrypt.hash(password, 10);
   const match = await bcrypt.compare(password, user.password_hash);
   ```

3. ✅ **Güçlü JWT_SECRET**

   ```bash
   openssl rand -base64 32
   ```

4. ✅ **Token refresh mechanism**
   ```javascript
   // Refresh token ekle (7 gün geçerli)
   // Access token (1 saat)
   ```

## CORS Security

### Allowed Origins

```javascript
// src/config/cors.js
const allowedOrigins = [
  'http://localhost:3000',
  // Production'da:
  // 'https://yourdomain.com',
];
```

### Features

- ✅ **Whitelist-based**: Sadece tanımlı origin'ler
- ✅ **Regex support**: Pattern-based matching
- ✅ **Credentials**: Cookie ve auth header'ları
- ✅ **Postman-friendly**: Origin yok ise izin ver

## Content Security Policy (CSP)

### Current Policy

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' https: 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self';
  object-src 'none';
  frame-src 'none';
```

### Production Improvements

⚠️ **TODO**: Remove `'unsafe-inline'` from styleSrc

- External CSS dosyalarına taşı
- Inline style'ları kaldır

## Rate Limiting

### Current Limits

- **Read (GET)**: 200 requests / 60 seconds
- **Write (POST/PUT/DELETE)**: 60 requests / 60 seconds

### Bypass

Rate limit IP-based olduğundan:

- Proxy arkasındaysa `trust proxy` ayarı gerekebilir
- Production'da CloudFlare/nginx kullanılabilir

## Database Security

### Development

```javascript
encrypt: false;
trustServerCertificate: true;
```

### Production (NODE_ENV=production)

```javascript
encrypt: true; // ✅ TLS encryption
trustServerCertificate: false; // ✅ Certificate validation
```

## Input Validation

### express-validator

Tüm input'lar validate edilir:

```javascript
body('email').isEmail(),
body('slug').isString().notEmpty(),
param('id').isInt(),
```

Validation error:

```json
{
  "ok": false,
  "message": "Validation error"
}
```

## Error Information Disclosure

### Production (NODE_ENV=production)

**Server Errors (5xx):**

```json
{
  "ok": false,
  "message": "Internal server error"
}
```

Detaylar log'a yazılır, kullanıcıya gösterilmez.

**Client Errors (4xx):**

```json
{
  "ok": false,
  "message": "User not found"
}
```

Kullanıcıya gösterilir (bilgi sızıntısı riski düşük).

### Development

Tüm hata detayları gösterilir (debugging için).

## Security Checklist

### Pre-Production

- [ ] JWT_SECRET güçlü key ile değiştir (min 32 karakter)
- [ ] Demo kullanıcıları kaldır, DB authentication ekle
- [ ] Şifreleri bcrypt ile hash'le
- [ ] NODE_ENV=production ayarla
- [ ] CORS allowed origins'i güncelle
- [ ] SSL/TLS sertifikası ekle (Let's Encrypt)
- [ ] DB encryption aktif (encrypt: true)
- [ ] CSP'den unsafe-inline kaldır
- [ ] Rate limit'leri sıkılaştır
- [ ] SMTP credentials güvenli sakla (Secrets Manager)
- [ ] Email rate limiting ekle (spam önleme)
- [ ] Admin panel için MFA ekle (optional)

### Vulnerability Monitoring

```bash
# Dependencies audit
npm audit

# Fix vulnerabilities
npm audit fix

# Manual review needed
npm audit fix --force
```

### Security Headers

Helmet ile eklenen header'lar:

```http
Content-Security-Policy: ...
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
```

## Reporting Security Issues

Güvenlik açığı bulursanız:

1. Public issue açmayın
2. Email ile bildir: security@yourdomain.com
3. Detaylı açıklama ve PoC ekle
4. Sorumlu açıklama: 90 gün

## Security Best Practices Applied

- ✅ JWT authentication (Bearer token)
- ✅ Role-based authorization (RBAC)
- ✅ Bruteforce protection (30 req/60s login)
- ✅ CORS whitelist (regex support)
- ✅ CSP headers (scriptSrcAttr: unsafe-inline for onclick handlers)
- ✅ Multi-tier rate limiting (read/write/auth)
- ✅ Input validation (express-validator)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (Helmet)
- ✅ Error message sanitization (prod/dev)
- ✅ Structured logging (Morgan + Pino)
- ✅ TLS encryption (production, DB encrypt: true)
- ✅ Helmet security headers
- ✅ Invitation tokens (UUID v4, single-use)
- ✅ Email auto-fill (readonly, prevents tampering)
- ✅ SMTP security (App Password, no plain text)

## Known Limitations (Demo)

1. **Statik kullanıcılar**: Production'da DB'ye taşınmalı
2. **Plain text passwords**: bcrypt hash kullanılmalı
3. **No refresh token**: Token refresh mechanism eklenebilir
4. **No MFA**: Multi-factor authentication eklenebilir
5. **No password reset**: Şifre sıfırlama akışı yok
6. **No account lockout**: Brute force koruması eklenebilir
7. **Email simulated**: SMTP olmadan console'a log (development)
8. **CSP unsafe-inline**: Inline event handlers için (onclick, onkeypress)

## Future Enhancements

- [ ] User management API
- [ ] Password reset flow
- [ ] Email verification
- [ ] Multi-factor authentication (MFA)
- [ ] Refresh token mechanism
- [ ] Session management
- [ ] Account lockout (brute force protection)
- [ ] IP whitelist/blacklist
- [ ] Audit logging
- [ ] CSRF protection (token-based)
