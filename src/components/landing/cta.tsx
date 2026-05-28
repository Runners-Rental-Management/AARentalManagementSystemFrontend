"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { SectionReveal } from "./motion";

export function LandingCta() {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal>
          <motion.div
            className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0F766E] via-[#0d9488] to-[#14B8A6] px-8 py-14 text-center sm:px-16 sm:py-20"
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
              aria-hidden
            />

            <div className="relative">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4" />
                {t("landing", "officialPlatformBadge")}
              </div>

              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                {t("landing", "ctaTitle")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-teal-50/95">
                {t("landing", "ctaDescription")}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#0F766E] shadow-xl transition-all hover:bg-teal-50"
                >
                  {t("landing", "ctaButton")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/60 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
                >
                  {t("landing", "explore")}
                </Link>
              </div>
            </div>
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  );
}
