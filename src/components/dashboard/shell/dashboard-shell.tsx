"use client";

import { DashboardTopBar } from "@/components/dashboard/dashboard-top-bar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="dashboard-premium dashboard-main flex min-h-screen flex-col bg-surface-muted dark:bg-[#050505]">
      <DashboardTopBar />
      <div className="dashboard-main mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
