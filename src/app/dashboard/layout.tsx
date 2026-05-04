"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/dashboard/top-nav";
import { useAuth } from "@/context/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">{children}</div>
    </div>
  );
}
