import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/index.js';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// ─── 0. SECURITY HEADERS & ENFORCEMENT ───
app.use((req, res, next) => {
  const isHttps = Boolean(req.connection?.encrypted || req.headers?.['x-forwarded-proto'] === 'https');

  if (config.nodeEnv === 'production' && req.headers?.['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');
  
  if (config.nodeEnv === 'production' || isHttps) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https:; media-src 'self' blob:;");

  next();
});

// ─── 1. GLOBAL MIDDLEWARE ───
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Id', 'x-workspace-id', 'X-Device-Id', 'Accept', 'Origin']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── 2. STATIC ASSETS SERVING ───
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('/')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.use('/asset_preview', express.static(path.join(__dirname, '../../mobile/assets')));

// ─── 3. UNIVERSAL ROUTE NORMALIZER ───
// Allows seamless backward compatibility for endpoints called with or without /api/ prefix
app.use((req, res, next) => {
  const url = req.url;
  const isStatic = url === '/' || 
                   url === '/health' || 
                   url.startsWith('/asset_preview') || 
                   url.endsWith('.html') || 
                   url.endsWith('.apk') || 
                   url.endsWith('.png') || 
                   url.endsWith('.jpg') || 
                   url.endsWith('.css') || 
                   url.endsWith('.js') || 
                   url.endsWith('.ico');

  if (!url.startsWith('/api/') && !isStatic) {
    req.url = '/api' + (url.startsWith('/') ? url : '/' + url);
  }
  next();
});

// Root landing page handler
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── 4. MOUNT API ROUTER ───
app.use('/api', apiRouter);

// Root health check alias
app.get('/health', (req, res) => {
  res.redirect('/api/health');
});

// ─── 5. SPA FALLBACK FOR NON-API GET ROUTES ───
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// ─── 6. ERROR HANDLING ───
app.use('/api', notFoundHandler);
app.use(errorHandler);

export default app;
