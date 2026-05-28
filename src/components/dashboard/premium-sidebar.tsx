"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import {
  LayoutDashboard,
  Building2,
  FileText,
  BarChart3,
  Bell,
  Users,
  Settings,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ScrollText,
  Shield,
  Heart,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

const navItems = [
  { labelKey: "overview", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "landlord", "tenant"] },
  { labelKey: "myProperties", href: "/dashboard/properties", icon: Building2, roles: ["landlord"] },
  { labelKey: "myAgreements", href: "/dashboard/agreements", icon: FileText, roles: ["landlord", "tenant"] },
  { labelKey: "payments", href: "/dashboard/payments", icon: CreditCard, roles: ["landlord", "tenant"] },
  { labelKey: "favorites", href: "/dashboard/favorites", icon: Heart, roles: ["tenant"] },
  { labelKey: "userManagement", href: "/dashboard/admin/users", icon: Users, roles: ["admin"] },
  { labelKey: "systemParameters", href: "/dashboard/admin/parameters", icon: Settings, roles: ["admin"] },
  { labelKey: "auditLogs", href: "/dashboard/admin/audit-logs", icon: ScrollText, roles: ["admin"] },
  { labelKey: "rolesPermissions", href: "/dashboard/admin/roles", icon: Shield, roles: ["admin"] },
  { labelKey: "analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["admin"] },
  { labelKey: "notifications", href: "/dashboard/notifications", icon: Bell, roles: ["admin", "landlord", "tenant"] },
  { labelKey: "profile", href: "/dashboard/profile", icon: UserCircle, roles: ["admin", "landlord", "tenant"] },
];

type PremiumSidebarProps = {
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
};

export function PremiumSidebar({
  collapsed,
  onCollapsedChange,
}: PremiumSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const role = user?.role || "tenant";

  const filteredNav = navItems.filter((item) => item.roles.includes(role));
  const seen = new Set<string>();
  const deduped = filteredNav.filter((item) => {
    const key = item.labelKey + item.href;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const overviewLabelKey =
    role === "admin"
      ? "overviewAdmin"
      : role === "landlord"
        ? "overviewLandlord"
        : "overviewTenant";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-stone-200/80 bg-white/95 backdrop-blur-xl transition-all duration-300 ease-out dark:border-orange-500/15 dark:bg-[#0a0a0a]/98",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-stone-100 px-3 dark:border-orange-500/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 min-w-0 group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-teal-600 shadow-md transition-transform group-hover:scale-105 dark:from-orange-600 dark:to-orange-500 dark:shadow-orange-900/40">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
              {t("landing", "brand")}
              <span className="text-primary-600 dark:text-orange-400">{t("landing", "brandAccent")}</span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        <ul className="space-y-0.5">
          {deduped.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "/explore" &&
                pathname.startsWith(item.href));
            const label =
              item.labelKey === "overview"
                ? t("nav", overviewLabelKey)
                : t("nav", item.labelKey);
            return (
              <li key={item.labelKey + item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-50 text-primary-800 shadow-sm dark:bg-orange-500/15 dark:text-orange-300 dark:shadow-orange-900/20"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-zinc-900 dark:hover:text-orange-200",
                    collapsed && "justify-center px-0"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-600 dark:bg-orange-500" />
                  )}
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive ? "text-primary-600 dark:text-orange-400" : "text-stone-400 dark:text-zinc-500"
                    )}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-stone-100 p-2 space-y-1 dark:border-orange-500/10">
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-600"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">{t("nav", "collapse")}</span>
            </>
          )}
        </button>
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl p-2",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-teal-50 text-xs font-bold text-primary-800">
            {user ? getInitials(`${user.firstName} ${user.lastName}`) : "?"}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-stone-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-[10px] text-stone-500 capitalize">
                  {t("roles", role)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="text-stone-400 hover:text-rose-600 transition-colors"
                title={t("nav", "signOut")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
