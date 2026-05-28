"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivityItem = {
  id: string;
  title: string;
  meta?: string;
  href?: string;
  badge?: string;
  time?: string;
};

export type ActivitySection = {
  title: string;
  icon: LucideIcon;
  href?: string;
  viewAllLabel?: string;
  items: ActivityItem[];
  emptyLabel?: string;
};

type ActivitySidebarProps = {
  sections: ActivitySection[];
  className?: string;
};

export function ActivitySidebar({ sections, className }: ActivitySidebarProps) {
  return (
    <aside
      className={cn(
        "theme-panel flex flex-col gap-4 p-4 backdrop-blur-md",
        "border-stone-200/80 bg-white/80 dark:border-orange-500/20 dark:bg-[#121212]/95",
        className
      )}
    >
      {sections.map((section) => (
        <div key={section.title} className="rounded-2xl border border-stone-100 bg-stone-50/50 p-3 dark:border-orange-500/15 dark:bg-[#1a1a1a]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <section.icon className="h-4 w-4 text-primary-600 dark:text-orange-400" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-stone-700 dark:text-stone-300">
                {section.title}
              </h3>
            </div>
            {section.href && section.viewAllLabel && (
              <Link
                href={section.href}
                className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 dark:text-orange-400 dark:hover:text-orange-300"
              >
                {section.viewAllLabel}
              </Link>
            )}
          </div>
          <ul className="space-y-1">
            {section.items.length === 0 ? (
              <li className="px-2 py-3 text-xs text-stone-400">
                {section.emptyLabel ?? "—"}
              </li>
            ) : (
              section.items.map((item) => {
                const row = (
                  <div className="flex items-start justify-between gap-2 px-2 py-2 rounded-xl hover:bg-white dark:hover:bg-[#252525] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {item.title}
                      </p>
                      {item.meta && (
                        <p className="text-xs text-stone-500 truncate">{item.meta}</p>
                      )}
                    </div>
                    {item.badge && (
                      <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link href={item.href} className="block">
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ))}
    </aside>
  );
}
