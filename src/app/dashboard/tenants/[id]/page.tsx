"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { TenantPublicProfileView } from "@/components/dashboard/tenant-public-profile";
import { useAuth } from "@/context/auth-context";
import { apiGetTenantProfile, getAccessToken } from "@/lib/api";
import type { TenantPublicProfile } from "@/lib/types";

export default function TenantProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "landlord") {
      router.replace("/dashboard");
      return;
    }
    const token = getAccessToken();
    if (!token || !tenantId) return;

    setLoading(true);
    apiGetTenantProfile(token, tenantId)
      .then(setTenant)
      .catch((e) => setError(e instanceof Error ? e.message : "Tenant not found"))
      .finally(() => setLoading(false));
  }, [tenantId, user?.role, router]);

  if (user?.role !== "landlord") return null;

  return (
    <>
      <Header title="Tenant Profile" />
      <main className="flex-1 p-6 overflow-y-auto">
        <Link
          href="/dashboard/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Find Tenants
        </Link>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Loading tenant profile…</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">{error}</p>
            <Link
              href="/dashboard/tenants"
              className="mt-3 inline-block text-primary-600 text-sm hover:underline"
            >
              Search by Fayda number
            </Link>
          </div>
        )}

        {!loading && tenant && <TenantPublicProfileView tenant={tenant} />}
      </main>
    </>
  );
}
