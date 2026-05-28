"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingRedirect } from "@/components/dashboard/onboarding-redirect";
import { DashboardShell } from "@/components/dashboard/shell/dashboard-shell";
import { TopNav } from "@/components/dashboard/top-nav";
import { AuthorityNavDropdown } from "@/components/dashboard/authority-nav-dropdown";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace("/login");
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-muted flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Loading...</div>
      </div>
    );
  }

  const role = user?.role || "tenant";
  const authorityUi = role === "admin";

  return (
    <div
      className={cn(
        "dashboard-shell min-h-screen",
        authorityUi ? "bg-surface dark:bg-[#050505]" : "bg-surface-muted dark:bg-[#050505]"
      )}
    >
      <OnboardingRedirect />
      {authorityUi ? (
        <>
          <AuthorityNavDropdown />
          <div className="flex flex-col min-h-screen pt-11">{children}</div>
        </>
      ) : (
        <DashboardShell>{children}</DashboardShell>
      )}
    </div>
  );
}
