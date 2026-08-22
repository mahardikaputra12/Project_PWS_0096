const jwt = require('jsonwebtoken');

/**
 * Melindungi endpoint akun (mis. kelola API key) menggunakan JWT.
 * Token dikirim lewat header: Authorization: Bearer <token>
 */
function authJwt(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token JWT tidak ditemukan. Sertakan header Authorization: Bearer <token>.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token JWT tidak valid atau sudah kedaluwarsa.',
    });
  }
}

module.exports = authJwt;
