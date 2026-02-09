import TopNav from '../components/landing/TopNav';
import Hero from '../components/landing/Hero';
import SectionPreviews from '../components/landing/SectionPreviews';
import ArchitectureDiagram from '../components/landing/ArchitectureDiagram';
import TechStack from '../components/landing/TechStack';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      <TopNav />
      <Hero />
      <SectionPreviews />
      <ArchitectureDiagram />
      <TechStack />
      <Footer />
    </div>
  );
}
