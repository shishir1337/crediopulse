import CrimeStats from "@/components/landing/CrimeStats";
import CtaBanner from "@/components/landing/CtaBanner";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import Fingertips from "@/components/landing/Fingertips";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import Monitoring from "@/components/landing/Monitoring";
import Navbar from "@/components/landing/Navbar";
import Pricing from "@/components/landing/Pricing";
import RadarSection from "@/components/landing/RadarSection";
import Testimonials from "@/components/landing/Testimonials";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CrimeStats />
        <RadarSection />
        <FeaturesGrid />
        <Fingertips />
        <Monitoring />
        <Pricing />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
