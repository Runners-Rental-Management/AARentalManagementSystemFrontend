"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { users } from "@/lib/dummy-data";
import { Shield, Check, X } from "lucide-react";

type Role = "tenant" | "landlord" | "admin";
type PermValue = "yes" | "no" | "view" | "verify";

const ROLES: Role[] = ["tenant", "landlord", "admin"];

const PERMISSIONS = [
  { key: "manageProperties", labelKey: "manageProperties" },
  { key: "manageAgreements", labelKey: "manageAgreements" },
  { key: "managePayments", labelKey: "managePayments" },
  { key: "manageUsers", labelKey: "manageUsers" },
  { key: "viewAnalytics", labelKey: "viewAnalytics" },
  { key: "verifyDocuments", labelKey: "verifyDocuments" },
  { key: "systemConfig", labelKey: "systemConfig" },
] as const;

const PERM_MATRIX: Record<Role, Record<string, PermValue>> = {
  tenant: {
    manageProperties: "view",
    manageAgreements: "yes",
    managePayments: "yes",
    manageUsers: "no",
    viewAnalytics: "no",
    verifyDocuments: "no",
    systemConfig: "no",
  },
  landlord: {
    manageProperties: "yes",
    manageAgreements: "yes",
    managePayments: "yes",
    manageUsers: "no",
    viewAnalytics: "no",
    verifyDocuments: "no",
    systemConfig: "no",
  },
  admin: {
    manageProperties: "yes",
    manageAgreements: "yes",
    managePayments: "yes",
    manageUsers: "yes",
    viewAnalytics: "yes",
    verifyDocuments: "yes",
    systemConfig: "yes",
  },
};

function PermIcon({ value }: { value: PermValue }) {
  if (value === "no") {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-400">
        <X className="w-3.5 h-3.5" />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded ${
        value === "yes"
          ? "bg-emerald-100 text-emerald-600"
          : value === "verify"
            ? "bg-blue-100 text-blue-600"
            : "bg-amber-100 text-amber-600"
      }`}
    >
      <Check className="w-3.5 h-3.5" />
    </span>
  );
}

export default function RolesPage() {
  const { t } = useLanguage();
  const roleCounts = ROLES.map((role) => ({
    role,
    count: users.filter((u) => u.role === role).length,
  }));

  return (
    <>
      <Header title={t("admin", "rolesPermissions")} />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t("admin", "rolesPermissions")}
                </h2>
                <p className="text-sm text-slate-500">
                  Tenant, landlord, and authority admin capabilities
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">
                      Permission
                    </th>
                    {ROLES.map((role) => (
                      <th key={role} className="text-center py-3 px-4 font-medium text-slate-500">
                        {t("roles", role)}
                        <span className="block text-xs font-normal text-slate-400">
                          ({roleCounts.find((r) => r.role === role)?.count ?? 0})
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS.map((perm) => (
                    <tr key={perm.key} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-slate-700">
                        {t("admin", perm.labelKey)}
                      </td>
                      {ROLES.map((role) => (
                        <td key={role} className="py-3 px-4 text-center">
                          <PermIcon value={PERM_MATRIX[role][perm.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
