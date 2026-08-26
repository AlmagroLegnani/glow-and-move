import { useEffect, useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import AuthModal from './AuthModal.jsx';
import photoBasico from '../assets/photos/about-2.jpg';
import photoPremium from '../assets/photos/story.jpg';
import photoFull from '../assets/photos/hero.jpg';
import './Plans.css';

// La foto de cada tarjeta no está en la DB (Plan no tiene ese campo) — se asigna acá por
// slug. Todo lo demás (nombre, precio, features, anuncios) sale de la API.
const PHOTO_BY_SLUG = { basico: photoBasico, premium: photoPremium, full: photoFull };

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
      const { initPoint } = await api.checkout({ planSlug: plan.slug }, authToken);
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

  function renderBuyButton(plan) {
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
              <p className="plans__price">
                U$S {Number(plan.priceUsd).toFixed(2)} <span>/ {plan.billingPeriod}</span>
              </p>
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
              <p className="plans__price">
                U$S {Number(featuredPlan.priceUsd).toFixed(2)} <span>/ {featuredPlan.billingPeriod}</span>
              </p>
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
