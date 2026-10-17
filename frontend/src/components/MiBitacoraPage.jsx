import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import AccountShell from './AccountShell.jsx';
import './Modal.css';
import './BlocksModal.css';

const BILLING_OPTIONS = [
  { id: 'trimestral', label: 'Trimestral' },
  { id: 'semestral', label: 'Semestral' },
  { id: 'anual', label: 'Anual' },
];

// Una vez que ya completaste algún bloque, "Anual" deja de poder elegirse (esa tarifa es
// solo para quien paga todo el año por adelantado desde el arranque).
const CONTINUE_BILLING_OPTIONS = BILLING_OPTIONS.filter((opt) => opt.id !== 'anual');

const BLOCK_STATUS_LABEL = {
  active: 'En curso',
  scheduled: 'Pago al día — se desbloquea solo',
  locked: 'Bloqueado',
  completed: 'Completado',
};

const PERFORMANCE_LABEL = {
  superior: 'Por encima de lo sugerido',
  esperado: 'Como lo sugerido',
  inferior: 'Por debajo de lo sugerido',
};

export default function MiBitacoraPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | locked | error | ready
  const [data, setData] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [continueBilling, setContinueBilling] = useState('trimestral');
  useEffect(() => {
    if (data?.today?.state === 'awaiting_payment') {
      setContinueBilling(data.billingMode !== 'anual' ? data.billingMode : 'trimestral');
    }
  }, [data?.today?.blockNumber, data?.today?.state, data?.billingMode]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    api
      .myBlocks(token)
      .then((res) => {
        if (cancelled) return;
        if (res.locked) setStatus('locked');
        else {
          setData(res);
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchError(err.message);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (status !== 'ready' || !token) return;
    setStatsLoading(true);
    api
      .blockStats(token)
      .then((res) => setStats(res))
      .catch((err) => setActionError(err.message))
      .finally(() => setStatsLoading(false));
  }, [status, token]);

  async function runAction(promise) {
    setBusy(true);
    setActionError('');
    try {
      const res = await promise;
      setData(res);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || status === 'loading') {
    return (
      <AccountShell active="bitacora">
        <h1>Mi bitácora</h1>
        <p className="profile__videos-hint">Cargando...</p>
      </AccountShell>
    );
  }

  if (!user) {
    return (
      <AccountShell active="bitacora">
        <h1>Mi bitácora</h1>
        <p className="profile__videos-hint">Iniciá sesión para ver tu bitácora.</p>
        <a className="btn btn-primary" href="/">
          Volver al inicio
        </a>
      </AccountShell>
    );
  }

  if (status === 'locked') {
    return (
      <AccountShell active="bitacora">
        <h1>Mi bitácora</h1>
        <p className="profile__videos-hint">
          La rutina por bloques está disponible a partir del plan Premium. <a href="/#planes">Ver planes</a>.
        </p>
      </AccountShell>
    );
  }

  if (status === 'error') {
    return (
      <AccountShell active="bitacora">
        <h1>Mi bitácora</h1>
        <p className="modal__error">{fetchError}</p>
      </AccountShell>
    );
  }

  const { today, blocks } = data;

  return (
    <AccountShell active="bitacora">
      <h1>Mi bitácora</h1>

      {actionError && <p className="modal__error">{actionError}</p>}

      {!data.inactive && today.state === 'year_complete' && (
        <div className="bl-yearend">
          <h3>¡Completaste los 4 bloques de este año! 🎉</h3>
          <p>Revisá tu progreso más abajo antes de arrancar el siguiente.</p>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => runAction(api.startBlockNewYear(token))}>
            Empezar el próximo año
          </button>
        </div>
      )}

      {!data.inactive && today.state === 'awaiting_payment' && (
        <div className="bl-paywall">
          <p>
            Terminaste el Bloque {today.blockNumber - 1}. ¿Querés seguir con el Bloque {today.blockNumber}?
          </p>
          <div className="bl-billing">
            <span className="bl-billing__label">Forma de pago:</span>
            {CONTINUE_BILLING_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={busy}
                className={`bl-billing__pill ${continueBilling === opt.id ? 'bl-billing__pill--active' : ''}`}
                onClick={() => setContinueBilling(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="bl-paywall__actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => runAction(api.payBlock({ blockNumber: today.blockNumber, billingMode: continueBilling }, token))}
            >
              Pagar y desbloquear Bloque {today.blockNumber}
            </button>
            <a href="/#planes">Cambiar de experiencia</a>
          </div>
        </div>
      )}

      {today.state === 'no_routine' && (
        <p className="profile__videos-hint">Este bloque todavía no tiene una rutina cargada. Escribinos y lo resolvemos.</p>
      )}

      {!data.inactive && today.state === 'active' && (
        <p className="profile__videos-hint">
          Tenés un entrenamiento pendiente hoy. Cargalo desde <a href="/mi-rutina">Mi rutina</a>.
        </p>
      )}

      <ProgressView stats={stats} loading={statsLoading} userName={`${user.firstName} ${user.lastName}`} />

      <details className="bl-track-details">
        <summary>Ver los 4 bloques del año</summary>
        <div className="bl-track">
          {blocks.map((b) => (
            <div key={b.number} className={`bl-track__item bl-track__item--${b.status} ${b.number === today.blockNumber ? 'bl-track__item--current' : ''}`}>
              <span className="bl-track__icon" aria-hidden="true">
                {b.status === 'completed' ? '✓' : b.status === 'locked' ? '🔒' : b.number}
              </span>
              <span className="bl-track__title">{b.name}</span>
              <span className="bl-track__months">{b.objective}</span>
              <span className="bl-track__status">{BLOCK_STATUS_LABEL[b.status]}</span>
              {b.paidUntil && <span className="bl-track__months">Pago vigente hasta {new Date(b.paidUntil).toLocaleDateString('es-UY')}</span>}
            </div>
          ))}
        </div>
      </details>
    </AccountShell>
  );
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function buildReportHtml(block, userName) {
  const rows = block.exercises
    .map(
      (ex) => `
        <tr>
          <td>${ex.name}</td>
          <td>${PERFORMANCE_LABEL[ex.performance]}</td>
          <td>${round1(ex.avgWeight)}kg × ${Math.round(ex.avgReps)} reps</td>
          <td>${round1(ex.avgSuggestedWeight)}kg × ${Math.round(ex.avgSuggestedReps)} reps</td>
          <td>${ex.weightDelta > 0 ? '+' : ''}${round1(ex.weightDelta)}kg, ${ex.repsDelta > 0 ? '+' : ''}${round1(ex.repsDelta)} reps</td>
        </tr>`
    )
    .join('');

  const weightSection =
    block.startWeightKg !== null && block.endWeightKg !== null
      ? `<p><strong>Peso al empezar el bloque:</strong> ${block.startWeightKg}kg<br/>
         <strong>Peso al terminar el bloque:</strong> ${block.endWeightKg}kg<br/>
         <strong>Diferencia:</strong> ${block.weightDeltaKg > 0 ? '+' : ''}${block.weightDeltaKg}kg
         (${block.weightDeltaKg > 0 ? 'aumento' : block.weightDeltaKg < 0 ? 'baja' : 'sin cambios'} de peso)</p>`
      : `<p><em>No hay suficientes registros de peso cargados desde "Mi plan" para calcular la diferencia de este bloque.</em></p>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Informe — ${block.blockName}</title>
<style>
  body { font-family: Arial, sans-serif; color: #33291f; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.3rem; }
  h2 { font-size: 1rem; margin-top: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.85rem; }
  th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid #eee; }
  th { background: #f0e6da; }
</style>
</head>
<body>
  <h1>Informe de progreso — ${block.blockName}</h1>
  <p><strong>Alumno/a:</strong> ${userName}</p>
  <p><strong>Objetivo de este bloque:</strong> ${block.objective || '—'}</p>
  <p><strong>Objetivo del próximo bloque:</strong> ${block.nextObjective || '—'}</p>

  <h2>Frecuencia de entrenamiento</h2>
  <p>${block.performedCount} entrenamientos realizados, ${block.missedCount} salteados — ${block.adherencePct}% de adherencia.</p>

  <h2>Peso corporal</h2>
  ${weightSection}

  <h2>Superación personal por ejercicio</h2>
  <table>
    <thead>
      <tr><th>Ejercicio</th><th>Resultado</th><th>Promedio real</th><th>Promedio sugerido</th><th>Diferencia</th></tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="5">Sin registros en este bloque.</td></tr>'}</tbody>
  </table>

  <p style="margin-top:2rem;font-size:0.75rem;color:#6b5f52;">Generado desde Glow &amp; Move — ${new Date().toLocaleDateString('es-UY')}</p>
</body>
</html>`;
}

function downloadBlockReport(block, userName) {
  const html = buildReportHtml(block, userName);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `informe-${block.blockName.replace(/\s+/g, '-').toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ProgressView({ stats, loading, userName }) {
  if (loading) return <p className="profile__videos-hint">Cargando progreso...</p>;
  if (!stats) return null;

  const blocksWithData = stats.perBlock.filter((b) => b.performedCount + b.missedCount > 0);

  return (
    <div className="bl-progress">
      {blocksWithData.length === 0 && <p className="profile__videos-hint">Todavía no registraste entrenamientos.</p>}

      {stats.perBlock.map((block) => (
        <div key={block.blockNumber} className="bl-progress__block">
          <h4>
            {block.blockName} — {BLOCK_STATUS_LABEL[block.status]}
          </h4>
          {block.status === 'completed' && (
            <button type="button" className="btn" onClick={() => downloadBlockReport(block, userName)}>
              Descargar informe
            </button>
          )}
          {block.adherencePct !== null ? (
            <>
              <div className="bl-progressbar">
                <div className="bl-progressbar__fill" style={{ width: `${block.adherencePct}%` }} />
                <span className="bl-progressbar__label">
                  {block.adherencePct}% de adherencia — {block.performedCount} hechos, {block.missedCount} salteados
                </span>
              </div>

              {block.exercises.map((ex) => (
                <div key={ex.videoId} className="bl-progress__exercise">
                  <span className="bl-progress__exercise-name">{ex.name}</span>
                  <span className={`bl-progress__badge bl-progress__badge--${ex.performance}`}>{PERFORMANCE_LABEL[ex.performance]}</span>
                  <span className="bl-progress__delta">
                    {round1(ex.avgWeight)}kg × {Math.round(ex.avgReps)} reps (sugerido: {round1(ex.avgSuggestedWeight)}kg ×{' '}
                    {Math.round(ex.avgSuggestedReps)} reps — {ex.weightDelta > 0 ? '+' : ''}
                    {round1(ex.weightDelta)}kg, {ex.repsDelta > 0 ? '+' : ''}
                    {round1(ex.repsDelta)} reps)
                  </span>
                </div>
              ))}
            </>
          ) : (
            <p className="bl-history-hint">Todavía sin registros en este bloque.</p>
          )}
        </div>
      ))}

      {stats.comparison.some((c) => c.points.length > 1) && (
        <div className="bl-progress__block">
          <h4>Comparación entre bloques</h4>
          {stats.comparison
            .filter((c) => c.points.length > 1)
            .map((c) => {
              const max = Math.max(...c.points.map((p) => p.avgWeight), 1);
              return (
                <div key={c.name} className="bl-compare">
                  <span className="bl-compare__name">{c.name}</span>
                  <div className="bl-bars">
                    {c.points.map((p) => (
                      <div key={p.blockNumber} className="bl-bars__col">
                        <div className="bl-bars__bar" style={{ height: `${(p.avgWeight / max) * 100}%` }} />
                        <span className="bl-bars__value">{round1(p.avgWeight)}kg</span>
                        <span className="bl-bars__label">B{p.blockNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
