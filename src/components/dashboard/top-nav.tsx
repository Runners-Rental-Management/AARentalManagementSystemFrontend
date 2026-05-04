"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  FileText,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Bell,
  Users,
  ShieldCheck,
  UserCircle,
  LogOut,
  Globe,
  CreditCard,
  Settings,
  ScrollText,
  Shield,
  Gavel,
  Menu,
  X,
  ChevronDown,
  Search,
  Heart,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useFavorites } from "@/context/favorites-context";
import { useRentalFlow, type NotifRecipient } from "@/context/rental-flow-context";
import { notifications } from "@/lib/dummy-data";
import { cn, getInitials } from "@/lib/utils";

type NavItem = {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Array<"admin" | "landlord" | "tenant" | "dara_agent">;
};

type NavRole = NavItem["roles"][number];

function toNavRole(role: string | undefined): NavRole {
  if (role === "admin" || role === "landlord" || role === "tenant" || role === "dara_agent") {
    return role;
  }
  if (role === "system_admin") return "admin";
  return "tenant";
}

const ALL_ITEMS: NavItem[] = [
  { labelKey: "favorites", href: "/dashboard/favorites", icon: Heart, roles: ["tenant"] },
  { labelKey: "myAgreements", href: "/dashboard/agreements", icon: FileText, roles: ["tenant"] },
  { labelKey: "disputes", href: "/dashboard/disputes", icon: AlertTriangle, roles: ["tenant"] },
  { labelKey: "payments", href: "/dashboard/payments", icon: CreditCard, roles: ["tenant"] },
  { labelKey: "analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["dara_agent", "admin"] },
  { labelKey: "userManagement", href: "/dashboard/admin/users", icon: Users, roles: ["admin"] },
  { labelKey: "systemParameters", href: "/dashboard/admin/parameters", icon: Settings, roles: ["admin"] },
  { labelKey: "auditLogs", href: "/dashboard/admin/audit-logs", icon: ScrollText, roles: ["admin"] },
  { labelKey: "rolesPermissions", href: "/dashboard/admin/roles", icon: Shield, roles: ["admin"] },
  { labelKey: "verifyAgreements", href: "/dashboard/admin/verifications", icon: ShieldCheck, roles: ["dara_agent"] },
  { labelKey: "reviewViolations", href: "/dashboard/disputes", icon: AlertTriangle, roles: ["dara_agent"] },
  { labelKey: "approveRentAdjustment", href: "/dashboard/rent-adjustment", icon: TrendingUp, roles: ["dara_agent"] },
  { labelKey: "penaltyNotices", href: "/dashboard/penalty-notices", icon: Gavel, roles: ["dara_agent"] },
];

// Per-role primary nav shown inline (overflow goes into "More")
const PRIMARY: Record<string, string[]> = {
  tenant: ["favorites", "myAgreements", "payments", "disputes"],
  admin: ["analytics", "userManagement", "systemParameters", "auditLogs", "rolesPermissions"],
  dara_agent: ["analytics", "verifyAgreements", "reviewViolations", "approveRentAdjustment", "penaltyNotices"],
};

export function TopNav() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLanguage();
  const { user, logout } = useAuth();
  const { count: favCount } = useFavorites();
  const role = toNavRole(user?.role);

  const { unreadFor } = useRentalFlow();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
    setUserOpen(false);
  }, [pathname]);

  const roleItems = ALL_ITEMS.filter((i) => i.roles.includes(role));
  const primaryKeys = PRIMARY[role] ?? [];
  const primaryItems = primaryKeys
    .map((k) => roleItems.find((i) => i.labelKey === k))
    .filter(Boolean) as NavItem[];
  const secondaryItems = roleItems.filter((i) => !primaryKeys.includes(i.labelKey));

  const staticUnread = notifications.filter((n) => !n.isRead).length;
  const liveRole: NotifRecipient =
    role === "landlord" ? "landlord" : role === "dara_agent" ? "dara_agent" : "tenant";
  const unread = staticUnread + unreadFor(liveRole);

  const labelFor = (item: NavItem) => t("nav", item.labelKey);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 inset-x-0 z-40 transition-all duration-300",
          scrolled
            ? "bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm"
            : "bg-white border-b border-slate-200"
        )}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 lg:gap-8">
              <Link
                href={role === "admin" || role === "dara_agent" ? "/dashboard/analytics" : "/dashboard"}
                className="flex items-center gap-2 group shrink-0"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-base text-slate-900 hidden sm:inline">
                  {t("landing", "brand")}
                  <span className="text-primary-600">{t("landing", "brandAccent")}</span>
                </span>
              </Link>

              {/* Primary links (desktop) */}
              <div className="hidden lg:flex items-center gap-1">
                {primaryItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.labelKey + item.href}
                      href={item.href}
                      className={cn(
                        "relative px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-200 inline-flex items-center gap-2",
                        active
                          ? "text-primary-700 bg-primary-50"
                          : "text-slate-600 hover:text-primary-700 hover:bg-slate-100"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 transition-transform",
                          item.labelKey === "favorites" && favCount > 0
                            ? "text-rose-500 fill-rose-500"
                            : active
                              ? "text-primary-600"
                              : "text-slate-400"
                        )}
                      />
                      <span>{labelFor(item)}</span>
                      {item.labelKey === "favorites" && favCount > 0 && (
                        <span className="ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm">
                          {favCount}
                        </span>
                      )}
                      {active && (
                        <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-gradient-to-r from-primary-500 to-indigo-500" />
                      )}
                    </Link>
                  );
                })}

                {/* More dropdown */}
                {secondaryItems.length > 0 && (
                  <div className="relative" ref={moreRef}>
                    <button
                      onClick={() => setMoreOpen((v) => !v)}
                      className="px-3.5 py-2 text-sm font-medium rounded-full transition-colors inline-flex items-center gap-1.5 text-slate-600 hover:text-primary-700 hover:bg-slate-100"
                    >
                      More
                      <ChevronDown
                        className={cn("w-3.5 h-3.5 transition-transform", moreOpen && "rotate-180")}
                      />
                    </button>
                    {moreOpen && (
                      <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 animate-fade-in-up">
                        {secondaryItems.map((item) => {
                          const active = isActive(item.href);
                          return (
                            <Link
                              key={item.labelKey + item.href}
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                active
                                  ? "bg-primary-50 text-primary-700"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              )}
                            >
                              <item.icon
                                className={cn(
                                  "w-4 h-4",
                                  active ? "text-primary-600" : "text-slate-400"
                                )}
                              />
                              <span className="truncate">{labelFor(item)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search (decorative, no functionality yet) */}
              <button
                className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Language */}
              <button
                onClick={() => setLocale(locale === "en" ? "am" : "en")}
                className="inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3 rounded-full text-sm font-medium text-slate-600 hover:text-primary-700 hover:bg-slate-100 transition-colors gap-1.5"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{locale === "en" ? "አማ" : "EN"}</span>
              </button>

              {/* Notifications */}
              <Link
                href="/dashboard/notifications"
                className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500">
                    <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
                  </span>
                )}
              </Link>

              {/* Avatar menu */}
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className="group flex items-center gap-2 p-1 pr-2 sm:pr-3 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                    {user ? getInitials(`${user.firstName} ${user.lastName}`) : "?"}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <div className="text-xs font-semibold text-slate-900 truncate max-w-[8rem]">
                      {user?.firstName}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">{t("roles", role)}</div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-slate-400 hidden sm:inline transition-transform",
                      userOpen && "rotate-180"
                    )}
                  />
                </button>
                {userOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 animate-fade-in-up">
                    <div className="p-3 mb-1 border-b border-slate-100">
                      <div className="font-semibold text-slate-900 text-sm">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <UserCircle className="w-4 h-4 text-slate-400" />
                      {t("nav", "profile")}
                    </Link>
                    <Link
                      href="/dashboard/notifications"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Bell className="w-4 h-4 text-slate-400" />
                      {t("nav", "notifications")}
                      {unread > 0 && (
                        <span className="ml-auto text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                          {unread}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={() => {
                        const isAuthority =
                          role === "admin" || role === "dara_agent";
                        logout();
                        window.location.href = isAuthority
                          ? "/authority/login"
                          : "/login";
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("nav", "signOut")}
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white animate-fade-in-up">
            <div className="max-w-[1400px] mx-auto px-4 py-3 space-y-1">
              {[...primaryItems, ...secondaryItems].map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.labelKey + item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-primary-50 text-primary-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4",
                        item.labelKey === "favorites" && favCount > 0
                          ? "text-rose-500 fill-rose-500"
                          : active
                            ? "text-primary-600"
                            : "text-slate-400"
                      )}
                    />
                    <span className="flex-1">{labelFor(item)}</span>
                    {item.labelKey === "favorites" && favCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white">
                        {favCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
