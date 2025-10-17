# Survey App - Gelişmiş Anket Yönetim Sistemi

## Node.js + Express + MS SQL Server + Vanilla JavaScript

Modern, modüler ve clean code prensipleriyle geliştirilmiş, kapsamlı özelliklere sahip online anket sistemi.

---

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükleyin

```bash
cd survey-app
npm install
```

### 2. Ortam Değişkenlerini Ayarlayın

⚠️ **Önemli**: `.env` dosyasını **ASLA** Git'e commit etmeyin!

`.env.example` dosyasını `.env` olarak kopyalayın ve bilgilerinizi girin:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Ardından `.env` dosyasını düzenleyin:

```env
PORT=3000
NODE_ENV=development

# MSSQL Configuration
MSSQL_USER=sa
MSSQL_PASSWORD=YourStrongPassword123!
MSSQL_SERVER=localhost
MSSQL_DB=survey_db
MSSQL_PORT=1433

# JWT Authentication
JWT_SECRET=your-secret-key-min-32-chars-use-openssl-rand-base64-32

# Optional
# CORS_ORIGIN=http://localhost:3000
# LOG_LEVEL=info
```

🔒 **Güvenlik Notları:**

- `.env` dosyası `.gitignore`'da olduğundan emin olun ✅
- JWT_SECRET için güçlü, rastgele key kullanın (min 32 karakter)
- Production'da farklı credentials kullanın
- Asla `.env` dosyasını public repository'ye push etmeyin!

### 3. Veritabanını Oluşturun

`ddl.sql` dosyasını SQL Server Management Studio veya komut satırından çalıştırın:

```sql
-- Veritabanı şeması, tablolar, stored procedure ve örnek veri oluşturulur
```

### 4. Uygulamayı Çalıştırın

```bash
npm run dev    # Geliştirme modu (nodemon ile)
# veya
npm start      # Production modu
```

### 5. Erişim

- **Anket Doldurma (Kullanıcı)**: `http://localhost:3000/`
- **Yönetici Paneli**: `http://localhost:3000/admin.html`

---

## ✨ Öne Çıkan Özellikler

### 🎯 Yönetici Paneli Özellikleri

#### 1. **Anket Yönetimi**

- ✅ **Dropdown Menü**: Tüm anketleri hızlıca görüntüleyin ve seçin
- ✅ **Yeni Anket Oluşturma**: Modal ile kolay anket oluşturma (Link + Başlık)
- ✅ **Anket Güncelleme**: Başlık ve slug düzenleme
- ✅ **Anket Silme**: Cascade silme ile tüm ilişkili verileri temizleme
- ✅ **Aktif/Pasif Toggle**: Anketleri anında aktif/pasif yapma
- ✅ **Veri İndirme**: XLSX formatında anket yanıtlarını dışa aktarma
- ✅ **İstatistikler**: Toplam yanıt, soru, davetiye sayıları
- ✅ **Davetiye Gönderme**: 
  - Email listesi ile toplu davetiye gönderimi
  - Özelleştirilebilir davetiye mesajı
  - Benzersiz token ile tek kullanımlık linkler
  - Toplam ve kullanılan davetiye istatistikleri
  - Nodemailer entegrasyonu (Gmail, SendGrid, vb.)
  - 📧 **[Email Kurulum Rehberi](docs/EMAIL_SETUP.md)**

#### 2. **Soru Yönetimi**

- ✅ **Sürükle-Bırak Sıralama**: Soruları kolayca yeniden düzenleyin
- ✅ **Manuel Sıra Değiştirme**: Input field ile soru sırasını numeric olarak değiştirin
- ✅ **5 Farklı Soru Tipi**:
  - 📝 Metin (Text)
  - 🔢 Sayısal (Number)
  - ⚪ Tek Seçim (Radio Button)
  - ☑️ Çoklu Seçim (Checkbox)
  - ⭐ Likert Ölçeği (Dropdown)
