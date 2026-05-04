/**
 * Addis Ababa — indicative **monthly rent (ETB)** ranges for landlord listings.
 *
 * Methodology (revised, 2026):
 *   The dominant price drivers in Addis Ababa rentals are, in order:
 *     1. **Sub-city / location tier**  (Bole prime ≈ 5× outer-city Akaky)
 *     2. **Property type**             (villa ≈ 2–3× apartment in the same area)
 *     3. **Floor area**                — modest sub-modifier, with diminishing returns
 *
 *   The previous model multiplied a per-m² band by area, which over-weighted area and
 *   under-weighted neighbourhood and type tiers. This module now uses a **direct
 *   (sub-city × property-type) base-rent matrix** for a typical-sized unit of each type,
 *   and applies a **square-root area scaler** so a 200 m² unit is ≈ 1.4× a 100 m² unit
 *   (matching observed Addis market behaviour where finishing, location and amenities
 *   dominate raw square-metres).
 *
 *   Bands grounded in public 2026 market write-ups: typical Addis rent levels of
 *   ETB 1,900–2,100 / m² / month overall, with ETB 2,800+ in prime furnished Bole /
 *   Kazanchis stock and ETB 1,400+ in outer areas — implying realistic monthly rents
 *   from ~ETB 5,000 (small outer apartment) to ETB 250,000+ (luxury Bole villa).
 *   (Sources: theafricanvestor.com — "Updated Rents in Addis Ababa (2026)" and
 *   "Housing Prices in Addis Ababa (2026)"; Miles Consulting summaries.)
 *
 *   The legal framework — Proclamation 1320/2016 (E.C.) — empowers the regulator to
 *   publish annual indicative bands; this module is a UX placeholder to be replaced
 *   with the regulator's official table when machine-readable.
 *
 * Not legal or appraisal advice — for UX guidance only.
 */

import { SUB_CITIES } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/*  Reference areas — typical floor area for each property type        */
/* ------------------------------------------------------------------ */

type PropertyTypeKey = "apartment" | "condominium" | "house" | "villa";

const REFERENCE_AREA: Record<PropertyTypeKey, number> = {
  apartment: 80,
  condominium: 110,
  house: 160,
  villa: 280,
};

/* ------------------------------------------------------------------ */
/*  Direct (sub-city × type) base monthly rent matrix (ETB / month)    */
/*  — for a unit at the type's reference area —                        */
/* ------------------------------------------------------------------ */

type Band = readonly [min: number, max: number];

const BASE_RENT_MATRIX: Record<string, Record<PropertyTypeKey, Band>> = {
  // Tier 1 — prime
  Bole: {
    apartment: [25_000, 75_000],
    condominium: [18_000, 50_000],
    house: [35_000, 95_000],
    villa: [60_000, 220_000],
  },
  // Tier 2 — central
  Kirkos: {
    apartment: [18_000, 55_000],
    condominium: [14_000, 38_000],
    house: [25_000, 70_000],
    villa: [45_000, 150_000],
  },
  Lideta: {
    apartment: [15_000, 45_000],
    condominium: [12_000, 32_000],
    house: [22_000, 60_000],
    villa: [38_000, 120_000],
  },
  Arada: {
    apartment: [13_000, 40_000],
    condominium: [10_000, 28_000],
    house: [20_000, 55_000],
    villa: [33_000, 100_000],
  },
  // Tier 3 — mid-ring
  Yeka: {
    apartment: [12_000, 35_000],
    condominium: [9_000, 26_000],
    house: [18_000, 50_000],
    villa: [30_000, 95_000],
  },
  "Addis Ketema": {
    apartment: [10_000, 30_000],
    condominium: [8_000, 22_000],
    house: [16_000, 42_000],
    villa: [26_000, 80_000],
  },
  Gullele: {
    apartment: [8_500, 24_000],
    condominium: [7_000, 19_000],
    house: [13_000, 33_000],
    villa: [22_000, 65_000],
  },
  // Tier 4 — outer
  "Nifas Silk-Lafto": {
    apartment: [8_000, 22_000],
    condominium: [6_500, 18_000],
    house: [12_500, 32_000],
    villa: [21_000, 60_000],
  },
  "Lemi Kura": {
    apartment: [6_500, 18_000],
    condominium: [5_500, 15_000],
    house: [10_500, 26_000],
    villa: [18_000, 48_000],
  },
  "Kolfe Keranio": {
    apartment: [6_500, 18_000],
    condominium: [5_500, 15_000],
    house: [10_500, 26_000],
    villa: [18_000, 48_000],
  },
  // Tier 5 — peri-urban
  "Akaky Kaliti": {
    apartment: [5_000, 14_000],
    condominium: [4_500, 12_000],
    house: [8_500, 21_000],
    villa: [15_000, 38_000],
  },
};

