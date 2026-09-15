import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import './BlocksModal.css';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

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

export default function BlocksModal({ onClose, onBack }) {
  const { token } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | locked | error | ready
  const [data, setData] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const [performedChoice, setPerformedChoice] = useState(null); // null | true | false
  const [drafts, setDrafts] = useState({});

  const [view, setView] = useState('today'); // today | progress
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [continueBilling, setContinueBilling] = useState('trimestral');
  useEffect(() => {
    if (data?.today?.state === 'awaiting_payment') {
      setContinueBilling(data.billingMode !== 'anual' ? data.billingMode : 'trimestral');
    }
  }, [data?.today?.blockNumber, data?.today?.state, data?.billingMode]);

  useEffect(() => {
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

  // cada vez que cambia el día/semana/bloque actual, arrancamos de cero el formulario
  useEffect(() => {
    setPerformedChoice(null);
    setDrafts({});
  }, [data?.today?.blockNumber, data?.today?.week, data?.today?.dayNumber]);

  async function loadStats() {
    setStatsLoading(true);
    try {
      const res = await api.blockStats(token);
      setStats(res);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }

  function openProgress() {
    setView('progress');
    if (!stats) loadStats();
  }

  async function submitDay(performed, exercisesPayload) {
    setBusy(true);
    setActionError('');
    try {
      const res = await api.logDay(performed ? { performed, exercises: exercisesPayload } : { performed }, token);
      setData(res);
      setNotice(res.notice || null);
      setStats(null); // se recalcula la próxima vez que se abra "Mi progreso"
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleChoosePerformed(value) {
    setActionError('');
    setPerformedChoice(value);
    if (value === false) {
      submitDay(false, []);
      return;
    }
    const initial = {};
    data.today.exercises.forEach((ex) => {
      initial[ex.videoId] = { reps: String(ex.suggestedReps), weight: String(ex.suggestedWeight) };
    });
    setDrafts(initial);
  }

  function updateDraft(videoId, field, value) {
    setDrafts((prev) => ({ ...prev, [videoId]: { ...prev[videoId], [field]: value } }));
  }

  function handleSaveDay() {
    const exercisesPayload = data.today.exercises.map((ex) => ({
      videoId: ex.videoId,
      actualReps: Number(drafts[ex.videoId]?.reps),
      actualWeight: Number(drafts[ex.videoId]?.weight),
    }));
    const invalid = exercisesPayload.some(
      (e) => !Number.isFinite(e.actualReps) || e.actualReps <= 0 || !Number.isFinite(e.actualWeight) || e.actualWeight < 0
    );
    if (invalid) {
      setActionError('Completá repeticiones y peso reales de todos los ejercicios antes de guardar.');
      return;
    }
    submitDay(true, exercisesPayload);
  }

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

  if (status === 'loading') {
    return (
      <Modal title="Mi rutina" onClose={onClose} size="lg">
        <button type="button" className="modal__back" onClick={onBack}>
          ← Volver a mi perfil
        </button>
        <p className="profile__videos-hint">Cargando...</p>
      </Modal>
    );
  }

  if (status === 'locked') {
    return (
      <Modal title="Mi rutina" onClose={onClose} size="lg">
        <button type="button" className="modal__back" onClick={onBack}>
          ← Volver a mi perfil
        </button>
        <p className="profile__videos-hint">
          La rutina por bloques está disponible a partir del plan Premium.{' '}
          <a href="#planes" onClick={onClose}>
            Ver planes
          </a>
          .
        </p>
      </Modal>
    );
  }

  if (status === 'error') {
    return (
      <Modal title="Mi rutina" onClose={onClose} size="lg">
        <button type="button" className="modal__back" onClick={onBack}>
          ← Volver a mi perfil
        </button>
        <p className="modal__error">{fetchError}</p>
      </Modal>
    );
  }

  const { today, blocks } = data;
  const hasCompletedBlock = blocks.some((b) => b.status === 'completed');
  const billingOptions = hasCompletedBlock ? CONTINUE_BILLING_OPTIONS : BILLING_OPTIONS;

  return (
    <Modal title="Mi rutina" onClose={onClose} size="lg">
      <button type="button" className="modal__back" onClick={onBack}>
        ← Volver a mi perfil
      </button>

      {actionError && <p className="modal__error">{actionError}</p>}

      {notice && (
        <div className="bl-notice">
          <span>
            {notice.type === 'block_unlocked' && `¡Bloque ${notice.blockNumber} desbloqueado! Ya está en tu rutina (te avisamos por email).`}
            {notice.type === 'awaiting_payment' && `Terminaste el bloque. Pagá el Bloque ${notice.blockNumber} para seguir.`}
            {notice.type === 'year_complete' && '¡Completaste los 4 bloques del año!'}
          </span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}

      <div className="bl-tabs">
        <button type="button" className={`bl-tabs__btn ${view === 'today' ? 'bl-tabs__btn--active' : ''}`} onClick={() => setView('today')}>
          Hoy
        </button>
        <button type="button" className={`bl-tabs__btn ${view === 'progress' ? 'bl-tabs__btn--active' : ''}`} onClick={openProgress}>
          Mi progreso
        </button>
      </div>

      {view === 'progress' ? (
        <ProgressView stats={stats} loading={statsLoading} />
      ) : (
        <>
          {today.state === 'year_complete' && (
            <div className="bl-yearend">
              <h3>¡Completaste los 4 bloques de este año! 🎉</h3>
              <p>Revisá tu progreso del año en la pestaña "Mi progreso" antes de arrancar el siguiente.</p>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => runAction(api.startBlockNewYear(token))}>
                Empezar el próximo año
              </button>
            </div>
          )}

          {today.state === 'awaiting_payment' && (
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
                <a href="#planes" onClick={onClose}>
                  Cambiar de experiencia
                </a>
              </div>
            </div>
          )}

          {today.state === 'no_routine' && (
            <p className="profile__videos-hint">Este bloque todavía no tiene una rutina cargada. Escribinos y lo resolvemos.</p>
          )}

          {today.state === 'active' && (
            <>
              <div className="bl-today">
                <p className="bl-today__eyebrow">
                  Bloque {today.blockNumber} · Semana {today.week} de {today.totalWeeks}
                </p>
                <p className="bl-today__objective">{today.objective}</p>
                <h3 className="bl-today__day">
                  Día {today.dayNumber} de {today.totalDays} — {today.routineName}
                  {today.personalized && <span className="bl-today__badge">Personalizada</span>}
                </h3>
              </div>

              <div className="bl-table-wrap">
                <table className="bl-table">
                  <thead>
                    <tr>
                      <th>Ejercicio</th>
                      <th>Video</th>
                      <th>Sugerido</th>
                      {performedChoice === true && <th>Real</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {today.exercises.map((ex) => (
                      <tr key={ex.videoId}>
                        <td>{ex.name}</td>
                        <td>
                          {ex.hasVideoAccess ? (
                            <a href={ex.videoUrl} target="_blank" rel="noreferrer">
                              ▶ Ver video
                            </a>
                          ) : (
                            <a href="#planes" className="bl-video-locked" onClick={onClose}>
                              🔒 Mejorar plan
                            </a>
                          )}
                        </td>
                        <td>
                          {ex.suggestedSets} series × {ex.suggestedReps} reps
                          {ex.suggestedWeight > 0 ? ` × ${ex.suggestedWeight}kg` : ' (peso corporal)'}
                        </td>
                        {performedChoice === true && (
                          <td>
                            <div className="bl-log">
                              <input
                                type="number"
                                min="1"
                                placeholder="reps"
                                value={drafts[ex.videoId]?.reps ?? ''}
                                disabled={busy}
                                onChange={(e) => updateDraft(ex.videoId, 'reps', e.target.value)}
                                aria-label={`Repeticiones reales de ${ex.name}`}
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="kg"
                                value={drafts[ex.videoId]?.weight ?? ''}
                                disabled={busy}
                                onChange={(e) => updateDraft(ex.videoId, 'weight', e.target.value)}
                                aria-label={`Peso real de ${ex.name}`}
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {performedChoice === null && (
                <div className="bl-ask">
                  <p>¿Realizaste este entrenamiento?</p>
                  <div className="bl-ask__buttons">
                    <button type="button" className="btn btn-primary" disabled={busy} onClick={() => handleChoosePerformed(true)}>
                      Sí, lo hice
                    </button>
                    <button type="button" className="btn" disabled={busy} onClick={() => handleChoosePerformed(false)}>
                      No lo hice
                    </button>
                  </div>
                </div>
              )}

              {performedChoice === true && (
                <div className="bl-ask">
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={handleSaveDay}>
                    Guardar entrenamiento
                  </button>
                  <button type="button" className="bl-ask__cancel" disabled={busy} onClick={() => setPerformedChoice(null)}>
                    Cancelar
                  </button>
                </div>
              )}
            </>
          )}

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

            <div className="bl-billing">
              <span className="bl-billing__label">Forma de pago:</span>
              {billingOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={busy}
                  className={`bl-billing__pill ${data.billingMode === opt.id ? 'bl-billing__pill--active' : ''}`}
                  onClick={() => runAction(api.changeBlockBilling({ billingMode: opt.id }, token))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </details>
        </>
      )}
    </Modal>
  );
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function ProgressView({ stats, loading }) {
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
