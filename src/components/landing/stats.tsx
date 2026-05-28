"use client";

import { motion } from "framer-motion";
import { Building2, Clock, FileWarning, TrendingUp } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { AnimatedCounter, SectionReveal, staggerContainer, fadeUp } from "./motion";
import { cn } from "@/lib/utils";

const STAT_ICONS = [Building2, TrendingUp, Clock, FileWarning] as const;

export function LandingStats() {
  const { t } = useLanguage();

  const stats = [
    { valueKey: "stat1Value", labelKey: "stat1Label", icon: STAT_ICONS[0] },
    { valueKey: "stat2Value", labelKey: "stat2Label", icon: STAT_ICONS[1] },
    { valueKey: "stat3Value", labelKey: "stat3Label", icon: STAT_ICONS[2] },
    { valueKey: "stat4Value", labelKey: "stat4Label", icon: STAT_ICONS[3] },
  ];

  return (
    <section className="relative py-16 sm:py-20" aria-labelledby="stats-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal>
          <h2 id="stats-heading" className="sr-only">
            {t("landing", "statsAriaLabel")}
          </h2>
          <motion.div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.labelKey}
                variants={fadeUp}
                className={cn(
                  "group rounded-[20px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-orange-500/20 dark:bg-[#141414]",
                  "transition-all duration-300 hover:-translate-y-1 hover:border-[#14B8A6]/30 hover:shadow-xl hover:shadow-teal-900/5",
                )}
              >
                <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-[#0F766E]/10 to-[#14B8A6]/10 p-3 text-[#0F766E] transition-colors group-hover:from-[#0F766E] group-hover:to-[#14B8A6] group-hover:text-white">
                  <stat.icon className="h-6 w-6" aria-hidden />
                </div>
                <AnimatedCounter
                  value={t("landing", stat.valueKey)}
                  className="block text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl"
                />
                <p className="mt-2 text-sm font-medium leading-snug text-[#374151]">
                  {t("landing", stat.labelKey)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  );
}
