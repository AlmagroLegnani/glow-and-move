import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { daysUntil, isSubscriptionExpired } from '../lib/subscription.js';
import AccountShell from './AccountShell.jsx';
import UserAvatar from './UserAvatar.jsx';
import AvatarPickerModal from './AvatarPicker.jsx';
import './Modal.css';
import './PlanStatus.css';

const STATUS_LABEL = {
  trial: 'Prueba gratis',
  pending_payment: 'Pago pendiente',
  active: 'Activo',
  past_due: 'Inactivo',
  canceled: 'Cancelado',
};

const BILLING_LABEL = {
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

// Umbrales de "cerca del vencimiento": generales para plan activo, más cortos
// para la prueba gratis porque dura apenas una semana.
const WARN_DAYS_ACTIVE = 7;
const WARN_DAYS_TRIAL = 2;

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function expirationMessage(days, endDate) {
  if (days === null) return null;
  if (days < 0) return `Tu plan venció el ${formatDate(endDate)}. Tus rutinas y tu bitácora siguen guardadas: renovalo para volver a registrar entrenamientos.`;
  if (days === 0) return 'Tu plan vence hoy.';
  if (days === 1) return 'Tu plan vence mañana.';
  return `Tu plan vence en ${days} días.`;
}

function remainingLabel(days) {
  if (days === null) return null;
  if (days < 0) return `Venció hace ${-days} ${-days === 1 ? 'día' : 'días'}`;
  if (days === 0) return 'Vence hoy';
  return `${days} ${days === 1 ? 'día restante' : 'días restantes'}`;
}

function periodProgress(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate).getTime();
  const total = new Date(endDate).getTime() - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((Date.now() - start) / total) * 100));
}

function getPlanStatusInfo(subscription) {
  const { status, trialEndsAt, currentPeriodEnd, createdAt, billingMode } = subscription;

  if (status === 'trial' || status === 'active') {
    const endDate = status === 'trial' ? trialEndsAt : currentPeriodEnd;
    const warnDays = status === 'trial' ? WARN_DAYS_TRIAL : WARN_DAYS_ACTIVE;
    const days = daysUntil(endDate);

    if (isSubscriptionExpired(subscription)) {
      return {
        tone: 'red',
        label: 'Inactivo',
        startDate: createdAt,
        endDate,
        days,
        billingLabel: status === 'active' ? BILLING_LABEL[billingMode] || null : null,
        message: expirationMessage(days, endDate),
        cta: status === 'trial' ? 'Elegir un plan' : 'Renovar plan',
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
      label: STATUS_LABEL[status],
      startDate: createdAt,
      endDate,
      days,
      billingLabel: status === 'active' ? BILLING_LABEL[billingMode] || null : null,
      message: tone !== 'green' ? expirationMessage(days, endDate) : null,
      cta: status === 'trial' ? 'Elegir un plan' : tone !== 'green' ? 'Renovar plan' : 'Cambiar de plan',
      ctaHref: status === 'active' && tone !== 'green' ? '#renovar' : '/#planes',
      canRenew: status === 'active' && tone !== 'green',
    };
  }

  if (status === 'past_due') {
    return {
      tone: 'red',
      label: STATUS_LABEL.past_due,
      startDate: createdAt,
      endDate: currentPeriodEnd,
      days: daysUntil(currentPeriodEnd),
      billingLabel: BILLING_LABEL[billingMode] || null,
      message: currentPeriodEnd
        ? expirationMessage(daysUntil(currentPeriodEnd), currentPeriodEnd)
        : 'Tu plan está inactivo. Actualizá el pago para seguir registrando entrenamientos.',
      cta: 'Renovar plan',
      ctaHref: '#renovar',
      canRenew: true,
    };
  }

  if (status === 'canceled') {
    return { tone: 'gray', label: STATUS_LABEL.canceled, startDate: createdAt, endDate: currentPeriodEnd, days: null, billingLabel: null, cta: 'Volver a suscribirme', ctaHref: '/#planes' };
  }

  // pending_payment
  return {
    tone: 'orange',
    label: STATUS_LABEL.pending_payment,
    startDate: createdAt,
    endDate: null,
    days: null,
    billingLabel: null,
    message: 'Estamos esperando la confirmación de tu pago.',
    cta: 'Ver planes',
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
  if (bmi < 18.5) return { label: 'Bajo peso', tone: 'yellow' };
  if (bmi < 25) return { label: 'Normal', tone: 'green' };
  if (bmi < 30) return { label: 'Sobrepeso', tone: 'yellow' };
  return { label: 'Obesidad', tone: 'red' };
}

// Posición del marcador en la escala visual (15 a 35 de IMC).
function bmiPosition(bmi) {
  return Math.min(100, Math.max(0, ((bmi - 15) / 20) * 100));
}

function BmiCard({ weightKg, heightCm }) {
  const bmi = computeBmi(weightKg, heightCm);
  if (bmi === null) return null;
  const category = bmiCategory(bmi);
  return (
    <section className={`acct-card bmi-card plan-tone--${category.tone}`}>
      <div className="acct-card__head">
        <span className="acct-card__eyebrow">Índice de masa corporal</span>
        <span className="status-pill">
          <span className="status-pill__dot" aria-hidden="true" />
          {category.label}
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
          <span>Bajo</span>
          <span>Normal</span>
          <span>Sobrepeso</span>
          <span>Obesidad</span>
        </div>
      </div>
    </section>
  );
}

function PlanStatusCard({ subscription }) {
  const info = getPlanStatusInfo(subscription);
  const progress = periodProgress(info.startDate, info.endDate);
  const remaining = remainingLabel(info.days);

  return (
    <section className={`acct-card plan-card plan-tone--${info.tone}`}>
      <div className="acct-card__head">
        <span className="acct-card__eyebrow">Tu plan</span>
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
            <dt>Inicio</dt>
            <dd>{formatDate(info.startDate)}</dd>
          </div>
        )}
        {info.endDate && (
          <div>
            <dt>Vencimiento</dt>
            <dd>{formatDate(info.endDate)}</dd>
          </div>
        )}
        {info.billingLabel && (
          <div>
            <dt>Facturación</dt>
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

// Opciones de renovación: trimestral, semestral o el resto del año (o anual si arranca un año
// nuevo). Los precios y descuentos los calcula el backend.
function RenewalCard({ token }) {
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
        <span className="acct-card__eyebrow">Renovar plan</span>
      </div>
      <div>
        <h2 className="renew-card__title">Elegí cómo querés pagar</h2>
        <p className="renew-card__lede">
          Mientras más meses pagás juntos, menos pagás por mes. Al acreditarse el pago se desbloquean los bloques
          correspondientes.
        </p>
      </div>

      {state.loading && <p className="profile__videos-hint">Cargando opciones...</p>}
      {state.error && <p className="modal__error">{state.error}</p>}

      {state.data && (
        <>
          <div className="renew-options" role="radiogroup" aria-label="Forma de pago">
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
                <span className="renew-option__label">{o.label}</span>
                <span className="renew-option__total">{formatUsd(o.total)}</span>
                <span className="renew-option__monthly">{formatUsd(o.monthly)} / mes</span>
              </button>
            ))}
          </div>

          {payError && <p className="modal__error">{payError}</p>}

          <button type="button" className="plan-card__cta renew-card__pay" disabled={!option || paying} onClick={handlePay}>
            {paying ? 'Redirigiendo...' : option ? `Pagar ${formatUsd(option.total)}` : 'Elegí una opción'}
          </button>
          <p className="renew-card__note">Pagás de forma segura con Mercado Pago.</p>
        </>
      )}
    </section>
  );
}

