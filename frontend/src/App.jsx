import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Plans from './components/Plans.jsx';
import StatsBar from './components/StatsBar.jsx';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import AIAssistant from './components/AIAssistant.jsx';
import CheckoutStatus from './components/CheckoutStatus.jsx';

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

  return (
    <>
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
