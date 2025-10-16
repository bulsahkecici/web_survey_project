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
`.env.example` dosyasını `.env` olarak kopyalayın ve MSSQL bilgilerinizi girin:
```
MSSQL_SERVER=localhost\SQLEXPRESS
MSSQL_DATABASE=SurveyDB
MSSQL_USER=        # Opsiyonel (Windows Auth için boş bırakın)
MSSQL_PASSWORD=    # Opsiyonel (Windows Auth için boş bırakın)
PORT=3000
```

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

#### 2. **Soru Yönetimi**
- ✅ **Sürükle-Bırak Sıralama**: Soruları kolayca yeniden düzenleyin
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
- ✅ **Koşullu Soru Gösterimi**: Akıllı soru atlama
- ✅ **Tek Seferlik Doldurma**: E-posta bazlı unique constraint
- ✅ **Token ile Davetiye**: `/s/<token>` ile tek tıklama erişim
- ✅ **Zorunlu Soru Doğrulaması**: Boş soru kontrolü

### 🛡️ Güvenlik ve Performans
- ✅ **SQL Injection Koruması**: Parametrized queries
- ✅ **Rate Limiting**: 200 istek/dakika
- ✅ **Helmet Security Headers**: XSS, clickjacking koruması
- ✅ **Transaction Yönetimi**: Rollback desteği
- ✅ **Error Handling**: Try-catch blokları ve anlamlı hata mesajları
- ✅ **Input Validation**: express-validator ile

### 🏗️ Mimari ve Kod Kalitesi
- ✅ **Modüler Yapı**: DB ve server ayrı modüller
- ✅ **Clean Code**: Separation of Concerns
- ✅ **RESTful API**: Standart HTTP metodları
- ✅ **Stored Procedure**: Kritik işlemler için
- ✅ **Cascade Delete**: İlişkisel veri temizliği

---

## 📊 API Uç Noktaları

### Anket (Survey) İşlemleri
```
GET    /api/surveys              # Tüm anketleri listele
POST   /api/surveys              # Yeni anket oluştur
PUT    /api/surveys/:id          # Anket güncelle
DELETE /api/surveys/:id          # Anket sil
GET    /api/surveys/:slug        # Anket detayları + sorular
GET    /api/surveys/:id/stats    # Anket istatistikleri
GET    /api/surveys/:id/export   # XLSX olarak veri dışa aktar
```

### Bölüm (Section) İşlemleri
```
GET    /api/surveys/:surveyId/sections    # Anketin bölümlerini listele
POST   /api/surveys/:surveyId/sections    # Yeni bölüm ekle
DELETE /api/sections/:id                  # Bölüm sil
```

### Soru (Question) İşlemleri
```
POST   /api/questions/bulk       # Toplu soru kaydetme (upsert)
```

### Davetiye ve Yanıt
```
POST   /api/invitations          # Token oluştur
POST   /api/responses            # Anket yanıtı gönder
```

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
- **Security**: Helmet, Rate Limiter, express-validator
- **Export**: xlsx kütüphanesi

### Bağımlılıklar
```json
{
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.19.2",
  "express-rate-limit": "^7.1.5",
  "express-validator": "^7.2.1",
  "helmet": "^7.1.0",
  "mssql": "^10.0.2",
  "uuid": "^9.0.1",
  "xlsx": "^0.18.5"
}
```

### Yeni Bağımlılık Ekleme
Geliştirme sırasında yeni bağımlılıklar eklendiyse:
```bash
npm install
```

---

## 🔒 Güvenlik Önerileri

### Production Ortamı İçin
1. **Admin Paneli Koruması**: `/admin.html` için kimlik doğrulama ekleyin
   - Reverse proxy (nginx) ile Basic Auth
   - Veya JWT token bazlı auth middleware
   
2. **CORS Kısıtlama**: `cors()` ayarlarını güncelleyin
   ```javascript
   app.use(cors({ origin: 'https://yourdomain.com' }));
   ```

3. **Rate Limit Ayarları**: İhtiyaca göre sıkılaştırın
   ```javascript
   rateLimit({ windowMs: 60_000, max: 50 })
   ```

4. **HTTPS Kullanımı**: SSL sertifikası ile şifreli bağlantı

5. **Environment Variables**: `.env` dosyasını asla commit etmeyin

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
**Versiyon**: 2.0.0  
**Stack**: Node.js + Express + MS SQL Server + Vanilla JavaScript
