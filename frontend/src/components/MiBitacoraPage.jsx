import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import AccountShell from './AccountShell.jsx';
import './Modal.css';
import './BlocksModal.css';
import './MiRutinaPage.css';
import './MiBitacoraPage.css';
import { useI18n } from '../i18n/I18nContext.jsx';

const BILLING_OPTIONS = ['trimestral', 'semestral', 'anual'];

// Una vez que ya completaste algún bloque, "Anual" deja de poder elegirse (esa tarifa es
// solo para quien paga todo el año por adelantado desde el arranque).
const CONTINUE_BILLING_OPTIONS = BILLING_OPTIONS.filter((mode) => mode !== 'anual');


export default function MiBitacoraPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { t, locale } = useI18n();
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
        <h1>{t('account.tabs.bitacora')}</h1>
        <p className="profile__videos-hint">{t('common.loading')}</p>
      </AccountShell>
    );
  }

  if (!user) {
    return (
      <AccountShell active="bitacora">
        <h1>{t('account.tabs.bitacora')}</h1>
        <p className="profile__videos-hint">{t('log.loginToSee')}</p>
        <a className="btn btn-primary" href="/">
          {t('common.backHome')}
        </a>
      </AccountShell>
    );
  }

  if (status === 'locked') {
    return (
      <AccountShell active="bitacora">
        <h1>{t('account.tabs.bitacora')}</h1>
        <div className="rt-empty">
          <h2>{t('log.lockedTitle')}</h2>
          <p>{t('log.lockedText')}</p>
          <a className="rt-btn rt-btn--primary" href="/#planes">
            {t('routine.seePlans')}
          </a>
        </div>
      </AccountShell>
    );
  }

  if (status === 'error') {
    return (
      <AccountShell active="bitacora">
        <h1>{t('account.tabs.bitacora')}</h1>
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
      <h1>{t('account.tabs.bitacora')}</h1>

      {actionError && <p className="modal__error">{actionError}</p>}

      <div className="bt-kpis">
        <div className="bt-kpi">
          <span className="bt-kpi__label">{t('log.kpiTrainings')}</span>
          <span className="bt-kpi__value">{totals.performed}</span>
          <span className="bt-kpi__hint">{t('log.kpiDone')}</span>
        </div>
        <div className="bt-kpi">
          <span className="bt-kpi__label">{t('log.kpiAdherence')}</span>
          <span className="bt-kpi__value">{overallAdherence !== null ? `${overallAdherence}%` : '—'}</span>
          <span className="bt-kpi__hint">{t('log.kpiSkipped', { n: totals.missed })}</span>
        </div>
        <div className="bt-kpi">
          <span className="bt-kpi__label">{t('log.kpiCurrentBlock')}</span>
          <span className="bt-kpi__value">{currentBlock ? currentBlock.number : '—'}</span>
          <span className="bt-kpi__hint">{t('log.kpiOf', { n: blocks.length || 4 })}</span>
        </div>
        <div className="bt-kpi">
          <span className="bt-kpi__label">{t('log.kpiCompleted')}</span>
          <span className="bt-kpi__value">{completedBlocks}</span>
          <span className="bt-kpi__hint">{t('log.kpiBlocks')}</span>
        </div>
      </div>

      {!data.inactive && today.state === 'year_complete' && (
        <div className="bt-callout bt-callout--celebrate">
          <div>
            <strong>{t('routine.yearEndTitle')}</strong>
            <span>{t('log.yearEndText')}</span>
          </div>
          <button type="button" className="rt-btn rt-btn--primary" disabled={busy} onClick={() => runAction(api.startBlockNewYear(token))}>
            {t('routine.startNextYear')}
          </button>
        </div>
      )}

      {!data.inactive && today.state === 'awaiting_payment' && (
        <div className="bt-callout bt-callout--pay">
          <div>
            <strong>{t('log.payTitle', { prev: today.blockNumber - 1, next: today.blockNumber })}</strong>
            <span>{t('log.payText')}</span>
          </div>
          <div className="bt-pay">
            <div className="bt-pay__options" role="radiogroup" aria-label={t('log.paymentModeAria')}>
              {CONTINUE_BILLING_OPTIONS.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={continueBilling === mode}
                  disabled={busy}
                  className={`bt-pay__opt ${continueBilling === mode ? 'bt-pay__opt--active' : ''}`}
                  onClick={() => setContinueBilling(mode)}
                >
                  {t(`plans.billing.${mode}`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="rt-btn rt-btn--primary"
              disabled={busy}
              onClick={() => runAction(api.payBlock({ blockNumber: today.blockNumber, billingMode: continueBilling }, token))}
            >
              {t('log.payCta', { n: today.blockNumber })}
            </button>
          </div>
          <a className="bt-callout__link" href="/#planes">
            {t('routine.changeExperience')}
          </a>
        </div>
      )}

      {today.state === 'no_routine' && (
        <div className="bt-callout">
          <div>
            <strong>{t('routine.empty.no_routine.title')}</strong>
            <span>{t('routine.empty.no_routine.text')}</span>
          </div>
        </div>
      )}

      {!data.inactive && today.state === 'active' && (
        <div className="bt-callout bt-callout--today">
          <div>
            <strong>{t('log.pendingTitle')}</strong>
            <span>{t('log.pendingMeta', { block: today.blockNumber, week: today.week, day: today.dayNumber })}</span>
          </div>
          <a className="rt-btn rt-btn--primary" href="/mi-rutina">
            {t('log.goToRoutine')}
          </a>
        </div>
      )}

      <section className="bt-section">
        <h2 className="bt-section__title">{t('log.yourYear')}</h2>
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
                <span className={`bt-pill bt-pill--${b.status}`}>{t(`routine.blockStatus.${b.status}`)}</span>
                {b.objective && <span className="bt-step__objective">{b.objective}</span>}
                {b.status === 'active' && (
                  <span className="bt-step__meta">{t('log.weekOf', { week: b.currentWeek, total: b.durationWeeks })}</span>
                )}
                {b.paidUntil && b.status !== 'completed' && (
                  <span className="bt-step__meta">{t('log.paidUntil', { date: new Date(b.paidUntil).toLocaleDateString(locale) })}</span>
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

function buildReportHtml(block, userName, t, locale) {
  const r = (key, vars) => t(`log.reportDoc.${key}`, vars);
  const rows = block.exercises
    .map(
      (ex) => `
        <tr>
          <td>${ex.name}</td>
          <td>${t(`routine.performance.${ex.performance}`)}</td>
          <td>${round1(ex.avgWeight)}kg × ${Math.round(ex.avgReps)} reps</td>
          <td>${round1(ex.avgSuggestedWeight)}kg × ${Math.round(ex.avgSuggestedReps)} reps</td>
          <td>${ex.weightDelta > 0 ? '+' : ''}${round1(ex.weightDelta)}kg, ${ex.repsDelta > 0 ? '+' : ''}${round1(ex.repsDelta)} reps</td>
        </tr>`
    )
    .join('');

  const weightChange = block.weightDeltaKg > 0 ? r('gain') : block.weightDeltaKg < 0 ? r('loss') : r('same');
  const weightSection =
    block.startWeightKg !== null && block.endWeightKg !== null
      ? `<p><strong>${r('startWeight')}</strong> ${block.startWeightKg}kg<br/>
         <strong>${r('endWeight')}</strong> ${block.endWeightKg}kg<br/>
         <strong>${r('difference')}</strong> ${block.weightDeltaKg > 0 ? '+' : ''}${block.weightDeltaKg}kg (${weightChange})</p>`
      : `<p><em>${r('noWeight')}</em></p>`;

  return `<!DOCTYPE html>
<html lang="${locale.slice(0, 2)}">
<head>
<meta charset="UTF-8" />
<title>${r('title', { block: block.blockName })}</title>
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
  <h1>${r('title', { block: block.blockName })}</h1>
  <p><strong>${r('student')}</strong> ${userName}</p>
  <p><strong>${r('objective')}</strong> ${block.objective || '—'}</p>
  <p><strong>${r('nextObjective')}</strong> ${block.nextObjective || '—'}</p>

  <h2>${r('frequency')}</h2>
  <p>${r('frequencyText', { done: block.performedCount, missed: block.missedCount, pct: block.adherencePct })}</p>

  <h2>${r('bodyweight')}</h2>
  ${weightSection}

  <h2>${r('perExercise')}</h2>
  <table>
    <thead>
      <tr><th>${r('colExercise')}</th><th>${r('colResult')}</th><th>${r('colReal')}</th><th>${r('colSuggested')}</th><th>${r('colDiff')}</th></tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="5">${r('noRows')}</td></tr>`}</tbody>
  </table>

  <p style="margin-top:2rem;font-size:0.75rem;color:#6b5f52;">${r('generated', { date: new Date().toLocaleDateString(locale) })}</p>
</body>
</html>`;
}

function downloadBlockReport(block, userName, t, locale) {
  const html = buildReportHtml(block, userName, t, locale);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${t('log.reportDoc.fileName')}-${block.blockName.replace(/\s+/g, '-').toLowerCase()}.html`;
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
  const { t } = useI18n();
  return (
    <span className="bt-ring" style={{ '--pct': pct }} aria-label={t('log.adherenceAria', { pct })}>
      <span>{pct}%</span>
    </span>
  );
}

function ProgressView({ stats, loading, userName }) {
  const { t, locale } = useI18n();
  if (loading) return <p className="profile__videos-hint">{t('routine.loadingProgress')}</p>;
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
        <h2>{t('log.emptyTitle')}</h2>
        <p>{t('log.emptyText')}</p>
        <a className="rt-btn rt-btn--primary" href="/mi-rutina">
          {t('log.goToRoutine')}
        </a>
      </div>
    );
  }

  return (
    <section className="bt-section">
      <h2 className="bt-section__title">{t('log.progressTitle')}</h2>

      {blocksWithData.map((block) => (
        <article key={block.blockNumber} className="bt-block">
          <header className="bt-block__head">
            <AdherenceRing pct={block.adherencePct} />
            <div className="bt-block__title">
              <h3>{block.blockName}</h3>
              <span>
                {block.performedCount} {block.performedCount === 1 ? t('log.doneOne') : t('log.doneMany')} · {block.missedCount}{' '}
                {block.missedCount === 1 ? t('log.skippedOne') : t('log.skippedMany')}
              </span>
            </div>
            <span className={`bt-pill bt-pill--${block.status}`}>{t(`routine.blockStatus.${block.status}`)}</span>
            {block.status === 'completed' && (
              <button type="button" className="rt-btn rt-btn--ghost bt-block__report" onClick={() => downloadBlockReport(block, userName, t, locale)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
                </svg>
                {t('log.report')}
              </button>
            )}
          </header>

          {block.exercises.length > 0 && (
            <ul className="bt-ex-list">
              {block.exercises.map((ex) => (
                <li key={ex.videoId} className="bt-ex">
                  <div className="bt-ex__main">
                    <span className="bt-ex__name">{ex.name}</span>
                    <span className={`bt-perf bt-perf--${ex.performance}`}>{t(`routine.performance.${ex.performance}`)}</span>
                  </div>
                  <div className="bt-ex__nums">
                    <span>
                      <small>{t('log.real')}</small>
                      {round1(ex.avgWeight)} kg × {Math.round(ex.avgReps)}
                    </span>
                    <span>
                      <small>{t('log.suggested')}</small>
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
              <h3>{t('routine.compareTitle')}</h3>
              <span>{t('log.compareSub')}</span>
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
