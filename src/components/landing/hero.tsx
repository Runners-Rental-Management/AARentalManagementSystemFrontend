"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { Float, fadeUp, staggerContainer } from "./motion";

export function LandingHero() {
  const { t } = useLanguage();

  const trustBadges = [
    t("landing", "trustProclamation"),
    t("landing", "trustFayda"),
    t("landing", "trustDara"),
  ];

  return (
    <section className="landing-hero relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28 lg:pb-32">
      <div className="landing-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-glow pointer-events-none absolute -top-40 right-0 h-[480px] w-[480px] rounded-full" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/25 bg-white/80 px-4 py-1.5 text-sm font-medium text-[#0F766E] shadow-sm backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t("landing", "badge")}
            </div>

            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-[#111827] sm:text-5xl lg:text-[3.25rem]">
              {t("landing", "heroHeadline")}
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-[#374151] sm:text-xl">
              {t("landing", "heroDescription")}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0F766E] to-[#14B8A6] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-teal-700/25 transition-all hover:shadow-2xl hover:brightness-105"
              >
                {t("landing", "getStarted")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white/90 px-8 py-4 text-base font-semibold text-[#111827] shadow-sm backdrop-blur-sm transition-all hover:border-[#14B8A6]/40 hover:shadow-md"
              >
                {t("landing", "explore")}
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Trust indicators">
              {trustBadges.map((badge) => (
                <li
                  key={badge}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#374151] backdrop-blur-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden />
                  {badge}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="relative mx-auto w-full max-w-lg pb-10 pl-2 pr-2 sm:pl-4 sm:pr-6 lg:mx-0 lg:max-w-none"
          >
            <Float className="relative z-0" delay={0.3}>
              <div className="landing-glass relative z-0 overflow-hidden rounded-[24px] border border-white/60 p-5 shadow-2xl shadow-slate-900/10 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                      {t("landing", "governanceDashboard")}
                    </p>
                    <p className="mt-0.5 text-sm text-[#374151]">
                      {t("landing", "liveMarketOverview")}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F766E]/10">
                    <Sparkles className="h-4 w-4 text-[#0F766E]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DashboardMetric
                    icon={FileText}
                    label={t("landing", "metricRegistrations")}
                    value="12,480"
                    delta="+8.2%"
                    accent="teal"
                  />
                  <DashboardMetric
                    icon={ShieldCheck}
                    label={t("landing", "metricAgreements")}
                    value="9,214"
                    delta="+5.1%"
                    accent="green"
                  />
                  <DashboardMetric
                    icon={BarChart3}
                    label={t("landing", "metricRevenue")}
                    value="2.4B ETB"
                    delta="+12%"
                    accent="slate"
                  />
                  <DashboardMetric
                    icon={TrendingUp}
                    label={t("landing", "metricCompliance")}
                    value="94%"
                    delta={t("common", "high")}
                    accent="teal"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-100/80 bg-white/50 p-4 backdrop-blur-sm">
                  <div className="flex h-20 items-end justify-between gap-2">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <motion.div
                        key={i}
                        className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-[#0F766E] to-[#14B8A6]"
                        initial={{ height: 0 }}
                        animate={{ height: `${h * 0.9}px` }}
                        transition={{ delay: 0.4 + i * 0.06, duration: 0.6 }}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-medium text-[#374151]">
                    {t("landing", "chartCaption")}
                  </p>
                </div>
              </div>
            </Float>

            <motion.div
              className="landing-glass pointer-events-none absolute bottom-0 left-0 z-10 hidden max-w-[9.5rem] rounded-2xl border border-white/70 bg-white/95 px-3.5 py-2.5 shadow-lg sm:block sm:-left-3"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            >
              <p className="text-xs font-semibold leading-tight text-[#111827]">
                {t("landing", "verifiedListing")}
              </p>
              <p className="mt-0.5 text-[10px] font-medium leading-tight text-[#22C55E]">
                {t("landing", "approvedByAuthority")}
              </p>
            </motion.div>

            <motion.div
              className="landing-glass pointer-events-none absolute bottom-[4.5rem] right-0 z-10 hidden max-w-[9.5rem] rounded-2xl border border-white/70 bg-white/95 px-3.5 py-2.5 shadow-lg md:block md:-right-3"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              aria-hidden
            >
              <p className="text-xs font-semibold leading-tight text-[#111827]">
                {t("landing", "aiPriceInsight")}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-[#374151]">
                {t("landing", "withinMarketBand")}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function DashboardMetric({
  icon: Icon,
  label,
  value,
  delta,
  accent,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  delta: string;
  accent: "teal" | "green" | "slate";
}) {
  const accentBg =
    accent === "green"
      ? "bg-[#22C55E]/10 text-[#22C55E]"
      : accent === "teal"
        ? "bg-[#0F766E]/10 text-[#0F766E]"
        : "bg-slate-100 text-[#374151]";

  return (
    <div className="rounded-2xl border border-slate-100/90 bg-white/70 p-3.5 backdrop-blur-sm transition-transform hover:-translate-y-0.5 dark:border-orange-500/20 dark:bg-[#1a1a1a]/90">
      <div className={`mb-2 inline-flex rounded-lg p-2 ${accentBg}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#374151]">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-[#111827]">{value}</p>
      <p className="text-[10px] font-semibold text-[#22C55E]">{delta}</p>
    </div>
  );
}
