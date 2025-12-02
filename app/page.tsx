import {
  LandingNav,
  HeroSection,
  DemoSection,
  StatsSection,
  FeaturesSection,
  PartnersSection,
  USPSection,
  SecuritySection,
  FAQSection,
  CTASection,
  LandingFooter,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <main>
        <HeroSection />
        <DemoSection />
        <StatsSection />
        <FeaturesSection />
        <PartnersSection />
        <USPSection />
        <SecuritySection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
