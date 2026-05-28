"use client";

import { Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type FilterBarProps = {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
  onExport?: () => void;
  exportLabel?: string;
  className?: string;
};

export function FilterBar({
  searchPlaceholder = "Search…",
  searchValue,
  onSearchChange,
  filters,
  actions,
  onExport,
  exportLabel = "Export",
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="flex min-w-[200px] flex-1 max-w-md items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-500/10 dark:border-orange-500/20 dark:bg-[#141414] dark:focus-within:border-orange-500/50 dark:focus-within:ring-orange-500/20">
          <Search className="h-4 w-4 shrink-0 text-stone-400" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </div>
        {filters}
      </div>
      <div className="flex items-center gap-2">
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 dark:border-orange-500/20 dark:bg-[#141414] dark:text-stone-300 dark:hover:bg-[#1f1f1f]"
          >
            <Download className="h-4 w-4" />
            {exportLabel}
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
