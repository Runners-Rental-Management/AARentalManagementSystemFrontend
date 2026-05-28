"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import type { Locale } from "@/lib/i18n";

/** Segmented control — highlighted pill is the **active** language. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  const btn = (code: Locale, label: string) => (
    <button
      type="button"
      onClick={() => setLocale(code)}
      aria-pressed={locale === code}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        locale === code
          ? "bg-primary-700 text-white shadow-sm"
          : "text-stone-600 hover:bg-stone-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="group"
      aria-label="Language"
    >
      <Globe className="w-4 h-4 text-stone-500 shrink-0" aria-hidden />
      <div className="inline-flex p-0.5 rounded-lg border border-stone-200 bg-stone-50">
        {btn("en", "English")}
        {btn("am", "አማርኛ")}
      </div>
    </div>
  );
}
