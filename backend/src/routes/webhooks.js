const express = require('express');
const router = express.Router();
const { mercadopagoWebhook } = require('../controllers/webhooksController');

router.post('/mercadopago', mercadopagoWebhook);

module.exports = router;
