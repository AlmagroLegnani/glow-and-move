import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

const STATUS_LABEL = {
  trial: 'Prueba gratis',
  pending_payment: 'Pago pendiente',
  active: 'Activo',
  past_due: 'Pago vencido',
  canceled: 'Cancelado',
};

export default function ProfileModal({ onClose }) {
  const { user, token, logout, refreshMe } = useAuth();
  const subscription = user?.subscriptions?.[0];

  const [videosState, setVideosState] = useState({ loading: true, locked: true, videos: [], error: '' });

  useEffect(() => {
    api
      .myVideos(token)
      .then((data) => setVideosState({ loading: false, locked: data.locked, videos: data.videos || [], error: '' }))
      .catch((err) => setVideosState({ loading: false, locked: true, videos: [], error: err.message }));
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

      <div className="profile__videos">
        <h3 className="profile__videos-title">Mis videos</h3>
        {videosState.loading && <p className="profile__videos-hint">Cargando...</p>}
        {!videosState.loading && videosState.error && <p className="modal__error">{videosState.error}</p>}
        {!videosState.loading && !videosState.error && videosState.locked && (
          <p className="profile__videos-hint">
            Los videos de ejercicios están disponibles a partir del plan Premium.{' '}
            <a href="#planes" onClick={onClose}>
              Ver planes
            </a>
            .
          </p>
        )}
        {!videosState.loading && !videosState.error && !videosState.locked && videosState.videos.length === 0 && (
          <p className="profile__videos-hint">Todavía no hay videos cargados para tu rutina.</p>
        )}
        {!videosState.loading && !videosState.error && !videosState.locked && videosState.videos.length > 0 && (
          <ul className="profile__videos-list">
            {videosState.videos.map((video) => (
              <li key={video.id}>
                {video.muscleImageUrl && (
                  <img
                    src={video.muscleImageUrl}
                    alt="Zona muscular trabajada"
                    className="profile__videos-muscle"
                  />
                )}
                <span className="profile__videos-title-text">{video.title}</span>
                <a href={video.videoUrl} target="_blank" rel="noreferrer">
                  Ver video
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

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
