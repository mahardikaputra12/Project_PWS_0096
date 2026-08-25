const express = require('express');
const { listDestinations, getDestinationDetail } = require('../controllers/destinations.controller');

const router = express.Router();

// GET /api/v1/destinations — untuk konsumen eksternal (API key)
router.get('/', listDestinations);

// GET /api/v1/destinations/:idOrSlug
router.get('/:idOrSlug', getDestinationDetail);

module.exports = router;
