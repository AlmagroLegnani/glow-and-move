import { useEffect, useMemo, useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { api } from '../lib/api.js';
import { groupServices, serviceIcon } from '../lib/serviceIcons.js';
import AuthModal from './AuthModal.jsx';
import './ExtraServices.css';

// "Rutina en casa" → "En casa": dentro de una categoría el prefijo sobra.
function shortName(name) {
  const rest = name.replace(/^rutina\s+/i, '');
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

// Sección "Servicios complementarios" del home: rutinas específicas que se suman a cualquier
// plan pago con un pago único. Se muestran agrupadas por categoría, una categoría a la vez.
export default function ExtraServices() {
  const revealIntro = useReveal();
  const revealPanel = useReveal();
  const { user, token } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState(null);
  const [toast, setToast] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [active, setActive] = useState(null);

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

  const groups = useMemo(() => (data ? groupServices(data.services) : []), [data]);
  const current = groups.find((g) => g.key === active) || groups[0];
  const minPrice = data?.services.length ? Math.min(...data.services.map((s) => s.priceUsd)) : 0;
  const canBuy = data && !data.reason;

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
    if (!canBuy) {
      return <span className="xs-row__price">U$S {service.priceUsd.toFixed(2)}</span>;
    }
    return (
      <button type="button" className="xs-btn xs-btn--primary" disabled={buying === service.slug} onClick={() => buy(service)}>
        {buying === service.slug ? t('plans.redirecting') : `${t('services.addShort')} · U$S ${service.priceUsd.toFixed(2)}`}
      </button>
    );
  }

  // Sin sesión o sin plan, un único llamado a la acción para todo el panel en vez de uno por fila.
  function renderGate() {
    if (data?.reason === 'login') {
      return (
        <button type="button" className="xs-btn xs-btn--primary" onClick={() => setAuthOpen(true)}>
          {t('services.loginToBuy')}
        </button>
      );
    }
    if (data?.reason === 'plan') {
      return (
        <a className="xs-btn xs-btn--primary" href="#planes">
          {t('services.seePlans')}
        </a>
      );
    }
    return null;
  }

  return (
    <section id="servicios" className="xs">
      <div className="container xs__intro reveal" ref={revealIntro}>
        <span className="eyebrow">{t('services.eyebrow')}</span>
        <h2 className="xs__title">{t('services.title')}</h2>
        <p className="xs__text">{t('services.text')}</p>
      </div>

      {error && <p className="container xs__error">{error}</p>}

      <div className="container reveal" ref={revealPanel}>
        {current && (
          <div className="xs-panel">
            <aside className="xs-panel__side">
              <div className="xs-panel__tabs" role="tablist">
                {groups.map((group) => (
                  <button
                    key={group.key}
                    type="button"
                    role="tab"
                    aria-selected={group.key === current.key}
                    className={`xs-tab ${group.key === current.key ? 'is-active' : ''}`}
                    onClick={() => setActive(group.key)}
                  >
                    <span className="xs-tab__title">{t(`services.cat.${group.key}.title`)}</span>
                    <span className="xs-tab__count">{group.services.length}</span>
                  </button>
                ))}
              </div>

              <div className="xs-panel__offer">
                <span className="xs-panel__from">{t('services.from')}</span>
                <span className="xs-panel__price">U$S {minPrice.toFixed(2)}</span>
                <span className="xs-panel__each">{t('services.each')}</span>
                {renderGate()}
              </div>
            </aside>

            <div className="xs-panel__main" role="tabpanel" key={current.key}>
              <header className="xs-panel__head">
                <h3>{t(`services.cat.${current.key}.title`)}</h3>
                <p>{t(`services.cat.${current.key}.tagline`)}</p>
              </header>

              <ul className="xs-list">
                {current.services.map((service) => (
                  <li key={service.slug} className={`xs-row ${service.owned ? 'xs-row--owned' : ''}`}>
                    <span className="xs-card__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d={serviceIcon(service.slug)} />
                      </svg>
                    </span>
                    <div className="xs-row__body">
                      <h4 className="xs-row__name">
                        {shortName(service.name)}
                        {service.owned && <span className="xs-row__badge">{t('services.owned')}</span>}
                      </h4>
                      <p className="xs-row__desc">{service.description}</p>
                    </div>
                    <div className="xs-row__action">{renderAction(service)}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {data && <p className="container xs__note">{t('services.note')}</p>}

      {toast && <div className="plans__toast">{toast}</div>}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </section>
  );
}
