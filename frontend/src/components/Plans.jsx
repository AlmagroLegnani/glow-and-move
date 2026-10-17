import { useEffect, useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { isSubscriptionInactive } from '../lib/subscription.js';
import AuthModal from './AuthModal.jsx';
import photoBasico from '../assets/photos/about-2.jpg';
import photoPremium from '../assets/photos/story.jpg';
import photoFull from '../assets/photos/hero.jpg';
import './Plans.css';

// La foto de cada tarjeta no está en la DB (Plan no tiene ese campo) — se asigna acá por
// slug. Todo lo demás (nombre, precio, features, anuncios) sale de la API.
const PHOTO_BY_SLUG = { basico: photoBasico, premium: photoPremium, full: photoFull };

const BILLING_OPTIONS = [
  { id: 'trimestral', label: 'Trimestral', hint: '3 meses' },
  { id: 'semestral', label: 'Semestral', hint: '6 meses' },
  { id: 'anual', label: 'Anual', hint: '12 meses' },
];

export default function Plans() {
  const revealIntro = useReveal();
  const revealCards = useReveal();
  const { user, token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState('');
  const [toast, setToast] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [billingMode, setBillingMode] = useState('trimestral');

  useEffect(() => {
    api
      .plans()
      .then(setPlans)
      .catch((err) => setPlansError(err.message));
  }, []);

  const currentSubscription = user?.subscriptions?.[0];
  const currentPlanSlug =
    currentSubscription && currentSubscription.status !== 'canceled' ? currentSubscription.plan?.slug : null;

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 3200);
  }

  async function goToCheckout(plan, authToken) {
    setLoadingPlan(plan.slug);
    try {
      const { initPoint } = await api.checkout({ planSlug: plan.slug, billingMode }, authToken);
      window.location.href = initPoint;
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoadingPlan(null);
    }
  }

  function handleBuy(plan) {
    if (!user) {
      setPendingPlan(plan);
      setAuthModalOpen(true);
      return;
    }
    goToCheckout(plan, token);
  }

  function handleAuthSuccess() {
    if (pendingPlan) {
      const plan = pendingPlan;
      setPendingPlan(null);
      // el token recién emitido todavía no está en contexto en este mismo tick,
      // así que lo volvemos a pedir del storage.
      const freshToken = localStorage.getItem('glowmove_token');
      goToCheckout(plan, freshToken);
    }
  }

  const featuredPlan = plans.find((p) => p.slug === 'full');
  const regularPlans = plans.filter((p) => p.slug !== 'full');

  function renderPrice(plan) {
    const price = plan.pricing?.[billingMode];
    if (!price) {
      return (
        <p className="plans__price">
          U$S {Number(plan.priceUsd).toFixed(2)} <span>/ mes</span>
        </p>
      );
    }
    return (
      <div className="plans__pricing">
        <p className="plans__price">
          U$S {price.monthly.toFixed(2)} <span>/ mes</span>
        </p>
        <p className="plans__price-total">
          {price.discountPct > 0 && <s>U$S {(Number(plan.priceUsd) * price.months).toFixed(2)}</s>} U$S{' '}
          {price.total.toFixed(2)} cada {price.months} meses
        </p>
      </div>
    );
  }

  function renderBuyButton(plan) {
    if (plan.slug === currentPlanSlug && isSubscriptionInactive(currentSubscription) && currentSubscription.status !== 'trial') {
      return (
        <a className="btn btn-primary plans__buy" href="/mi-plan#renovar">
          Renovar plan
        </a>
      );
    }
    if (plan.slug === currentPlanSlug) {
      return (
        <button type="button" className="btn plans__buy plans__buy--owned" disabled>
          Plan actual
        </button>
      );
    }
    return (
      <button
        type="button"
        className="btn btn-primary plans__buy"
        onClick={() => handleBuy(plan)}
        disabled={loadingPlan === plan.slug}
      >
        {loadingPlan === plan.slug ? 'Redirigiendo...' : 'Comprar plan'}
      </button>
    );
  }

  return (
    <section id="planes" className="plans">
      <div className="container plans__intro reveal" ref={revealIntro}>
        <span className="eyebrow">Planes</span>
        <h2 className="plans__title">Elegí tu experiencia Glow &amp; Move</h2>
        <div className="plans__billing" role="radiogroup" aria-label="Forma de pago">
          {BILLING_OPTIONS.map((opt) => {
            const discount = plans[0]?.pricing?.[opt.id]?.discountPct;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={billingMode === opt.id}
                className={`plans__billing-opt ${billingMode === opt.id ? 'plans__billing-opt--active' : ''}`}
                onClick={() => setBillingMode(opt.id)}
              >
                {opt.label}
                {discount > 0 && <span className="plans__billing-save">-{discount}%</span>}
              </button>
            );
          })}
        </div>
      </div>

      {plansError && (
        <p className="container" style={{ textAlign: 'center', color: '#b3543f' }}>
          {plansError}
        </p>
      )}

      <div className="container plans__grid reveal" ref={revealCards}>
        {regularPlans.map((plan) => (
          <article key={plan.slug} className="plans__card">
            <img src={PHOTO_BY_SLUG[plan.slug]} alt={plan.name} className="plans__card-photo" />
            <div className="plans__card-body">
              <h3>{plan.name}</h3>
              {renderPrice(plan)}
              <p className={`plans__ads ${plan.hasAds ? 'plans__ads--yes' : 'plans__ads--no'}`}>
                {plan.hasAds ? 'Contiene anuncios' : 'Libre de anuncios'}
              </p>
              <ul className="plans__features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {renderBuyButton(plan)}
            </div>
          </article>
        ))}
      </div>

      {featuredPlan && (
        <div className="container plans__featured-wrap reveal">
          <article className="plans__featured">
            <span className="plans__badge">Más elegido</span>
            <img src={PHOTO_BY_SLUG[featuredPlan.slug]} alt={featuredPlan.name} className="plans__featured-photo" />
            <div className="plans__featured-body">
              <h3>{featuredPlan.name}</h3>
              {renderPrice(featuredPlan)}
              <p className="plans__ads plans__ads--no">Libre de anuncios</p>
              <ul className="plans__features">
                {featuredPlan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {renderBuyButton(featuredPlan)}
            </div>
          </article>
        </div>
      )}

      {toast && <div className="plans__toast">{toast}</div>}
      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
      )}
    </section>
  );
}
