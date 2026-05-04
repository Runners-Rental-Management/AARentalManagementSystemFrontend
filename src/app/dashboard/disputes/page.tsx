"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { disputes } from "@/lib/dummy-data";
import { formatDate, getStatusColor, formatStatus } from "@/lib/utils";
import { VIOLATION_TYPES } from "@/lib/constants";
import {
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Clock,
  User,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DisputesPage() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState("under_review");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const role = user?.role || "tenant";
  const userId = user?.id || "";

  const roleBasedList =
    role === "admin" || role === "dara_agent" || role === "system_admin"
      ? disputes
      : disputes.filter((d) => d.reporterId === userId || d.respondentId === userId);

  const filtered = roleBasedList.filter((d) => {
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.respondentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getViolationLabel = (type: string) =>
    VIOLATION_TYPES.find((v) => v.value === type)?.label || type;

  return (
    <>
      <Header title={t("disputes", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Stats row - role-based counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: t("disputes", "totalCases"),
              value: roleBasedList.length,
              color: "text-slate-900",
            },
            {
              label: t("disputes", "open"),
              value: roleBasedList.filter(
                (d) => !["resolved", "closed"].includes(d.status)
              ).length,
              color: "text-blue-600",
            },
            {
              label: t("disputes", "critical"),
              value: roleBasedList.filter((d) => d.priority === "critical").length,
              color: "text-red-600",
            },
            {
              label: t("disputes", "resolved"),
              value: roleBasedList.filter((d) => d.status === "resolved").length,
              color: "text-emerald-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search disputes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="mediation">Mediation</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <Link
            href="/dashboard/disputes/report"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("disputes", "reportViolation")}
          </Link>
        </div>

        {/* Dispute Cards */}
        <div className="space-y-4">
          {filtered.map((dispute) => (
            <Link
              key={dispute.id}
              href={`/dashboard/disputes/${dispute.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">
                      D-{dispute.id.slice(1).padStart(3, "0")}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(dispute.priority)}`}
                    >
                      {dispute.priority}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                      {getViolationLabel(dispute.violationType)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    {dispute.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {dispute.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Filed by: {dispute.reporterName} ({dispute.reporterRole})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(dispute.createdAt)}
                    </span>
                    {dispute.assignedTo && (
                      <span className="text-primary-600">Assigned</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}
                  >
                    {formatStatus(dispute.status)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              {dispute.resolution && (
                <div className="mt-3 pt-3 border-t border-slate-100 bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-emerald-800">
                    Resolution:
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {dispute.resolution}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No disputes found</p>
          </div>
        )}
      </main>
    </>
  );
}
