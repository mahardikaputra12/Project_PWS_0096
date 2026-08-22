const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// GET /api/v1/destinations
// Query params: page, limit, province, category, search, min_rating, featured
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (req.query.province) {
      conditions.push(`d.province ILIKE $${idx++}`);
      values.push(`%${req.query.province}%`);
    }
    if (req.query.category) {
      conditions.push(`c.slug = $${idx++}`);
      values.push(req.query.category);
    }
    if (req.query.search) {
      conditions.push(`(d.name ILIKE $${idx} OR d.description ILIKE $${idx})`);
      values.push(`%${req.query.search}%`);
      idx++;
    }
    if (req.query.min_rating) {
      conditions.push(`d.rating >= $${idx++}`);
      values.push(parseFloat(req.query.min_rating));
    }
    if (req.query.featured === 'true') {
      conditions.push(`d.is_featured = TRUE`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM destinations d JOIN categories c ON c.id = d.category_id
       ${whereClause}`,
      values
    );
    const total = countResult.rows[0].total;

    const dataResult = await pool.query(
      `SELECT d.id, d.name, d.slug, c.name AS category, c.slug AS category_slug,
              d.province, d.city, d.address, d.description, d.latitude, d.longitude,
              d.ticket_price, d.rating, d.opening_hours, d.facilities,
              d.is_featured, d.image_url, d.created_at
       FROM destinations d JOIN categories c ON c.id = d.category_id
       ${whereClause}
       ORDER BY d.rating DESC, d.name ASC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset]
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/v1/destinations/:idOrSlug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isNumeric = /^\d+$/.test(idOrSlug);

    const result = await pool.query(
      `SELECT d.id, d.name, d.slug, c.name AS category, c.slug AS category_slug,
              d.province, d.city, d.address, d.description, d.latitude, d.longitude,
              d.ticket_price, d.rating, d.opening_hours, d.facilities,
              d.is_featured, d.image_url, d.created_at, d.updated_at
       FROM destinations d JOIN categories c ON c.id = d.category_id
       WHERE ${isNumeric ? 'd.id = $1' : 'd.slug = $1'}`,
      [isNumeric ? parseInt(idOrSlug) : idOrSlug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Destinasi tidak ditemukan.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
