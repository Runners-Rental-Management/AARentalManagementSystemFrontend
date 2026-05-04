"use client";

import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import {
  Building2,
  ShieldCheck,
  FileText,
  BarChart3,
  Scale,
  Bell,
  Users,
  ArrowRight,
  CheckCircle2,
  Globe,
} from "lucide-react";

export default function LandingPage() {
  const { t, locale, setLocale } = useLanguage();

  const features = [
    { icon: FileText, titleKey: "feature1Title", descKey: "feature1Desc" },
    { icon: Building2, titleKey: "feature2Title", descKey: "feature2Desc" },
    { icon: Scale, titleKey: "feature3Title", descKey: "feature3Desc" },
    { icon: BarChart3, titleKey: "feature4Title", descKey: "feature4Desc" },
    { icon: ShieldCheck, titleKey: "feature5Title", descKey: "feature5Desc" },
    { icon: Bell, titleKey: "feature6Title", descKey: "feature6Desc" },
  ];

  const stats = [
    { valueKey: "stat1Value", labelKey: "stat1Label" },
    { valueKey: "stat2Value", labelKey: "stat2Label" },
    { valueKey: "stat3Value", labelKey: "stat3Label" },
    { valueKey: "stat4Value", labelKey: "stat4Label" },
  ];

  const stakeholders = [
    {
      roleKey: "tenants",
      benefits: ["tenantBenefit1", "tenantBenefit2", "tenantBenefit3", "tenantBenefit4"],
    },
    {
      roleKey: "landlords",
      benefits: ["landlordBenefit1", "landlordBenefit2", "landlordBenefit3", "landlordBenefit4"],
    },
    {
      roleKey: "government",
      benefits: ["govBenefit1", "govBenefit2", "govBenefit3", "govBenefit4"],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">
                {t("landing", "brand")}
                <span className="text-primary-600">{t("landing", "brandAccent")}</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/explore" className="text-sm text-slate-600 hover:text-primary-600 transition-colors font-medium">
                {t("landing", "explore")}
              </Link>
              <a href="#features" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">
                {t("landing", "featuresTitle")}
              </a>
              <a href="#stakeholders" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">
                {t("landing", "stakeholdersTitle")}
              </a>
              <a href="#about" className="text-sm text-slate-600 hover:text-primary-600 transition-colors">
                {t("landing", "aboutTitle")}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocale(locale === "en" ? "am" : "en")}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5"
              >
                <Globe className="w-4 h-4" />
                {locale === "en" ? "አማርኛ" : "English"}
              </button>
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors px-4 py-2">
                {t("landing", "signIn")}
              </Link>
              <Link href="/register" className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-5 py-2.5 rounded-lg transition-colors">
                {t("landing", "register")}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
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
              <Link href="/explore" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-8 py-3.5 rounded-xl transition-colors text-base">
                {t("landing", "explore")}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-300 hover:border-primary-300 text-slate-700 font-medium px-8 py-3.5 rounded-xl transition-colors text-base">
                {t("landing", "getStarted")}
              </Link>
              <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-slate-700 hover:text-primary-700 font-medium px-4 py-3.5 transition-colors text-base">
                {t("landing", "signInDashboard")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
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

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t("landing", "featuresTitle")}</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">{t("landing", "featuresDescription")}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.titleKey} className="p-6 rounded-2xl border border-slate-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300 group">
                <div className="w-12 h-12 bg-primary-100 group-hover:bg-primary-600 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{t("landing", feature.titleKey)}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{t("landing", feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stakeholders */}
      <section id="stakeholders" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t("landing", "stakeholdersTitle")}</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">{t("landing", "stakeholdersDescription")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {stakeholders.map((s) => (
              <div key={s.roleKey} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-6 h-6 text-primary-600" />
                  <h3 className="text-xl font-bold text-slate-900">{t("landing", s.roleKey)}</h3>
                </div>
                <ul className="space-y-3">
                  {s.benefits.map((bKey) => (
                    <li key={bKey} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      {t("landing", bKey)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">{t("landing", "aboutTitle")}</h2>
          <p className="text-slate-600 leading-relaxed mb-6">{t("landing", "aboutP1")}</p>
          <p className="text-slate-600 leading-relaxed">{t("landing", "aboutP2")}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t("landing", "ctaTitle")}</h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">{t("landing", "ctaDescription")}</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-colors">
            {t("landing", "ctaButton")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">
                {t("landing", "brand")}{t("landing", "brandAccent")}
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
