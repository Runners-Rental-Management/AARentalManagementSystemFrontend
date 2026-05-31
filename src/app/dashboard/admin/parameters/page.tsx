"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { systemParameters } from "@/lib/dummy-data";
import type { SystemParameter } from "@/lib/types";
import { Settings, Save } from "lucide-react";
import { useState, useMemo } from "react";

const CATEGORIES = ["rental", "compliance", "system", "notification"] as const;
const CATEGORY_COLORS: Record<string, string> = {
  rental: "bg-blue-500",
  compliance: "bg-amber-500",
  system: "bg-purple-500",
  notification: "bg-emerald-500",
};

export default function SystemParametersPage() {
  const { t } = useLanguage();
  const [params, setParams] = useState<Record<string, string>>(() =>
    Object.fromEntries(systemParameters.map((p) => [p.id, p.value]))
  );

  const grouped = useMemo(() => {
    const map: Record<string, SystemParameter[]> = {};
    for (const cat of CATEGORIES) {
      map[cat] = systemParameters.filter((p) => p.category === cat);
    }
    return map;
  }, []);

  const updateParam = (id: string, value: string) => {
    setParams((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    // Dummy action
  };

  return (
    <>
      <Header title={t("sysParams", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-stone-400" />
          <p className="text-sm text-stone-500">
            {t("sysParams", "subtitle")}
          </p>
        </div>
        <div className="space-y-6">
          {CATEGORIES.map((category) => {
            const items = grouped[category];
            if (!items.length) return null;
            return (
              <div
                key={category}
                className="bg-white rounded-xl border border-stone-200 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_COLORS[category]}`}
                  />
                  <h2 className="text-base font-semibold text-stone-900">
                    {t("sysParams", category)}
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((param) => (
                    <div key={param.id}>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        {t("sysParams", param.key)}
                      </label>
                      <p className="text-xs text-stone-500 mb-2">
                        {param.description}
                      </p>
                      <input
                        type="text"
                        value={params[param.id] ?? param.value}
                        onChange={(e) =>
                          updateParam(param.id, e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {t("sysParams", "saveChanges")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
