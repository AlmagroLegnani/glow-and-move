import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import UserAvatar from './UserAvatar.jsx';
import AvatarPickerModal from './AvatarPicker.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { isSubscriptionInactive } from '../lib/subscription.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import './ProfileModal.css';

const STATUS_TONE = { trial: 'beige', pending_payment: 'orange', active: 'green', past_due: 'rose', canceled: 'neutral' };

const ICONS = {
  plan: 'M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM4 10h16M8 15h3',
  videos: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM10 9l5 3-5 3z',
  rutina: 'M6.5 6.5v11M17.5 6.5v11M6.5 12h11M3.5 9v6M20.5 9v6',
  bitacora: 'M4 19V5M4 19h16M8 15l3-4 3 2 5-6',
  admin: 'M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6zM9 12l2 2 4-4',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5',
};

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function videosSummary(videosState, t) {
  const count = videosState.videos.length;
  if (videosState.loading) return t('common.loading');
  if (videosState.error) return t('profile.videosError');
  if (count === 0) return t('videos.none');
  if (!videosState.hasVideoAccess) return t('profile.videosNoAccess', { count });
  return count === 1 ? t('profile.videosOne') : t('profile.videosMany', { count });
}

function profileForm(user) {
  return {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    documentId: user?.documentId || '',
    nationality: user?.nationality || '',
    phone: user?.phone || '',
    city: user?.city || '',
  };
}

