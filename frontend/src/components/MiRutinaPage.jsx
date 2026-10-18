import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import AccountShell from './AccountShell.jsx';
import './Modal.css';
import './BlocksModal.css';
import './MiRutinaPage.css';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function MiRutinaPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [status, setStatus] = useState('loading'); // loading | locked | error | ready
  const [data, setData] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const [performedChoice, setPerformedChoice] = useState(null); // null | true | false
  const [drafts, setDrafts] = useState({});

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

  // cada vez que cambia el día/semana/bloque actual, arrancamos de cero el formulario
  useEffect(() => {
    setPerformedChoice(null);
    setDrafts({});
  }, [data?.today?.blockNumber, data?.today?.week, data?.today?.dayNumber]);

  async function submitDay(performed, exercisesPayload) {
    setBusy(true);
    setActionError('');
    try {
      const res = await api.logDay(performed ? { performed, exercises: exercisesPayload } : { performed }, token);
      setData(res);
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
      initial[ex.videoId] = {
        sets: String(ex.suggestedSets),
        reps: String(ex.suggestedReps),
        weight: String(ex.suggestedWeight),
        rest: ex.suggestedRest || '',
      };
    });
    setDrafts(initial);
  }

  function updateDraft(videoId, field, value) {
    setDrafts((prev) => ({ ...prev, [videoId]: { ...prev[videoId], [field]: value } }));
  }

  function handleSaveDay() {
    const exercisesPayload = data.today.exercises.map((ex) => ({
      videoId: ex.videoId,
      actualSets: Number(drafts[ex.videoId]?.sets),
      actualReps: Number(drafts[ex.videoId]?.reps),
      actualWeight: Number(drafts[ex.videoId]?.weight),
      actualRest: drafts[ex.videoId]?.rest || '',
    }));
    const invalid = exercisesPayload.some(
      (e) =>
        !Number.isFinite(e.actualSets) ||
        e.actualSets <= 0 ||
        !Number.isFinite(e.actualReps) ||
        e.actualReps <= 0 ||
        !Number.isFinite(e.actualWeight) ||
        e.actualWeight < 0
    );
    if (invalid) {
      setActionError(t('routine.invalidLog'));
      return;
    }
    submitDay(true, exercisesPayload);
  }

  if (authLoading || status === 'loading') {
    return (
      <AccountShell active="rutina">
        <h1>{t('account.tabs.rutina')}</h1>
        <p className="profile__videos-hint">{t('common.loading')}</p>
      </AccountShell>
    );
  }

  if (!user) {
    return (
      <AccountShell active="rutina">
        <h1>{t('account.tabs.rutina')}</h1>
        <p className="profile__videos-hint">{t('routine.loginToSee')}</p>
        <a className="btn btn-primary" href="/">
          {t('common.backHome')}
        </a>
      </AccountShell>
    );
  }

  if (status === 'locked') {
    return (
      <AccountShell active="rutina">
        <h1>{t('account.tabs.rutina')}</h1>
        <RoutineEmpty
          title={t('routine.lockedTitle')}
          text={t('routine.lockedText')}
          cta={{ href: '/#planes', label: t('routine.seePlans') }}
        />
      </AccountShell>
    );
  }

  if (status === 'error') {
    return (
      <AccountShell active="rutina">
        <h1>{t('account.tabs.rutina')}</h1>
        <p className="modal__error">{fetchError}</p>
      </AccountShell>
    );
  }

  const { today } = data;
  // Con el plan inactivo se ve la rutina pero no se registra (el cartel lo pone AccountShell).
  const canLog = !data.inactive;

  if (today.state !== 'active') {
    const CTA = {
      year_complete: { href: '/mi-bitacora', label: t('routine.goToLog') },
      awaiting_payment: { href: '/mi-bitacora', label: t('routine.goToLog') },
      no_routine: { href: '/#contacto', label: t('routine.writeUs') },
    };
    const key = CTA[today.state] ? today.state : 'none';
    const empty = { title: t(`routine.empty.${key}.title`), text: t(`routine.empty.${key}.text`), cta: CTA[today.state] };
    return (
      <AccountShell active="rutina">
        <h1>{t('account.tabs.rutina')}</h1>
        <RoutineEmpty {...empty} />
      </AccountShell>
    );
  }

  const weekPct = Math.round(((today.week - 1) / today.totalWeeks) * 100);
  const totalSets = today.exercises.reduce((sum, ex) => sum + ex.suggestedSets, 0);
  const logging = canLog && performedChoice === true;

  return (
    <AccountShell active="rutina">
      <h1>{t('account.tabs.rutina')}</h1>

      <section className="rt-hero">
        <div className="rt-hero__main">
          <span className="rt-hero__eyebrow">
            {t('routine.blockWeek', { block: today.blockNumber, week: today.week, total: today.totalWeeks })}
          </span>
          <h2 className="rt-hero__title">
            {t('routine.day', { n: today.dayNumber })}
            <span> {t('routine.ofTotal', { total: today.totalDays })}</span>
          </h2>
          <p className="rt-hero__routine">
            {today.routineName}
            {today.personalized && <span className="rt-badge">{t('routine.personalized')}</span>}
          </p>
          {today.objective && <p className="rt-hero__objective">{today.objective}</p>}
        </div>

        <div className="rt-hero__side">
          <span className="rt-hero__side-label">{t('routine.thisWeek')}</span>
          <div className="rt-days" aria-label={t('routine.dayAria', { n: today.dayNumber, total: today.totalDays })}>
            {Array.from({ length: today.totalDays }, (_, i) => {
              const n = i + 1;
              const state = n < today.dayNumber ? 'done' : n === today.dayNumber ? 'current' : 'next';
              return (
                <span key={n} className={`rt-day rt-day--${state}`}>
                  {state === 'done' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  ) : (
                    n
                  )}
                </span>
              );
            })}
          </div>
          <div className="rt-progress">
            <div className="rt-progress__track">
              <span style={{ width: `${Math.max(weekPct, 2)}%` }} />
            </div>
            <span className="rt-progress__label">{t('routine.blockPct', { pct: weekPct })}</span>
          </div>
        </div>
      </section>

      <div className="rt-summary">
        <span>
          <strong>{today.exercises.length}</strong> {today.exercises.length === 1 ? t('routine.exerciseOne') : t('routine.exerciseMany')}
        </span>
        <span className="rt-summary__dot" aria-hidden="true" />
        <span>
          <strong>{totalSets}</strong> {t('routine.setsTotal')}
        </span>
      </div>

      {actionError && <p className="modal__error">{actionError}</p>}

      <ol className="rt-list">
        {today.exercises.map((ex, idx) => (
          <li key={ex.videoId} className={`rt-ex ${logging ? 'rt-ex--logging' : ''}`}>
            <div className="rt-ex__head">
              <span className="rt-ex__num">{String(idx + 1).padStart(2, '0')}</span>
              <h3 className="rt-ex__name">{ex.name}</h3>
              {ex.hasVideoAccess ? (
                <a className="rt-ex__video" href={ex.videoUrl} target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                  {t('routine.watchVideo')}
                </a>
              ) : (
                <a className="rt-ex__video rt-ex__video--locked" href="/#planes">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="11" rx="3" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  {t('routine.upgrade')}
                </a>
              )}
            </div>

            <dl className="rt-ex__stats">
              <div>
                <dt>{t('routine.sets')}</dt>
                <dd>{ex.suggestedSets}</dd>
              </div>
              <div>
                <dt>{t('routine.reps')}</dt>
                <dd>{ex.suggestedReps}</dd>
              </div>
              <div>
                <dt>{t('routine.weight')}</dt>
                <dd>{ex.suggestedWeight > 0 ? `${ex.suggestedWeight} kg` : t('routine.bodyweight')}</dd>
              </div>
              <div>
                <dt>{t('routine.rest')}</dt>
                <dd>{ex.suggestedRest || '—'}</dd>
              </div>
            </dl>

            {logging && (
              <div className="rt-ex__log">
                <span className="rt-ex__log-title">{t('routine.whatYouDid')}</span>
                <div className="rt-ex__log-fields">
                  <label>
                    {t('routine.sets')}
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={drafts[ex.videoId]?.sets ?? ''}
                      disabled={busy}
                      onChange={(e) => updateDraft(ex.videoId, 'sets', e.target.value)}
                      aria-label={t('routine.ariaSets', { name: ex.name })}
                    />
                  </label>
                  <label>
                    {t('routine.reps')}
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={drafts[ex.videoId]?.reps ?? ''}
                      disabled={busy}
                      onChange={(e) => updateDraft(ex.videoId, 'reps', e.target.value)}
                      aria-label={t('routine.ariaReps', { name: ex.name })}
                    />
                  </label>
                  <label>
                    {t('routine.kilos')}
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      inputMode="decimal"
                      value={drafts[ex.videoId]?.weight ?? ''}
                      disabled={busy}
                      onChange={(e) => updateDraft(ex.videoId, 'weight', e.target.value)}
                      aria-label={t('routine.ariaWeight', { name: ex.name })}
                    />
                  </label>
                  <label>
                    {t('routine.rest')}
                    <input
                      type="text"
                      placeholder="1:30"
                      value={drafts[ex.videoId]?.rest ?? ''}
                      disabled={busy}
                      onChange={(e) => updateDraft(ex.videoId, 'rest', e.target.value)}
                      aria-label={t('routine.ariaRest', { name: ex.name })}
                    />
                  </label>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>

      {canLog ? (
        <div className={`rt-action ${logging ? 'rt-action--save' : ''}`}>
          {logging ? (
            <>
              <p>
                <strong>{t('routine.reviewTitle')}</strong>
                <span>{t('routine.reviewText')}</span>
              </p>
              <div className="rt-action__buttons">
                <button type="button" className="rt-btn rt-btn--ghost" disabled={busy} onClick={() => setPerformedChoice(null)}>
                  {t('routine.cancel')}
                </button>
                <button type="button" className="rt-btn rt-btn--primary" disabled={busy} onClick={handleSaveDay}>
                  {busy ? t('common.saving') : t('routine.saveToLog')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                <strong>{t('routine.askTitle')}</strong>
                <span>{t('routine.askText')}</span>
              </p>
              <div className="rt-action__buttons">
                <button type="button" className="rt-btn rt-btn--ghost" disabled={busy} onClick={() => handleChoosePerformed(false)}>
                  {t('routine.no')}
                </button>
                <button type="button" className="rt-btn rt-btn--primary" disabled={busy} onClick={() => handleChoosePerformed(true)}>
                  {t('routine.yes')}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="rt-action rt-action--locked">
          <span className="rt-action__lock" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="10" width="16" height="11" rx="3" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <p>
            <strong>{t('routine.pausedTitle')}</strong>
            <span>{t('routine.pausedText')}</span>
          </p>
        </div>
      )}

      <p className="rt-foot">
        {t('routine.footBefore')} <a href="/mi-bitacora">{t('routine.footLink')}</a> {t('routine.footAfter')}
      </p>
    </AccountShell>
  );
}

function RoutineEmpty({ title, text, cta }) {
  return (
    <div className="rt-empty">
      <span className="rt-empty__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M3.5 9v6M20.5 9v6" />
        </svg>
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {cta && (
        <a className="rt-btn rt-btn--primary" href={cta.href}>
          {cta.label}
        </a>
      )}
    </div>
  );
}
