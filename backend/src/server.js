require('dotenv').config();
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health');
const workoutRoutes = require('./routes/workouts');
const authRoutes = require('./routes/auth');
const plansRoutes = require('./routes/plans');
const trialRoutes = require('./routes/trial');
const subscriptionsRoutes = require('./routes/subscriptions');
const webhooksRoutes = require('./routes/webhooks');
const contactRoutes = require('./routes/contact');
const healthProfileRoutes = require('./routes/healthProfile');
const videosRoutes = require('./routes/videos');
const blocksRoutes = require('./routes/blocks');
const adminRoutes = require('./routes/admin');
const jobsRoutes = require('./routes/jobs');
const assistantRoutes = require('./routes/assistant');
const servicesRoutes = require('./routes/services');

const app = express();
// Render pone un proxy adelante: así req.ip es la IP real (la usa el límite del asistente).
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
// 1mb para admitir el avatar (foto recortada en base64).
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/trial', trialRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/health-profile', healthProfileRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/blocks', blocksRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/services', servicesRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Web Fitness API funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
