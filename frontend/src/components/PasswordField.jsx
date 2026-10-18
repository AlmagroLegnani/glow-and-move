import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  required,
  minLength,
  autoComplete,
  icon,
  placeholder,
}) {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`password-field${icon ? ' input-icon' : ''}`}>
        {icon}
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="password-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('password.hide') : t('password.show')}
          tabIndex={-1}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
              <line x1="3" y1="21" x2="21" y2="3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
