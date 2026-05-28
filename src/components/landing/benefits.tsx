"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Lock, Shield, Zap } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { SectionReveal, fadeUp } from "./motion";

const HIGHLIGHTS = [
  { icon: Shield, title: "benefitComplianceTitle", desc: "benefitComplianceDesc" },
  { icon: BarChart3, title: "benefitIntelTitle", desc: "benefitIntelDesc" },
  { icon: Lock, title: "benefitSecureTitle", desc: "benefitSecureDesc" },
  { icon: Zap, title: "benefitFastTitle", desc: "benefitFastDesc" },
] as const;

const PROGRESS_LABELS = [
  "tenantProtection",
  "landlordTransparency",
  "authorityOversight",
] as const;

export function LandingBenefits() {
  const { t } = useLanguage();

  return (
    <section id="benefits" className="scroll-mt-24 bg-[#111827] py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <SectionReveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#14B8A6]">
              {t("landing", "benefitsKicker")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("landing", "benefitsHeadline")}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-300">
              {t("landing", "benefitsBody")}
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#14B8A6] px-6 py-3.5 text-sm font-semibold text-[#111827] transition-all hover:bg-[#2dd4bf]"
            >
              {t("landing", "startYourAccount")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </SectionReveal>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="landing-glass-dark relative overflow-hidden rounded-[24px] border border-white/10 p-8">
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#14B8A6]/20 blur-3xl" />
              <div className="relative space-y-2">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="mt-6 space-y-4">
                  {PROGRESS_LABELS.map((labelKey, i) => (
                    <motion.div
                      key={labelKey}
                      className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3"
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
                      <span className="text-sm font-medium">{t("landing", labelKey)}</span>
                      <div className="ml-auto h-1.5 max-w-[100px] flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0F766E] to-[#14B8A6]"
                          style={{ width: `${85 - i * 12}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 grid gap-5 sm:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {HIGHLIGHTS.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="rounded-[20px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <item.icon className="h-6 w-6 text-[#14B8A6]" aria-hidden />
              <h3 className="mt-4 font-bold text-white">{t("landing", item.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {t("landing", item.desc)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
