const pool = require('../config/db');

async function listCategories(req, res) {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.slug, c.description,
              COUNT(d.id)::int AS total_destinations
       FROM categories c
       LEFT JOIN destinations d ON d.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
}

module.exports = { listCategories };
