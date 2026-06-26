import HeroBanner from "@/components/HeroBanner";
import AfterHeroSection from "@/components/AfterHeroSection";
import ClientsSection from "@/components/ClientsSection";
import CTASection from "@/components/CTASection";

export const metadata = {
  title: "FORWARD Agency — Smart Digital Marketing",
};

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <AfterHeroSection />
      <ClientsSection />
      <CTASection />
    </>
  );
}
