"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Gavel,
  Info,
  Landmark,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  classifyRent,
  type ListingRange,
} from "@/lib/addis-rent-benchmarks";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtETB(n: number) {
  return `${Math.round(n).toLocaleString()} ETB`;
}

function pct(value: number, min: number, max: number) {
  if (max === min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

interface PricingPanelProps {
  range: ListingRange;
  /** Sub-city name (for header display) */
  subCity: string;
  /** Property type label (for header display) */
  propertyType: string;
  /** Area in m² */
  areaSqm: number;
  /** Currently chosen monthly rent (ETB) */
  value: number;
  onChange: (next: number) => void;
}

export function PricingPanel({
  range,
  subCity,
  propertyType,
  areaSqm,
  value,
  onChange,
}: PricingPanelProps) {
  const [policyOpen, setPolicyOpen] = useState(true);

  const classification = useMemo(() => classifyRent(value, range), [value, range]);

  const recommendedMinPct = pct(range.recommendedMin, range.floor, range.ceiling);
  const recommendedMaxPct = pct(range.recommendedMax, range.floor, range.ceiling);
  const valuePct = pct(value, range.floor, range.ceiling);

  const tone = (() => {
    switch (classification) {
      case "within_band":
        return {
          ring: "ring-emerald-300",
          chip: "bg-emerald-100 text-emerald-700 border-emerald-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: "Within government-approved band",
          note: "This price aligns with the published indicative range for this area.",
        };
      case "below_band":
        return {
          ring: "ring-sky-300",
          chip: "bg-sky-100 text-sky-700 border-sky-200",
          icon: <TrendingDown className="w-3.5 h-3.5" />,
          label: "Below recommended band",
          note: "Tenants will love this, but you may be undercharging vs. the regulator's indicative floor.",
        };
      case "above_band":
        return {
          ring: "ring-amber-300",
          chip: "bg-amber-100 text-amber-800 border-amber-200",
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          label: "Above recommended band — DARA review",
          note: "This rent exceeds the indicative ceiling. The DARA officer will manually review the listing.",
        };
      case "below_floor":
        return {
          ring: "ring-rose-300",
          chip: "bg-rose-100 text-rose-700 border-rose-200",
          icon: <TrendingDown className="w-3.5 h-3.5" />,
          label: "Below absolute floor",
          note: "This price is far below market expectations and cannot be submitted.",
        };
      case "above_ceiling":
        return {
          ring: "ring-rose-300",
          chip: "bg-rose-100 text-rose-700 border-rose-200",
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          label: "Above absolute ceiling",
          note: "This price exceeds the policy ceiling and cannot be submitted.",
        };
    }
  })();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* ── Header: policy banner ── */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 px-5 py-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm">
              Government Pricing Range
            </p>
            <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Proclamation 1320/2016
            </span>
          </div>
          <p className="text-emerald-50 text-xs mt-0.5">
            Annual indicative band for {propertyType}s in {subCity} ·{" "}
            {areaSqm.toLocaleString()} m²
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 space-y-5">
        {/* Range summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Floor
            </p>
            <p className="text-base font-bold text-slate-700 mt-0.5">
              {fmtETB(range.floor)}
            </p>
          </div>
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-3 relative">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5" />
              Suggested
            </span>
            <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
              Sweet Spot
            </p>
            <p className="text-base font-bold text-emerald-800 mt-0.5">
              {fmtETB(range.mid)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Ceiling
            </p>
            <p className="text-base font-bold text-slate-700 mt-0.5">
              {fmtETB(range.ceiling)}
            </p>
          </div>
        </div>

        {/* Range slider with zones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700">
              Set Monthly Rent
            </label>
            <button
              type="button"
              onClick={() => onChange(range.mid)}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Use suggested
            </button>
          </div>

          <div className="relative pt-3 pb-1">
            {/* Zone bar */}
            <div className="relative h-2.5 rounded-full overflow-hidden bg-rose-100">
              {/* below band (sky-100) */}
              <div
                className="absolute top-0 bottom-0 bg-sky-100"
                style={{ left: 0, right: `${100 - recommendedMaxPct}%` }}
              />
              {/* within band (emerald-300) */}
              <div
                className="absolute top-0 bottom-0 bg-emerald-300"
                style={{
                  left: `${recommendedMinPct}%`,
                  right: `${100 - recommendedMaxPct}%`,
                }}
              />
              {/* above band (amber-200) */}
              <div
                className="absolute top-0 bottom-0 bg-amber-200"
                style={{
                  left: `${recommendedMaxPct}%`,
                  right: 0,
                }}
              />
              {/* below floor / above ceiling stay rose-100 (base) */}

              {/* recommended band markers */}
              <div
                className="absolute top-0 bottom-0 w-px bg-emerald-700"
                style={{ left: `${recommendedMinPct}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-px bg-emerald-700"
                style={{ left: `${recommendedMaxPct}%` }}
              />
            </div>

            {/* slider input on top */}
            <input
              type="range"
              min={range.floor}
              max={range.ceiling}
              step={Math.max(50, Math.round((range.ceiling - range.floor) / 200))}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="absolute inset-x-0 top-2 w-full appearance-none bg-transparent cursor-pointer h-5
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-white
                         [&::-webkit-slider-thumb]:border-2
                         [&::-webkit-slider-thumb]:border-emerald-600
                         [&::-webkit-slider-thumb]:shadow-md
                         [&::-webkit-slider-thumb]:cursor-grab
                         [&::-moz-range-thumb]:w-5
                         [&::-moz-range-thumb]:h-5
                         [&::-moz-range-thumb]:rounded-full
                         [&::-moz-range-thumb]:bg-white
                         [&::-moz-range-thumb]:border-2
                         [&::-moz-range-thumb]:border-emerald-600
                         [&::-moz-range-thumb]:shadow-md"
            />

            {/* tick labels */}
            <div className="flex justify-between text-[10px] text-slate-400 mt-3 font-medium">
              <span>{fmtETB(range.floor)}</span>
              <span>{fmtETB(range.ceiling)}</span>
            </div>
          </div>

          {/* Big value display + numeric input */}
          <div className={`mt-4 rounded-2xl border-2 ${tone.ring} ring-2 ring-offset-1 px-4 py-3.5 bg-white`}>
            <div className="flex items-baseline gap-3 flex-wrap">
              <input
                type="number"
                min={range.floor}
                max={range.ceiling}
                value={value || ""}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  onChange(n);
                }}
                className="text-3xl font-bold text-slate-900 bg-transparent outline-none w-44 tabular-nums"
              />
              <span className="text-sm font-semibold text-slate-500">
                ETB / month
              </span>
              <span
                className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${tone.chip}`}
              >
                {tone.icon}
                {tone.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">{tone.note}</p>
          </div>
        </div>

        {/* Why this range — collapsible policy reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <button
            type="button"
            onClick={() => setPolicyOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Gavel className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                Why this range?
              </p>
              <p className="text-xs text-slate-500">
                Ethiopian rent control policy basis & calculation
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                policyOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {policyOpen && (
            <div className="px-4 pb-4 pt-1 space-y-3">
              {/* Step 1 — base band (sub-city × type) */}
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2.5">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                  Step 1 · Base Band
                </p>
                <div className="text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    Regulator&apos;s base band for{" "}
                    <strong>{propertyType}s in {subCity}</strong>:{" "}
                    <span className="font-mono font-semibold text-slate-900">
                      {fmtETB(range.baseMin)} – {fmtETB(range.baseMax)}
                    </span>
                    <span className="text-slate-500"> / month (typical-size unit)</span>
                  </div>
                </div>
              </div>

              {/* Step 2 — area scaler */}
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2.5">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                  Step 2 · Area Adjustment
                </p>
                <div className="text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    Your unit is{" "}
                    <span className="font-mono font-semibold">{areaSqm} m²</span>.
                    A square-root area factor (≈ ×{range.areaFactor}) is applied
                    so larger / smaller units scale realistically — not linearly —
                    matching observed Addis market behaviour where{" "}
                    <strong>location and finishing matter more than raw m²</strong>.
                  </div>
                </div>
              </div>

              {/* Step 3 — final range */}
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                  Step 3 · Your Allowed Range
                </p>
                <div className="text-xs text-slate-800 leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-mono">{fmtETB(range.baseMin)}</span> ×{" "}
                    {range.areaFactor} ={" "}
                    <span className="font-mono font-semibold text-emerald-800">
                      {fmtETB(range.recommendedMin)}
                    </span>
                    <span className="mx-1.5">…</span>
                    <span className="font-mono">{fmtETB(range.baseMax)}</span> ×{" "}
                    {range.areaFactor} ={" "}
                    <span className="font-mono font-semibold text-emerald-800">
                      {fmtETB(range.recommendedMax)}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Equivalent per-m²: {range.perSqmMin.toLocaleString()}–
                      {range.perSqmMax.toLocaleString()} ETB / m²
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pt-1">
                Legal Basis
              </p>
              <ul className="space-y-2">
                {range.citations.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg bg-white border border-slate-200 px-3 py-2.5 flex items-start gap-2.5"
                  >
                    <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {c.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
