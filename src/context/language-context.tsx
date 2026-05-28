"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { type Locale, type TranslationKeys, translations } from "@/lib/i18n";
import { i18nExtensions } from "@/lib/i18n-extensions";

const LOCALE_STORAGE_KEY = "aa_rental_locale";

type MergedTranslations = typeof translations.en & typeof i18nExtensions.en;

function mergeTranslations(locale: Locale): MergedTranslations {
  const base = translations[locale];
  const extra = i18nExtensions[locale];
  const merged = { ...base } as Record<string, Record<string, string>>;

  for (const section of Object.keys(extra) as Array<keyof typeof extra>) {
    merged[section] = {
      ...(merged[section] ?? {}),
      ...extra[section],
    };
  }

  return merged as MergedTranslations;
}

const mergedTranslations: Record<Locale, MergedTranslations> = {
  en: mergeTranslations("en"),
  am: mergeTranslations("am"),
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (section: keyof MergedTranslations, key: string) => string;
  /** Replace `{name}` placeholders in translated strings. */
  tVar: (
    section: keyof MergedTranslations,
    key: string,
    vars: Record<string, string | number>,
  ) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  formatStatus: (status: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function resolveTranslation(
  locale: Locale,
  section: keyof MergedTranslations,
  key: string,
): string {
  const sectionObj = mergedTranslations[locale]?.[section] as
    | Record<string, string>
    | undefined;

  if (sectionObj && key in sectionObj) {
    return sectionObj[key];
  }

  const fallbackSection = mergedTranslations.en[section] as
    | Record<string, string>
    | undefined;

  if (fallbackSection && key in fallbackSection) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[i18n] Missing "${locale}.${String(section)}.${key}" — using English fallback`,
      );
    }
    return fallbackSection[key];
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(`[i18n] Missing translation key: ${String(section)}.${key}`);
  }

  return fallbackSection?.[key] ?? key;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === "en" || stored === "am") {
        setLocaleState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "am" ? "am" : "en";
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "am" ? "am" : "en";
    }
  }, [locale]);

  const t = useCallback(
    (section: keyof MergedTranslations, key: string): string => {
      return resolveTranslation(locale, section, key);
    },
    [locale],
  );

  const tVar = useCallback(
    (
      section: keyof MergedTranslations,
      key: string,
      vars: Record<string, string | number>,
    ): string => {
      let text = resolveTranslation(locale, section, key);
      for (const [name, val] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(val));
      }
      return text;
    },
    [locale],
  );

  const formatCurrency = useCallback(
    (amount: number) => {
      const loc = locale === "am" ? "am-ET" : "en-ET";
      return new Intl.NumberFormat(loc, {
        style: "currency",
        currency: "ETB",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    },
    [locale],
  );

  const formatDate = useCallback(
    (dateString: string) => {
      const loc = locale === "am" ? "am-ET" : "en-GB";
      return new Date(dateString).toLocaleDateString(loc, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    [locale],
  );

  const formatStatus = useCallback(
    (status: string) => {
      const key = status as keyof TranslationKeys["statuses"];
      const translated = resolveTranslation(locale, "statuses", key);
      if (translated !== key) return translated;
      return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      tVar,
      formatCurrency,
      formatDate,
      formatStatus,
    }),
    [locale, setLocale, t, tVar, formatCurrency, formatDate, formatStatus],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
