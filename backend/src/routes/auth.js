const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { register, login, me, updateMe } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, updateMe);

module.exports = router;
