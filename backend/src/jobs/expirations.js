const prisma = require('../lib/prisma');
const { notifyUser, enabledChannels } = require('../lib/notifications');
const { accessEndDate } = require('../lib/billing');

const DAY_MS = 24 * 60 * 60 * 1000;

// Cuántos días antes del vencimiento se avisa. La prueba gratis dura una semana, así que
// usa umbrales más cortos.
const REMINDER_DAYS = { active: [7, 3, 1], trial: [2, 1] };

function formatDate(date) {
  // El servidor corre en UTC: forzamos la zona de Uruguay para que la fecha no salga corrida.
  return new Date(date).toLocaleDateString('es-UY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Montevideo',
  });
}

function layout({ title, body, ctaLabel, ctaUrl }) {
  return `
  <div style="background:#f0e6da;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#33291f">
    <div style="max-width:520px;margin:0 auto;background:#fffdf9;border-radius:20px;padding:32px;border:1px solid #e4d6c4">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#b89b7c;font-weight:bold">Glow &amp; Move</p>
      <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;font-size:26px;color:#33291f">${title}</h1>
      ${body}
      <p style="margin:28px 0 0">
        <a href="${ctaUrl}" style="display:inline-block;background:#55402c;color:#f0e6da;text-decoration:none;padding:14px 28px;border-radius:100px;font-weight:bold;font-size:13px;letter-spacing:1px;text-transform:uppercase">${ctaLabel}</a>
      </p>
    </div>
  </div>`;
}

function buildMessage(kind, { user, subscription, endDate, daysLeft }) {
  const url = `${process.env.FRONTEND_URL || ''}/mi-plan`;
  const planName = subscription.plan.name;
  const isTrial = subscription.status === 'trial';
  const what = isTrial ? 'tu prueba gratis' : `tu ${planName}`;

  if (kind === 'expired') {
    const subject = isTrial ? 'Tu prueba gratis terminó — Glow & Move' : 'Tu plan venció — Glow & Move';
    const text = `Hola ${user.firstName}, ${what} venció el ${formatDate(endDate)}. Tus rutinas y tu bitácora siguen guardadas: renová tu plan para seguir entrenando. ${url}`;
    return {
      subject,
      text,
      html: layout({
        title: isTrial ? 'Tu prueba gratis terminó' : 'Tu plan venció',
        body: `<p style="line-height:1.6">Hola ${user.firstName}, ${what} venció el <strong>${formatDate(endDate)}</strong>.</p>
               <p style="line-height:1.6">No perdiste nada: tus rutinas, ejercicios y bitácora siguen guardados. Para volver a registrar entrenamientos y avanzar de bloque, renová tu plan.</p>`,
        ctaLabel: isTrial ? 'Elegir mi plan' : 'Renovar plan',
        ctaUrl: url,
      }),
    };
  }

  const days = daysLeft ?? Number(kind.match(/\d+/)[0]);
  const when = days === 1 ? 'mañana' : `en ${days} días`;
  const text = `Hola ${user.firstName}, ${what} vence ${when} (${formatDate(endDate)}). Renovalo para no cortar tu progreso. ${url}`;
  return {
    subject: `${isTrial ? 'Tu prueba gratis' : 'Tu plan'} vence ${when} — Glow & Move`,
    text,
    html: layout({
      title: `${isTrial ? 'Tu prueba gratis' : 'Tu plan'} vence ${when}`,
      body: `<p style="line-height:1.6">Hola ${user.firstName}, ${what} vence el <strong>${formatDate(endDate)}</strong>.</p>
             <p style="line-height:1.6">Renovalo antes para no cortar tu progreso. Podés elegir pagar trimestral, semestral o el resto del año con descuento.</p>`,
      ctaLabel: isTrial ? 'Elegir mi plan' : 'Renovar plan',
      ctaUrl: url,
    }),
  };
}

// Qué aviso le toca hoy a esta suscripción (null si ninguno). Si el job no corrió algún día,
// se manda sólo el umbral más cercano, no todos los atrasados.
function dueKind(subscription, endDate, now) {
  if (endDate.getTime() < now.getTime()) return 'expired';
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / DAY_MS);
  const thresholds = REMINDER_DAYS[subscription.status] || [];
  const hit = thresholds.filter((t) => daysLeft <= t).sort((a, b) => a - b)[0];
  return hit ? `expiry_${hit}d` : null;
}

async function runExpirationJob({ now = new Date() } = {}) {
  // Sólo la suscripción más reciente de cada usuario: las anteriores ya no representan su plan.
  const latest = await prisma.subscription.findMany({
    orderBy: { createdAt: 'desc' },
    distinct: ['userId'],
    include: { plan: true, user: true },
  });

  const channels = enabledChannels();
  const summary = { checked: 0, markedPastDue: 0, sent: [], failed: [] };

  for (const subscription of latest) {
    if (subscription.status !== 'active' && subscription.status !== 'trial') continue;
    const end = accessEndDate(subscription);
    if (!end) continue;
    summary.checked += 1;

    const endDate = new Date(end);
    const kind = dueKind(subscription, endDate, now);
    if (!kind) continue;

    const already = await prisma.notificationLog.findMany({
      where: { subscriptionId: subscription.id, kind, periodEnd: endDate },
      select: { channel: true },
    });
    const skip = already.map((n) => n.channel);

    if (skip.length < channels.length) {
      const daysLeft = Math.max(1, Math.ceil((endDate.getTime() - now.getTime()) / DAY_MS));
      const message = buildMessage(kind, { user: subscription.user, subscription, endDate, daysLeft });
      const results = await notifyUser(subscription.user, message, { channels, skip });
      for (const r of results) {
        if (r.ok) {
          await prisma.notificationLog.create({
            data: { subscriptionId: subscription.id, kind, channel: r.channel, periodEnd: endDate },
          });
          summary.sent.push({ subscriptionId: subscription.id, kind, channel: r.channel });
        } else {
          summary.failed.push({ subscriptionId: subscription.id, kind, channel: r.channel, error: r.error });
        }
      }
    }

    // Se marca como vencido después de intentar el aviso, así un fallo de email no deja al
    // usuario sin el cartel de "plan inactivo" (el frontend igual lo calcula por fecha).
    if (kind === 'expired') {
      await prisma.subscription.update({ where: { id: subscription.id }, data: { status: 'past_due' } });
      summary.markedPastDue += 1;
    }
  }

  return summary;
}

module.exports = { runExpirationJob, dueKind, buildMessage };
