
import dynamic from 'next/dynamic';
import Hero from '../components/Hero';

const FeaturesSection = dynamic(() => import('../components/FeaturesSection'), {
  loading: () => <div style={{ minHeight: '400px' }} />,
});
const BuiltInToolsPreview = dynamic(() => import('../components/BuiltInToolsPreview'), {
  loading: () => <div style={{ minHeight: '400px' }} />,
});
const StatsSection = dynamic(() => import('../components/StatsSection'), {
  loading: () => <div style={{ minHeight: '200px' }} />,
});
const CTASection = dynamic(() => import('../components/CTASection'), {
  loading: () => <div style={{ minHeight: '200px' }} />,
});
const ContactSection = dynamic(() => import('../components/ContactSection'), {
  loading: () => <div style={{ minHeight: '300px' }} />,
});

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
