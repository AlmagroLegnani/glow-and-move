const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { checkout, changePlan } = require('../controllers/subscriptionsController');

router.post('/checkout', requireAuth, checkout);
router.post('/change-plan', requireAuth, changePlan);

module.exports = router;
