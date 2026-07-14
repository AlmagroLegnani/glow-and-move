const express = require('express');
const router = express.Router();
const { listPlans } = require('../controllers/plansController');

router.get('/', listPlans);

module.exports = router;
