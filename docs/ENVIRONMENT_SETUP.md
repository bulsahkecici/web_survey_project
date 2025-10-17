# Environment Setup Guide

## ⚠️ CRITICAL SECURITY WARNING

**NEVER commit `.env` file to Git!**

The `.env` file contains sensitive information like database passwords and JWT secrets. Committing this file to a public (or even private) repository is a serious security risk.

## Quick Setup

### 1. Copy Template

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

### 2. Edit Configuration

Open `.env` in your favorite editor and update the values:

```env
PORT=3000
NODE_ENV=development

# Database Configuration (MSSQL)
MSSQL_USER=sa
MSSQL_PASSWORD=YourStrongPassword123!
MSSQL_SERVER=localhost
MSSQL_DB=survey_db
MSSQL_PORT=1433

# JWT Authentication
JWT_SECRET=<use openssl rand -base64 32>

# SMTP Email Configuration (Optional - for invitations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=<gmail-app-password>
SMTP_FROM="Anket Sistemi <your-email@gmail.com>"

# Base URL (for email links)
BASE_URL=http://localhost:3000

# Optional
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

### 3. Verify .gitignore

Ensure `.env` is in `.gitignore`:

```bash
# Check .gitignore
cat .gitignore | grep .env
# Output: .env ✅

# Verify git status
git status
# .env should NOT appear in the list
```

## Required Variables

### Server

| Variable   | Description | Example                       | Required |
| ---------- | ----------- | ----------------------------- | -------- |
| `PORT`     | Server port | `3000`                        | Yes      |
| `NODE_ENV` | Environment | `development` or `production` | Yes      |

### Database (MSSQL)

| Variable         | Description       | Example            | Required           |
| ---------------- | ----------------- | ------------------ | ------------------ |
| `MSSQL_USER`     | Database user     | `sa`               | Yes                |
| `MSSQL_PASSWORD` | Database password | `YourPassword123!` | Yes                |
| `MSSQL_SERVER`   | Server address    | `localhost`        | Yes                |
| `MSSQL_DB`       | Database name     | `survey_db`        | Yes                |
| `MSSQL_PORT`     | Server port       | `1433`             | No (default: 1433) |

**Legacy Support:**

- `MSSQL_DATABASE` also works (alias for `MSSQL_DB`)

**Windows Authentication:**

- Leave `MSSQL_USER` and `MSSQL_PASSWORD` empty
- Application will use Windows Authentication automatically

### JWT Authentication

| Variable     | Description                | Example   | Required |
| ------------ | -------------------------- | --------- | -------- |
| `JWT_SECRET` | Secret key for JWT signing | See below | Yes      |

**Generate Strong JWT_SECRET:**

```bash
# Method 1: OpenSSL (recommended)
openssl rand -base64 32
# Output: xK8pQ2mN9vR3sT6uW1yB4cD7eF0gH5iJ2kL8mN1oP4qR3s=

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Online (use with caution)
# https://randomkeygen.com/
```

**Requirements:**

- ✅ Minimum 32 characters
- ✅ Random and unpredictable
- ✅ Different for each environment (dev/staging/prod)
- ❌ Never use weak secrets: "secret", "12345", "mysecret"

### SMTP Email (Optional)

| Variable      | Description        | Example                                 | Required |
| ------------- | ------------------ | --------------------------------------- | -------- |
| `SMTP_HOST`   | SMTP server        | `smtp.gmail.com`                        | No       |
| `SMTP_PORT`   | SMTP port          | `587` (TLS) or `465` (SSL)              | No       |
| `SMTP_SECURE` | Use SSL            | `false` for TLS, `true` for SSL         | No       |
| `SMTP_USER`   | SMTP username      | `your-email@gmail.com`                  | No       |
| `SMTP_PASS`   | SMTP password      | Gmail App Password                      | No       |
| `SMTP_FROM`   | Sender email       | `"Anket Sistemi <your-email@gmail.com>` | No       |
| `BASE_URL`    | Base URL for links | `http://localhost:3000`                 | No       |

