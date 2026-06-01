"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { notifications } from "@/lib/dummy-data";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";

export function Header({ title }: { title: string }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;
  const authorityUi = role === "admin";
  if (authorityUi) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-14 bg-surface-elevated/80 backdrop-blur-sm border-b border-stone-200/80 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-stone-900 tracking-tight">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-stone-100/80 rounded-lg px-3 py-2 w-64 border border-stone-200/60">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder={t("common", "search")}
            className="bg-transparent text-sm outline-none flex-1 text-stone-700 placeholder:text-stone-400"
          />
        </div>
        <Link
          href="/dashboard/notifications"
          className="relative p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
