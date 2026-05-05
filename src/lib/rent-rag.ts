import { computeListingRange, type ListingRange } from "@/lib/addis-rent-benchmarks";
import type { HomeCondition } from "@/lib/types";
import { RENT_RAG_CHUNKS, type RentKnowledgeChunk } from "@/data/rent-rag-knowledge";

/** Mid-point multipliers vs policy mid (before amenity micro-adjust) */
const CONDITION_MID_MULTIPLIER: Record<HomeCondition, number> = {
  new_build: 1.12,
  excellent: 1.07,
  good: 1.0,
  fair: 0.9,
  needs_renovation: 0.78,
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

export function retrieveRentChunks(
  query: string,
  topK = 4
): { chunk: RentKnowledgeChunk; score: number }[] {
  const q = query.toLowerCase();
  const qTokens = new Set(tokenize(query));
  const scored = RENT_RAG_CHUNKS.map((chunk) => {
    let score = 0;
    const blob = `${chunk.text} ${chunk.tags.join(" ")}`.toLowerCase();
    for (const t of qTokens) {
      if (t.length > 2 && blob.includes(t)) score += 1;
    }
    for (const tag of chunk.tags) {
      if (q.includes(tag.toLowerCase())) score += 2.5;
    }
    return { chunk, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);
  if (top.some((t) => t.score > 0)) return top;
  return RENT_RAG_CHUNKS.slice(0, topK).map((chunk) => ({ chunk, score: 0 }));
}

export interface RagSuggestInput {
  subCity: string;
  propertyType: string;
  areaSqm: number;
  homeCondition: HomeCondition;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  description?: string;
}

export interface RagSuggestResult {
  listingRange: ListingRange;
  suggestedMin: number;
  suggestedMax: number;
  suggestedMid: number;
  conditionMultiplier: number;
  amenityBump: number;
  retrieved: { id: string; score: number }[];
  contextText: string;
  localSummary: string;
}

function amenityBumpPct(amenities: string[]): number {
  const strong = ["Parking", "Generator", "Guard/Security", "Elevator"];
  let n = 0;
  for (const a of amenities) {
    if (strong.some((s) => a.toLowerCase().includes(s.toLowerCase()))) n++;
  }
  return Math.min(0.08, n * 0.025);
}

/**
 * RAG: retrieve chunks, build context, adjust recommended rent inside policy band.
 */
export function suggestRentWithRag(input: RagSuggestInput): RagSuggestResult | null {
  const range = computeListingRange(input.subCity, input.propertyType, input.areaSqm);
  if (!range) return null;

  const queryParts = [
    input.subCity,
    input.propertyType,
    input.homeCondition.replace(/_/g, " "),
    input.description ?? "",
    ...(input.amenities ?? []),
    `bedrooms ${input.bedrooms ?? ""}`,
    `bathrooms ${input.bathrooms ?? ""}`,
  ];
  const query = queryParts.join(" ");

  const retrieved = retrieveRentChunks(query, 5);
  const contextText = retrieved
    .map(({ chunk }) => `[${chunk.id}] ${chunk.text}`)
    .join("\n\n");

  const condMul = CONDITION_MID_MULTIPLIER[input.homeCondition] ?? 1;
  const bump = amenityBumpPct(input.amenities ?? []);
  const combined = condMul * (1 + bump);

  const rawMid = Math.round(range.mid * combined);
  const rawMin = Math.round(range.recommendedMin * combined);
  const rawMax = Math.round(range.recommendedMax * combined);

  const suggestedMid = Math.max(range.floor, Math.min(range.ceiling, rawMid));
  const suggestedMin = Math.max(range.floor, Math.min(suggestedMid, rawMin));
  const suggestedMax = Math.min(range.ceiling, Math.max(suggestedMid, rawMax));

  const localSummary =
    `Based on retrieved guidance for ${input.subCity} (${input.propertyType}, ~${input.areaSqm} m²) ` +
    `and home condition “${input.homeCondition.replace(/_/g, " ")}”, ` +
    `a reasonable ask is about ${suggestedMid.toLocaleString()} ETB/month (within the regulator band ${range.floor.toLocaleString()}–${range.ceiling.toLocaleString()}). ` +
    (bump > 0
      ? `Amenities add ~${Math.round(bump * 100)}% on top of the condition adjustment. `
      : "") +
    `Sources considered: ${retrieved.map((r) => r.chunk.id).join(", ")}.`;

  return {
    listingRange: range,
    suggestedMin,
    suggestedMax,
    suggestedMid,
    conditionMultiplier: condMul,
    amenityBump: bump,
    retrieved: retrieved.map((r) => ({ id: r.chunk.id, score: Math.round(r.score * 10) / 10 })),
    contextText,
    localSummary,
  };
}
