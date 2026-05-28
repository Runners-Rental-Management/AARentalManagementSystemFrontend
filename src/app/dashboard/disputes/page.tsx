"use client";

import { PageHeader, EmptyState, FilterBar } from "@/components/dashboard/ui";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { Gavel, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type DisputeStatus = "open" | "in_review" | "resolved" | "escalated";

type DisputeCard = {
  id: string;
  title: string;
  property: string;
  status: DisputeStatus;
  filedAt: string;
};

const DEMO_DISPUTES: DisputeCard[] = [
  {
    id: "d1",
    title: "Unauthorized rent increase",
    property: "Bole Apartment 4B",
    status: "open",
    filedAt: "2025-05-28",
  },
  {
    id: "d2",
    title: "Maintenance delay",
    property: "Kazanchis Studio 2",
    status: "in_review",
    filedAt: "2025-05-20",
  },
  {
    id: "d3",
    title: "Deposit refund dispute",
    property: "Piassa Flat 12",
    status: "resolved",
    filedAt: "2025-04-15",
  },
  {
    id: "d4",
    title: "Lease termination notice",
    property: "CMC Villa 1",
    status: "escalated",
    filedAt: "2025-05-10",
  },
];

const COLUMNS: { status: DisputeStatus; labelKey: string }[] = [
  { status: "open", labelKey: "kanbanOpen" },
  { status: "in_review", labelKey: "kanbanInReview" },
  { status: "resolved", labelKey: "kanbanResolved" },
  { status: "escalated", labelKey: "kanbanEscalated" },
];

export default function DisputesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DEMO_DISPUTES;
    return DEMO_DISPUTES.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.property.toLowerCase().includes(q)
    );
  }, [search]);

  const byColumn = (status: DisputeStatus) =>
    filtered.filter((d) => d.status === status);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={t("disputes", "title")}
        subtitle={t("dashboardUi", "disputesSubtitle")}
        badge={
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200/60 capitalize">
            {t("roles", user?.role || "tenant")}
          </span>
        }
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            {t("dashboardUi", "fileDispute")}
          </button>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("disputes", "searchPlaceholder")}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title={t("disputes", "noDisputes")}
          description={t("dashboardUi", "disputesSubtitle")}
          actionLabel={t("dashboardUi", "fileDispute")}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div
              key={col.status}
              className="flex flex-col rounded-[18px] border border-stone-200/80 bg-stone-50/50 min-h-[320px]"
            >
              <div className="flex items-center justify-between border-b border-stone-200/60 px-4 py-3">
                <h2 className="text-xs font-bold uppercase tracking-wide text-stone-700">
                  {t("dashboardUi", col.labelKey)}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-stone-600 shadow-sm">
                  {byColumn(col.status).length}
                </span>
              </div>
              <ul className="flex-1 space-y-2 p-3 overflow-y-auto scrollbar-thin">
                {byColumn(col.status).map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/dashboard/disputes/${d.id}`}
                      className={cn(
                        "block rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
                      )}
                    >
                      <p className="text-sm font-semibold text-stone-900 leading-snug">
                        {d.title}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">{d.property}</p>
                      <p className="mt-2 text-[10px] font-medium text-stone-400">
                        {d.filedAt}
                      </p>
                    </Link>
                  </li>
                ))}
                {byColumn(col.status).length === 0 && (
                  <li className="py-8 text-center text-xs text-stone-400">—</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
