import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { daysUntil, isSubscriptionExpired } from '../lib/subscription.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import AccountShell from './AccountShell.jsx';
import UserAvatar from './UserAvatar.jsx';
import AvatarPickerModal from './AvatarPicker.jsx';
import './Modal.css';
import './PlanStatus.css';

// Umbrales de "cerca del vencimiento": generales para plan activo, más cortos
// para la prueba gratis porque dura apenas una semana.
const WARN_DAYS_ACTIVE = 7;
const WARN_DAYS_TRIAL = 2;

function makeFormatDate(locale) {
  return (date) => new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function expirationMessage(t, formatDate, days, endDate) {
  if (days === null) return null;
  if (days < 0) return t('myPlan.expired', { date: formatDate(endDate) });
  if (days === 0) return t('myPlan.expiresToday');
  if (days === 1) return t('myPlan.expiresTomorrow');
  return t('myPlan.expiresIn', { days });
}

function remainingLabel(t, days) {
  if (days === null) return null;
  if (days < 0) return -days === 1 ? t('myPlan.expiredAgoOne') : t('myPlan.expiredAgo', { days: -days });
  if (days === 0) return t('myPlan.dueToday');
  return days === 1 ? t('myPlan.daysLeftOne') : t('myPlan.daysLeft', { days });
}

function periodProgress(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate).getTime();
  const total = new Date(endDate).getTime() - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((Date.now() - start) / total) * 100));
}

function getPlanStatusInfo(subscription, t, formatDate) {
  const { status, trialEndsAt, currentPeriodEnd, createdAt, billingMode } = subscription;
  const billingLabel = billingMode ? t(`plans.billing.${billingMode}`) : null;

  if (status === 'trial' || status === 'active') {
    const endDate = status === 'trial' ? trialEndsAt : currentPeriodEnd;
    const warnDays = status === 'trial' ? WARN_DAYS_TRIAL : WARN_DAYS_ACTIVE;
    const days = daysUntil(endDate);

    if (isSubscriptionExpired(subscription)) {
      return {
        tone: 'red',
        label: t('myPlan.status.past_due'),
        startDate: createdAt,
        endDate,
        days,
        billingLabel: status === 'active' ? billingLabel : null,
        message: expirationMessage(t, formatDate, days, endDate),
        cta: status === 'trial' ? t('myPlan.cta.choosePlan') : t('myPlan.cta.renew'),
        ctaHref: status === 'trial' ? '/#planes' : '#renovar',
        canRenew: status === 'active',
      };
    }

    let tone = 'green';
    if (days !== null) {
      if (days <= 1) tone = 'red';
      else if (days <= warnDays) tone = 'yellow';
    }
    return {
      tone,
      label: t(`myPlan.status.${status}`),
      startDate: createdAt,
      endDate,
      days,
      billingLabel: status === 'active' ? billingLabel : null,
      message: tone !== 'green' ? expirationMessage(t, formatDate, days, endDate) : null,
      cta: status === 'trial' ? t('myPlan.cta.choosePlan') : tone !== 'green' ? t('myPlan.cta.renew') : t('myPlan.cta.change'),
      ctaHref: status === 'active' && tone !== 'green' ? '#renovar' : '/#planes',
      canRenew: status === 'active' && tone !== 'green',
    };
  }

  if (status === 'past_due') {
    return {
      tone: 'red',
      label: t('myPlan.status.past_due'),
      startDate: createdAt,
      endDate: currentPeriodEnd,
      days: daysUntil(currentPeriodEnd),
      billingLabel,
      message: currentPeriodEnd
        ? expirationMessage(t, formatDate, daysUntil(currentPeriodEnd), currentPeriodEnd)
        : t('myPlan.pastDueNoDate'),
      cta: t('myPlan.cta.renew'),
      ctaHref: '#renovar',
      canRenew: true,
    };
  }

  if (status === 'canceled') {
    return {
      tone: 'gray',
      label: t('myPlan.status.canceled'),
      startDate: createdAt,
      endDate: currentPeriodEnd,
      days: null,
      billingLabel: null,
      cta: t('myPlan.cta.resubscribe'),
      ctaHref: '/#planes',
    };
  }

  // pending_payment
  return {
    tone: 'orange',
    label: t('myPlan.status.pending_payment'),
    startDate: createdAt,
    endDate: null,
    days: null,
    billingLabel: null,
    message: t('myPlan.pendingMessage'),
    cta: t('myPlan.cta.seePlans'),
    ctaHref: '/#planes',
  };
}

function computeBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

// Categorías estándar de la OMS para IMC en adultos.
function bmiCategory(bmi) {
  if (bmi < 18.5) return { key: 'under', tone: 'yellow' };
  if (bmi < 25) return { key: 'normal', tone: 'green' };
  if (bmi < 30) return { key: 'over', tone: 'yellow' };
  return { key: 'obese', tone: 'red' };
}

// Posición del marcador en la escala visual (15 a 35 de IMC).
function bmiPosition(bmi) {
  return Math.min(100, Math.max(0, ((bmi - 15) / 20) * 100));
}

function BmiCard({ weightKg, heightCm }) {
  const { t } = useI18n();
  const bmi = computeBmi(weightKg, heightCm);
  if (bmi === null) return null;
  const category = bmiCategory(bmi);
  return (
    <section className={`acct-card bmi-card plan-tone--${category.tone}`}>
      <div className="acct-card__head">
        <span className="acct-card__eyebrow">{t('myPlan.bmi.title')}</span>
        <span className="status-pill">
          <span className="status-pill__dot" aria-hidden="true" />
          {t(`myPlan.bmi.${category.key}`)}
        </span>
      </div>
      <div className="bmi-card__main">
        <span className="bmi-card__value">{bmi}</span>
        <div className="bmi-card__chips">
          <span className="chip">{weightKg} kg</span>
          <span className="chip">{heightCm} cm</span>
        </div>
      </div>
      <div className="bmi-scale" aria-hidden="true">
        <div className="bmi-scale__bar" />
        <span className="bmi-scale__marker" style={{ left: `${bmiPosition(bmi)}%` }} />
        <div className="bmi-scale__labels">
          <span>{t('myPlan.bmi.low')}</span>
          <span>{t('myPlan.bmi.normal')}</span>
          <span>{t('myPlan.bmi.over')}</span>
          <span>{t('myPlan.bmi.obese')}</span>
        </div>
      </div>
    </section>
  );
}

function PlanStatusCard({ subscription }) {
  const { t, locale } = useI18n();
  const formatDate = makeFormatDate(locale);
  const info = getPlanStatusInfo(subscription, t, formatDate);
  const progress = periodProgress(info.startDate, info.endDate);
  const remaining = remainingLabel(t, info.days);

  return (
    <section className={`acct-card plan-card plan-tone--${info.tone}`}>
      <div className="acct-card__head">
        <span className="acct-card__eyebrow">{t('myPlan.yourPlan')}</span>
        <span className="status-pill">
          <span className="status-pill__dot" aria-hidden="true" />
          {info.label}
        </span>
      </div>

      <div className="plan-card__title-row">
        <h2 className="plan-card__name">{subscription.plan?.name}</h2>
        <a href={info.ctaHref} className="plan-card__cta">
          {info.cta}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>

      <dl className="plan-card__stats">
        {info.startDate && (
          <div>
            <dt>{t('myPlan.start')}</dt>
            <dd>{formatDate(info.startDate)}</dd>
          </div>
        )}
        {info.endDate && (
          <div>
            <dt>{t('myPlan.end')}</dt>
            <dd>{formatDate(info.endDate)}</dd>
          </div>
        )}
        {info.billingLabel && (
          <div>
            <dt>{t('myPlan.billing')}</dt>
            <dd>{info.billingLabel}</dd>
          </div>
        )}
      </dl>

      {progress !== null && (
        <div className="plan-card__progress">
          <div className="plan-card__progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
          {remaining && <span className="plan-card__progress-label">{remaining}</span>}
        </div>
      )}

      {info.message && (
        <p className="plan-card__alert" role={info.tone === 'red' ? 'alert' : undefined}>
          {info.message}
        </p>
      )}
    </section>
  );
}

