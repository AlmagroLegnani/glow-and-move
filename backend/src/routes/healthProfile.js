const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { submitHealthProfile } = require('../controllers/healthProfileController');

router.post('/', requireAuth, submitHealthProfile);

module.exports = router;
