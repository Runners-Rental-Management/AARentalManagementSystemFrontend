"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Globe,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", labelKey: "navFeatures" },
  { href: "#how-it-works", labelKey: "navHowItWorks" },
  { href: "#benefits", labelKey: "navBenefits" },
  { href: "#testimonials", labelKey: "navTestimonials" },
  { href: "#platform", labelKey: "navPlatform" },
] as const;

export function LandingNavbar() {
  const { t, locale, setLocale } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <nav
        className={cn(
          "border-b border-slate-200/60 bg-white/75 backdrop-blur-xl backdrop-saturate-150",
          "shadow-[0_1px_0_rgba(15,118,110,0.06)]",
          "dark:border-orange-500/15 dark:bg-black/80 dark:shadow-[0_1px_0_rgba(249,115,22,0.12)]",
        )}
        aria-label="Main navigation"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-xl py-1 pr-2 transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] shadow-lg shadow-teal-700/20 transition-transform group-hover:scale-105">
              <Building2 className="h-5 w-5 text-white" aria-hidden />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#111827] dark:text-stone-100">
              {t("landing", "brand")}
              <span className="text-[#0F766E] dark:text-orange-400">{t("landing", "brandAccent")}</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F766E]"
              >
                {t("landing", link.labelKey)}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "am" : "en")}
              className="hidden items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm font-medium text-[#374151] transition-all hover:border-[#14B8A6]/40 hover:text-[#0F766E] sm:flex"
            >
              <Globe className="h-4 w-4" aria-hidden />
              {locale === "en" ? t("common", "amharic") : t("common", "english")}
            </button>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-800/20 transition-all hover:bg-[#115e59] hover:shadow-lg"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t("common", "dashboard")}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-xl px-3 py-2.5 text-sm font-medium text-[#374151] transition-colors hover:text-[#0F766E] sm:inline-block"
                >
                  {t("landing", "signIn")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#0F766E] to-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/25 transition-all hover:shadow-xl hover:brightness-105"
                >
                  {t("landing", "register")}
                </Link>
              </>
            )}

            <button
              type="button"
              className="inline-flex rounded-xl border border-slate-200 p-2.5 text-[#374151] lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? t("common", "closeMenu") : t("common", "openMenu")}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl lg:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-[#374151] hover:bg-[#F8FAFC] hover:text-[#0F766E]"
                  >
                    {t("landing", link.labelKey)}
                  </a>
                ))}
                <Link
                  href="/explore"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-[#374151] hover:bg-[#F8FAFC]"
                >
                  {t("landing", "explore")}
                </Link>
                {!isAuthenticated && (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-[#374151]"
                  >
                    {t("landing", "signIn")}
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
