const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { register, login, me, updateMe, forgotPassword, resetPassword, logWeight } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, updateMe);
router.post('/weight', requireAuth, logWeight);

module.exports = router;
