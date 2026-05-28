"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  gradient?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  gradient = "from-primary-500/20 via-teal-400/10 to-transparent",
}: EmptyStateProps) {
  const action =
    actionLabel &&
    (actionHref ? (
      <Link
        href={actionHref}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-700 dark:bg-orange-600 dark:hover:bg-orange-500"
      >
        {actionLabel}
      </Link>
    ) : onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-700 dark:bg-orange-600 dark:hover:bg-orange-500"
      >
        {actionLabel}
      </button>
    ) : null);

  return (
    <div
      className={cn(
        "theme-panel relative flex flex-col items-center justify-center border border-dashed border-stone-200 bg-white px-8 py-14 text-center dark:border-orange-500/25 dark:bg-[#121212]",
        className
      )}
    >
      <div
        className={cn(
          "mb-5 flex h-20 w-20 items-center justify-center rounded-[20px] bg-gradient-to-br",
          gradient
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-[#1a1a1a]">
          <Icon className="h-7 w-7 text-primary-600 dark:text-orange-400" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500 dark:text-stone-400">
        {description}
      </p>
      {action}
    </div>
  );
}
