const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const admin = require('../controllers/adminController');

router.use(requireAuth, requireAdmin);

router.get('/users', admin.listUsers);
router.patch('/users/:id/role', admin.updateUserRole);
router.patch('/subscriptions/:id/status', admin.updateSubscriptionStatus);

router.get('/plans', admin.listPlans);
router.patch('/plans/:id', admin.updatePlan);

router.get('/blocks', admin.listBlocks);
router.patch('/blocks/:id', admin.updateBlock);

router.get('/videos', admin.listVideos);
router.post('/videos', admin.createVideo);
router.patch('/videos/:id', admin.updateVideo);
router.delete('/videos/:id', admin.deleteVideo);

router.get('/blocks/:blockId/routines', admin.listRoutinesForBlock);
router.post('/routines', admin.createRoutine);
router.delete('/routines/:id', admin.deleteRoutine);
router.post('/routines/:id/days', admin.createRoutineDay);
router.delete('/routine-days/:id', admin.deleteRoutineDay);
router.post('/routine-days/:id/exercises', admin.createRoutineExercise);
router.patch('/routine-exercises/:id', admin.updateRoutineExercise);
router.delete('/routine-exercises/:id', admin.deleteRoutineExercise);

module.exports = router;
