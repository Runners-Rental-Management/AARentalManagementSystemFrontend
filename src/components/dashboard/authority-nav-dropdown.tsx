"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  Gavel,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Users,
  Settings,
  ScrollText,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";

type Bucket = "dara_agent" | "admin";

function roleBucket(role: string | undefined): Bucket | null {
  if (role === "dara_agent") return "dara_agent";
  if (role === "admin" || role === "system_admin") return "admin";
  return null;
}

const DARA_LINKS: {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { href: "/dashboard/admin/verifications", labelKey: "verifyAgreements", icon: ShieldCheck },
  { href: "/dashboard/disputes", labelKey: "reviewViolations", icon: AlertTriangle },
  { href: "/dashboard/rent-adjustment", labelKey: "approveRentAdjustment", icon: TrendingUp },
  { href: "/dashboard/penalty-notices", labelKey: "penaltyNotices", icon: Gavel },
  { href: "/dashboard/analytics", labelKey: "analytics", icon: BarChart3 },
];

const ADMIN_LINKS: {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { href: "/dashboard/admin/users", labelKey: "userManagement", icon: Users },
  { href: "/dashboard/admin/parameters", labelKey: "systemParameters", icon: Settings },
  { href: "/dashboard/admin/audit-logs", labelKey: "auditLogs", icon: ScrollText },
  { href: "/dashboard/admin/roles", labelKey: "rolesPermissions", icon: Shield },
  { href: "/dashboard/analytics", labelKey: "analytics", icon: BarChart3 },
];

export function AuthorityNavDropdown() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bucket = roleBucket(user?.role);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  if (!bucket) return null;

  const links = bucket === "dara_agent" ? DARA_LINKS : ADMIN_LINKS;

  return (
    <div ref={wrapRef} className="fixed top-2 right-2 z-[110]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex items-center gap-1 rounded-md px-2.5 py-1.5 transition-colors",
          "text-slate-400 hover:text-slate-600 focus-visible:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        )}
      >
        <span className="text-xs font-medium tracking-wide max-sm:sr-only">
          {t("nav", "menu")}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 max-h-[min(80vh,28rem)] w-64 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-xl"
          role="listbox"
        >
          <Link
            href="/dashboard/authority"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-slate-50",
              pathname === "/dashboard/authority" ? "bg-primary-50 text-primary-800" : "text-slate-800"
            )}
            role="option"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 text-primary-600" />
            <span className="truncate">{t("nav", "authorityWorkspace")}</span>
          </Link>
          <div className="my-1 border-t border-slate-100" />
          {links.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href + item.labelKey}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50",
                  active ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-700"
                )}
                role="option"
              >
                <item.icon className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{t("nav", item.labelKey)}</span>
              </Link>
            );
          })}
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = "/authority/login";
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t("nav", "signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
