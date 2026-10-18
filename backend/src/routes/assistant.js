const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/assistantController');

// Asistente IA (Gemini). Público: si llega un token se usa para personalizar la respuesta.
router.post('/chat', chat);

module.exports = router;
