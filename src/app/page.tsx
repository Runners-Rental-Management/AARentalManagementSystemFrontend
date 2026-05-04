"use client";

import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  Globe,
} from "lucide-react";
import { LandingPlatformSections } from "@/components/landing-platform-sections";

export default function LandingPage() {
  const { t, locale, setLocale } = useLanguage();

  const stats = [
    { valueKey: "stat1Value", labelKey: "stat1Label" },
    { valueKey: "stat2Value", labelKey: "stat2Label" },
    { valueKey: "stat3Value", labelKey: "stat3Label" },
    { valueKey: "stat4Value", labelKey: "stat4Label" },
  ];

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">
                {t("landing", "brand")}
                <span className="text-primary-600">{t("landing", "brandAccent")}</span>
              </span>
            </Link>

            <div className="flex flex-1 items-center justify-center md:absolute md:left-1/2 md:-translate-x-1/2">
              <Link
                href="/explore"
                className="text-sm text-slate-700 hover:text-primary-600 transition-colors font-semibold px-4 py-2 rounded-full hover:bg-primary-50"
              >
                {t("landing", "explore")}
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setLocale(locale === "en" ? "am" : "en")}
                className="text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors px-2 sm:px-3 py-2 border border-slate-200 rounded-lg flex items-center gap-1.5"
                type="button"
              >
                <Globe className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{locale === "en" ? "አማርኛ" : "English"}</span>
              </button>
              <Link
                href="/login"
                className="hidden sm:inline text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors px-3 py-2"
              >
                {t("landing", "signIn")}
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              >
                {t("landing", "register")}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4" />
              {t("landing", "badge")}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              {t("landing", "heroTitle1")}{" "}
              <span className="text-primary-600">{t("landing", "heroTitle2")}</span>
            </h1>
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t("landing", "heroDescription")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-8 py-3.5 rounded-xl transition-colors text-base"
              >
                {t("landing", "explore")}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-300 hover:border-primary-300 text-slate-700 font-medium px-8 py-3.5 rounded-xl transition-colors text-base"
              >
                {t("landing", "getStarted")}
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-slate-700 hover:text-primary-700 font-medium px-4 py-3.5 transition-colors text-base"
              >
                {t("landing", "signInDashboard")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.labelKey} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary-700 mb-1">
                  {t("landing", stat.valueKey)}
                </div>
                <div className="text-sm text-slate-500">{t("landing", stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingPlatformSections />

      <section className="py-20 bg-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t("landing", "ctaTitle")}</h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">{t("landing", "ctaDescription")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-colors"
            >
              {t("landing", "explore")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 border-2 border-white/80 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              {t("landing", "ctaButton")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">
                {t("landing", "brand")}
                {t("landing", "brandAccent")}
              </span>
            </div>
            <p className="text-sm text-center">{t("landing", "footerUniversity")}</p>
            <p className="text-sm">{t("landing", "footerRights")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}