/** Fallback band when sub-city / type isn't in the matrix */
const FALLBACK_BAND: Band = [9_000, 28_000];

/* ------------------------------------------------------------------ */
/*  Hard-tolerance ratios (applied below floor / above ceiling)        */
/* ------------------------------------------------------------------ */

const HARD_LOW_RATIO = 0.5;
const HARD_HIGH_RATIO = 1.6;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function typeKey(type: string): PropertyTypeKey {
  if (type === "apartment" || type === "condominium" || type === "house" || type === "villa") {
    return type;
  }
  return "apartment";
}

/**
 * Square-root area scaler — so a 200 m² unit is ≈ 1.4× the rent of a 100 m² unit
 * of the same type in the same sub-city, not 2×. Clamped to avoid extremes.
 */
function areaScaler(actual: number, reference: number): number {
  if (actual <= 0 || reference <= 0) return 1;
  const raw = Math.sqrt(actual / reference);
  return Math.max(0.55, Math.min(2.2, raw));
}

function lookupBaseBand(subCity: string, type: PropertyTypeKey): Band {
  return BASE_RENT_MATRIX[subCity]?.[type] ?? FALLBACK_BAND;
}

/* ------------------------------------------------------------------ */
/*  Public — soft band (per-area-adjusted recommended monthly rent)    */
/* ------------------------------------------------------------------ */

export function adjustedBand(
  subCity: string,
  propertyType: string,
  areaSqm = 0
): { min: number; max: number } {
  const tk = typeKey(propertyType);
  const [baseMin, baseMax] = lookupBaseBand(subCity, tk);

  if (areaSqm <= 0) {
    return { min: baseMin, max: baseMax };
  }

  const k = areaScaler(areaSqm, REFERENCE_AREA[tk]);
  return {
    min: Math.round(baseMin * k),
    max: Math.round(baseMax * k),
  };
}

/** Implied per-m² monthly rent — useful for tooltips / sanity checks */
export function rentPerSqm(monthlyRent: number, areaSqm: number): number | null {
  if (!areaSqm || areaSqm <= 0 || monthlyRent < 0) return null;
  return monthlyRent / areaSqm;
}

/* ------------------------------------------------------------------ */
/*  Legacy-compatible evaluator (used by older callers)                */
/* ------------------------------------------------------------------ */

export type RentGuidanceLevel = "within" | "soft_warning" | "hard_block";

export function evaluateMonthlyRent(input: {
  subCity: string;
  areaSqm: number;
  monthlyRent: number;
  propertyType: string;
}): {
  level: RentGuidanceLevel;
  perSqm: number | null;
  softMin: number;
  softMax: number;
  hardMin: number;
  hardMax: number;
} {
  const { min: softMin, max: softMax } = adjustedBand(
    input.subCity,
    input.propertyType,
    input.areaSqm
  );
  const perSqm = rentPerSqm(input.monthlyRent, input.areaSqm);
  const hardMin = Math.round(softMin * HARD_LOW_RATIO);
  const hardMax = Math.round(softMax * HARD_HIGH_RATIO);

  if (input.monthlyRent <= 0) {
    return { level: "hard_block", perSqm, softMin, softMax, hardMin, hardMax };
  }
  if (input.monthlyRent < hardMin || input.monthlyRent > hardMax) {
    return { level: "hard_block", perSqm, softMin, softMax, hardMin, hardMax };
  }
  if (input.monthlyRent < softMin || input.monthlyRent > softMax) {
    return { level: "soft_warning", perSqm, softMin, softMax, hardMin, hardMax };
  }
  return { level: "within", perSqm, softMin, softMax, hardMin, hardMax };
}

