
import Hero from '../components/Hero';
import FeaturesSection from '../components/FeaturesSection';
import BuiltInToolsPreview from '../components/BuiltInToolsPreview';
import StatsSection from '../components/StatsSection';
import CTASection from '../components/CTASection';
import ContactSection from '../components/ContactSection';

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturesSection />
      <BuiltInToolsPreview />
      <StatsSection />
      <CTASection />
      <ContactSection />
    </>
  );
}
