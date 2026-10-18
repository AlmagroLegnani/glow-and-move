import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import VideosModal from './VideosModal.jsx';
import BlocksModal from './BlocksModal.jsx';
import WeightUpdateForm from './WeightUpdateForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { isSubscriptionExpired } from '../lib/subscription.js';
import { useI18n } from '../i18n/I18nContext.jsx';

function videosSummary(videosState, t) {
  const count = videosState.videos.length;
  if (videosState.loading) return t('common.loading');
  if (videosState.error) return t('profile.videosError');
  if (count === 0) return t('videos.none');
  if (!videosState.hasVideoAccess) return t('profile.videosNoAccess', { count });
  return count === 1 ? t('profile.videosOne') : t('profile.videosMany', { count });
}

export default function ProfileModal({ onClose }) {
  const { user, token, logout, refreshMe } = useAuth();
  const { t, locale } = useI18n();
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
    <Modal title={t('account.tabs.profile')} onClose={onClose}>
      <div>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{user?.email}</p>
        {subscription ? (
          <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
            {t('profile.currentPlan')} <strong>{subscription.plan?.name}</strong> —{' '}
            {isSubscriptionExpired(subscription) ? t('profile.expired') : t(`myPlan.status.${subscription.status}`)}
            {subscription.isTrial && subscription.trialEndsAt && (
              <> {t('profile.trialEnds', { date: new Date(subscription.trialEndsAt).toLocaleDateString(locale) })}</>
            )}
          </p>
        ) : (
          <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>{t('myPlan.noPlan')}</p>
        )}
        <a href="#planes" className="modal__switch" style={{ display: 'inline-block', marginTop: '0.4rem' }} onClick={onClose}>
          <button type="button">{t('profile.changePlan')}</button>
        </a>
      </div>

      <button type="button" className="profile__teaser" onClick={() => setShowVideos(true)}>
        <span className="profile__teaser-text">
          <span className="profile__teaser-title">{t('account.tabs.videos')}</span>
          <span className="profile__teaser-sub">{videosSummary(videosState, t)}</span>
        </span>
        <span className="profile__teaser-arrow" aria-hidden="true">
          →
        </span>
      </button>

      <button type="button" className="profile__teaser" onClick={() => setShowBlocks(true)}>
        <span className="profile__teaser-text">
          <span className="profile__teaser-title">{t('account.tabs.rutina')}</span>
          <span className="profile__teaser-sub">{t('profile.routineSub')}</span>
        </span>
        <span className="profile__teaser-arrow" aria-hidden="true">
          →
        </span>
      </button>

      {isAdmin && (
        <a className="profile__teaser" href="/admin" onClick={onClose}>
          <span className="profile__teaser-text">
            <span className="profile__teaser-title">{t('account.tabs.admin')}</span>
            <span className="profile__teaser-sub">{t('profile.adminSub')}</span>
          </span>
          <span className="profile__teaser-arrow" aria-hidden="true">
            →
          </span>
        </a>
      )}

      <WeightUpdateForm token={token} refreshMe={refreshMe} />

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="modal__row">
          <div className="field">
            <label htmlFor="pfirstName">{t('common.firstName')}</label>
            <input id="pfirstName" name="firstName" value={form.firstName} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="plastName">{t('common.lastName')}</label>
            <input id="plastName" name="lastName" value={form.lastName} onChange={handleChange} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="pdocumentId">{t('profile.document')}</label>
          <input id="pdocumentId" name="documentId" value={form.documentId} onChange={handleChange} />
        </div>

        <div className="modal__row">
          <div className="field">
            <label htmlFor="pnationality">{t('common.nationality')}</label>
            <input id="pnationality" name="nationality" value={form.nationality} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="pphone">{t('common.whatsapp')}</label>
            <input id="pphone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="pcity">{t('profile.city')}</label>
          <input id="pcity" name="city" value={form.city} onChange={handleChange} />
        </div>

        {error && <p className="modal__error">{error}</p>}
        {saved && <p className="modal__success">{t('profile.saved')}</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? t('common.saving') : t('profile.save')}
        </button>

        <button type="button" className="btn" onClick={handleLogout}>
          {t('myPlan.logout')}
        </button>
      </form>
    </Modal>
  );
}