**Note:** If SMTP is not configured, invitation emails will be logged to console only.

**Detailed Setup:** See [`docs/EMAIL_SETUP.md`](EMAIL_SETUP.md) for Gmail, SendGrid, Mailgun, AWS SES setup.

### Other Optional Variables

| Variable      | Description          | Default | Example                          |
| ------------- | -------------------- | ------- | -------------------------------- |
| `CORS_ORIGIN` | Allowed CORS origins | `true`  | `https://yourdomain.com`         |
| `LOG_LEVEL`   | Logging level        | `info`  | `debug`, `info`, `warn`, `error` |

## Environment-Specific Configuration

### Development

```env
PORT=3000
NODE_ENV=development

MSSQL_USER=sa
MSSQL_PASSWORD=DevPassword123!
MSSQL_SERVER=localhost
MSSQL_DB=survey_db_dev
MSSQL_PORT=1433

JWT_SECRET=dev-secret-min-32-chars-long-xyz123

# SMTP not configured - emails will be logged
# SMTP_HOST=smtp.gmail.com
# SMTP_USER=...
# SMTP_PASS=...

CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

**Features:**

- Detailed error messages
- Pretty logging (pino-pretty)
- DB: `encrypt: false`, `trustServerCertificate: true`
- Relaxed security for faster development

### Production

```env
PORT=80
NODE_ENV=production

MSSQL_USER=prod_user
MSSQL_PASSWORD=<strong-random-password>
MSSQL_SERVER=prod-sql-server.database.windows.net
MSSQL_DB=survey_db_prod
MSSQL_PORT=1433

JWT_SECRET=<openssl-rand-base64-32-output>

# SMTP Production (SendGrid recommended)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
SMTP_FROM="Anket Sistemi <noreply@yourdomain.com>"
BASE_URL=https://yourdomain.com

CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

**Features:**

- Generic error messages (security)
- JSON logging (structured)
- DB: `encrypt: true`, `trustServerCertificate: false`
- Strict security policies

## Security Best Practices

### 1. Never Commit .env

**Bad:**

```bash
git add .env
git commit -m "Add config"
git push  # ❌ SECURITY BREACH!
```

**Good:**

```bash
git add .env.example
git commit -m "Add config template"
git push  # ✅ Safe (no secrets)
```

### 2. Use Strong Secrets

**Bad JWT_SECRET:**

```env
JWT_SECRET=secret
JWT_SECRET=12345678
JWT_SECRET=mysecretkey
```

**Good JWT_SECRET:**

```env
JWT_SECRET=xK8pQ2mN9vR3sT6uW1yB4cD7eF0gH5iJ2kL8mN1oP4qR3s=
JWT_SECRET=$(openssl rand -base64 32)
```

### 3. Different Secrets Per Environment

```env
# Development
JWT_SECRET=dev-xK8pQ2mN9vR3sT6uW1yB4cD7eF0g

# Production
JWT_SECRET=prod-yL9qR3nO0wS4tU7vX2zA5bE8fG1h
```

### 4. Rotate Secrets Regularly

```bash
# Every 3-6 months
openssl rand -base64 32 > new_secret.txt
# Update .env
# Deploy
# Delete old secret
```

### 5. Use Secrets Management

**Sensitive Variables:**

- `JWT_SECRET` - Token signing key
- `MSSQL_PASSWORD` - Database password
- `SMTP_PASS` - Email service password/API key

**Cloud Services:**

- AWS Secrets Manager
- Azure Key Vault
- Google Secret Manager
- HashiCorp Vault

**Kubernetes:**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: survey-secrets
type: Opaque
data:
  jwt-secret: <base64-encoded>
  db-password: <base64-encoded>
```

**Docker:**

```bash
# Use secrets file
docker run --env-file .env.production app

