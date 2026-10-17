const prisma = require('../lib/prisma');
const { pricingTable } = require('../lib/billing');

// Cada plan sale con su precio mensual (priceUsd) y el total por forma de pago ya calculado
// con descuento, para que el frontend no duplique la lógica de precios.
async function listPlans(req, res) {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(plans.map((plan) => ({ ...plan, pricing: pricingTable(plan) })));
}

module.exports = { listPlans };
