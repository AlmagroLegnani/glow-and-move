import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          Glow <span>&</span> Move
          <p>Entrenamiento sin fronteras.</p>
        </div>

        <nav className="footer__links">
          <a href="#home">Home</a>
          <a href="#planes">Planes</a>
          <a href="#nosotros">Sobre nosotros</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <p className="footer__copy">© {new Date().getFullYear()} Glow &amp; Move. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