export default function ProfileModal({ onClose }) {
  const { user, token, logout, refreshMe } = useAuth();
  const { t } = useI18n();
  const subscription = user?.subscriptions?.[0];
  const isAdmin = user?.role === 'admin';

  const [videosState, setVideosState] = useState({ loading: true, hasVideoAccess: false, videos: [], error: '' });
  const [avatarOpen, setAvatarOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) return;
    api
      .myVideos(token)
      .then((data) => setVideosState({ loading: false, hasVideoAccess: data.hasVideoAccess, videos: data.videos || [], error: '' }))
      .catch((err) => setVideosState({ loading: false, hasVideoAccess: false, videos: [], error: err.message }));
  }, [token, isAdmin]);

  const [initial, setInitial] = useState(() => profileForm(user));
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const [weight, setWeight] = useState('');
  const [weightSaving, setWeightSaving] = useState(false);
  const [weightError, setWeightError] = useState('');
  const [weightSaved, setWeightSaved] = useState(false);

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
      setInitial(form);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleWeight(e) {
    e.preventDefault();
    setWeightError('');
    setWeightSaving(true);
    try {
      await api.logWeight({ weightKg: Number(weight) }, token);
      await refreshMe();
      setWeight('');
      setWeightSaved(true);
    } catch (err) {
      setWeightError(err.message);
    } finally {
      setWeightSaving(false);
    }
  }

  function handleLogout() {
    logout();
    onClose();
  }

  if (avatarOpen) {
    return <AvatarPickerModal onClose={() => setAvatarOpen(false)} />;
  }

  const inactive = isSubscriptionInactive(subscription);
  const statusKey = inactive ? 'past_due' : subscription?.status;

  const shortcuts = isAdmin
    ? [
        { key: 'admin', href: '/admin', label: t('account.tabs.admin'), sub: t('profile.adminSub') },
        { key: 'profile', href: '/mi-plan', label: t('account.tabs.profile'), sub: t('profile.profilePageSub') },
      ]
    : [
        { key: 'plan', href: '/mi-plan', label: t('account.myPlan'), sub: t('profile.planSub') },
        { key: 'videos', href: '/mis-videos', label: t('account.tabs.videos'), sub: videosSummary(videosState, t) },
        { key: 'rutina', href: '/mi-rutina', label: t('account.tabs.rutina'), sub: t('profile.routineSubShort') },
        { key: 'bitacora', href: '/mi-bitacora', label: t('account.tabs.bitacora'), sub: t('profile.logSub') },
      ];

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email;

  return (
    <Modal
      title={fullName}
      subtitle={user?.email}
      variant="profile"
      onClose={onClose}
      media={
        <button type="button" className="pf-avatar" onClick={() => setAvatarOpen(true)} aria-label={t('nav.changeAvatar')}>
          <UserAvatar user={user} size={64} />
          <span className="pf-avatar__edit" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16z" />
            </svg>
          </span>
        </button>
      }
    >
      <form className="pf" onSubmit={handleSave}>
        {isAdmin && <span className="pf-role">{t('profile.adminRole')}</span>}

        {!isAdmin && (
          <section className={`pf-plan pf-tone--${subscription ? STATUS_TONE[statusKey] || 'neutral' : 'neutral'}`}>
            <div className="pf-plan__info">
              <span className="pf-eyebrow">{t('myPlan.yourPlan')}</span>
              {subscription ? (
                <div className="pf-plan__row">
                  <strong>{subscription.plan?.name}</strong>
                  <span className="pf-pill">
                    <span className="pf-pill__dot" aria-hidden="true" />
                    {t(`myPlan.status.${statusKey}`)}
                  </span>
                </div>
              ) : (
                <strong className="pf-plan__empty">{t('myPlan.noPlan')}</strong>
              )}
            </div>
            <a className="pf-plan__cta" href={subscription ? '/mi-plan' : '/#planes'} onClick={subscription ? undefined : onClose}>
              {subscription ? (inactive ? t('myPlan.cta.renew') : t('profile.viewPlan')) : t('myPlan.cta.seePlans')}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </section>
        )}

        <section className="pf-section">
          <h3 className="pf-section__title">{t('profile.shortcuts')}</h3>
          <div className={`pf-tiles ${isAdmin ? 'pf-tiles--two' : ''}`}>
            {shortcuts.map((s) => (
              <a key={s.key} className={`pf-tile ${s.key === 'admin' ? 'pf-tile--accent' : ''}`} href={s.href}>
                <span className="pf-tile__icon">
                  <Icon d={ICONS[s.key]} />
                </span>
                <span className="pf-tile__text">
                  <span className="pf-tile__label">{s.label}</span>
                  <span className="pf-tile__sub">{s.sub}</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        {!isAdmin && (
          <section className="pf-weight">
            <div className="pf-weight__current">
              <span className="pf-eyebrow">{t('profile.currentWeight')}</span>
              <strong>{user?.weightKg ? `${Number(user.weightKg)} kg` : t('profile.weightNone')}</strong>
            </div>
            <div className="pf-weight__form">
              <input
                type="number"
                min="1"
                step="0.1"
                inputMode="decimal"
                value={weight}
                placeholder={t('profile.weightPlaceholder')}
                aria-label={t('profile.weightLabel')}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setWeightSaved(false);
                }}
              />
              <button type="button" className="pf-btn" disabled={!weight || weightSaving} onClick={handleWeight}>
                {weightSaving ? t('common.saving') : t('profile.weightUpdate')}
              </button>
            </div>
            {weightError && <p className="modal__error pf-weight__msg">{weightError}</p>}
            {weightSaved && <p className="pf-weight__msg pf-weight__msg--ok">{t('profile.weightSaved')}</p>}
          </section>
        )}

        <section className="pf-section">
          <div>
            <h3 className="pf-section__title">{t('profile.personalData')}</h3>
            <p className="pf-section__hint">{t('profile.personalHint')}</p>
          </div>
          <div className="pf-grid">
            <div className="field">
              <label htmlFor="pfirstName">{t('common.firstName')}</label>
              <input id="pfirstName" name="firstName" value={form.firstName} onChange={handleChange} autoComplete="given-name" />
            </div>
            <div className="field">
              <label htmlFor="plastName">{t('common.lastName')}</label>
              <input id="plastName" name="lastName" value={form.lastName} onChange={handleChange} autoComplete="family-name" />
            </div>
            <div className="field">
              <label htmlFor="pdocumentId">{t('profile.document')}</label>
              <input id="pdocumentId" name="documentId" value={form.documentId} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="pnationality">{t('common.nationality')}</label>
              <input id="pnationality" name="nationality" value={form.nationality} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="pphone">{t('common.whatsapp')}</label>
              <input id="pphone" name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" />
            </div>
            <div className="field">
              <label htmlFor="pcity">{t('profile.city')}</label>
              <input id="pcity" name="city" value={form.city} onChange={handleChange} autoComplete="address-level2" />
            </div>
          </div>
          {error && <p className="modal__error">{error}</p>}
        </section>

        <div className="pf-footer">
          <button type="button" className="pf-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
              <path d="M10 17l-5-5 5-5M5 12h11" />
            </svg>
            {t('myPlan.logout')}
          </button>
          <div className="pf-footer__save">
            {(dirty || saved) && (
              <span className={`pf-status ${dirty ? 'pf-status--dirty' : 'pf-status--saved'}`}>
                {dirty ? t('profile.unsaved') : t('profile.saved')}
              </span>
            )}
            <button type="submit" className="pf-btn pf-btn--primary" disabled={!dirty || saving}>
              {saving ? t('common.saving') : t('profile.save')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
