import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import AccountShell from './AccountShell.jsx';
import './Modal.css';
import './PlanStatus.css';

const STATUS_LABEL = {
  trial: 'Prueba gratis',
  pending_payment: 'Pago pendiente',
  active: 'Activo',
  past_due: 'Pago vencido',
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

function daysUntil(date) {
  if (!date) return null;
  const ms = new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-UY');
}

function expirationMessage(days) {
  if (days === null) return null;
  if (days < 0) return 'Tu plan venció.';
  if (days === 0) return 'Tu plan vence hoy.';
  if (days === 1) return 'Tu plan vence mañana.';
  return `Tu plan vence en ${days} días.`;
}

function getPlanStatusInfo(subscription) {
  const { status, trialEndsAt, currentPeriodEnd, createdAt, billingMode } = subscription;

  if (status === 'trial') {
    const days = daysUntil(trialEndsAt);
    let tone = 'green';
    if (days !== null) {
      if (days <= 1) tone = 'red';
      else if (days <= WARN_DAYS_TRIAL) tone = 'yellow';
    }
    return {
      tone,
      label: STATUS_LABEL.trial,
      startDate: createdAt,
      endDate: trialEndsAt,
      billingLabel: null,
      message: tone !== 'green' ? expirationMessage(days) : null,
    };
  }

  if (status === 'active') {
    const days = daysUntil(currentPeriodEnd);
    let tone = 'green';
    if (days !== null) {
      if (days <= 1) tone = 'red';
      else if (days <= WARN_DAYS_ACTIVE) tone = 'yellow';
    }
    return {
      tone,
      label: STATUS_LABEL.active,
      startDate: createdAt,
      endDate: currentPeriodEnd,
      billingLabel: BILLING_LABEL[billingMode] || null,
      message: tone !== 'green' ? expirationMessage(days) : null,
    };
  }

  if (status === 'past_due') {
    return { tone: 'red', label: STATUS_LABEL.past_due, startDate: createdAt, endDate: currentPeriodEnd, billingLabel: BILLING_LABEL[billingMode] || null };
  }

  if (status === 'canceled') {
    return { tone: 'gray', label: STATUS_LABEL.canceled, startDate: createdAt, endDate: currentPeriodEnd, billingLabel: null };
  }

  // pending_payment
  return { tone: 'orange', label: STATUS_LABEL.pending_payment, startDate: createdAt, endDate: null, billingLabel: null };
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

function BmiCard({ weightKg, heightCm }) {
  const bmi = computeBmi(weightKg, heightCm);
  if (bmi === null) return null;
  const category = bmiCategory(bmi);
  return (
    <div className={`plan-status plan-status--${category.tone}`}>
      <div className="plan-status__top">
        <span className="plan-status__dot" aria-hidden="true" />
        <span className="plan-status__plan">IMC: {bmi}</span>
        <span className="plan-status__badge">{category.label}</span>
      </div>
      <div className="plan-status__dates">
        <span>Peso: {weightKg}kg</span>
        <span>Altura: {heightCm}cm</span>
      </div>
    </div>
  );
}

function WeightUpdateForm({ token, refreshMe }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.logWeight({ weightKg: Number(value) }, token);
      await refreshMe();
      setSaved(true);
      setValue('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div className="field" style={{ maxWidth: '160px' }}>
        <label htmlFor="newWeight">Actualizar peso (kg)</label>
        <input
          id="newWeight"
          type="number"
          min="1"
          step="0.1"
          required
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
        />
      </div>
      <button type="submit" className="btn" disabled={saving}>
        {saving ? 'Guardando...' : 'Actualizar'}
      </button>
      {error && <p className="modal__error">{error}</p>}
      {saved && <p className="modal__success">Peso actualizado.</p>}
    </form>
  );
}

function PlanStatusCard({ subscription }) {
  const info = getPlanStatusInfo(subscription);
  return (
    <div className={`plan-status plan-status--${info.tone}`}>
      <div className="plan-status__top">
        <span className="plan-status__dot" aria-hidden="true" />
        <span className="plan-status__plan">{subscription.plan?.name}</span>
        <span className="plan-status__badge">{info.label}</span>
      </div>
      <div className="plan-status__dates">
        {info.startDate && <span>Inicio: {formatDate(info.startDate)}</span>}
        {info.endDate && <span>Vencimiento: {formatDate(info.endDate)}</span>}
        {info.billingLabel && <span>Facturación: {info.billingLabel}</span>}
      </div>
      {info.message && <p className="plan-status__message">{info.message}</p>}
    </div>
  );
}

export default function MiPlanPage() {
  const { user, token, loading, logout, refreshMe } = useAuth();

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
      <h1>Mi plan (Mi experiencia)</h1>
      <p className="account-page__email">{user.email}</p>

      {subscription ? <PlanStatusCard subscription={subscription} /> : <p style={{ fontSize: '0.9rem' }}>Todavía no tenés un plan activo.</p>}

      {user.weightKg && user.heightCm && <BmiCard weightKg={Number(user.weightKg)} heightCm={Number(user.heightCm)} />}

      <WeightUpdateForm token={token} refreshMe={refreshMe} />

      <a href="/#planes" className="modal__switch" style={{ display: 'inline-block' }}>
        <button type="button">Cambiar de plan</button>
      </a>

      {isAdmin && (
        <a className="profile__teaser" href="/admin">
          <span className="profile__teaser-text">
            <span className="profile__teaser-title">Administración</span>
            <span className="profile__teaser-sub">Planes, bloques, ejercicios y usuarios</span>
          </span>
          <span className="profile__teaser-arrow" aria-hidden="true">
            →
          </span>
        </a>
      )}

      <button type="button" className="btn" onClick={handleLogout} style={{ alignSelf: 'flex-start' }}>
        Cerrar sesión
      </button>
    </AccountShell>
  );
}
