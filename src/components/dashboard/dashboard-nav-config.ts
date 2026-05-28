import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  FileText,
  BarChart3,
  Bell,
  Users,
  Settings,
  UserCircle,
  CreditCard,
  ScrollText,
  Shield,
  Heart,
} from "lucide-react";

export type DashboardNavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  roles: Array<"admin" | "landlord" | "tenant">;
  /** Shown in main horizontal nav (excludes profile/notifications) */
  inMainNav?: boolean;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  /** Dashboard home — use logo/brand link only, not a separate nav tab */
  { labelKey: "overview", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "landlord", "tenant"], inMainNav: false },
  { labelKey: "myProperties", href: "/dashboard/properties", icon: Building2, roles: ["landlord"], inMainNav: true },
  { labelKey: "myAgreements", href: "/dashboard/agreements", icon: FileText, roles: ["landlord", "tenant"], inMainNav: true },
  {
    labelKey: "payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    roles: ["landlord", "tenant"],
    inMainNav: true,
  },
  { labelKey: "favorites", href: "/dashboard/favorites", icon: Heart, roles: ["tenant"], inMainNav: true },
  { labelKey: "userManagement", href: "/dashboard/admin/users", icon: Users, roles: ["admin"], inMainNav: true },
  { labelKey: "systemParameters", href: "/dashboard/admin/parameters", icon: Settings, roles: ["admin"], inMainNav: true },
  { labelKey: "auditLogs", href: "/dashboard/admin/audit-logs", icon: ScrollText, roles: ["admin"], inMainNav: true },
  { labelKey: "rolesPermissions", href: "/dashboard/admin/roles", icon: Shield, roles: ["admin"], inMainNav: true },
  { labelKey: "analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["admin"], inMainNav: true },
  { labelKey: "notifications", href: "/dashboard/notifications", icon: Bell, roles: ["admin", "landlord", "tenant"], inMainNav: false },
  { labelKey: "profile", href: "/dashboard/profile", icon: UserCircle, roles: ["admin", "landlord", "tenant"], inMainNav: false },
];

export function getMainNavForRole(role: string) {
  const seen = new Set<string>();
  return DASHBOARD_NAV_ITEMS.filter((item) => {
    if (!item.roles.includes(role as "admin" | "landlord" | "tenant")) return false;
    if (item.inMainNav === false) return false;
    const key = item.labelKey + item.href;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getOverviewLabelKey(role: string) {
  if (role === "admin") return "overviewAdmin";
  if (role === "landlord") return "overviewLandlord";
  if (role === "tenant") return "overviewTenant";
  return "overview";
}
