import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Plans from './components/Plans.jsx';
import StatsBar from './components/StatsBar.jsx';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import AIAssistant from './components/AIAssistant.jsx';

function App() {
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
