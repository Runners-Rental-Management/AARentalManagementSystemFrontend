"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyState?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  loading,
  loadingLabel = "Loading…",
  sortKey,
  sortDir,
  onSort,
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "theme-panel overflow-hidden shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_rgba(28,25,23,0.05)] dark:shadow-[0_8px_24px_rgba(249,115,22,0.08)]",
        className
      )}
    >
      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-thin">
        <table className="w-full min-w-[640px]">
          <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200 dark:bg-[#1a1a1a]/95 dark:border-orange-500/15">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-stone-500",
                    col.className
                  )}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-stone-800"
                    >
                      {col.header}
                      {sortKey === col.key && (
                        <span className="text-primary-600">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-sm text-stone-500"
                >
                  {loadingLabel}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {emptyState ?? (
                    <div className="px-4 py-16 text-center text-sm text-stone-500">
                      No results
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="border-b border-stone-100 transition-colors hover:bg-primary-50/30 last:border-0"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3.5 text-sm text-stone-800", col.className)}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
