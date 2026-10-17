const express = require('express');
const router = express.Router();
const { runExpirationJob } = require('../jobs/expirations');

// Render (plan free) duerme el servidor, así que no podemos programar tareas adentro del
// proceso. Un cron externo (GitHub Actions, ver .github/workflows/daily-jobs.yml) llama a
// este endpoint una vez por día con el secreto en el header Authorization.
function requireCronSecret(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'CRON_SECRET no está configurado en el servidor' });
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

router.post('/daily', requireCronSecret, async (req, res) => {
  try {
    const expirations = await runExpirationJob();
    res.json({ ok: true, expirations });
  } catch (err) {
    console.error('Error en el job diario', err);
    res.status(500).json({ error: 'Falló el job diario' });
  }
});

module.exports = router;
