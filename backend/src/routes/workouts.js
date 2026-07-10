const express = require('express');
const router = express.Router();
const { listWorkouts, createWorkout } = require('../controllers/workoutController');

router.get('/', listWorkouts);
router.post('/', createWorkout);

module.exports = router;
