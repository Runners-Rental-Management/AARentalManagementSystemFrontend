"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { penaltyNotices } from "@/lib/dummy-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Gavel,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  DollarSign,
  Clock,
} from "lucide-react";
import { useState } from "react";

const TYPE_BADGE_COLORS: Record<string, string> = {
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  fine: "bg-red-100 text-red-800 border-red-200",
  suspension: "bg-orange-100 text-orange-800 border-orange-200",
  legal_action: "bg-purple-100 text-purple-800 border-purple-200",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  issued: "bg-blue-100 text-blue-800 border-blue-200",
  acknowledged: "bg-green-100 text-green-800 border-green-200",
  appealed: "bg-amber-100 text-amber-800 border-amber-200",
  enforced: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-stone-100 text-stone-600 border-stone-200",
};

export default function PenaltyNoticesPage() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalFines = penaltyNotices
    .filter((n) => n.type === "fine" && n.amount != null)
    .reduce((sum, n) => sum + (n.amount ?? 0), 0);

  const pendingCount = penaltyNotices.filter((n) => n.status === "issued").length;

  const filtered = penaltyNotices.filter((notice) => {
    const matchesStatus =
      statusFilter === "all" || notice.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      notice.issuedToName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.issuedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <Header title={t("penalty", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Gavel className="w-4 h-4 text-stone-500" />
              <p className="text-xs text-stone-500">{t("penalty", "totalIssued")}</p>
            </div>
            <p className="text-2xl font-bold text-stone-900">
              {penaltyNotices.length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-stone-500" />
              <p className="text-xs text-stone-500">{t("penalty", "pendingAck")}</p>
            </div>
            <p className="text-2xl font-bold text-stone-900">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-stone-500" />
              <p className="text-xs text-stone-500">{t("penalty", "totalFines")}</p>
            </div>
            <p className="text-2xl font-bold text-stone-900">
              {formatCurrency(totalFines)}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder={t("common", "search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1 text-stone-700 placeholder:text-stone-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white outline-none text-stone-700"
              >
                <option value="all">{t("common", "all")}</option>
                <option value="issued">{t("penalty", "issued")}</option>
                <option value="acknowledged">{t("penalty", "acknowledged")}</option>
                <option value="appealed">{t("penalty", "appealed")}</option>
                <option value="enforced">{t("penalty", "enforced")}</option>
                <option value="cancelled">{t("penalty", "cancelled")}</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {}}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("penalty", "issueNotice")}
          </button>
        </div>

        {/* Penalty notice cards */}
        <div className="space-y-4">
          {filtered.map((notice) => (
            <div
              key={notice.id}
              className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        TYPE_BADGE_COLORS[notice.type] ?? "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {t("penalty", notice.type)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        STATUS_BADGE_COLORS[notice.status] ??
                        "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {t("penalty", notice.status)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-stone-700">
                      <span className="text-stone-500 font-medium">
                        {t("penalty", "issuedTo")}:{" "}
                      </span>
                      {notice.issuedToName}
                    </p>
                    <p className="text-stone-700">
                      <span className="text-stone-500 font-medium">
                        {t("penalty", "issuedBy")}:{" "}
                      </span>
                      {notice.issuedByName}
                    </p>
                    <p className="text-stone-600 mt-2">{notice.reason}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-stone-500">
                    {notice.type === "fine" && notice.amount != null && (
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(notice.amount)}
                      </span>
                    )}
                    {notice.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t("penalty", "deadline")}: {formatDate(notice.deadline)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t("penalty", "issuedAt")}: {formatDate(notice.issuedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-500 text-sm">{t("penalty", "noNotices")}</p>
          </div>
        )}
      </main>
    </>
  );
}
