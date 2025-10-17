import 'dotenv/config.js';
import path from 'path';
import { fileURLToPath } from 'url';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { corsConfig } from './config/cors.js';
import { cspDirectives } from './config/csp.js';
import { errorHandler } from './middlewares/error.js';
import { httpLogger, logger } from './middlewares/logger.js';
import { rlRead } from './middlewares/rateLimit.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// -------- Security & Config Middlewares --------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
  }),
);
app.use(cors(corsConfig));

// -------- Body Parser --------
app.use(express.json({ limit: '1mb' }));

// -------- Logging --------
app.use(httpLogger);

// -------- Rate Limiting (default: read limit) --------
app.use(rlRead);

// -------- Health Check Endpoints --------
app.get('/healthz', (req, res) =>
  res.status(200).json({
    ok: true,
    data: { status: 'up' },
  }),
);

app.get('/readyz', async (req, res) => {
  try {
    const { getPool } = await import('./db.js');
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1 as ok');
    return res.status(200).json({
      ok: true,
      data: {
        status: 'ready',
        db: result.recordset[0],
      },
    });
  } catch (e) {
    logger.error('Readiness check failed', e);
    return res.status(503).json({
      ok: false,
      message:
        process.env.NODE_ENV === 'production' ? 'Service not ready' : e.message,
    });
  }
});

// -------- API Routes --------
app.use('/api/auth', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', publicRoutes);

// -------- Static Files --------
app.use(express.static(path.join(__dirname, '..', 'public')));

// Token redirect route
app.get('/s/:token', (req, res) => {
  const t = req.params.token;
  res.redirect(`/?token=${t}`);
});

// -------- Error Handler (must be last) --------
app.use(errorHandler);

// -------- Start Server --------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`🚀 API listening on http://localhost:${port}`);
});
