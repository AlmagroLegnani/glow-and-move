import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Plans from './components/Plans.jsx';
import StatsBar from './components/StatsBar.jsx';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import AIAssistant from './components/AIAssistant.jsx';
import MascotBubbles from './components/MascotBubbles.jsx';
import CheckoutStatus from './components/CheckoutStatus.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import AdminPage from './components/AdminPage.jsx';
import MiPlanPage from './components/MiPlanPage.jsx';
import MisVideosPage from './components/MisVideosPage.jsx';
import MiBitacoraPage from './components/MiBitacoraPage.jsx';
import MiRutinaPage from './components/MiRutinaPage.jsx';

const CHECKOUT_PATHS = {
  '/checkout/exito': 'exito',
  '/checkout/pendiente': 'pendiente',
  '/checkout/error': 'error',
};

function App() {
  const checkoutStatus = CHECKOUT_PATHS[window.location.pathname];
  if (checkoutStatus) {
    return <CheckoutStatus status={checkoutStatus} />;
  }

  if (window.location.pathname === '/reset-password') {
    return <ResetPassword />;
  }

  if (window.location.pathname === '/admin') {
    return <AdminPage />;
  }

  if (window.location.pathname === '/mi-plan') {
    return <MiPlanPage />;
  }

  if (window.location.pathname === '/mis-videos') {
    return <MisVideosPage />;
  }

  if (window.location.pathname === '/mi-bitacora') {
    return <MiBitacoraPage />;
  }

  if (window.location.pathname === '/mi-rutina') {
    return <MiRutinaPage />;
  }

  return (
    <>
      <MascotBubbles />
      <Navbar />
      <main>
        <Hero />
        <Plans />
        <StatsBar />
        <About />
        <Contact />
      </main>
      <Footer />
      <AIAssistant />
    </>
  );
}

export default App;
