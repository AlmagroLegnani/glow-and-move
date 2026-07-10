import { useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import photoEconomico from '../assets/photos/about-1.jpg';
import photoBasico from '../assets/photos/about-2.jpg';
import photoPremium from '../assets/photos/story.jpg';
import photoFull from '../assets/photos/hero.jpg';
import './Plans.css';

const PLANS = [
  {
    id: 'economico',
    photo: photoEconomico,
    name: 'Plan Económico',
    price: '3,99',
    period: 'mensual',
    hasAds: true,
    features: ['Rutina genérica (1 opción a elegir)', 'Asistente IA para dudas'],
  },
  {
    id: 'basico',
    photo: photoBasico,
    name: 'Plan Básico',
    price: '6,99',
    period: 'mensual',
    hasAds: true,
    features: [
      'Rutina genérica (2 opciones a elegir)',
      'Buzón de comentarios de la app',
      'Asistente IA para dudas',
    ],
  },
  {
    id: 'premium',
    photo: photoPremium,
    name: 'Plan Premium',
    price: '8,99',
    period: 'semestral, por mes',
    hasAds: false,
    features: [
      'Rutina genérica (3 opciones a elegir)',
      'Videos disponibles de los ejercicios',
      'Buzón de comentarios + Asistente IA',
    ],
  },
];

const FULL_PLAN = {
  id: 'full',
  photo: photoFull,
  name: 'Plan Full',
  price: '12,99',
  period: 'anual, por mes',
  hasAds: false,
  highlight: true,
  features: [
    'Rutina de entrenamiento personalizada',
    'Videos de ejercicios y seguimiento de progreso',
    '10% de descuento en convenios y G&M Shop',
    'Dudas por WhatsApp cuando la IA no responde',
  ],
};

export default function Plans() {
  const revealIntro = useReveal();
  const revealCards = useReveal();
  const [toast, setToast] = useState('');

  function handleBuy(plan) {
    setToast(`Compra de ${plan.name}: disponible próximamente`);
    setTimeout(() => setToast(''), 2400);
  }

  return (
    <section id="planes" className="plans">
      <div className="container plans__intro reveal" ref={revealIntro}>
        <span className="eyebrow">Planes</span>
        <h2 className="plans__title">Elegí tu experiencia Glow &amp; Move</h2>
      </div>

      <div className="container plans__grid reveal" ref={revealCards}>
        {PLANS.map((plan) => (
          <article key={plan.id} className="plans__card">
            <img src={plan.photo} alt={plan.name} className="plans__card-photo" />
            <div className="plans__card-body">
              <h3>{plan.name}</h3>
              <p className="plans__price">
                U$S {plan.price} <span>/ {plan.period}</span>
              </p>
              <p className={`plans__ads ${plan.hasAds ? 'plans__ads--yes' : 'plans__ads--no'}`}>
                {plan.hasAds ? 'Contiene anuncios' : 'Libre de anuncios'}
              </p>
              <ul className="plans__features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary plans__buy" onClick={() => handleBuy(plan)}>
                Comprar plan
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="container plans__featured-wrap reveal">
        <article className="plans__featured">
          <span className="plans__badge">Más elegido</span>
          <img src={FULL_PLAN.photo} alt={FULL_PLAN.name} className="plans__featured-photo" />
          <div className="plans__featured-body">
            <h3>{FULL_PLAN.name}</h3>
            <p className="plans__price">
              U$S {FULL_PLAN.price} <span>/ {FULL_PLAN.period}</span>
            </p>
            <p className="plans__ads plans__ads--no">Libre de anuncios</p>
            <ul className="plans__features">
              {FULL_PLAN.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary plans__buy" onClick={() => handleBuy(FULL_PLAN)}>
              Comprar plan
            </button>
          </div>
        </article>
      </div>

      {toast && <div className="plans__toast">{toast}</div>}
    </section>
  );
}
