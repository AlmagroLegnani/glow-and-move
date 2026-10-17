// Días enteros entre hoy y `date` (negativo si ya pasó).
export function daysUntil(date) {
  if (!date) return null;
  const ms = new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// Fecha en la que termina el acceso según el estado de la suscripción.
export function subscriptionEndDate(subscription) {
  if (!subscription) return null;
  if (subscription.status === 'trial') return subscription.trialEndsAt;
  if (subscription.status === 'active' || subscription.status === 'past_due') return subscription.currentPeriodEnd;
  return null;
}

// Un plan "activo" o "prueba" cuya fecha de fin ya pasó no está vigente,
// aunque el backend todavía no haya actualizado el status.
export function isSubscriptionExpired(subscription) {
  if (!subscription || !['trial', 'active'].includes(subscription.status)) return false;
  const days = daysUntil(subscriptionEndDate(subscription));
  return days !== null && days < 0;
}

// Inactivo = pago vencido o fecha de fin pasada. Puede ver lo que ya pagó pero no registrar
// entrenamientos nuevos hasta renovar.
export function isSubscriptionInactive(subscription) {
  return subscription?.status === 'past_due' || isSubscriptionExpired(subscription);
}
