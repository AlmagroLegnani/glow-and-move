const prisma = require('../lib/prisma');

async function listPlans(req, res) {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(plans);
}

module.exports = { listPlans };