function formatUsd(value) {
  return `U$S ${Number(value).toFixed(2)}`;
}

// El backend manda la etiqueta en español; acá la armamos en el idioma elegido a partir de
// los meses (3/6/12 = forma de pago estándar, otro número = lo que resta del año).
function renewalLabel(t, months, remainingMonths) {
  if (months === 12) return t('plans.billing.anual');
  if (months === 6) return t('plans.billing.semestral');
  if (months === 3) return t('plans.billing.trimestral');
  if (months === remainingMonths) return t('myPlan.renew.restOfYear', { months });
  return t('myPlan.renew.months', { months });
}

// Opciones de renovación: trimestral, semestral o el resto del año (o anual si arranca un año
// nuevo). Los precios y descuentos los calcula el backend.
function RenewalCard({ token }) {
  const { t } = useI18n();
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [selected, setSelected] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .renewalOptions(token)
      .then((data) => {
        if (cancelled) return;
        setState({ loading: false, error: '', data });
        // Por defecto, la opción más larga (la de mejor precio por mes).
        setSelected(data.options[data.options.length - 1]?.months ?? null);
      })
      .catch((err) => !cancelled && setState({ loading: false, error: err.message, data: null }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handlePay() {
    setPaying(true);
    setPayError('');
    try {
      const { initPoint } = await api.renew({ months: selected }, token);
      window.location.href = initPoint;
    } catch (err) {
      setPayError(err.message);
      setPaying(false);
    }
  }

  const option = state.data?.options.find((o) => o.months === selected);

  return (
    <section id="renovar" className="acct-card renew-card">
      <div className="acct-card__head">
        <span className="acct-card__eyebrow">{t('myPlan.renew.eyebrow')}</span>
      </div>
      <div>
        <h2 className="renew-card__title">{t('myPlan.renew.title')}</h2>
        <p className="renew-card__lede">{t('myPlan.renew.lede')}</p>
      </div>

      {state.loading && <p className="profile__videos-hint">{t('myPlan.renew.loading')}</p>}
      {state.error && <p className="modal__error">{state.error}</p>}

      {state.data && (
        <>
          <div className="renew-options" role="radiogroup" aria-label={t('plans.billingLabel')}>
            {state.data.options.map((o) => (
              <button
                key={o.months}
                type="button"
                role="radio"
                aria-checked={selected === o.months}
                className={`renew-option ${selected === o.months ? 'renew-option--active' : ''}`}
                onClick={() => setSelected(o.months)}
              >
                {o.discountPct > 0 && <span className="renew-option__badge">-{o.discountPct}%</span>}
                <span className="renew-option__label">{renewalLabel(t, o.months, state.data.remainingMonths)}</span>
                <span className="renew-option__total">{formatUsd(o.total)}</span>
                <span className="renew-option__monthly">
                  {formatUsd(o.monthly)} {t('plans.perMonth')}
                </span>
              </button>
            ))}
          </div>

          {payError && <p className="modal__error">{payError}</p>}

          <button type="button" className="plan-card__cta renew-card__pay" disabled={!option || paying} onClick={handlePay}>
            {paying ? t('plans.redirecting') : option ? t('myPlan.renew.pay', { amount: formatUsd(option.total) }) : t('myPlan.renew.pickOne')}
          </button>
          <p className="renew-card__note">{t('myPlan.renew.secure')}</p>
        </>
      )}
    </section>
  );
}

const ADMIN_SECTIONS = [
  { tab: 'plans', icon: 'M4 7h16M4 12h16M4 17h10' },
  { tab: 'blocks', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { tab: 'exercises', icon: 'M6.5 6.5v11M17.5 6.5v11M6.5 12h11M3.5 9v6M20.5 9v6' },
  { tab: 'routines', icon: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01' },
  { tab: 'users', icon: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 19v-1a4 4 0 0 0-3-3.9M15.5 3.1a3.5 3.5 0 0 1 0 6.8' },
];

// Para el admin, lo principal de su perfil es el panel: accesos directos a cada sección.
function AdminHub() {
  const { t } = useI18n();
  return (
    <section className="admin-hub">
      <div className="admin-hub__head">
        <div>
          <span className="admin-hub__eyebrow">{t('myPlan.admin.eyebrow')}</span>
          <h2 className="admin-hub__title">{t('myPlan.admin.title')}</h2>
          <p className="admin-hub__lede">{t('myPlan.admin.lede')}</p>
        </div>
        <a className="admin-hub__cta" href="/admin">
          {t('myPlan.admin.open')}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
      <div className="admin-hub__grid">
        {ADMIN_SECTIONS.map((s) => (
          <a key={s.tab} className="admin-hub__item" href={`/admin?tab=${s.tab}`}>
            <span className="admin-hub__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
            </span>
            <span className="admin-hub__label">{t(`myPlan.admin.sections.${s.tab}.label`)}</span>
            <span className="admin-hub__hint">{t(`myPlan.admin.sections.${s.tab}.hint`)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function MiPlanPage() {
  const { user, token, loading, logout } = useAuth();
  const { t, locale } = useI18n();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  function handleLogout() {
    logout();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <AccountShell active="plan">
        <p className="profile__videos-hint">{t('common.loading')}</p>
      </AccountShell>
    );
  }

  if (!user) {
    return (
      <AccountShell active="plan">
        <h1>{t('account.tabs.plan')}</h1>
        <p className="profile__videos-hint">{t('myPlan.loginToSee')}</p>
        <a className="btn btn-primary" href="/">
          {t('common.backHome')}
        </a>
      </AccountShell>
    );
  }

  const subscription = user.subscriptions?.[0];
  const isAdmin = user.role === 'admin';

  return (
    <AccountShell active="plan">
      <header className="acct-header">
        <button
          type="button"
          className="acct-header__avatar-btn"
          onClick={() => setAvatarModalOpen(true)}
          aria-label={t('nav.changeAvatar')}
        >
          <UserAvatar user={user} size={56} className="acct-header__avatar" />
          <span className="acct-header__avatar-edit" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16z" />
            </svg>
          </span>
        </button>
        <div>
          <h1>{isAdmin ? t('account.tabs.profile') : t('account.myPlan')}</h1>
          <p className="account-page__email">
            {user.email}
            {isAdmin && <span className="acct-role">Admin</span>}
          </p>
        </div>
      </header>

      {isAdmin && <AdminHub />}

      {isAdmin ? (
        subscription && <PlanStatusCard subscription={subscription} />
      ) : subscription ? (
        <>
          <PlanStatusCard subscription={subscription} />
          {getPlanStatusInfo(subscription, t, makeFormatDate(locale)).canRenew && <RenewalCard token={token} />}
        </>
      ) : (
        <section className="acct-card acct-card--empty">
          <p>{t('myPlan.noPlan')}</p>
          <a href="/#planes" className="plan-card__cta">
            {t('myPlan.cta.seePlans')}
          </a>
        </section>
      )}

      {!isAdmin && user.weightKg && user.heightCm && <BmiCard weightKg={Number(user.weightKg)} heightCm={Number(user.heightCm)} />}

      {avatarModalOpen && <AvatarPickerModal onClose={() => setAvatarModalOpen(false)} />}

      <div className="acct-footer">
        <button type="button" className="acct-logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
            <path d="M10 17l-5-5 5-5M5 12h11" />
          </svg>
          {t('myPlan.logout')}
        </button>
      </div>
    </AccountShell>
  );
}
