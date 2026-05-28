"use client";

import { motion } from "framer-motion";
import { ClipboardList, FileSignature, Home, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { SectionReveal, fadeUp, staggerContainer } from "./motion";

const STEPS = [
  { step: "01", icon: ClipboardList, title: "stepRegister", desc: "stepRegisterDesc" },
  { step: "02", icon: ShieldCheck, title: "stepVerify", desc: "stepVerifyDesc" },
  { step: "03", icon: FileSignature, title: "stepSign", desc: "stepSignDesc" },
  { step: "04", icon: Home, title: "stepManage", desc: "stepManageDesc" },
] as const;

export function LandingHowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0F766E]">
            {t("landing", "howItWorksKicker")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
            {t("landing", "howItWorksHeadline")}
          </h2>
        </SectionReveal>

        <div className="relative mt-16">
          <div
            className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-[#14B8A6] via-[#0F766E]/40 to-transparent lg:left-1/2 lg:block"
            aria-hidden
          />

          <motion.ol
            className="space-y-10 lg:space-y-0"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {STEPS.map((item, index) => (
              <motion.li
                key={item.step}
                variants={fadeUp}
                className={`relative flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-12 ${
                  index % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div className={`lg:px-8 ${index % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                  <span className="text-sm font-bold text-[#14B8A6]">
                    {t("landing", "stepLabel")} {item.step}
                  </span>
                  <h3 className="mt-1 text-2xl font-bold text-[#111827]">
                    {t("landing", item.title)}
                  </h3>
                  <p className="mt-3 leading-relaxed text-[#374151]">
                    {t("landing", item.desc)}
                  </p>
                </div>

                <div className="flex items-center gap-4 lg:items-center">
                  <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white shadow-xl shadow-teal-800/20">
                    <item.icon className="h-7 w-7" aria-hidden />
                  </div>
                  <div className="hidden flex-1 rounded-2xl border border-dashed border-[#14B8A6]/30 bg-[#F8FAFC] p-6 lg:block">
                    <div className="h-2 w-24 rounded-full bg-[#14B8A6]/30" />
                    <div className="mt-3 h-2 w-full max-w-xs rounded-full bg-slate-200" />
                    <div className="mt-2 h-2 w-3/4 rounded-full bg-slate-100" />
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}
