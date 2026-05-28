"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { SectionReveal, fadeUp, staggerContainer } from "./motion";

const TESTIMONIAL_KEYS = [
  {
    name: "testimonial1Name",
    role: "testimonial1Role",
    quote: "testimonial1Quote",
    initials: "ST",
  },
  {
    name: "testimonial2Name",
    role: "testimonial2Role",
    quote: "testimonial2Quote",
    initials: "DM",
  },
  {
    name: "testimonial3Name",
    role: "testimonial3Role",
    quote: "testimonial3Quote",
    initials: "AO",
  },
] as const;

export function LandingTestimonials() {
  const { t } = useLanguage();

  return (
    <section id="testimonials" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0F766E]">
            {t("landing", "testimonialsKicker")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
            {t("landing", "testimonialsHeadline")}
          </h2>
        </SectionReveal>

        <motion.div
          className="mt-14 grid gap-6 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {TESTIMONIAL_KEYS.map((item) => (
            <motion.blockquote
              key={item.name}
              variants={fadeUp}
              className="flex flex-col rounded-[20px] border border-slate-200/80 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-orange-500/20 dark:bg-[#141414] dark:hover:shadow-orange-900/20"
            >
              <Quote className="h-8 w-8 text-[#14B8A6]/40" aria-hidden />
              <div className="mt-3 flex gap-0.5" aria-label="5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="mt-4 flex-1 leading-relaxed text-[#374151]">
                &ldquo;{t("landing", item.quote)}&rdquo;
              </p>
              <footer className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-sm font-bold text-white">
                  {item.initials}
                </div>
                <div>
                  <cite className="not-italic font-semibold text-[#111827]">
                    {t("landing", item.name)}
                  </cite>
                  <p className="text-xs text-[#374151]">{t("landing", item.role)}</p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
