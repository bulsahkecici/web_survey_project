# Utils - Response Helpers

Standart API response formatları için yardımcı fonksiyonlar.

## responses.js

### Standart Response Formatı

Tüm API endpoint'leri tutarlı bir format kullanır:

#### Başarılı Response

```json
{
  "ok": true,
  "data": { ... }
}
```

#### Hatalı Response

```json
{
  "ok": false,
  "message": "Error message"
}
```

### Fonksiyonlar

#### `ok(res, data, code = 200)`

Başarılı response döndürür.

```javascript
import { ok } from '../utils/responses.js';

// Örnek kullanım
router.get('/users', async (req, res) => {
  const users = await getUsers();
  return ok(res, users); // 200 { ok: true, data: users }
});

router.post('/users', async (req, res) => {
  const newUser = await createUser(req.body);
  return ok(res, newUser, 201); // 201 { ok: true, data: newUser }
});
```

**Parametreler:**

- `res`: Express response object
- `data`: Dönülecek veri (any type)
- `code`: HTTP status code (default: 200)

#### `fail(res, message, code = 500)`

Hatalı response döndürür.

```javascript
import { fail } from '../utils/responses.js';

// Örnek kullanım
router.get('/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  if (!user) {
    return fail(res, 'User not found', 404);
  }
  return ok(res, user);
});
```

**Parametreler:**

- `res`: Express response object
- `message`: Hata mesajı (string)
- `code`: HTTP status code (default: 500)

### Production vs Development

Response mesajları environment'a göre değişir:

| Durum                   | Development   | Production    |
| ----------------------- | ------------- | ------------- |
| **Client Errors (4xx)** | Detaylı mesaj | Detaylı mesaj |
| **Server Errors (5xx)** | Detaylı mesaj | Generic mesaj |
| **Stack Trace**         | Log'da        | Log'da        |

### Error Handler ile Entegrasyon

`middlewares/error.js` ile entegredir. Route'larda `next(err)` kullanın:

```javascript
router.get('/users', async (req, res, next) => {
  try {
    const users = await getUsers();
    return ok(res, users);
  } catch (err) {
    next(err); // Error handler yakalayacak
  }
});
```

Error handler otomatik olarak `fail()` fonksiyonunu çağırır.

### Custom Error Status Codes

```javascript
router.post('/users', async (req, res, next) => {
  try {
    if (!req.body.email) {
      const error = new Error('Email is required');
      error.statusCode = 400; // Custom status code
      throw error;
    }
    const user = await createUser(req.body);
    return ok(res, user, 201);
  } catch (err) {
    next(err); // Error handler statusCode'u kullanacak
  }
});
```

### Frontend Kullanımı

Frontend'de response'ları parse etmek:

```javascript
// Başarılı durumu kontrol et
const response = await fetch('/api/users');
const data = await response.json();

if (data.ok) {
  console.log('Users:', data.data);
} else {
  console.error('Error:', data.message);
}
```

### Migration Notları

Eğer eski format kullanıyorsanız:

**Eski:**

```javascript
res.json({ status: 'success', users: [...] });
res.status(404).json({ error: 'Not found' });
```

**Yeni:**

```javascript
ok(res, { users: [...] });
fail(res, 'Not found', 404);
```

### Best Practices

1. ✅ **Her zaman `ok()` ve `fail()` kullan**

   ```javascript
   return ok(res, data); // Good
   res.json(data); // Bad
   ```

2. ✅ **Error handler kullan**

   ```javascript
   catch (err) {
     next(err); // Good - error handler yakalayacak
   }
   ```

3. ✅ **Status code belirt**

   ```javascript
   return ok(res, newUser, 201); // POST için 201
   return fail(res, 'Not found', 404); // 404 için
   ```

4. ✅ **Descriptive error messages**
   ```javascript
   return fail(res, 'User not found', 404); // Good
   return fail(res, 'Error', 404); // Bad
   ```

### Örnekler

#### REST API CRUD

```javascript
import { ok, fail } from '../utils/responses.js';

// GET /api/users
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.findAll();
    return ok(res, users);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return fail(res, 'User not found', 404);
    }
    return ok(res, user);
  } catch (err) {
    next(err);
  }
});

// POST /api/users
router.post('/users', async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    return ok(res, user, 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id
router.put('/users/:id', async (req, res, next) => {
  try {
    const user = await User.update(req.params.id, req.body);
    if (!user) {
      return fail(res, 'User not found', 404);
    }
    return ok(res, user);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    const deleted = await User.delete(req.params.id);
    if (!deleted) {
      return fail(res, 'User not found', 404);
    }
    return ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
});
```
