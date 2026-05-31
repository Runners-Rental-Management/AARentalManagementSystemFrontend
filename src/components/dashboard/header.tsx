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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t("common", "search")}
            className="bg-transparent text-sm outline-none flex-1 text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <Link
          href="/dashboard/notifications"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
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
