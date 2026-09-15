import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import AccountShell from './AccountShell.jsx';
import './Modal.css';

const STATUS_LABEL = {
  trial: 'Prueba gratis',
  pending_payment: 'Pago pendiente',
  active: 'Activo',
  past_due: 'Pago vencido',
  canceled: 'Cancelado',
};

export default function MiPlanPage() {
  const { user, token, loading, logout, refreshMe } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    documentId: '',
    nationality: '',
    phone: '',
    city: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      documentId: user.documentId || '',
      nationality: user.nationality || '',
      phone: user.phone || '',
      city: user.city || '',
    });
  }, [user]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.updateMe(form, token);
      await refreshMe();
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

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

      {subscription ? (
        <p style={{ fontSize: '0.9rem' }}>
          Plan actual: <strong>{subscription.plan?.name}</strong> — {STATUS_LABEL[subscription.status] || subscription.status}
          {subscription.isTrial && subscription.trialEndsAt && (
            <> (termina el {new Date(subscription.trialEndsAt).toLocaleDateString('es-UY')})</>
          )}
        </p>
      ) : (
        <p style={{ fontSize: '0.9rem' }}>Todavía no tenés un plan activo.</p>
      )}
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

      <form onSubmit={handleSave} className="account-page__form">
        <div className="modal__row">
          <div className="field">
            <label htmlFor="pfirstName">Nombre</label>
            <input id="pfirstName" name="firstName" value={form.firstName} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="plastName">Apellido</label>
            <input id="plastName" name="lastName" value={form.lastName} onChange={handleChange} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="pdocumentId">CI / DNI / Pasaporte</label>
          <input id="pdocumentId" name="documentId" value={form.documentId} onChange={handleChange} />
        </div>

        <div className="modal__row">
          <div className="field">
            <label htmlFor="pnationality">Nacionalidad</label>
            <input id="pnationality" name="nationality" value={form.nationality} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="pphone">WhatsApp</label>
            <input id="pphone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="pcity">Ciudad</label>
          <input id="pcity" name="city" value={form.city} onChange={handleChange} />
        </div>

        {error && <p className="modal__error">{error}</p>}
        {saved && <p className="modal__success">Datos actualizados.</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        <button type="button" className="btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </form>
    </AccountShell>
  );
}
