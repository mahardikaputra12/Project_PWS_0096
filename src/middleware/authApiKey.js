const pool = require('../config/db');

/**
 * Melindungi endpoint data (/api/v1/*) menggunakan API Key.
 * API Key dikirim lewat header: x-api-key: <api_key>
 * Setiap request yang lolos maupun ditolak dicatat ke tabel api_usage_logs.
 */
async function authApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key tidak ditemukan. Sertakan header x-api-key.',
    });
  }

  try {
    const result = await pool.query(
      `SELECT ak.id, ak.user_id, ak.is_active, ak.daily_quota
       FROM api_keys ak
       WHERE ak.api_key = $1`,
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'API key tidak valid.' });
    }

    const keyRow = result.rows[0];

    if (!keyRow.is_active) {
      return res.status(403).json({ success: false, message: 'API key ini sudah dinonaktifkan.' });
    }

    // Cek kuota harian sederhana berbasis jumlah baris log hari ini
    const usageToday = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM api_usage_logs
       WHERE api_key_id = $1 AND requested_at::date = CURRENT_DATE`,
      [keyRow.id]
    );

    if (usageToday.rows[0].total >= keyRow.daily_quota) {
      return res.status(429).json({
        success: false,
        message: `Kuota harian (${keyRow.daily_quota} request) untuk API key ini sudah habis.`,
      });
    }

    // Update last_used_at (fire and forget, tidak perlu di-await blocking response)
    pool.query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [keyRow.id]).catch(() => {});

    req.apiKeyId = keyRow.id;
    req.apiKeyUserId = keyRow.user_id;

    // Catat log setelah response selesai dikirim
    res.on('finish', () => {
      pool
        .query(
          `INSERT INTO api_usage_logs (api_key_id, endpoint, method, status_code, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [keyRow.id, req.originalUrl, req.method, res.statusCode, req.ip]
        )
        .catch((err) => console.error('Gagal mencatat api_usage_logs:', err.message));
    });

    next();
  } catch (err) {
    console.error('authApiKey error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat validasi API key.' });
  }
}

module.exports = authApiKey;
