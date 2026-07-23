import heroPhoto from '../assets/photos/hero.jpg';
import './Hero.css';

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero__brandbar">
        <h1 className="hero__brand">
          Glow <span>&amp;</span> Move
        </h1>
      </div>

      <div className="container">
        <div className="hero__frame">
          <img src={heroPhoto} alt="Entrenamiento guiado en un estudio luminoso" className="hero__photo" />
          <div className="hero__overlay" />
        </div>

        <blockquote className="hero__quote">
          “Glow and Move, donde la distancia se acorta a través del movimiento”
        </blockquote>

        <div className="hero__trial">
          <p className="hero__trial-text">
            Prueba gratis plan Full, libre de anuncios
          </p>
          <p className="hero__trial-note">
            Te mostramos los beneficios y la experiencia Full eligiendo una de dos rutinas: tren superior o tren inferior.
          </p>
          <a href="#planes" className="btn btn-primary hero__trial-cta">
            Empezar prueba gratis
          </a>
        </div>
      </div>
    </section>
  );
}
