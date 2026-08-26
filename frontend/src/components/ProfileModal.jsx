import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import VideosModal from './VideosModal.jsx';
import BlocksModal from './BlocksModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

const STATUS_LABEL = {
  trial: 'Prueba gratis',
  pending_payment: 'Pago pendiente',
  active: 'Activo',
  past_due: 'Pago vencido',
  canceled: 'Cancelado',
};

function videosSummary(videosState) {
  if (videosState.loading) return 'Cargando...';
  if (videosState.error) return 'No se pudieron cargar';
  if (videosState.videos.length === 0) return 'Todavía no hay ejercicios cargados';
  if (!videosState.hasVideoAccess) return `${videosState.videos.length} ejercicios — videos desde el plan Premium`;
  return `${videosState.videos.length} video${videosState.videos.length === 1 ? '' : 's'} disponible${videosState.videos.length === 1 ? '' : 's'}`;
}

export default function ProfileModal({ onClose }) {
  const { user, token, logout, refreshMe } = useAuth();
  const subscription = user?.subscriptions?.[0];
  const isAdmin = user?.role === 'admin';

  const [videosState, setVideosState] = useState({ loading: true, hasVideoAccess: false, videos: [], error: '' });
  const [showVideos, setShowVideos] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);

  useEffect(() => {
    api
      .myVideos(token)
      .then((data) => setVideosState({ loading: false, hasVideoAccess: data.hasVideoAccess, videos: data.videos || [], error: '' }))
      .catch((err) => setVideosState({ loading: false, hasVideoAccess: false, videos: [], error: err.message }));
  }, [token]);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    documentId: user?.documentId || '',
    nationality: user?.nationality || '',
    phone: user?.phone || '',
    city: user?.city || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

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
    onClose();
  }

  if (showVideos) {
    return <VideosModal videosState={videosState} onClose={onClose} onBack={() => setShowVideos(false)} />;
  }

  if (showBlocks) {
    return <BlocksModal onClose={onClose} onBack={() => setShowBlocks(false)} />;
  }

  return (
    <Modal title="Mi perfil" onClose={onClose}>
      <div>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{user?.email}</p>
        {subscription ? (
          <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Plan actual: <strong>{subscription.plan?.name}</strong> — {STATUS_LABEL[subscription.status] || subscription.status}
            {subscription.isTrial && subscription.trialEndsAt && (
              <> (termina el {new Date(subscription.trialEndsAt).toLocaleDateString('es-UY')})</>
            )}
          </p>
        ) : (
          <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>Todavía no tenés un plan activo.</p>
        )}
        <a href="#planes" className="modal__switch" style={{ display: 'inline-block', marginTop: '0.4rem' }} onClick={onClose}>
          <button type="button">Cambiar de plan</button>
        </a>
      </div>

      <button type="button" className="profile__teaser" onClick={() => setShowVideos(true)}>
        <span className="profile__teaser-text">
          <span className="profile__teaser-title">Mis videos</span>
          <span className="profile__teaser-sub">{videosSummary(videosState)}</span>
        </span>
        <span className="profile__teaser-arrow" aria-hidden="true">
          →
        </span>
      </button>

      <button type="button" className="profile__teaser" onClick={() => setShowBlocks(true)}>
        <span className="profile__teaser-text">
          <span className="profile__teaser-title">Mi rutina</span>
          <span className="profile__teaser-sub">
            {videosState.loading ? 'Cargando...' : !videosState.hasVideoAccess ? 'Disponible desde el plan Premium' : 'Bloques, bitácora y progreso'}
          </span>
        </span>
        <span className="profile__teaser-arrow" aria-hidden="true">
          →
        </span>
      </button>

      {isAdmin && (
        <a className="profile__teaser" href="/admin" onClick={onClose}>
          <span className="profile__teaser-text">
            <span className="profile__teaser-title">Administración</span>
            <span className="profile__teaser-sub">Planes, bloques, ejercicios y usuarios</span>
          </span>
          <span className="profile__teaser-arrow" aria-hidden="true">
            →
          </span>
        </a>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
    </Modal>
  );
}
