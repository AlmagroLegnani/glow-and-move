require('dotenv').config();
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health');
const workoutRoutes = require('./routes/workouts');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/workouts', workoutRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Web Fitness API funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
