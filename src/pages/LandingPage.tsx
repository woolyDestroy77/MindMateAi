import React from 'react';
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import HowItWorks from "../components/home/HowItWorks";
import Testimonials from "../components/home/Testimonials";
import FAQ from "../components/home/FAQ";
import CTASection from "../components/home/CTASection";
import { useLanguageContext } from '../context/LanguageContext';

const LandingPage = () => {
  const { changeLanguage } = useLanguageContext();
  
  const handleLanguageChange = (language: string) => {
    changeLanguage(language);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLanguageChange={handleLanguageChange} />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;