- ✅ **Zorunlu Soru İşaretleme**: Kullanıcı boş bırakamaz
- ✅ **Hazır Şablonlar**:
  - 📊 NPS (Net Promoter Score)
  - ⭐ Likert (5'li ölçek)
  - 👥 Demografi (Yaş, Cinsiyet, Eğitim)
  - 🏙️ Şehir (81 il listesi)

#### 3. **Koşullu Akış (Conditional Logic)** 🎯

- Sorulara göre dinamik yönlendirme
- Örnek: "Evet" cevabı → Soru 16'ya atla, "Hayır" → Soru 13'e devam
- Çoklu koşul tanımlama desteği
- Kullanıcı deneyimini kişiselleştirme

#### 4. **Bölümlere Ayırma (Sections)** 📂

- Toggle ile bölüm modu etkinleştirme
- Bölüm ekleme/silme
- Soruları bölümlere organize etme
- Sekme (Tab) görünümü ile kolay gezinme
- Örnek bölümler: Demografi, Memnuniyet, Geri Bildirim

### 👤 Kullanıcı (Katılımcı) Özellikleri

- ✅ **Responsive Tasarım**: Mobil, tablet, desktop uyumlu
- ✅ **Akıllı Form Rendering**: 10+ seçenek otomatik dropdown olur
- ✅ **Koşullu Soru Gösterimi**: Akıllı soru atlama
- ✅ **Tek Seferlik Doldurma**: E-posta bazlı unique constraint
- ✅ **Token ile Davetiye**: Kişiselleştirilmiş anket linkleri
- ✅ **Email Auto-fill**: Davetiye tokenı ile email otomatik doldurulur (readonly)
- ✅ **Zorunlu Soru Doğrulaması**: Boş soru kontrolü
- ✅ **Draft Kaydetme**: LocalStorage ile taslak otomatik kaydedilir
- ✅ **Unsaved Changes Warning**: Sayfa çıkarken uyarı

### 🛡️ Güvenlik ve Performans

- ✅ **JWT Authentication**: Bearer token ile kimlik doğrulama
- ✅ **Role-based Authorization**: Admin/user role kontrolü
- ✅ **Bruteforce Protection**: Login için 30/60s rate limit
- ✅ **SQL Injection Koruması**: Parametrized queries
- ✅ **CORS Whitelist**: Origin-based access control (regex desteği)
- ✅ **Rate Limiting**: Read 200/60s, Write 60/60s, Auth 30/60s
- ✅ **Helmet Security Headers**: XSS, clickjacking koruması
- ✅ **Transaction Yönetimi**: Rollback desteği
- ✅ **Error Handling**: Centralized error handler (production-ready)
- ✅ **Input Validation**: express-validator ile
- ✅ **Structured Logging**: Morgan + Pino (production-ready)
- ✅ **Standardized Responses**: `{ok, data}` / `{ok, message}` format

### 🏗️ Mimari ve Kod Kalitesi

- ✅ **Modüler Yapı**: DB ve server ayrı modüller
- ✅ **Clean Code**: Separation of Concerns
- ✅ **RESTful API**: Standart HTTP metodları
- ✅ **Stored Procedure**: Kritik işlemler için
- ✅ **Cascade Delete**: İlişkisel veri temizliği
- ✅ **Middleware Architecture**: Logger, error handler, rate limiter
- ✅ **Centralized Config**: CORS, CSP ayrı config dosyaları
- ✅ **Route Separation**: Admin ve public rotalar ayrı modüller

---

## 📁 Proje Yapısı

```
web_survey_project/
├── src/
│   ├── server.js              # Ana sunucu giriş noktası
│   ├── db.js                  # MSSQL bağlantı yönetimi
│   ├── config/
│   │   ├── cors.js           # CORS ayarları
│   │   ├── csp.js            # Content Security Policy
│   │   └── README.md         # Config dökümantasyonu
│   ├── middlewares/
│   │   ├── auth.js           # ✅ JWT authentication & RBAC
│   │   ├── error.js          # Global error handler
│   │   ├── logger.js         # Morgan + Pino logging
│   │   ├── rateLimit.js      # Rate limiting presets
│   │   └── README.md         # Middlewares dökümantasyonu
│   ├── utils/
│   │   ├── responses.js      # ok() ve fail() helpers
│   │   ├── email.js          # ✅ Nodemailer email utility
│   │   └── README.md         # Utils dökümantasyonu
│   └── routes/
│       ├── auth.js           # ✅ Authentication endpoints
│       ├── admin.js          # 🔒 Admin API (auth required)
│       └── public.js         # Public API rotaları
├── public/
│   ├── js/
│   │   ├── index.js          # Kullanıcı anket logic
│   │   └── admin.js          # ✅ Admin panel + auth logic
│   ├── index.html            # Kullanıcı anket sayfası
│   └── admin.html            # ✅ Yönetici paneli + login
├── docs/
│   ├── ENVIRONMENT_SETUP.md  # Environment setup guide
│   ├── EMAIL_SETUP.md        # ✅ Email configuration guide
│   └── CODE_QUALITY.md       # Code quality & linting guide
├── scripts/
│   └── smoke.test.js         # ✅ Health check smoke tests
├── ddl.sql                   # Veritabanı şeması
├── package.json
├── .env.example              # ⚠️ Template (safe to commit)
├── .env                      # ❌ NEVER COMMIT (in .gitignore)
├── .gitignore                # Git ignore rules
├── README.md                 # Ana dökümantasyon
├── SECURITY.md               # Güvenlik dökümantasyonu
└── CHANGELOG.md              # Version history
```

### Katmanlı Mimari

- **Config Layer**: Yapılandırma ayarları (CORS, CSP)
- **Middleware Layer**: Ortak işlemler (logging, error handling, rate limiting)
- **Route Layer**: Endpoint tanımları (admin, public)
- **Utils Layer**: Yardımcı fonksiyonlar (responses)
- **DB Layer**: Veritabanı bağlantısı ve işlemleri

---

## 📊 API Uç Noktaları

Tüm API endpoint'leri `/api` prefix'i ile başlar.

### Health Check (Public)

```
GET    /healthz                  # Liveness check (process up)
GET    /readyz                   # Readiness check (DB: SELECT 1 as ok)
```

**Health Check Detayları:**

- `/healthz` → `{"ok":true,"data":{"status":"up"}}` (200) - Process çalışıyor mu?
- `/readyz` → `{"ok":true,"data":{"status":"ready","db":{"ok":1}}}` (200) - DB erişilebilir mi?
- Hata durumunda: `{"ok":false,"message":"Service not ready"}` (503)

### Authentication Rotaları (`/api/auth`)

```
POST   /api/auth/login           # Giriş yap → JWT token al
GET    /api/auth/me              # Mevcut kullanıcı bilgisi (auth required)
```

**Demo Kullanıcılar:**

- 📧 `admin@example.com` / `admin123` (role: admin)
- 📧 `user@example.com` / `user123` (role: user)

### Admin Rotaları (`/api`) 🔒 Auth Required

Tüm POST/PUT/DELETE işlemleri **JWT authentication** ve **admin role** gerektirir.

```
GET    /api/surveys              # Tüm anketleri listele
POST   /api/surveys              # 🔒 Yeni anket oluştur (admin)
PUT    /api/surveys/:id          # 🔒 Anket güncelle (admin)
DELETE /api/surveys/:id          # 🔒 Anket sil (admin)
GET    /api/surveys/:id/stats    # Anket istatistikleri
GET    /api/surveys/:id/export   # XLSX olarak veri dışa aktar

GET    /api/surveys/:surveyId/sections    # Anketin bölümlerini listele
POST   /api/surveys/:surveyId/sections    # 🔒 Yeni bölüm ekle (admin)
DELETE /api/sections/:id                  # 🔒 Bölüm sil (admin)

POST   /api/questions/bulk       # 🔒 Toplu soru kaydetme (admin)
POST   /api/invitations          # 🔒 Token oluştur (admin)
```

### Public Rotaları (`/api`)

```
GET    /api/surveys/:slug        # Anket detayları + sorular (aktif anketler)
GET    /api/invitations/:token   # ✅ Davetiye bilgisi (email, survey)
POST   /api/responses            # Anket yanıtı gönder (optional token)
```

### Rate Limiting

| Endpoint Type      | Preset         | Limit | Window | Use Case                |
| ------------------ | -------------- | ----- | ------ | ----------------------- |
| Public GET         | `rlRead`       | 200   | 60s    | Anket listesi, detaylar |
| Public/Admin Write | `rlWrite`      | 60    | 60s    | CRUD operations         |
| Login/Auth         | `rlBruteforce` | 30    | 60s    | Bruteforce protection   |

### Response Format (Standardized)

Tüm API endpoint'leri standart format kullanır:

**Başarılı Response:**

```json
{
  "ok": true,
  "data": { ... }
}
```

**Hatalı Response:**

```json
{
  "ok": false,
  "message": "Error message"
}
```

**Production vs Development:**

- **Production**: Server hataları (5xx) için generic mesaj: `"Internal server error"`
- **Development**: Detaylı hata mesajları ve stack trace (log'da)
- **Client hataları** (4xx): Her ortamda mesaj gösterilir

---

## 📁 Veritabanı Şeması

### Tablolar

1. **surveys**: Anket bilgileri (slug, title, is_active)
2. **survey_sections**: Bölümler (name, ord)
3. **questions**: Sorular (label, type, required, options_json, conditional_logic, section_id)
4. **invitations**: Davetiye token'ları (email, token, used_at)
5. **responses**: Kullanıcı yanıtları (email, survey_id)
6. **answers**: Soru cevapları (question_id, response_id, value_text)

### Stored Procedure

- **sp_submit_response**: Transaction ile güvenli yanıt kaydetme

---

## 🎨 Kullanıcı Arayüzü Özellikleri

### Yönetici Paneli (admin.html)

- 🎨 **Modern Gradyan Tasarım**: Mor-mavi gradyan tema
- 🎭 **Smooth Animasyonlar**: Modal açılma, hover efektleri
- 📱 **Responsive Grid**: Esnek düzen
- 🔘 **Toggle Switch**: iOS tarzı aktif/pasif anahtarı
- 📋 **Modal Sistemleri**: 5 farklı modal (Yeni Anket, Güncelle, İstatistikler, Şablonlar, Bölüm Ekle, Soru Düzenle)
- 🖱️ **Drag & Drop**: HTML5 Drag API ile soru sıralama
- 🎯 **Empty States**: Kullanıcı dostu boş durum görselleri

### Kullanıcı Anket Sayfası (index.html)

- 🎯 **Minimalist Tasarım**: Dikkat dağıtmayan arayüz
- 📝 **Dinamik Form**: JavaScript ile sorulara göre render
- ✅ **Gerçek Zamanlı Doğrulama**: Zorunlu alan kontrolü
- 🔄 **Koşullu Gösterim**: Akıllı soru atlama

---

## 🔧 Geliştirme Notları

### Teknoloji Stack'i

- **Backend**: Node.js 18+, Express 4.x
- **Database**: MS SQL Server 2019+
- **Frontend**: Vanilla JavaScript (framework yok)
- **Security**: Helmet, JWT, Rate Limiter, express-validator
- **Export**: xlsx kütüphanesi
- **Code Quality**: ESLint (Airbnb), Prettier
- **Logging**: Morgan + Pino

### Bağımlılıklar

```json
{
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.19.2",
  "express-rate-limit": "^7.1.5",
  "express-validator": "^7.2.1",
  "helmet": "^7.1.0",
  "jsonwebtoken": "^9.0.2",
  "morgan": "^1.10.1",
  "mssql": "^10.0.2",
  "nodemailer": "^7.0.9",          // ✅ Email gönderimi
  "pino": "^10.0.0",
  "pino-pretty": "^13.1.2",
  "uuid": "^9.0.1",
  "xlsx": "^0.18.5"
}

// Dev Dependencies
{
  "eslint": "^8.57.1",
  "eslint-config-airbnb-base": "^15.0.0",
  "eslint-config-prettier": "^10.1.8",
  "eslint-plugin-import": "^2.32.0",
  "nodemon": "^3.1.0",
  "prettier": "^3.6.2"
}
```

### Yeni Bağımlılık Ekleme

Geliştirme sırasında yeni bağımlılıklar eklendiyse:

```bash
npm install
```

### Environment Variables

⚠️ **KRITIK**: `.env` dosyasını ASLA commit etmeyin!

**Doğru Kullanım:**

```bash
# 1. Template'i kopyala
copy .env.example .env

# 2. Düzenle (.env dosyasını)
# 3. ASLA git'e ekleme!
git add .env.example  # ✅ Template eklenebilir
git add .env          # ❌ ASLA YAPMAYIN!
```

**Kontrol:**

```bash
git status  # .env gösterilmemeli
```

Detaylı bilgi için: [`docs/ENVIRONMENT_SETUP.md`](docs/ENVIRONMENT_SETUP.md)

---

## 🔒 Güvenlik Önerileri

### Production Ortamı İçin

#### 1. **Admin Paneli Koruması** ✅ Yapıldı

JWT-based authentication aktif:

- ✅ Login ekranı (`/admin.html`)
- ✅ Bearer token authentication
- ✅ Role-based access control (admin, user)
- ✅ Auto-logout on token expiry
- ✅ LocalStorage token management

**Demo Credentials:**

```
admin@example.com / admin123  (role: admin)
user@example.com / user123    (role: user - admin panel erişemez)
```

⚠️ **Production**: Statik kullanıcıları DB'ye taşı, bcrypt hash kullan

#### 2. **CORS Yapılandırması** ✅ Yapıldı

Whitelist-based CORS aktif. Production domain'lerinizi ekleyin:

```javascript
// src/config/cors.js
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  // Regex örneği:
  /^https:\/\/.*\.yourdomain\.com$/, // Tüm subdomain'ler
];
```

**Test Edilmiş:**

- ✅ İzin verilen origin'ler çalışıyor
- ✅ İzin verilmeyen origin'ler bloklanıyor
- ✅ Postman/API test araçları çalışıyor (origin yok)
- ✅ OPTIONS preflight requests çalışıyor

#### 3. **Rate Limiting** ✅ Yapıldı

İhtiyaca göre sıkılaştırılmış, çok katmanlı limitler:

```javascript
// src/middlewares/rateLimit.js
rlRead: 200 istek / 60 saniye       // Public GET
rlWrite: 60 istek / 60 saniye       // Admin CRUD
rlBruteforce: 30 istek / 60 saniye  // Login (bruteforce protection)
```

**Test Sonuçları:**

- ✅ Login endpoint: 30/60s limit aktif
- ✅ Protected POST: 60/60s limit aktif
- ✅ Public GET: 200/60s limit aktif
- ✅ Başarılı login denemeleri de sayılıyor (bruteforce önleme)

#### 4. **Content Security Policy**

⚠️ Production'da `src/config/csp.js` dosyasından şunları kaldırın:

- `'unsafe-inline'` (script ve style için)
- `'unsafe-eval'`
- Inline script'leri ayrı .js dosyalarına taşıyın

#### 5. **HTTPS Kullanımı**

SSL sertifikası ile şifreli bağlantı zorunlu (Let's Encrypt ücretsiz)

#### 6. **Environment Variables** ⚠️ Kritik

- ❌ `.env` dosyasını **ASLA** commit etmeyin
- ✅ `.gitignore`'da `.env` olduğundan emin olun (zaten var)
- ✅ `.env.example` şablonunu paylaşın
- ✅ Production'da farklı credentials kullanın
- ✅ JWT_SECRET için güçlü key: `openssl rand -base64 32`
- ✅ Secrets management: AWS Secrets Manager, Azure Key Vault, vs.

**Kontrol:**

```bash
# .env dosyası git'de olmamalı
git status  # .env gösterilmemeli

# .gitignore kontrolü
cat .gitignore | grep .env  # .env satırı olmalı
```

#### 7. **Database Security** ✅ Yapıldı

Production MSSQL ayarları environment-based:

```javascript
// src/db.js
const isProduction = process.env.NODE_ENV === 'production';

options: {
  enableArithAbort: true,
  encrypt: isProduction ? true : false,           // Production: TLS encryption
  trustServerCertificate: isProduction ? false : true,  // Production: Sertifika doğrulama
  useUTC: false,
}
```

**Development**: `encrypt: false`, `trustServerCertificate: true` (local MSSQL uyumlu)  
**Production**: `encrypt: true`, `trustServerCertificate: false` (güvenli)

---

## 📈 Örnek Kullanım Senaryoları

### 1. NPS Anketi

```
Soru 1: Bizi 0-10 arasında önerme olasılığınız? (Likert)
Soru 2: Neden bu puanı verdiniz? (Metin)
```

### 2. Koşullu Akış Örneği

```
Soru 1: Ürünümüzü kullanıyor musunuz?
  → Evet: Soru 5'e atla (detaylı sorular)
  → Hayır: Soru 2'ye devam (neden kullanmıyor)
```

### 3. Bölümlü Anket

```
Bölüm 1: Demografi
  - Yaş
  - Cinsiyet
  - Şehir

Bölüm 2: Memnuniyet
  - Ürün kalitesi
  - Müşteri hizmetleri
  - Fiyat/performans

Bölüm 3: Geri Bildirim
  - Açık uçlu sorular
```

---

## 🐛 Sorun Giderme

### Veritabanı Bağlantı Hatası

- SQL Server'ın çalıştığından emin olun
- `.env` dosyasındaki bilgileri kontrol edin
- Windows Authentication için `MSSQL_USER` ve `MSSQL_PASSWORD` boş bırakın

### XLSX Export Çalışmıyor

- `npm install xlsx` komutu çalıştırılmış olmalı
- Node.js versiyonu 14+ olmalı

### Admin Panelinde Sorular Görünmüyor

- Tarayıcı konsolunu kontrol edin (F12)
- Backend'in çalıştığından emin olun
- Anketin seçili olduğundan emin olun

---

## 📝 Lisans ve İletişim

Bu proje, Node.js + Express + MS SQL Server kullanılarak modüler ve clean code prensipleriyle geliştirilmiştir.

### Özellikler Özeti

✅ Dropdown anket menüsü  
✅ Yeni anket oluşturma modal'ı  
✅ Anket güncelleme/silme  
✅ Aktif/Pasif toggle  
✅ XLSX export  
✅ İstatistikler  
✅ 5 soru tipi  
✅ Zorunlu soru işaretleme  
✅ Hazır şablonlar (NPS, Likert, Demografi, Şehir)  
✅ Koşullu akış (soru bağlantıları)  
✅ Bölümlere ayırma  
✅ Sürükle-bırak sıralama  
✅ Modern UI/UX

---

**Geliştirme Tarihi**: 2025  
**Versiyon**: 2.1.0  
**Stack**: Node.js + Express + MS SQL Server + Vanilla JavaScript

### 🆕 Son Güncellemeler (v2.1.0)

- ✅ **Davetiye Sistemi**: Email ile kişiselleştirilmiş anket linkleri
- ✅ **Nodemailer**: Gmail, SendGrid, Mailgun, AWS SES desteği
- ✅ **Email Auto-fill**: Token ile email otomatik doldurma
- ✅ **Soru Sıralama**: Input field ile manuel sıra değiştirme
- ✅ **Akıllı Dropdown**: 10+ seçenek otomatik dropdown
- ✅ **Smoke Tests**: Health check test script'i
- ✅ **ESLint & Prettier**: Airbnb style guide
- ✅ **İstatistik Kartları**: Toplam/Kullanılan davetiye sayıları
