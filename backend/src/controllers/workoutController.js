// Datos de ejemplo en memoria (reemplazar por una base de datos real)
let workouts = [
  { id: 1, name: 'Full Body', exercises: ['Sentadillas', 'Flexiones', 'Plancha'] },
];

function listWorkouts(req, res) {
  res.json(workouts);
}

function createWorkout(req, res) {
  const { name, exercises } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El campo "name" es requerido' });
  }
  const newWorkout = { id: workouts.length + 1, name, exercises: exercises || [] };
  workouts.push(newWorkout);
  res.status(201).json(newWorkout);
}

module.exports = { listWorkouts, createWorkout };
