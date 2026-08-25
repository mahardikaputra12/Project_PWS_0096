const express = require('express');
const { listCategories } = require('../controllers/categories.controller');

const router = express.Router();

// GET /api/v1/categories — untuk konsumen eksternal (API key)
router.get('/', listCategories);

module.exports = router;
