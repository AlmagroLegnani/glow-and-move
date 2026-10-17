// Formas de pago y precios. Plan.priceUsd es el precio MENSUAL; cada forma de pago cobra
// varios meses juntos con un descuento según cuántos meses se pagan por adelantado.
// Cada bloque del programa dura 3 meses, así que meses / 3 = bloques que quedan pagos.

const MONTHS_BY_MODE = { trimestral: 3, semestral: 6, anual: 12 };
const BILLING_MODES = Object.keys(MONTHS_BY_MODE);
const MONTHS_PER_BLOCK = 3;

// Descuento por cantidad de meses pagados juntos. Para un número de meses que no está en la
// tabla (ej. "resto del año" = 9) se usa el escalón inmediato inferior.
const DISCOUNT_BY_MONTHS = { 3: 0, 6: 0.1, 9: 0.15, 12: 0.2 };

function discountFor(months) {
  const steps = Object.keys(DISCOUNT_BY_MONTHS)
    .map(Number)
    .filter((m) => m <= months)
    .sort((a, b) => b - a);
  return steps.length ? DISCOUNT_BY_MONTHS[steps[0]] : 0;
}

function priceFor(plan, months) {
  const discount = discountFor(months);
  const total = Math.round(Number(plan.priceUsd) * months * (1 - discount) * 100) / 100;
  return {
    months,
    total,
    monthly: Math.round((total / months) * 100) / 100,
    discountPct: Math.round(discount * 100),
  };
}

function pricingTable(plan) {
  return Object.fromEntries(BILLING_MODES.map((mode) => [mode, priceFor(plan, MONTHS_BY_MODE[mode])]));
}

function modeForMonths(months) {
  if (months <= 3) return 'trimestral';
  if (months <= 6) return 'semestral';
  return 'anual';
}

function labelForMonths(months, remainingMonths) {
  if (months === 12) return 'Anual';
  if (months === 6) return 'Semestral';
  if (months === 3) return 'Trimestral';
  if (months === remainingMonths) return `Resto del año (${months} meses)`;
  return `${months} meses`;
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// Fecha hasta la que el usuario tiene acceso pago (o de prueba).
function accessEndDate(subscription) {
  if (!subscription) return null;
  if (subscription.status === 'trial') return subscription.trialEndsAt;
  return subscription.currentPeriodEnd;
}

// Inactivo = pago vencido, o un plan activo/de prueba cuya fecha de fin ya pasó (aunque el
// job diario todavía no lo haya marcado como past_due).
function isInactive(subscription) {
  if (!subscription) return false;
  if (subscription.status === 'past_due') return true;
  if (subscription.status !== 'active' && subscription.status !== 'trial') return false;
  const end = accessEndDate(subscription);
  return !!end && new Date(end).getTime() < Date.now();
}

module.exports = {
  MONTHS_BY_MODE,
  BILLING_MODES,
  MONTHS_PER_BLOCK,
  DISCOUNT_BY_MONTHS,
  priceFor,
  pricingTable,
  modeForMonths,
  labelForMonths,
  addMonths,
  accessEndDate,
  isInactive,
};
