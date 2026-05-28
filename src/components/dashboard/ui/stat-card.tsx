"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";

export type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon;
  gradient?: string;
  href?: string;
  sparkData?: number[];
};

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  gradient = "from-primary-500 to-teal-600",
  href,
  sparkData,
}: StatCardProps) {
  const positive = trend === undefined || trend >= 0;
  const inner = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[18px] border border-stone-200/80 bg-white p-5",
        "shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_rgba(28,25,23,0.06)]",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200/80 hover:shadow-[0_12px_32px_rgba(13,148,136,0.12)]",
        "dark:border-orange-500/20 dark:bg-[#121212] dark:hover:border-orange-500/40 dark:hover:shadow-[0_12px_32px_rgba(249,115,22,0.15)]",
        href && "cursor-pointer"
      )}
    >
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-[0.08] transition-transform duration-500 group-hover:scale-125",
          gradient
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md",
            gradient
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <Sparkline data={sparkData} strokeClassName="stroke-primary-400" />
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-stone-900 tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-stone-700">{title}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-stone-500">{subtitle}</p>
      )}
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5",
              positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {positive ? "+" : ""}
            {trend}%
          </span>
          {trendLabel && <span className="text-stone-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}
