"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Bell,
  UserCircle,
  LogOut,
  Globe,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { apiGetUnreadCount, getAccessToken } from "@/lib/api";
import { cn, getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { getMainNavForRole } from "@/components/dashboard/dashboard-nav-config";

export function DashboardTopBar() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLanguage();
  const { user, logout } = useAuth();
  const role = user?.role || "tenant";

  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  const mainNav = getMainNavForRole(role);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;
    const fetch = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const count = await apiGetUnreadCount(token);
        if (active) setUnread(count);
      } catch {
        /* ignore */
      }
    };
    void fetch();
    const id = window.setInterval(fetch, 30_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const labelFor = (labelKey: string) => t("nav", labelKey);

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" &&
      href !== "/explore" &&
      pathname.startsWith(href));

  const signOut = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-xl dark:border-orange-500/15 dark:bg-black/85">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:gap-4">
        <Link
          href="/dashboard"
          className="group flex shrink-0 items-center gap-2"
          title={t("nav", "overview")}
          aria-label={`${t("landing", "brand")}${t("landing", "brandAccent")} — ${t("nav", "overview")}`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-teal-600 shadow-sm transition-transform group-hover:scale-105 dark:from-orange-600 dark:to-orange-500">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="hidden font-bold text-sm text-stone-900 dark:text-stone-100 sm:inline">
            {t("landing", "brand")}
            <span className="text-primary-600 dark:text-orange-400">
              {t("landing", "brandAccent")}
            </span>
          </span>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto hide-scrollbar lg:flex"
          aria-label="Dashboard"
        >
          {mainNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.labelKey + item.href}
                href={item.href}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary-800 dark:bg-orange-500/15 dark:text-orange-300"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-zinc-900 dark:hover:text-orange-200"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active
                      ? "text-primary-600 dark:text-orange-400"
                      : "text-stone-400"
                  )}
                />
                <span className="whitespace-nowrap">{labelFor(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block shrink-0">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="md:hidden">
            <GlobalSearch />
          </div>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "am" : "en")}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-zinc-800"
            aria-label={t("common", "english")}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">
              {locale === "en" ? "አማ" : "EN"}
            </span>
          </button>

          <Link
            href="/dashboard/notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-zinc-800 dark:hover:text-orange-300"
            aria-label={t("nav", "notifications")}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
            )}
          </Link>

          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-stone-100 dark:hover:bg-zinc-800 sm:pr-3"
              aria-expanded={userOpen}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white dark:bg-orange-600">
                {user ? getInitials(`${user.firstName} ${user.lastName}`) : "?"}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="max-w-[7rem] truncate text-xs font-semibold text-stone-900 dark:text-stone-100">
                  {user?.firstName}
                </p>
                <p className="text-[10px] capitalize text-stone-500 dark:text-stone-400">
                  {t("roles", role)}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "hidden h-3.5 w-3.5 text-stone-400 sm:inline transition-transform",
                  userOpen && "rotate-180"
                )}
              />
            </button>
            {userOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl animate-fade-in-up dark:border-orange-500/20 dark:bg-[#141414]">
                <div className="mb-1 border-b border-stone-100 px-3 py-2.5 dark:border-orange-500/10">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-xs text-stone-500">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-zinc-800"
                >
                  <UserCircle className="h-4 w-4 text-stone-400 dark:text-orange-400" />
                  {t("nav", "profile")}
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <LogOut className="h-4 w-4" />
                  {t("nav", "signOut")}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100 lg:hidden dark:text-stone-200 dark:hover:bg-zinc-800"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="border-t border-stone-200 bg-white px-4 py-3 lg:hidden dark:border-orange-500/15 dark:bg-[#0a0a0a]"
          aria-label="Mobile dashboard"
        >
          <ul className="max-h-[60vh] space-y-0.5 overflow-y-auto scrollbar-thin">
            {mainNav.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.labelKey + item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-primary-50 text-primary-800 dark:bg-orange-500/15 dark:text-orange-300"
                        : "text-stone-600 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-zinc-900"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {labelFor(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