const ADMIN_SECTIONS = [
  { tab: 'plans', label: 'Planes', hint: 'Precios y beneficios', icon: 'M4 7h16M4 12h16M4 17h10' },
  { tab: 'blocks', label: 'Bloques', hint: 'Objetivos del año', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { tab: 'exercises', label: 'Ejercicios', hint: 'Catálogo y videos', icon: 'M6.5 6.5v11M17.5 6.5v11M6.5 12h11M3.5 9v6M20.5 9v6' },
  { tab: 'routines', label: 'Rutinas', hint: 'Días y series', icon: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01' },
  { tab: 'users', label: 'Usuarios', hint: 'Roles y suscripciones', icon: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 19v-1a4 4 0 0 0-3-3.9M15.5 3.1a3.5 3.5 0 0 1 0 6.8' },
];

// Para el admin, lo principal de su perfil es el panel: accesos directos a cada sección.
function AdminHub() {
  return (
    <section className="admin-hub">
      <div className="admin-hub__head">
        <div>
          <span className="admin-hub__eyebrow">Panel de control</span>
          <h2 className="admin-hub__title">Administración</h2>
          <p className="admin-hub__lede">Gestioná los planes, el programa y los usuarios de Glow &amp; Move.</p>
        </div>
        <a className="admin-hub__cta" href="/admin">
          Abrir panel
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
            <span className="admin-hub__label">{s.label}</span>
            <span className="admin-hub__hint">{s.hint}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function MiPlanPage() {
  const { user, token, loading, logout } = useAuth();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  function handleLogout() {
    logout();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <AccountShell active="plan">
        <p className="profile__videos-hint">Cargando...</p>
      </AccountShell>
    );
  }

  if (!user) {
    return (
      <AccountShell active="plan">
        <h1>Mi plan (Mi experiencia)</h1>
        <p className="profile__videos-hint">Iniciá sesión para ver tu plan.</p>
        <a className="btn btn-primary" href="/">
          Volver al inicio
        </a>
      </AccountShell>
    );
  }

  const subscription = user.subscriptions?.[0];
  const isAdmin = user.role === 'admin';

  return (
    <AccountShell active="plan">
      <header className="acct-header">
        <button type="button" className="acct-header__avatar-btn" onClick={() => setAvatarModalOpen(true)} aria-label="Cambiar avatar">
          <UserAvatar user={user} size={56} className="acct-header__avatar" />
          <span className="acct-header__avatar-edit" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16z" />
            </svg>
          </span>
        </button>
        <div>
          <h1>{isAdmin ? 'Mi perfil' : 'Mi plan'}</h1>
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
          {getPlanStatusInfo(subscription).canRenew && <RenewalCard token={token} />}
        </>
      ) : (
        <section className="acct-card acct-card--empty">
          <p>Todavía no tenés un plan activo.</p>
          <a href="/#planes" className="plan-card__cta">
            Ver planes
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
          Cerrar sesión
        </button>
      </div>
    </AccountShell>
  );
}
