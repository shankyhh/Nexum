import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/config';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());

// Allow multiple origins: local dev + Vercel production URL
const allowedOrigins = [
  config.cors.origin,
  /\.vercel\.app$/,
  /\.nexum\.app$/,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((o) =>
        typeof o === 'string' ? o === origin : (o as RegExp).test(origin)
      );
      if (allowed) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(config.isDev ? 'dev' : 'combined'));

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use(generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Root health (for Render uptime check) ───────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'NEXUM API', version: '1.0.0' });
});

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`\n🚀 NEXUM API  →  http://localhost:${config.port}`);
  console.log(`   Env:  ${config.nodeEnv}`);
  console.log(`   CORS: ${config.cors.origin}\n`);
});

export default app;
