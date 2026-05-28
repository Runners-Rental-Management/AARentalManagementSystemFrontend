"use client";

import { motion } from "framer-motion";
import {
  Brain,
  CreditCard,
  FileCheck2,
  Home,
  Scale,
  Users,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { SectionReveal, fadeUp, staggerContainer } from "./motion";
import { cn } from "@/lib/utils";

const FEATURE_KEYS = [
  { icon: Home, title: "premiumFeature1Title", desc: "premiumFeature1Desc" },
  { icon: FileCheck2, title: "premiumFeature2Title", desc: "premiumFeature2Desc" },
  { icon: Users, title: "premiumFeature3Title", desc: "premiumFeature3Desc" },
  { icon: Brain, title: "premiumFeature4Title", desc: "premiumFeature4Desc" },
  { icon: CreditCard, title: "premiumFeature5Title", desc: "premiumFeature5Desc" },
  { icon: Scale, title: "premiumFeature6Title", desc: "premiumFeature6Desc" },
] as const;

export function LandingFeatures() {
  const { t } = useLanguage();

  return (
    <section id="features" className="scroll-mt-24 bg-[#F8FAFC] py-20 sm:py-28 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0F766E]">
            {t("landing", "platformCapabilities")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
            {t("landing", "featuresHeadline")}
          </h2>
          <p className="mt-4 text-lg text-[#374151]">{t("landing", "featuresSubhead")}</p>
        </SectionReveal>

        <motion.div
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {FEATURE_KEYS.map((feature) => (
            <motion.article
              key={feature.title}
              variants={fadeUp}
              className={cn(
                "group rounded-[20px] border border-slate-200/70 bg-white p-8 dark:border-orange-500/20 dark:bg-[#141414]",
                "shadow-sm transition-all duration-300",
                "hover:-translate-y-1 hover:border-[#14B8A6]/35 hover:shadow-xl hover:shadow-slate-900/5",
              )}
            >
              <div className="mb-5 inline-flex rounded-2xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] p-3 text-white shadow-lg shadow-teal-700/20 transition-transform group-hover:scale-105">
                <feature.icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">
                {t("landing", feature.title)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#374151]">
                {t("landing", feature.desc)}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
