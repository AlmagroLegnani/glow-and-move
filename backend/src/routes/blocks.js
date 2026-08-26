const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const blocks = require('../controllers/blocksController');

router.use(requireAuth, blocks.loadContext);

router.get('/', blocks.getOverview);
router.post('/day', blocks.logDay);
router.post('/pay', blocks.payBlock);
router.post('/billing-mode', blocks.changeBillingMode);
router.get('/stats', blocks.getStats);
router.post('/new-year', blocks.startNewYear);

module.exports = router;
