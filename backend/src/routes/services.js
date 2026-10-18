const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const services = require('../controllers/servicesController');

router.get('/', services.listServices);
router.get('/:slug', requireAuth, services.getService);
router.post('/:slug/checkout', requireAuth, services.checkoutService);

module.exports = router;
