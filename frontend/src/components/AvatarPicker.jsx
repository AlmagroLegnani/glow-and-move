import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { AVATAR_PRESETS, photoToAvatarDataUrl, useAvatarSrc, userInitial } from '../lib/avatar.js';
import Modal from './Modal.jsx';
import UserAvatar from './UserAvatar.jsx';
import './AvatarPicker.css';
import { useI18n } from '../i18n/I18nContext.jsx';

const PHOTO_ERRORS = { type: 'avatar.errorType', size: 'avatar.errorSize', read: 'avatar.errorRead' };

// Selector de avatar: subir una foto propia, elegir uno de la galería o quedarse con la
// inicial del nombre. `onDone` se llama después de guardar (o de "Ahora no" si skipLabel).
export function AvatarPicker({ onDone, skipLabel }) {
  const { user, token, updateUser } = useAuth();
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [selected, setSelected] = useState(user?.avatarUrl ?? null);
  const [photo, setPhoto] = useState(user?.avatarUrl?.startsWith('data:') ? user.avatarUrl : null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setProcessing(true);
    try {
      const dataUrl = await photoToAvatarDataUrl(file);
      setPhoto(dataUrl);
      setSelected(dataUrl);
    } catch (err) {
      setError(PHOTO_ERRORS[err.code] ? t(PHOTO_ERRORS[err.code]) : err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const { avatarUrl } = await api.updateAvatar({ avatar: selected }, token);
      updateUser({ avatarUrl });
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const unchanged = selected === (user?.avatarUrl ?? null);

  return (
    <div className="avatar-picker">
      <div className="avatar-picker__preview">
        <UserAvatar user={user} avatarUrl={selected} size={96} className="avatar-picker__current" />
        <span>{t('avatar.preview')}</span>
      </div>

      <div className="avatar-picker__section">
        <span className="avatar-picker__label">{t('avatar.yourPhoto')}</span>
        <div className="avatar-picker__row">
          <button
            type="button"
            className="avatar-picker__upload"
            onClick={() => fileRef.current?.click()}
            disabled={processing || saving}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            {processing ? t('avatar.processing') : photo ? t('avatar.change') : t('avatar.upload')}
          </button>
          {photo && (
            <button
              type="button"
              className={`avatar-picker__option ${selected === photo ? 'is-selected' : ''}`}
              onClick={() => setSelected(photo)}
              aria-label={t('avatar.useMyPhoto')}
              aria-pressed={selected === photo}
            >
              <img src={photo} alt="" />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
        </div>
      </div>

      <div className="avatar-picker__section">
        <span className="avatar-picker__label">{t('avatar.orPick')}</span>
        <div className="avatar-picker__grid">
          <button
            type="button"
            className={`avatar-picker__option avatar-picker__option--initial ${selected === null ? 'is-selected' : ''}`}
            onClick={() => setSelected(null)}
            aria-label={t('avatar.useInitial')}
            aria-pressed={selected === null}
          >
            {userInitial(user)}
          </button>
          {AVATAR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`avatar-picker__option ${selected === preset ? 'is-selected' : ''}`}
              onClick={() => setSelected(preset)}
              aria-label={t('avatar.pickThis')}
              aria-pressed={selected === preset}
            >
              <PresetImage value={preset} />
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="modal__error" role="alert">
          {error}
        </p>
      )}

      <div className="avatar-picker__actions">
        {skipLabel && (
          <button type="button" className="avatar-picker__skip" onClick={onDone} disabled={saving}>
            {skipLabel}
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || processing || (unchanged && !skipLabel)}>
          {saving ? t('common.saving') : t('avatar.save')}
        </button>
      </div>
    </div>
  );
}

function PresetImage({ value }) {
  const src = useAvatarSrc(value);
  return src ? <img src={src} alt="" /> : null;
}

export default function AvatarPickerModal({ onClose }) {
  const { t } = useI18n();
  return (
    <Modal title={t('avatar.title')} subtitle={t('avatar.subtitle')} variant="auth" onClose={onClose}>
      <AvatarPicker onDone={onClose} />
    </Modal>
  );
}
