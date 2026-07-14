const express = require('express');
const router = express.Router();
const { startTrial } = require('../controllers/trialController');

router.post('/', startTrial);

module.exports = router;
