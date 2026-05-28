"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageHeaderProps = {
  greeting?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  dateLabel?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  greeting,
  title,
  subtitle,
  badge,
  dateLabel,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {greeting && (
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{greeting}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-[1.75rem]">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>
        )}
        {dateLabel && (
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-stone-400">
            {dateLabel}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
}