# Or environment variables
docker run -e JWT_SECRET=$JWT_SECRET app
```

## Troubleshooting

### "JWT_SECRET not set" Error

```bash
# Check .env exists
ls -la .env

# Check variable is set
cat .env | grep JWT_SECRET

# Restart server
npm start
```

### Database Connection Failed

```bash
# Check credentials
cat .env | grep MSSQL_

# Test connection
sqlcmd -S localhost -U sa -P YourPassword

# Check database exists
sqlcmd -S localhost -U sa -P YourPassword -Q "SELECT name FROM sys.databases"
```

### CORS Error

```bash
# Check CORS_ORIGIN
cat .env | grep CORS_ORIGIN

# Update if needed
CORS_ORIGIN=http://localhost:3000
```

### Email Not Sending

```bash
# Check SMTP configuration
cat .env | grep SMTP_

# If variables missing, emails will be logged to console
# See docs/EMAIL_SETUP.md for configuration

# Test email sending
# Check server logs for:
# [INFO] SMTP server ready to send emails  (✅ configured)
# [WARN] SMTP not configured  (⚠️ not configured)
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
env:
  NODE_ENV: production
  PORT: 80
  MSSQL_SERVER: ${{ secrets.MSSQL_SERVER }}
  MSSQL_DB: ${{ secrets.MSSQL_DB }}
  MSSQL_USER: ${{ secrets.MSSQL_USER }}
  MSSQL_PASSWORD: ${{ secrets.MSSQL_PASSWORD }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

**Setup Secrets:**

1. Go to GitHub repository → Settings → Secrets
2. Add each secret individually
3. Reference as `${{ secrets.SECRET_NAME }}`

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Run with .env file
docker run --env-file .env.production survey-app

# Or with environment variables
docker run \
  -e NODE_ENV=production \
  -e JWT_SECRET=$JWT_SECRET \
  -e MSSQL_PASSWORD=$MSSQL_PASSWORD \
  survey-app
```

## Migration from Old Format

### Old .env Format

```env
MSSQL_SERVER=localhost\SQLEXPRESS
MSSQL_DATABASE=SurveyDB
# Empty for Windows Auth
```

### New .env Format

```env
MSSQL_USER=sa
MSSQL_PASSWORD=YourPassword
MSSQL_SERVER=localhost
MSSQL_DB=survey_db
MSSQL_PORT=1433

JWT_SECRET=<generate-strong-secret>
```

**Backward Compatible:**

- `MSSQL_DATABASE` still works (falls back to `MSSQL_DB`)
- Windows Auth: Leave user/password empty

## Validation

### Startup Check

Server validates environment on startup:

```javascript
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'CHANGE_ME') {
  console.error('❌ JWT_SECRET must be set!');
  process.exit(1);
}
```

### Health Check

```bash
# Check server is running
curl http://localhost:3000/healthz
# → {"ok":true,"data":{"status":"up"}}

# Check database connection
curl http://localhost:3000/readyz
# → {"ok":true,"data":{"status":"ready","db":{"ok":1}}}
```

## Security Incidents

### If .env is Leaked

**Immediate Actions:**

1. ✅ **Rotate ALL secrets**

   ```bash
   # Generate new JWT_SECRET
   openssl rand -base64 32

   # Update database password
   # Update .env
   # Redeploy
   ```

2. ✅ **Invalidate all tokens**
   - Users will need to re-login
   - Update JWT_SECRET forces token invalidation

3. ✅ **Check for unauthorized access**
   - Review logs
   - Check database for suspicious activity
   - Monitor API usage

4. ✅ **Notify users** (if breach is severe)

### Prevention

- ✅ Use `.env.example` for templates
- ✅ Never commit `.env`
- ✅ Use GitHub secret scanning
- ✅ Use pre-commit hooks to block `.env`
- ✅ Regular security audits

## Resources

- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [12-Factor App Config](https://12factor.net/config)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
