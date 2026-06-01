"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { supportingDocuments } from "@/lib/dummy-data";
import { formatDate } from "@/lib/utils";
import {
  FolderOpen,
  Upload,
  Search,
  File,
} from "lucide-react";
import { useState } from "react";

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export default function DocumentsPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const userId = user?.id || "";

  const roleBasedList = supportingDocuments.filter(
    (d) => d.uploaderId === userId
  );

  const filtered = roleBasedList.filter(
    (d) =>
      searchQuery === "" ||
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.relatedEntityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRelatedTypeLabel = (type: string) => t("documents", type);

  return (
    <>
      <Header title={t("documents", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Upload button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder={t("common", "search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1"
              />
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            {t("documents", "uploadDocument")}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("documents", "fileName")}
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("documents", "fileType")}
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("documents", "fileSize")}
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("documents", "relatedTo")}
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("documents", "uploadedAt")}
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("documents", "description")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-stone-100 hover:bg-stone-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-stone-400" />
                        <span className="text-sm text-stone-900">
                          {doc.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600 uppercase">
                      {doc.fileType}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-700">
                      {doc.relatedEntityTitle}
                      <span className="ml-1 text-xs text-stone-400">
                        ({getRelatedTypeLabel(doc.relatedEntityType)})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600 max-w-xs truncate">
                      {doc.description ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <FolderOpen className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-stone-500 text-sm">
                {t("documents", "noDocuments")}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
