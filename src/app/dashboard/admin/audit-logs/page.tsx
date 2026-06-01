"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { auditLogs } from "@/lib/dummy-data";
import { formatDate } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { ScrollText, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";

const ACTION_TYPES = ["All", "CREATE", "UPDATE", "APPROVE", "REJECT"] as const;
const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-blue-100 text-blue-700",
  UPDATE: "bg-amber-100 text-amber-700",
  APPROVE: "bg-emerald-100 text-emerald-700",
  REJECT: "bg-red-100 text-red-700",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  landlord: "bg-blue-100 text-blue-700",
  tenant: "bg-emerald-100 text-emerald-700",
};

export default function AuditLogsPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        searchQuery === "" ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAction =
        actionFilter === "All" || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [searchQuery, actionFilter]);

  return (
    <>
      <Header title={t("auditLogs", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder={t("auditLogs", "searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white outline-none"
            >
              {ACTION_TYPES.map((action) => (
                <option key={action} value={action}>
                  {action === "All" ? t("common", "all") : action}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase px-6 py-3">
                    {t("auditLogs", "user")}
                  </th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase px-6 py-3">
                    {t("auditLogs", "action")}
                  </th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase px-6 py-3">
                    {t("auditLogs", "entity")}
                  </th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase px-6 py-3">
                    {t("auditLogs", "details")}
                  </th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase px-6 py-3">
                    {t("auditLogs", "ipAddress")}
                  </th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase px-6 py-3">
                    {t("auditLogs", "timestamp")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-stone-500 text-sm"
                    >
                      <div className="flex flex-col items-center">
                        <ScrollText className="w-10 h-10 text-stone-300 mb-2" />
                        {t("auditLogs", "noLogs")}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-stone-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 font-medium text-xs">
                            {getInitials(log.userName)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-900">
                              {log.userName}
                            </p>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                ROLE_COLORS[log.userRole] ?? "bg-stone-100 text-stone-600"
                              }`}
                            >
                              {t("roles", log.userRole)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ACTION_COLORS[log.action] ?? "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-700">
                        {log.entity}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500 font-mono">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500">
                        {formatDate(log.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
