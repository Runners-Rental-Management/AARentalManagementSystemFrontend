"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const toggle = () => setTheme(isDark ? "light" : "dark");

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white/80 text-stone-500",
          className
        )}
        aria-label={t("theme", "toggle")}
        disabled
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl border transition-all duration-300",
        "border-stone-200/80 bg-white/80 text-stone-600 hover:border-orange-400/40 hover:bg-orange-50/50 hover:text-orange-700",
        "dark:border-orange-500/25 dark:bg-zinc-900/90 dark:text-orange-400 dark:hover:border-orange-500/50 dark:hover:bg-orange-500/10 dark:hover:text-orange-300",
        showLabel ? "h-9 px-3" : "h-9 w-9",
        className
      )}
      aria-label={isDark ? t("theme", "dayMode") : t("theme", "nightMode")}
      title={isDark ? t("theme", "dayMode") : t("theme", "nightMode")}
    >
      {isDark ? (
        <Sun className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <Moon className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {showLabel && (
        <span className="text-sm font-medium hidden sm:inline">
          {isDark ? t("theme", "dayMode") : t("theme", "nightMode")}
        </span>
      )}
    </button>
  );
}
