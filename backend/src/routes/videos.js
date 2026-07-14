const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { listMyVideos } = require('../controllers/videosController');

router.get('/', requireAuth, listMyVideos);

module.exports = router;
