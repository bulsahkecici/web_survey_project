# Email Setup Guide

Bu proje davetiye gönderme için **Nodemailer** kullanır. SMTP ayarlarını yapılandırmadan da çalışır (emails console'a log olur).

## 📧 Gmail ile Kurulum (Önerilen)

### 1. Gmail App Password Oluştur

Google hesabınızda **2FA (İki Faktörlü Doğrulama)** aktif olmalıdır.

1. [Google Account Security](https://myaccount.google.com/security) sayfasına git
2. "2-Step Verification" bölümüne tıkla
3. En alta "App passwords" bölümüne git
4. "Select app" → **Mail** seç
5. "Select device" → **Other** seç, "Survey App" yaz
6. **Generate** butonuna tıkla
7. Oluşan 16 haneli şifreyi kopyala

### 2. .env Dosyasını Ayarla

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Gmail App Password (16 haneli)
SMTP_FROM="Anket Sistemi <your-email@gmail.com>"
BASE_URL=http://localhost:3000
```

### 3. Test Et

Admin panelde davetiye gönder. Gmail gelen kutusunu kontrol et!

---

## 📨 SendGrid ile Kurulum (Production İçin)

[SendGrid](https://sendgrid.com/) ücretsiz 100 email/gün sağlar.

### 1. SendGrid Account Oluştur

1. [SendGrid](https://sendgrid.com/) - Sign Up
2. Email doğrula
3. Settings > API Keys > Create API Key
4. **Full Access** ver
5. API Key'i kopyala

### 2. .env Dosyasını Ayarla

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM="Anket Sistemi <noreply@yourdomain.com>"
BASE_URL=https://yourdomain.com
```

### 3. Domain Authentication (Opsiyonel ama Önerilen)

SendGrid > Settings > Sender Authentication > **Authenticate Your Domain**

Bu adım email'lerin spam klasörüne düşmesini önler.

---

## 🔧 Diğer SMTP Servisleri

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
SMTP_FROM="Anket Sistemi <noreply@yourdomain.com>"
```

### AWS SES (Amazon Simple Email Service)

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
SMTP_FROM="Anket Sistemi <noreply@yourdomain.com>"
```

### Outlook/Office365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM="Anket Sistemi <your-email@outlook.com>"
```

---

## 🚫 SMTP Olmadan Çalıştırma

`.env` dosyasında SMTP ayarları yoksa:
- Email gönderilmez
- Davetiye bilgileri **console'a log** olur
- Sistem normal çalışmaya devam eder

Bu geliştirme ortamında kullanışlıdır.

---

## ✅ Email Template Özelleştirme

Email template'i düzenlemek için: `src/utils/email.js`

### Varsayılan Template

```javascript
const defaultMessage = `Merhaba,

${surveyTitle} anketine katılmanızı rica ediyoruz.

Anket linki: ${surveyUrl}

Teşekkürler.`;
```

### HTML Template

Modern, responsive HTML email template zaten var. Stil değişiklikleri için `sendInvitationEmail()` fonksiyonundaki HTML kodunu düzenleyin.

---

## 🐛 Sorun Giderme

### Email gönderilmiyor

1. **Console log'lara bak:**
   ```bash
   [INFO] Email sent successfully
   ```
   veya
   ```bash
   [ERROR] Email send failed
   ```

2. **SMTP bağlantısını test et:**
   ```bash
   [INFO] SMTP server ready to send emails
   ```
   veya
   ```bash
   [ERROR] SMTP connection failed
   ```

3. **Yaygın hatalar:**
   - ❌ **Invalid login:** SMTP_USER/SMTP_PASS yanlış
   - ❌ **Connection timeout:** SMTP_HOST/SMTP_PORT yanlış
   - ❌ **TLS error:** SMTP_SECURE değerini değiştir
   - ❌ **535 Authentication failed:** Gmail için App Password kullan

### Gmail "Less secure app" hatası

Gmail artık "Less secure apps" desteklemiyor. **App Password** kullanmalısınız.

### Email spam klasörüne düşüyor

1. **Domain Authentication** yap (SendGrid/Mailgun)
2. **SPF/DKIM** kayıtları ekle (DNS)
3. **Gerçek domain** kullan (`noreply@yourdomain.com`)

---

## 📊 Rate Limits

### Gmail
- **Ücretsiz:** 500 email/gün
- **Workspace:** 2000 email/gün

### SendGrid
- **Ücretsiz:** 100 email/gün
- **Essentials:** 40,000 email/ay ($15)

### Mailgun
- **Ücretsiz:** 5,000 email/ay (3 ay trial)
- **Foundation:** 50,000 email/ay ($35)

---

## 🔐 Güvenlik

1. **`.env` dosyasını GIT'e ekleme!**
   - Zaten `.gitignore`'da var
   - SMTP şifreleri hassas bilgidir

2. **App Password kullan** (Gmail)
   - Ana şifreyi asla kullanma

3. **API Key'leri döndür**
   - Düzenli olarak yeni key oluştur
   - Eski key'leri sil

4. **Rate limit koy**
   - Kötü amaçlı kullanım önlenir
   - Zaten admin-only endpoint

---

## 🎯 Production Checklist

- [ ] SendGrid/Mailgun gibi profesyonel servis kullan
- [ ] Domain authentication yap
- [ ] SMTP_FROM gerçek domain ile değiştir
- [ ] BASE_URL production URL'e güncelle
- [ ] Rate limit ayarla (rlWrite zaten var)
- [ ] Email monitoring kur (bounce/spam tracking)
- [ ] GDPR/KVKK uyumu kontrol et

---

## 📚 Kaynaklar

- [Nodemailer Docs](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Setup](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Email Deliverability Best Practices](https://sendgrid.com/blog/email-deliverability-best-practices/)

