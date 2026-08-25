const express = require('express');
const crypto = require('crypto');
const pool = require('../config/db');
const authJwt = require('../middleware/authJwt');

const router = express.Router();
router.use(authJwt); // semua route di bawah ini wajib login (JWT)

function generateApiKey() {
  return 'wd_' + crypto.randomBytes(24).toString('hex');
}

// Samarkan API key saat ditampilkan ulang (bukan saat pertama dibuat), supaya
// key lengkap tidak berulang kali terekspos lewat response API/log/screenshot.
// Contoh: wd_e9d8f8d2ec1549735fbb51b09fc15c61a2c2d46b7473ac2b -> wd_e9d8f8...73ac2b
function maskApiKey(key) {
  if (!key || key.length < 14) return key;
  return `${key.slice(0, 9)}...${key.slice(-6)}`;
}

// GET /account/api-keys -> daftar API key milik user yang login (key disamarkan)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, label, api_key, is_active, daily_quota, last_used_at, created_at, revoked_at
       FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    const data = result.rows.map((row) => ({ ...row, api_key: maskApiKey(row.api_key) }));
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// POST /account/api-keys -> buat API key baru (key LENGKAP hanya muncul di response ini, sekali saja)
router.post('/', async (req, res) => {
  try {
    const { label } = req.body;
    const apiKey = generateApiKey();

    const result = await pool.query(
      `INSERT INTO api_keys (user_id, label, api_key) VALUES ($1, $2, $3)
       RETURNING id, label, api_key, is_active, daily_quota, created_at`,
      [req.user.id, label || 'Default Key', apiKey]
    );

    res.status(201).json({
      success: true,
      message: 'API key berhasil dibuat. Simpan sekarang — key lengkap tidak akan ditampilkan lagi.',
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// PATCH /account/api-keys/:id/revoke -> nonaktifkan API key
router.patch('/:id/revoke', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE api_keys SET is_active = FALSE, revoked_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING id, label, is_active, revoked_at`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'API key tidak ditemukan.' });
    }

    res.json({ success: true, message: 'API key dinonaktifkan.', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /account/api-keys/:id/usage -> statistik pemakaian API key
router.get('/:id/usage', async (req, res) => {
  try {
    const key = await pool.query(`SELECT id FROM api_keys WHERE id = $1 AND user_id = $2`, [
      req.params.id,
      req.user.id,
    ]);
    if (key.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'API key tidak ditemukan.' });
    }

    const usage = await pool.query(
      `SELECT endpoint, method, status_code, requested_at
       FROM api_usage_logs WHERE api_key_id = $1
       ORDER BY requested_at DESC LIMIT 50`,
      [req.params.id]
    );
    const totalToday = await pool.query(
      `SELECT COUNT(*)::int AS total FROM api_usage_logs
       WHERE api_key_id = $1 AND requested_at::date = CURRENT_DATE`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: { total_requests_today: totalToday.rows[0].total, recent_requests: usage.rows },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
