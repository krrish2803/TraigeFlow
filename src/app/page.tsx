"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Features from "@/components/landing/Features";
import Solution from "@/components/landing/Solution";
import CTA from "@/components/landing/CTA";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <Hero />
      <Problem />
      <Features />
      <Solution />
      <CTA />
      <FAQ />
      <Footer />
    </div>
  );
}
