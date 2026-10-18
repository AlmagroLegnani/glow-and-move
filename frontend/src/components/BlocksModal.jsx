import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import InactivePlanBanner from './InactivePlanBanner.jsx';
import './BlocksModal.css';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { useI18n } from '../i18n/I18nContext.jsx';

const BILLING_OPTIONS = ['trimestral', 'semestral', 'anual'];

// Una vez que ya completaste algún bloque, "Anual" deja de poder elegirse (esa tarifa es
// solo para quien paga todo el año por adelantado desde el arranque).
const CONTINUE_BILLING_OPTIONS = BILLING_OPTIONS.filter((mode) => mode !== 'anual');


export default function BlocksModal({ onClose, onBack }) {
  const { token } = useAuth();
  const { t, locale } = useI18n();
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
      setActionError(t('routine.invalidLogShort'));
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
      <Modal title={t('account.tabs.rutina')} onClose={onClose} size="lg">
        <button type="button" className="modal__back" onClick={onBack}>
          {t('profile.backToProfile')}
        </button>
        <p className="profile__videos-hint">{t('common.loading')}</p>
      </Modal>
    );
  }

  if (status === 'locked') {
    return (
      <Modal title={t('account.tabs.rutina')} onClose={onClose} size="lg">
        <button type="button" className="modal__back" onClick={onBack}>
          {t('profile.backToProfile')}
        </button>
        <p className="profile__videos-hint">
          {t('routine.lockedText')}{' '}
          <a href="#planes" onClick={onClose}>
            {t('routine.seePlans')}
          </a>
          .
        </p>
      </Modal>
    );
  }

  if (status === 'error') {
    return (
      <Modal title={t('account.tabs.rutina')} onClose={onClose} size="lg">
        <button type="button" className="modal__back" onClick={onBack}>
          {t('profile.backToProfile')}
        </button>
        <p className="modal__error">{fetchError}</p>
      </Modal>
    );
  }

  const { today, blocks } = data;

  return (
    <Modal title={t('account.tabs.rutina')} onClose={onClose} size="lg">
      <button type="button" className="modal__back" onClick={onBack}>
        {t('profile.backToProfile')}
      </button>

      <InactivePlanBanner />

      {actionError && <p className="modal__error">{actionError}</p>}

      {notice && (
        <div className="bl-notice">
          <span>
            {notice.type === 'block_unlocked' && t('routine.noticeUnlocked', { n: notice.blockNumber })}
            {notice.type === 'awaiting_payment' && t('routine.noticeAwaiting', { n: notice.blockNumber })}
            {notice.type === 'year_complete' && t('routine.noticeYear')}
          </span>
          <button type="button" onClick={() => setNotice(null)} aria-label={t('routine.closeNotice')}>
            ×
          </button>
        </div>
      )}

      <div className="bl-tabs">
        <button type="button" className={`bl-tabs__btn ${view === 'today' ? 'bl-tabs__btn--active' : ''}`} onClick={() => setView('today')}>
          {t('routine.today')}
        </button>
        <button type="button" className={`bl-tabs__btn ${view === 'progress' ? 'bl-tabs__btn--active' : ''}`} onClick={openProgress}>
          {t('routine.myProgress')}
        </button>
      </div>

      {view === 'progress' ? (
        <ProgressView stats={stats} loading={statsLoading} />
      ) : (
        <>
          {!data.inactive && today.state === 'year_complete' && (
            <div className="bl-yearend">
              <h3>{t('routine.yearEndTitle')}</h3>
              <p>{t('routine.yearEndModalText')}</p>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => runAction(api.startBlockNewYear(token))}>
                {t('routine.startNextYear')}
              </button>
            </div>
          )}

          {!data.inactive && today.state === 'awaiting_payment' && (
            <div className="bl-paywall">
              <p>
                {t('routine.paywallQuestion', { prev: today.blockNumber - 1, next: today.blockNumber })}
              </p>
              <div className="bl-billing">
                <span className="bl-billing__label">{t('routine.billingLabel')}</span>
                {CONTINUE_BILLING_OPTIONS.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={busy}
                    className={`bl-billing__pill ${continueBilling === mode ? 'bl-billing__pill--active' : ''}`}
                    onClick={() => setContinueBilling(mode)}
                  >
                    {t(`plans.billing.${mode}`)}
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
                  {t('routine.payUnlock', { n: today.blockNumber })}
                </button>
                <a href="#planes" onClick={onClose}>
                  {t('routine.changeExperience')}
                </a>
              </div>
            </div>
          )}

          {today.state === 'no_routine' && (
            <p className="profile__videos-hint">{t('routine.empty.no_routine.text')}</p>
          )}

          {today.state === 'active' && (
            <>
              <div className="bl-today">
                <p className="bl-today__eyebrow">
                  {t('routine.blockWeek', { block: today.blockNumber, week: today.week, total: today.totalWeeks })}
                </p>
                <p className="bl-today__objective">{today.objective}</p>
                <h3 className="bl-today__day">
                  {t('routine.dayOf', { n: today.dayNumber, total: today.totalDays, name: today.routineName })}
                  {today.personalized && <span className="bl-today__badge">{t('routine.personalized')}</span>}
                </h3>
              </div>

              <div className="bl-table-wrap">
                <table className="bl-table">
                  <thead>
                    <tr>
                      <th>{t('routine.colExercise')}</th>
                      <th>{t('routine.colVideo')}</th>
                      <th>{t('routine.colSuggested')}</th>
                      {performedChoice === true && <th>{t('routine.colActual')}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {today.exercises.map((ex) => (
                      <tr key={ex.videoId}>
                        <td>{ex.name}</td>
                        <td>
                          {ex.hasVideoAccess ? (
                            <a href={ex.videoUrl} target="_blank" rel="noreferrer">
                              ▶ {t('routine.watchVideo')}
                            </a>
                          ) : (
                            <a href="#planes" className="bl-video-locked" onClick={onClose}>
                              🔒 {t('routine.upgrade')}
                            </a>
                          )}
                        </td>
                        <td>
                          {t('routine.suggestedLine', { sets: ex.suggestedSets, reps: ex.suggestedReps })}
                          {ex.suggestedWeight > 0 ? ` × ${ex.suggestedWeight}kg` : t('routine.bodyweightParen')}
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
                                aria-label={t('routine.ariaReps', { name: ex.name })}
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="kg"
                                value={drafts[ex.videoId]?.weight ?? ''}
                                disabled={busy}
                                onChange={(e) => updateDraft(ex.videoId, 'weight', e.target.value)}
                                aria-label={t('routine.ariaWeight', { name: ex.name })}
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!data.inactive && performedChoice === null && (
                <div className="bl-ask">
                  <p>{t('routine.askTitle')}</p>
                  <div className="bl-ask__buttons">
                    <button type="button" className="btn btn-primary" disabled={busy} onClick={() => handleChoosePerformed(true)}>
                      {t('routine.yes')}
                    </button>
                    <button type="button" className="btn" disabled={busy} onClick={() => handleChoosePerformed(false)}>
                      {t('routine.no')}
                    </button>
                  </div>
                </div>
              )}

              {performedChoice === true && (
                <div className="bl-ask">
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={handleSaveDay}>
                    {t('routine.saveWorkout')}
                  </button>
                  <button type="button" className="bl-ask__cancel" disabled={busy} onClick={() => setPerformedChoice(null)}>
                    {t('routine.cancel')}
                  </button>
                </div>
              )}
            </>
          )}

          <details className="bl-track-details">
            <summary>{t('routine.seeYear')}</summary>
            <div className="bl-track">
              {blocks.map((b) => (
                <div key={b.number} className={`bl-track__item bl-track__item--${b.status} ${b.number === today.blockNumber ? 'bl-track__item--current' : ''}`}>
                  <span className="bl-track__icon" aria-hidden="true">
                    {b.status === 'completed' ? '✓' : b.status === 'locked' ? '🔒' : b.number}
                  </span>
                  <span className="bl-track__title">{b.name}</span>
                  <span className="bl-track__months">{b.objective}</span>
                  <span className="bl-track__status">{t(`routine.blockStatus.${b.status}`)}</span>
                  {b.paidUntil && <span className="bl-track__months">{t('routine.paidUntil', { date: new Date(b.paidUntil).toLocaleDateString(locale) })}</span>}
                </div>
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
  const { t } = useI18n();
  if (loading) return <p className="profile__videos-hint">{t('routine.loadingProgress')}</p>;
  if (!stats) return null;

  const blocksWithData = stats.perBlock.filter((b) => b.performedCount + b.missedCount > 0);

  return (
    <div className="bl-progress">
      {blocksWithData.length === 0 && <p className="profile__videos-hint">{t('routine.noLogs')}</p>}

      {stats.perBlock.map((block) => (
        <div key={block.blockNumber} className="bl-progress__block">
          <h4>
            {block.blockName} — {t(`routine.blockStatus.${block.status}`)}
          </h4>
          {block.adherencePct !== null ? (
            <>
              <div className="bl-progressbar">
                <div className="bl-progressbar__fill" style={{ width: `${block.adherencePct}%` }} />
                <span className="bl-progressbar__label">
                  {t('routine.adherenceLine', { pct: block.adherencePct, done: block.performedCount, missed: block.missedCount })}
                </span>
              </div>

              {block.exercises.map((ex) => (
                <div key={ex.videoId} className="bl-progress__exercise">
                  <span className="bl-progress__exercise-name">{ex.name}</span>
                  <span className={`bl-progress__badge bl-progress__badge--${ex.performance}`}>{t(`routine.performance.${ex.performance}`)}</span>
                  <span className="bl-progress__delta">
                    {round1(ex.avgWeight)}kg × {Math.round(ex.avgReps)} reps ({t('routine.suggestedShort')}: {round1(ex.avgSuggestedWeight)}kg ×{' '}
                    {Math.round(ex.avgSuggestedReps)} reps — {ex.weightDelta > 0 ? '+' : ''}
                    {round1(ex.weightDelta)}kg, {ex.repsDelta > 0 ? '+' : ''}
                    {round1(ex.repsDelta)} reps)
                  </span>
                </div>
              ))}
            </>
          ) : (
            <p className="bl-history-hint">{t('routine.noLogsBlock')}</p>
          )}
        </div>
      ))}

      {stats.comparison.some((c) => c.points.length > 1) && (
        <div className="bl-progress__block">
          <h4>{t('routine.compareTitle')}</h4>
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
