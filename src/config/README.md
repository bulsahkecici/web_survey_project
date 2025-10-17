# Config Modülleri

Bu klasör, uygulamanın yapılandırma dosyalarını içerir.

## cors.js

CORS (Cross-Origin Resource Sharing) yapılandırması.

### Özellikler

- **Whitelist-based**: Sadece izin verilen origin'lerden gelen isteklere izin verir
- **Regex desteği**: Dinamik origin pattern'leri tanımlayabilirsiniz
- **Postman/curl uyumlu**: Origin header'ı olmayan isteklere izin verilir (server-to-server, API testleri)
- **Credentials**: Cookie ve authentication header'ları desteklenir
- **Tüm HTTP metodları**: GET, POST, PUT, PATCH, DELETE, OPTIONS

### Kullanım

```javascript
import { corsConfig } from './config/cors.js';
app.use(cors(corsConfig));
```

### İzin Verilen Origin'leri Düzenleme

```javascript
const allowedOrigins = [
  'http://localhost:3000', // Exact match
  /^http:\/\/localhost:\d+$/, // Regex: tüm localhost portları
  'https://yourdomain.com', // Production domain
];
```

### Test Sonuçları

✅ **Origin yok (Postman/curl)**: İzin verilir  
✅ **Origin: http://localhost:3000**: İzin verilir  
❌ **Origin: http://evil.com**: Bloklanır (500 error)  
✅ **OPTIONS preflight**: Çalışır  
✅ **Allow-Methods**: GET,POST,PUT,PATCH,DELETE,OPTIONS  
✅ **Allow-Headers**: Content-Type, Authorization  
✅ **Credentials**: true

---

## csp.js

Content Security Policy (CSP) yapılandırması.

### Özellikler

- **XSS Koruması**: Script injection saldırılarını önler
- **Clickjacking Koruması**: Frame injection saldırılarını önler
- **HTTPS Enforcement**: Güvenli bağlantıları zorunlu kılar (upgrade-insecure-requests)

### Kullanım

```javascript
import { cspDirectives } from './config/csp.js';
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
  }),
);
```

### Production İçin Öneriler

⚠️ **Önemli**: Production ortamında aşağıdaki değişiklikleri yapın:

1. `unsafe-inline` ve `unsafe-eval` direktiflerini kaldırın
2. Inline script'leri ayrı .js dosyalarına taşıyın
3. CDN kullanıyorsanız, ilgili domain'leri whitelist'e ekleyin

```javascript
// Production CSP örneği
export const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", 'https://cdn.example.com'], // unsafe-inline KALDIRILDI
  styleSrc: ["'self'", 'https://cdn.example.com'],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: ["'self'"],
  fontSrc: ["'self'", 'https://fonts.googleapis.com'],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
};
```

---

## Güvenlik Best Practices

### Development vs Production

| Ayar            | Development             | Production           |
| --------------- | ----------------------- | -------------------- |
| CORS Origin     | `true` veya `localhost` | Specific domain'ler  |
| CSP scriptSrc   | `unsafe-inline` OK      | ❌ Kaldır            |
| CSP unsafe-eval | OK for dev tools        | ❌ Kaldır            |
| Credentials     | true                    | true (HTTPS gerekli) |

### Environment Variables

```env
# .env.example
NODE_ENV=production
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Dinamik origin yönetimi için environment variable kullanabilirsiniz:

```javascript
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];
```

---

## db.js (Database Configuration)

MSSQL bağlantı ayarları environment-based yapılandırılmıştır.

### Development vs Production

| Setting                  | Development | Production |
| ------------------------ | ----------- | ---------- |
| `encrypt`                | `false`     | `true` ✅  |
| `trustServerCertificate` | `true`      | `false` ✅ |
| `enableArithAbort`       | `true`      | `true`     |

### Kullanım

```javascript
// src/db.js
const isProduction = process.env.NODE_ENV === 'production';

const config = {
  server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.MSSQL_DATABASE,
  options: {
    enableArithAbort: true,
    encrypt: isProduction ? true : false,
    trustServerCertificate: isProduction ? false : true,
    useUTC: false,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};
```

### Production'da

Production'da `NODE_ENV=production` ayarlayın:

```bash
# .env
NODE_ENV=production
```

Bu durumda:

- ✅ **TLS Encryption**: Bağlantı şifrelenir (`encrypt: true`)
- ✅ **Certificate Validation**: Sunucu sertifikası doğrulanır (`trustServerCertificate: false`)
- ⚠️ **Gereksinim**: SQL Server'ın geçerli TLS sertifikası olmalı

### Development'da

Development'da (default):

- 🔧 **No Encryption**: Local bağlantı için pratik (`encrypt: false`)
- 🔧 **Trust All Certs**: Self-signed sertifikalara izin verir (`trustServerCertificate: true`)
- ✅ **Windows Auth**: Varsayılan olarak trusted connection kullanır

### Health Check

#### `/healthz` - Liveness Check

```http
GET /healthz
Response: 200 {"status":"ok"}
```

Process çalışıyor mu? (DB kontrolü yok)

#### `/readyz` - Readiness Check

```http
GET /readyz
Response: 200 {"status":"ready","db":{"ok":1}}
```

DB bağlantısı çalışıyor mu? (`SELECT 1 as ok` sorgusu)

Hata durumunda:

```http
Response: 503 {"status":"not ready","error":"Connection failed"}
```
