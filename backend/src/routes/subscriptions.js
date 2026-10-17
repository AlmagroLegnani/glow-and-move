const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { checkout, changePlan, getRenewalOptions, renew } = require('../controllers/subscriptionsController');

router.post('/checkout', requireAuth, checkout);
router.post('/change-plan', requireAuth, changePlan);
router.get('/renewal-options', requireAuth, getRenewalOptions);
router.post('/renew', requireAuth, renew);

module.exports = router;
