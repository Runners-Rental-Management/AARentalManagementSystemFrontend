"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  FileText,
  Search,
  User,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

const RECENT_KEY = "aa_rental_recent_searches";

type SearchHit = {
  id: string;
  type: "property" | "agreement" | "tenant" | "payment";
  title: string;
  meta?: string;
  href: string;
};

type GlobalSearchProps = {
  hits?: SearchHit[];
  className?: string;
};

export function GlobalSearch({ hits = [], className }: GlobalSearchProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hits.slice(0, 8);
    return hits
      .filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          (h.meta?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 8);
  }, [hits, query]);

  const saveRecent = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const iconFor = (type: SearchHit["type"]) => {
    switch (type) {
      case "property":
        return Building2;
      case "agreement":
        return FileText;
      case "tenant":
        return User;
      case "payment":
        return CreditCard;
    }
  };

  const go = (hit: SearchHit) => {
    saveRecent(hit.title);
    setOpen(false);
    setQuery("");
    router.push(hit.href);
  };

  return (
    <div className={cn("relative", className)} ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="hidden md:flex items-center gap-2 min-w-[200px] lg:min-w-[280px] rounded-2xl border border-stone-200 bg-stone-50/80 px-3.5 py-2 text-sm text-stone-500 hover:border-primary-200 hover:bg-white transition-colors dark:border-orange-500/20 dark:bg-[#141414] dark:text-stone-400 dark:hover:border-orange-500/40 dark:hover:bg-[#1a1a1a]"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">
          {t("dashboardUi", "searchPlaceholder")}
        </span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded-md border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-stone-400">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
        aria-label={t("dashboardUi", "searchPlaceholder")}
      >
        <Search className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-stone-900/20 backdrop-blur-sm p-4 pt-[12vh] dark:bg-black/60 md:absolute md:inset-auto md:left-0 md:top-full md:mt-2 md:block md:bg-transparent md:backdrop-blur-none md:p-0">
          <div className="w-full max-w-lg rounded-[20px] border border-stone-200 bg-white shadow-2xl animate-fade-in-up overflow-hidden md:max-w-md dark:border-orange-500/20 dark:bg-[#121212]">
            <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3">
              <Search className="h-4 w-4 text-stone-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("dashboardUi", "searchPlaceholder")}
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <kbd className="text-[10px] text-stone-400">esc</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length > 0 ? (
                <ul>
                  {filtered.map((hit) => {
                    const Icon = iconFor(hit.type);
                    return (
                      <li key={hit.id}>
                        <button
                          type="button"
                          onClick={() => go(hit)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-stone-50"
                        >
                          <Icon className="h-4 w-4 text-primary-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-stone-900 truncate">
                              {hit.title}
                            </p>
                            {hit.meta && (
                              <p className="text-xs text-stone-500 truncate">
                                {hit.meta}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : query ? (
                <p className="px-3 py-6 text-center text-sm text-stone-500">
                  {t("dashboardUi", "noSearchResults")}
                </p>
              ) : recent.length > 0 ? (
                <div>
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {t("dashboardUi", "recentSearches")}
                  </p>
                  {recent.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setQuery(r)}
                      className="block w-full px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 rounded-lg"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-6 text-center text-sm text-stone-500">
                  {t("dashboardUi", "searchHint")}
                </p>
              )}
            </div>
            <div className="border-t border-stone-100 px-4 py-2 flex gap-3 text-[10px] text-stone-400">
              <Link href="/explore" onClick={() => setOpen(false)} className="hover:text-primary-600">
                {t("nav", "browseProperties")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
