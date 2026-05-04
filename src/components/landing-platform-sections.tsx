"use client";

import {
  Building2,
  ShieldCheck,
  FileText,
  BarChart3,
  Scale,
  Bell,
  Users,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";

/** Full-width sections for the landing page (features, stakeholders, about). */
export function LandingPlatformSections() {
  const { t } = useLanguage();

  const features = [
    { icon: FileText, titleKey: "feature1Title", descKey: "feature1Desc" },
    { icon: Building2, titleKey: "feature2Title", descKey: "feature2Desc" },
    { icon: Scale, titleKey: "feature3Title", descKey: "feature3Desc" },
    { icon: BarChart3, titleKey: "feature4Title", descKey: "feature4Desc" },
    { icon: ShieldCheck, titleKey: "feature5Title", descKey: "feature5Desc" },
    { icon: Bell, titleKey: "feature6Title", descKey: "feature6Desc" },
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
    <>
      <section id="features" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t("landing", "featuresTitle")}</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">{t("landing", "featuresDescription")}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.titleKey}
                className="p-6 rounded-2xl border border-slate-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-primary-100 group-hover:bg-primary-600 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {t("landing", feature.titleKey)}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{t("landing", feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stakeholders" className="py-20 bg-slate-50 scroll-mt-20">
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

      <section id="about" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">{t("landing", "aboutTitle")}</h2>
          <p className="text-slate-600 leading-relaxed mb-6">{t("landing", "aboutP1")}</p>
          <p className="text-slate-600 leading-relaxed">{t("landing", "aboutP2")}</p>
        </div>
      </section>
    </>
  );
}
