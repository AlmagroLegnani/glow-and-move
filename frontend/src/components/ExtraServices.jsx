import { useEffect, useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { api } from '../lib/api.js';
import { serviceIcon } from '../lib/serviceIcons.js';
import AuthModal from './AuthModal.jsx';
import './ExtraServices.css';

// Sección "Servicios complementarios" del home: rutinas específicas que se suman a cualquier
// plan pago con un pago único.
export default function ExtraServices() {
  const revealIntro = useReveal();
  const revealGrid = useReveal();
  const { user, token } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState(null);
  const [toast, setToast] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    api
      .services(token)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token, user?.id]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  async function buy(service) {
    setBuying(service.slug);
    try {
      const { initPoint } = await api.serviceCheckout(service.slug, token);
      window.location.href = initPoint;
    } catch (err) {
      setToast(err.message);
      setBuying(null);
    }
  }

  function renderAction(service) {
    if (service.owned) {
      return (
        <a className="xs-btn xs-btn--owned" href={`/servicios/${service.slug}`}>
          {t('services.open')}
        </a>
      );
    }
    if (!service.hasContent) {
      return <span className="xs-soon">{t('services.soon')}</span>;
    }
    if (data.reason === 'login') {
      return (
        <button type="button" className="xs-btn" onClick={() => setAuthOpen(true)}>
          {t('services.loginToBuy')}
        </button>
      );
    }
    if (data.reason === 'plan') {
      return (
        <a className="xs-btn" href="#planes">
          {t('services.needPlan')}
        </a>
      );
    }
    return (
      <button type="button" className="xs-btn xs-btn--primary" disabled={buying === service.slug} onClick={() => buy(service)}>
        {buying === service.slug ? t('plans.redirecting') : t('services.add', { price: service.priceUsd.toFixed(2) })}
      </button>
    );
  }

  return (
    <section id="servicios" className="xs">
      <div className="container xs__intro reveal" ref={revealIntro}>
        <span className="eyebrow">{t('services.eyebrow')}</span>
        <h2 className="xs__title">{t('services.title')}</h2>
        <p className="xs__text">{t('services.text')}</p>
      </div>

      {error && <p className="container xs__error">{error}</p>}

      <div className="container xs__grid reveal" ref={revealGrid}>
        {data?.services.map((service) => (
          <article key={service.slug} className={`xs-card ${service.owned ? 'xs-card--owned' : ''}`}>
            <div className="xs-card__top">
              <span className="xs-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d={serviceIcon(service.slug)} />
                </svg>
              </span>
              {service.owned ? (
                <span className="xs-card__badge xs-card__badge--owned">{t('services.owned')}</span>
              ) : (
                <span className="xs-card__price">
                  U$S {service.priceUsd.toFixed(2)}
                  <small>{t('services.oneTime')}</small>
                </span>
              )}
            </div>
            <h3 className="xs-card__name">{service.name}</h3>
            <p className="xs-card__desc">{service.description}</p>
            <div className="xs-card__action">{renderAction(service)}</div>
          </article>
        ))}
      </div>

      {data && <p className="container xs__note">{t('services.note')}</p>}

      {toast && <div className="plans__toast">{toast}</div>}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </section>
  );
}