/** Sub-cities we have explicit benchmarks for */
export function benchmarkedSubCities(): readonly string[] {
  return SUB_CITIES as unknown as string[];
}

/* ------------------------------------------------------------------ */
/*  Government-policy-driven listing range                             */
/* ------------------------------------------------------------------ */

export interface PolicyCitation {
  id: string;
  title: string;
  detail: string;
}

export const POLICY_CITATIONS: PolicyCitation[] = [
  {
    id: "proc-1320",
    title: "Proclamation No. 1320/2016 (E.C.) — Residential Rent Control & Administration",
    detail:
      "Establishes a regulatory body that determines allowable rent fees considering economic conditions and other factors; rent increases are limited to once a year and require government approval.",
  },
  {
    id: "advance-cap",
    title: "Article 11 — Advance Payment Cap",
    detail:
      "Landlords cannot demand more than two (2) months of rent as advance payment. Listings exceeding the indicative ceiling are blocked from submission.",
  },
  {
    id: "lease-term",
    title: "Article 6 — Minimum Lease Term",
    detail:
      "Every residential rent agreement must run for a minimum of two (2) years; pricing must therefore be sustainable for the full lease horizon.",
  },
  {
    id: "annual-revision",
    title: "Annual Rent Revision",
    detail:
      "The regulator publishes annual indicative rent bands by sub-city and property type. Listings outside the band are reviewed by the DARA officer before activation.",
  },
];

export interface ListingRange {
  /** Absolute minimum — below this, submission is blocked */
  floor: number;
  /** Bottom of the regulator's indicative band (sweet-spot floor) */
  recommendedMin: number;
  /** Top of the regulator's indicative band (sweet-spot ceiling) */
  recommendedMax: number;
  /** Absolute maximum — above this, submission is blocked */
  ceiling: number;
  /** Suggested mid-point */
  mid: number;
  /** Equivalent per-m² rent at the recommended bounds (for the policy reference card) */
  perSqmMin: number;
  perSqmMax: number;
  /** Base (sub-city × type) band before the area scaler is applied — for traceability */
  baseMin: number;
  baseMax: number;
  /** How much the area scaled the base band (×) */
  areaFactor: number;
  citations: PolicyCitation[];
}

/**
 * Compute the **government-aligned monthly rent range** for a listing.
 *
 * Calculation:
 *   1. Look up the (subCity × propertyType) base band → [baseMin, baseMax]
 *      for a unit at the reference area (~80 m² apt, ~110 m² condo, ~160 m² house, ~280 m² villa).
 *   2. Multiply by an area scaler ≈ √(area / referenceArea), clamped to [0.55, 2.2].
 *   3. Apply hard-tolerance ratios for absolute floor / ceiling.
 */
export function computeListingRange(
  subCity: string,
  propertyType: string,
  areaSqm: number
): ListingRange | null {
  if (!subCity || !propertyType || areaSqm <= 0) return null;

  const tk = typeKey(propertyType);
  const [baseMin, baseMax] = lookupBaseBand(subCity, tk);
  const ref = REFERENCE_AREA[tk];
  const k = areaScaler(areaSqm, ref);

  const recommendedMin = Math.round(baseMin * k);
  const recommendedMax = Math.round(baseMax * k);
  const floor = Math.round(recommendedMin * HARD_LOW_RATIO);
  const ceiling = Math.round(recommendedMax * HARD_HIGH_RATIO);
  const mid = Math.round((recommendedMin + recommendedMax) / 2);

  return {
    floor,
    recommendedMin,
    recommendedMax,
    ceiling,
    mid,
    perSqmMin: Math.round(recommendedMin / areaSqm),
    perSqmMax: Math.round(recommendedMax / areaSqm),
    baseMin,
    baseMax,
    areaFactor: Math.round(k * 100) / 100,
    citations: POLICY_CITATIONS,
  };
}

/** Classify a chosen rent against the policy band */
export function classifyRent(
  rent: number,
  range: ListingRange
): "below_floor" | "below_band" | "within_band" | "above_band" | "above_ceiling" {
  if (rent < range.floor) return "below_floor";
  if (rent < range.recommendedMin) return "below_band";
  if (rent <= range.recommendedMax) return "within_band";
  if (rent <= range.ceiling) return "above_band";
  return "above_ceiling";
}
