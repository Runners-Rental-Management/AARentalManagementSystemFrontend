"use client";

import { LandingNavbar } from "./navbar";
import { LandingHero } from "./hero";
import { LandingStats } from "./stats";
import { LandingFeatures } from "./features";
import { LandingHowItWorks } from "./how-it-works";
import { LandingBenefits } from "./benefits";
import { LandingTestimonials } from "./testimonials";
import { LandingPlatformOverview } from "./platform-overview";
import { LandingCta } from "./cta";
import { LandingFooter } from "./footer";

export function PremiumLandingPage() {
  return (
    <div className="landing-page min-h-screen bg-white font-[family-name:var(--font-inter)] text-[#111827] antialiased dark:bg-[#050505] dark:text-stone-100">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingBenefits />
        <LandingTestimonials />
        <LandingPlatformOverview />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
