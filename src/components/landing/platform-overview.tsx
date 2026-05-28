"use client";

import { motion } from "framer-motion";
import { BarChart3, FileText, LayoutDashboard, Shield } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { SectionReveal, fadeUp, staggerContainer } from "./motion";

const MOCKUPS = [
  {
    title: "mockAuthorityTitle",
    desc: "mockAuthorityDesc",
    icon: Shield,
    bars: [30, 55, 40, 70, 50, 85, 65],
  },
  {
    title: "mockLandlordTitle",
    desc: "mockLandlordDesc",
    icon: BarChart3,
    bars: [50, 35, 60, 45, 75, 55, 90],
  },
  {
    title: "mockTenantTitle",
    desc: "mockTenantDesc",
    icon: FileText,
    bars: [45, 60, 38, 72, 48, 68, 58],
  },
] as const;

export function LandingPlatformOverview() {
  const { t } = useLanguage();

  return (
    <section id="platform" className="scroll-mt-24 bg-[#F8FAFC] py-20 sm:py-28 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0F766E]">
            {t("landing", "platformKicker")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
            {t("landing", "platformHeadline")}
          </h2>
          <p className="mt-4 text-lg text-[#374151]">{t("landing", "platformSubhead")}</p>
        </SectionReveal>

        <motion.div
          className="mt-14 grid gap-8 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {MOCKUPS.map((mock) => (
            <motion.div
              key={mock.title}
              variants={fadeUp}
              className="group rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-orange-500/20 dark:bg-[#141414]"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-[#0F766E]/10 p-2.5 text-[#0F766E]">
                  <mock.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#111827]">{t("landing", mock.title)}</h3>
                  <p className="text-xs text-[#374151]">{t("landing", mock.desc)}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-[#111827] p-3 shadow-inner">
                <div className="flex gap-1.5 pb-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                </div>
                <div className="rounded-xl bg-slate-800/80 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium">{t("landing", "livePreview")}</span>
                  </div>
                  <div className="mt-4 flex h-20 items-end gap-1.5">
                    {mock.bars.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-[#0F766E] to-[#14B8A6] opacity-90 transition-all group-hover:opacity-100"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="h-8 rounded-lg bg-slate-700/80" />
                    <div className="h-8 rounded-lg bg-slate-700/50" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
