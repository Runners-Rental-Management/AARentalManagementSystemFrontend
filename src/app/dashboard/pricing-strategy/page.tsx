"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { pricingStrategies } from "@/lib/dummy-data";
import { formatDate, formatCurrency, getStatusColor, formatStatus } from "@/lib/utils";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Eye,
  Pencil,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

export default function PricingStrategyPage() {
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>("ps1");

  return (
    <>
      <Header title={t("pricing", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Pricing strategies</strong> define maximum allowable rent
            thresholds and annual adjustment percentages per sub-city. Published
            strategies are enforced system-wide for rent adjustment validation.
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-stone-900">
            All Strategies
          </h2>
          <button className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Create Strategy
          </button>
        </div>

        {/* Strategy Cards */}
        <div className="space-y-4">
          {pricingStrategies.map((strategy) => (
            <div
              key={strategy.id}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer"
                onClick={() =>
                  setExpandedId(
                    expandedId === strategy.id ? null : strategy.id
                  )
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-stone-900">
                        {strategy.title}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(strategy.status)}`}
                      >
                        {formatStatus(strategy.status)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 mb-3">
                      {strategy.description}
                    </p>
                    <div className="flex items-center gap-6 text-xs text-stone-500">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Max Annual Increase:{" "}
                        <strong className="text-stone-700">
                          {strategy.maxAnnualIncreasePercent}%
                        </strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(strategy.effectiveFrom)} –{" "}
                        {formatDate(strategy.effectiveTo)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {strategy.status === "draft" && (
                      <button className="p-2 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    {expandedId === strategy.id ? (
                      <ChevronUp className="w-5 h-5 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded: Sub-City Rules Table */}
              {expandedId === strategy.id && (
                <div className="border-t border-stone-100">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-stone-50">
                          <th className="text-left text-xs font-semibold text-stone-500 uppercase px-6 py-3">
                            Sub-City
                          </th>
                          <th className="text-left text-xs font-semibold text-stone-500 uppercase px-6 py-3">
                            Max Rent/m²
                          </th>
                          <th className="text-left text-xs font-semibold text-stone-500 uppercase px-6 py-3">
                            Adjustment Factor
                          </th>
                          <th className="text-left text-xs font-semibold text-stone-500 uppercase px-6 py-3">
                            Max Annual Increase
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {strategy.subCityRules.map((rule) => (
                          <tr
                            key={rule.subCity}
                            className="hover:bg-stone-50"
                          >
                            <td className="px-6 py-3 text-sm font-medium text-stone-900">
                              {rule.subCity}
                            </td>
                            <td className="px-6 py-3 text-sm text-stone-600">
                              {formatCurrency(rule.maxRentPerSqm)}
                            </td>
                            <td className="px-6 py-3 text-sm text-stone-600">
                              {rule.adjustmentFactor}x
                            </td>
                            <td className="px-6 py-3 text-sm text-stone-600">
                              {strategy.maxAnnualIncreasePercent}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {strategy.status === "draft" && (
                    <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-end">
                      <button className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
                        Publish Strategy
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
