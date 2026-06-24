import dotenv from 'dotenv';
import path from 'path';

// Load .env from root in development; in production env vars come from platform
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },

  cors: {
    // In production accept both the Vercel URL and any configured origin
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.warn(`⚠️  Missing env vars: ${missing.join(', ')}`);
}
