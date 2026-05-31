"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import {
  LayoutDashboard,
  Building2,
  FileText,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  DollarSign,
  Bell,
  Users,
  ShieldCheck,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
  CreditCard,
  FolderOpen,
  Settings,
  ScrollText,
  Shield,
  Gavel,
  UserSearch,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getInitials } from "@/lib/utils";

const navItems = [
  // -- Dashboard (all roles) --
  {
    labelKey: "overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "landlord", "tenant", "dara_agent"],
  },

  // -- Tenant: Browse Properties --
  {
    labelKey: "browseProperties",
    href: "/dashboard/properties",
    icon: Building2,
    roles: ["tenant"],
  },

  // -- Landlord: Register Property / My Properties --
  {
    labelKey: "myProperties",
    href: "/dashboard/properties",
    icon: Building2,
    roles: ["landlord"],
  },

  // -- Landlord: Find tenant by Fayda --
  {
    labelKey: "findTenant",
    href: "/dashboard/tenants",
    icon: UserSearch,
    roles: ["landlord"],
  },

  // -- Tenant & Landlord: Agreements (Register, Extend, Terminate) --
  {
    labelKey: "myAgreements",
    href: "/dashboard/agreements",
    icon: FileText,
    roles: ["landlord", "tenant"],
  },

  // -- Landlord: Report Violation / Track Dispute Status --
  {
    labelKey: "disputes",
    href: "/dashboard/disputes",
    icon: AlertTriangle,
    roles: ["landlord"],
  },

  // -- Landlord: Request Rent Adjustment --
  {
    labelKey: "requestRentAdjustment",
    href: "/dashboard/rent-adjustment",
    icon: TrendingUp,
    roles: ["landlord"],
  },

  // -- Tenant & Landlord: Make Rent Payment --
  {
    labelKey: "payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    roles: ["landlord", "tenant"],
  },

  // -- Tenant & Landlord: Upload Supporting Documents --
  {
    labelKey: "documents",
    href: "/dashboard/documents",
    icon: FolderOpen,
    roles: ["landlord", "tenant"],
  },

  // -- Admin: Manage User Accounts --
  {
    labelKey: "userManagement",
    href: "/dashboard/admin/users",
    icon: Users,
    roles: ["admin"],
  },

  // -- Admin: Configure System Parameters --
  {
    labelKey: "systemParameters",
    href: "/dashboard/admin/parameters",
    icon: Settings,
    roles: ["admin"],
  },

  // -- Admin: View Audit Logs --
  {
    labelKey: "auditLogs",
    href: "/dashboard/admin/audit-logs",
    icon: ScrollText,
    roles: ["admin"],
  },

  // -- Admin: Manage Roles & Permissions --
  {
    labelKey: "rolesPermissions",
    href: "/dashboard/admin/roles",
    icon: Shield,
    roles: ["admin"],
  },

  // -- DARA/Authorities: Verify Agreements --
  {
    labelKey: "verifyAgreements",
    href: "/dashboard/admin/verifications",
    icon: ShieldCheck,
    roles: ["dara_agent"],
  },

  // -- DARA/Authorities: Review Violation Reports --
  {
    labelKey: "reviewViolations",
    href: "/dashboard/disputes",
    icon: AlertTriangle,
    roles: ["dara_agent"],
  },

  // -- DARA/Authorities: Approve/Reject Rent Adjustments --
  {
    labelKey: "approveRentAdjustment",
    href: "/dashboard/rent-adjustment",
    icon: TrendingUp,
    roles: ["dara_agent"],
  },

  // -- DARA/Authorities: Facilitate Dispute Resolution --
  {
    labelKey: "disputeResolution",
    href: "/dashboard/disputes",
    icon: AlertTriangle,
    roles: ["dara_agent"],
    dedicatedHref: "/dashboard/dispute-resolution",
  },

  // -- DARA/Authorities: Generate Market Analytics Reports --
  {
    labelKey: "analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    roles: ["dara_agent", "admin", "system_admin"],
  },

  // -- DARA/Authorities: Issue Penalty Notices --
  {
    labelKey: "penaltyNotices",
    href: "/dashboard/penalty-notices",
    icon: Gavel,
    roles: ["dara_agent"],
  },

  // -- All: Notifications --
  {
    labelKey: "notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    roles: ["admin", "landlord", "tenant", "dara_agent"],
  },

  // -- All: Profile --
  {
    labelKey: "profile",
    href: "/dashboard/profile",
    icon: UserCircle,
    roles: ["admin", "landlord", "tenant", "dara_agent"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { locale, setLocale, t } = useLanguage();

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
        : role === "tenant"
          ? "overviewTenant"
          : role === "dara_agent"
            ? "overviewDara"
            : "overview";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-40 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className="h-16 flex items-center gap-2 px-4 border-b border-slate-200 shrink-0">
        <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-sm text-slate-900 truncate">
            {t("landing", "brand")}
            <span className="text-primary-600">{t("landing", "brandAccent")}</span>
          </span>
        )}
      </div>

      <div className={cn("px-3 pt-3", collapsed && "px-2")}>
        <button
          onClick={() => setLocale(locale === "en" ? "am" : "en")}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-200 hover:bg-slate-50",
            collapsed && "justify-center px-0"
          )}
          title={locale === "en" ? "ወደ አማርኛ ቀይር" : "Switch to English"}
        >
          <Globe className="w-4 h-4 text-primary-600 shrink-0" />
          {!collapsed && (
            <span className="text-slate-700">
              {locale === "en" ? "አማርኛ" : "English"}
            </span>
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-3">
        <ul className="space-y-1">
          {deduped.map((item) => {
            const href = (item as { dedicatedHref?: string }).dedicatedHref || item.href;
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            const label =
              item.labelKey === "overview"
                ? t("nav", overviewLabelKey)
                : t("nav", item.labelKey);
            return (
              <li key={item.labelKey}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive ? "text-primary-600" : "text-slate-400"
                    )}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200 p-3 space-y-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">{t("nav", "collapse")}</span>
            </>
          )}
        </button>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs shrink-0">
            {user ? getInitials(`${user.firstName} ${user.lastName}`) : "?"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {t("roles", role)}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => { logout(); window.location.href = "/login"; }}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title={t("nav", "signOut")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
