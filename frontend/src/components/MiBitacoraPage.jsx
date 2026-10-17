import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import AccountShell from './AccountShell.jsx';
import './Modal.css';
import './BlocksModal.css';
import './MiRutinaPage.css';
import './MiBitacoraPage.css';

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
  scheduled: 'Pago, se desbloquea solo',
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
        <div className="rt-empty">
          <h2>Tu bitácora te está esperando</h2>
          <p>La rutina por bloques y la bitácora están disponibles a partir del plan Premium.</p>
          <a className="rt-btn rt-btn--primary" href="/#planes">
            Ver planes
          </a>
        </div>
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
  const currentBlock = blocks.find((b) => b.status === 'active') || blocks.find((b) => b.number === today.blockNumber);
  const totals = (stats?.perBlock || []).reduce(
    (acc, b) => ({ performed: acc.performed + b.performedCount, missed: acc.missed + b.missedCount }),
    { performed: 0, missed: 0 }
  );
  const totalLogged = totals.performed + totals.missed;
  const overallAdherence = totalLogged > 0 ? Math.round((totals.performed / totalLogged) * 100) : null;
  const completedBlocks = blocks.filter((b) => b.status === 'completed').length;

  return (
    <AccountShell active="bitacora">
      <h1>Mi bitácora</h1>

      {actionError && <p className="modal__error">{actionError}</p>}

      <div className="bt-kpis">
        <div className="bt-kpi">
          <span className="bt-kpi__label">Entrenamientos</span>
          <span className="bt-kpi__value">{totals.performed}</span>
          <span className="bt-kpi__hint">realizados</span>
        </div>
        <div className="bt-kpi">
          <span className="bt-kpi__label">Adherencia</span>
          <span className="bt-kpi__value">{overallAdherence !== null ? `${overallAdherence}%` : '—'}</span>
          <span className="bt-kpi__hint">{totals.missed} salteados</span>
        </div>
        <div className="bt-kpi">
          <span className="bt-kpi__label">Bloque actual</span>
          <span className="bt-kpi__value">{currentBlock ? currentBlock.number : '—'}</span>
          <span className="bt-kpi__hint">de {blocks.length || 4}</span>
        </div>
        <div className="bt-kpi">
          <span className="bt-kpi__label">Completados</span>
          <span className="bt-kpi__value">{completedBlocks}</span>
          <span className="bt-kpi__hint">bloques</span>
        </div>
      </div>

      {!data.inactive && today.state === 'year_complete' && (
        <div className="bt-callout bt-callout--celebrate">
          <div>
            <strong>¡Completaste los 4 bloques de este año! 🎉</strong>
            <span>Revisá tu progreso más abajo antes de arrancar el siguiente.</span>
          </div>
          <button type="button" className="rt-btn rt-btn--primary" disabled={busy} onClick={() => runAction(api.startBlockNewYear(token))}>
            Empezar el próximo año
          </button>
        </div>
      )}

      {!data.inactive && today.state === 'awaiting_payment' && (
        <div className="bt-callout bt-callout--pay">
          <div>
            <strong>
              Terminaste el Bloque {today.blockNumber - 1}. ¿Seguimos con el Bloque {today.blockNumber}?
            </strong>
            <span>Elegí cómo querés pagar para desbloquearlo.</span>
          </div>
          <div className="bt-pay">
            <div className="bt-pay__options" role="radiogroup" aria-label="Forma de pago">
              {CONTINUE_BILLING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={continueBilling === opt.id}
                  disabled={busy}
                  className={`bt-pay__opt ${continueBilling === opt.id ? 'bt-pay__opt--active' : ''}`}
                  onClick={() => setContinueBilling(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="rt-btn rt-btn--primary"
              disabled={busy}
              onClick={() => runAction(api.payBlock({ blockNumber: today.blockNumber, billingMode: continueBilling }, token))}
            >
              Desbloquear Bloque {today.blockNumber}
            </button>
          </div>
          <a className="bt-callout__link" href="/#planes">
            Cambiar de experiencia
          </a>
        </div>
      )}

      {today.state === 'no_routine' && (
        <div className="bt-callout">
          <div>
            <strong>Tu rutina se está armando</strong>
            <span>Este bloque todavía no tiene una rutina cargada. Escribinos y lo resolvemos.</span>
          </div>
        </div>
      )}

      {!data.inactive && today.state === 'active' && (
        <div className="bt-callout bt-callout--today">
          <div>
            <strong>Tenés un entrenamiento pendiente</strong>
            <span>
              Bloque {today.blockNumber} · Semana {today.week} · Día {today.dayNumber}
            </span>
          </div>
          <a className="rt-btn rt-btn--primary" href="/mi-rutina">
            Ir a Mi rutina
          </a>
        </div>
      )}

      <section className="bt-section">
        <h2 className="bt-section__title">Tu año</h2>
        <ol className="bt-timeline">
          {blocks.map((b) => (
            <li key={b.number} className={`bt-step bt-step--${b.status}`}>
              <span className="bt-step__dot" aria-hidden="true">
                {b.status === 'completed' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                ) : b.status === 'locked' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="10" width="16" height="11" rx="3" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                ) : (
                  b.number
                )}
              </span>
              <div className="bt-step__body">
                <span className="bt-step__name">{b.name}</span>
                <span className={`bt-pill bt-pill--${b.status}`}>{BLOCK_STATUS_LABEL[b.status]}</span>
                {b.objective && <span className="bt-step__objective">{b.objective}</span>}
                {b.status === 'active' && (
                  <span className="bt-step__meta">
                    Semana {b.currentWeek} de {b.durationWeeks}
                  </span>
                )}
                {b.paidUntil && b.status !== 'completed' && (
                  <span className="bt-step__meta">Pago hasta {new Date(b.paidUntil).toLocaleDateString('es-UY')}</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <ProgressView stats={stats} loading={statsLoading} userName={`${user.firstName} ${user.lastName}`} />
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

function signed(n, unit) {
  const v = round1(n);
  return `${v > 0 ? '+' : ''}${v}${unit}`;
}

function AdherenceRing({ pct }) {
  return (
    <span className="bt-ring" style={{ '--pct': pct }} aria-label={`${pct}% de adherencia`}>
      <span>{pct}%</span>
    </span>
  );
}

function ProgressView({ stats, loading, userName }) {
  if (loading) return <p className="profile__videos-hint">Cargando progreso...</p>;
  if (!stats) return null;

  const blocksWithData = stats.perBlock.filter((b) => b.performedCount + b.missedCount > 0);
  const comparisons = stats.comparison.filter((c) => c.points.length > 1);

  if (blocksWithData.length === 0) {
    return (
      <div className="rt-empty">
        <span className="rt-empty__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6" />
          </svg>
        </span>
        <h2>Tu progreso aparece acá</h2>
        <p>Cada vez que registres un entrenamiento en Mi rutina, vas a ver tu adherencia y cómo rendiste frente a lo sugerido.</p>
        <a className="rt-btn rt-btn--primary" href="/mi-rutina">
          Ir a Mi rutina
        </a>
      </div>
    );
  }

  return (
    <section className="bt-section">
      <h2 className="bt-section__title">Tu progreso</h2>

      {blocksWithData.map((block) => (
        <article key={block.blockNumber} className="bt-block">
          <header className="bt-block__head">
            <AdherenceRing pct={block.adherencePct} />
            <div className="bt-block__title">
              <h3>{block.blockName}</h3>
              <span>
                {block.performedCount} {block.performedCount === 1 ? 'hecho' : 'hechos'} · {block.missedCount}{' '}
                {block.missedCount === 1 ? 'salteado' : 'salteados'}
              </span>
            </div>
            <span className={`bt-pill bt-pill--${block.status}`}>{BLOCK_STATUS_LABEL[block.status]}</span>
            {block.status === 'completed' && (
              <button type="button" className="rt-btn rt-btn--ghost bt-block__report" onClick={() => downloadBlockReport(block, userName)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
                </svg>
                Informe
              </button>
            )}
          </header>

          {block.exercises.length > 0 && (
            <ul className="bt-ex-list">
              {block.exercises.map((ex) => (
                <li key={ex.videoId} className="bt-ex">
                  <div className="bt-ex__main">
                    <span className="bt-ex__name">{ex.name}</span>
                    <span className={`bt-perf bt-perf--${ex.performance}`}>{PERFORMANCE_LABEL[ex.performance]}</span>
                  </div>
                  <div className="bt-ex__nums">
                    <span>
                      <small>Real</small>
                      {round1(ex.avgWeight)} kg × {Math.round(ex.avgReps)}
                    </span>
                    <span>
                      <small>Sugerido</small>
                      {round1(ex.avgSuggestedWeight)} kg × {Math.round(ex.avgSuggestedReps)}
                    </span>
                    <span className={`bt-delta bt-delta--${ex.performance}`}>
                      {signed(ex.weightDelta, ' kg')} · {signed(ex.repsDelta, ' reps')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}

      {comparisons.length > 0 && (
        <article className="bt-block">
          <header className="bt-block__head">
            <div className="bt-block__title">
              <h3>Comparación entre bloques</h3>
              <span>Peso promedio por ejercicio</span>
            </div>
          </header>
          <div className="bt-compare">
            {comparisons.map((c) => {
              const max = Math.max(...c.points.map((p) => p.avgWeight), 1);
              return (
                <div key={c.name} className="bt-compare__item">
                  <span className="bt-compare__name">{c.name}</span>
                  <div className="bt-bars">
                    {c.points.map((p) => (
                      <div key={p.blockNumber} className="bt-bars__col">
                        <span className="bt-bars__value">{round1(p.avgWeight)}kg</span>
                        <div className="bt-bars__bar" style={{ height: `${Math.max((p.avgWeight / max) * 100, 4)}%` }} />
                        <span className="bt-bars__label">B{p.blockNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      )}
    </section>
  );
}
