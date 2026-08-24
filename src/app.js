const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const apiKeysRoutes = require('./routes/apiKeys.routes');
const destinationsRoutes = require('./routes/destinations.routes');
const categoriesRoutes = require('./routes/categories.routes');
const authApiKey = require('./middleware/authApiKey');

const app = express();

// Vercel (dan hampir semua platform serverless/hosting modern) menjalankan aplikasi
// di belakang reverse proxy. Baris ini memberi tahu Express untuk mempercayai
// header X-Forwarded-For dari 1 hop proxy di depannya, supaya:
//   1) req.ip terisi dengan IP asli pengunjung (dipakai di api_usage_logs)
//   2) express-rate-limit tidak error ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

// Rate limit global dasar (proteksi tambahan di luar kuota per API key)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti.' },
});
app.use(globalLimiter);

// ---------- Static landing page (public/) ----------
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- Health check (JSON) ----------
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'WisataData API aktif 🚀',
    docs: '/api/v1',
    version: '1.0.0',
  });
});

// ---------- Auth (JWT) ----------
app.use('/auth', authRoutes);

// ---------- Account management (JWT protected) ----------
app.use('/account/api-keys', apiKeysRoutes);

// ---------- Public Data API (API Key protected) ----------
app.use('/api/v1/destinations', authApiKey, destinationsRoutes);
app.use('/api/v1/categories', authApiKey, categoriesRoutes);

app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'Selamat datang di WisataData API v1',
    endpoints: {
      destinations: 'GET /api/v1/destinations?page=1&limit=10&province=Bali&category=pantai&search=kuta&min_rating=4&featured=true',
      destination_detail: 'GET /api/v1/destinations/:idOrSlug',
      categories: 'GET /api/v1/categories',
    },
    auth: 'Sertakan header x-api-key pada setiap request.',
  });
});

// ---------- 404 handler ----------
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
});

// ---------- Global error handler ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
});

module.exports = app;
