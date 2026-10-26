
import Hero from '../components/Hero';
import FeaturesSection from '../components/FeaturesSection';
import BuiltInToolsPreview from '../components/BuiltInToolsPreview';
import StatsSection from '../components/StatsSection';
import CTASection from '../components/CTASection';
import ContactSection from '../components/ContactSection';
import BrandLogo from '../components/ui/BrandLogo';
import styles from './page.module.scss';

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturesSection />
      <BuiltInToolsPreview />
      <StatsSection />
      <CTASection />
      <ContactSection />
      <section className={styles.brandSection} aria-label="CodeCanvas brand">
        <BrandLogo variant="full" size="full" href={null} />
      </section>
    </>
  );
}
