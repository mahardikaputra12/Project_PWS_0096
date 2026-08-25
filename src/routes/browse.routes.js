const express = require('express');
const authJwt = require('../middleware/authJwt');
const { listDestinations, getDestinationDetail } = require('../controllers/destinations.controller');
const { listCategories } = require('../controllers/categories.controller');

const router = express.Router();

// Semua route di sini dipakai oleh WEBSITE untuk user yang sedang login,
// otentikasinya pakai token JWT dari sesi login — BUKAN API key.
// API key tetap dipakai khusus untuk konsumen eksternal lewat /api/v1/*.
router.use(authJwt);

router.get('/destinations', listDestinations);
router.get('/destinations/:idOrSlug', getDestinationDetail);
router.get('/categories', listCategories);

module.exports = router;
