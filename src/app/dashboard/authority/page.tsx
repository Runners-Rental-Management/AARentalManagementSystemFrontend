"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

function isAuthorityRole(role: string | undefined) {
  return role === "dara_agent" || role === "admin" || role === "system_admin";
}

export default function AuthorityBlankPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !isAuthorityRole(user.role)) router.replace("/dashboard");
  }, [user, router]);

  if (!user || !isAuthorityRole(user.role)) return null;

  return <main className="min-h-screen w-full bg-white" />;
}
