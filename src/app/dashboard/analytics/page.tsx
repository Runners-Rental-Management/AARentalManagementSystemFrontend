"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { analyticsData } from "@/lib/dummy-data";
import { ShieldOff } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
];

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const isAuthorised = user?.role === "dara_agent" || user?.role === "admin" || user?.role === "system_admin";

  useEffect(() => {
    if (user && !isAuthorised) {
      router.replace("/dashboard");
    }
  }, [user, isAuthorised, router]);

  if (!user || !isAuthorised) {
    return (
      <>
        <Header title="Rental Market Analytics" />
        <main className="flex-1 p-6 overflow-y-auto flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldOff className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-slate-500 text-sm">
              This page is only available to DARA agents and system administrators.
              Tenants and landlords do not have access to market analytics.
            </p>
          </div>
        </main>
      </>
    );
  }

  const totalProperties = analyticsData.propertyDistribution.reduce(
    (sum, d) => sum + d.count,
    0
  );
  const avgOccupancy =
    analyticsData.occupancyRates.reduce((sum, d) => sum + d.rate, 0) /
    analyticsData.occupancyRates.length;
  const totalDisputes = analyticsData.disputeStats.reduce(
    (sum, d) => sum + d.count,
    0
  );

  return (
    <>
      <Header title={t("analyticsPage", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: t("analyticsPage", "registeredProperties"),
              value: totalProperties.toLocaleString(),
            },
            { label: t("analyticsPage", "avgOccupancy"), value: `${avgOccupancy.toFixed(1)}%` },
            {
              label: "Avg. Monthly Rent",
              value: formatCurrency(
                analyticsData.rentalTrends[
                  analyticsData.rentalTrends.length - 1
                ].averageRent
              ),
            },
            { label: t("analyticsPage", "totalDisputes"), value: totalDisputes.toString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-5"
            >
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Rental Trends */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Average Rent & New Agreements Trend
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={analyticsData.rentalTrends}>
                <defs>
                  <linearGradient id="rentGradAn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="averageRent"
                  name="Avg Rent (ETB)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#rentGradAn)"
                />
                <Bar
                  yAxisId="right"
                  dataKey="agreements"
                  name="Agreements"
                  fill="#6366f1"
                  radius={[3, 3, 0, 0]}
                  opacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Property Distribution by Sub-City */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Properties by Sub-City
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={analyticsData.propertyDistribution}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  dataKey="subCity"
                  type="category"
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Properties" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dispute Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Dispute Types Distribution
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analyticsData.disputeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="type"
                >
                  {analyticsData.disputeStats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Projection */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Tax Revenue: Projected vs Actual (ETB)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analyticsData.revenueProjection}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="quarter" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend />
                <Bar
                  dataKey="projected"
                  name="Projected"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actual"
                  name="Actual"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Rates Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Sub-City Occupancy Rates & Average Rent
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-6 py-3">
                    Sub-City
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-6 py-3">
                    Properties
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-6 py-3">
                    Avg. Rent
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-6 py-3">
                    Occupancy Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analyticsData.propertyDistribution.map((dist) => {
                  const occ = analyticsData.occupancyRates.find(
                    (o) => o.subCity === dist.subCity
                  );
                  return (
                    <tr key={dist.subCity} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">
                        {dist.subCity}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">
                        {dist.count.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">
                        {formatCurrency(dist.avgRent)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full max-w-[120px]">
                            <div
                              className="h-2 bg-primary-500 rounded-full"
                              style={{
                                width: `${occ?.rate || 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-slate-600">
                            {occ?.rate || 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
