"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function LandingFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-200 bg-white py-14 dark:border-orange-500/15 dark:bg-[#050505]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6]">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-[#111827]">
              {t("landing", "brand")}
              <span className="text-[#0F766E]">{t("landing", "brandAccent")}</span>
            </span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-[#374151]" aria-label="Footer">
            <a href="#features" className="hover:text-[#0F766E]">
              {t("landing", "navFeatures")}
            </a>
            <a href="#how-it-works" className="hover:text-[#0F766E]">
              {t("landing", "navHowItWorks")}
            </a>
            <Link href="/explore" className="hover:text-[#0F766E]">
              {t("landing", "explore")}
            </Link>
            <Link href="/login" className="hover:text-[#0F766E]">
              {t("landing", "signIn")}
            </Link>
            <Link href="/register" className="font-semibold text-[#0F766E]">
              {t("landing", "register")}
            </Link>
          </nav>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-8 text-center text-sm text-[#374151]">
          <p>{t("landing", "footerUniversity")}</p>
          <p className="mt-2">{t("landing", "footerRights")}</p>
        </div>
      </div>
    </footer>
  );
}
