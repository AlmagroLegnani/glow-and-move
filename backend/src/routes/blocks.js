const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const blocks = require('../controllers/blocksController');

router.use(requireAuth, blocks.loadContext);

router.get('/', blocks.getOverview);
router.post('/day', blocks.requireActivePlan, blocks.logDay);
router.post('/pay', blocks.requireActivePlan, blocks.payBlock);
router.post('/billing-mode', blocks.requireActivePlan, blocks.changeBillingMode);
router.get('/stats', blocks.getStats);
router.post('/new-year', blocks.requireActivePlan, blocks.startNewYear);

module.exports = router;
