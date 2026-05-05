import { NextResponse } from "next/server";
import { suggestRentWithRag } from "@/lib/rent-rag";
import type { HomeCondition } from "@/lib/types";

const CONDITIONS: HomeCondition[] = [
  "new_build",
  "excellent",
  "good",
  "fair",
  "needs_renovation",
];

function isHomeCondition(s: string): s is HomeCondition {
  return CONDITIONS.includes(s as HomeCondition);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const subCity = String(body.subCity ?? "").trim();
    const propertyType = String(body.propertyType ?? "").trim();
    const areaSqm = Number(body.areaSqm);
    const homeConditionRaw = String(body.homeCondition ?? "good").trim();
    const homeCondition = isHomeCondition(homeConditionRaw) ? homeConditionRaw : "good";

    if (!subCity || !propertyType || !Number.isFinite(areaSqm) || areaSqm <= 0) {
      return NextResponse.json({ error: "Invalid location or area" }, { status: 400 });
    }

    const result = suggestRentWithRag({
      subCity,
      propertyType,
      areaSqm,
      homeCondition,
      bedrooms: body.bedrooms != null ? Number(body.bedrooms) : undefined,
      bathrooms: body.bathrooms != null ? Number(body.bathrooms) : undefined,
      amenities: Array.isArray(body.amenities)
        ? body.amenities.map((x: unknown) => String(x))
        : undefined,
      description: body.description != null ? String(body.description) : undefined,
    });

    if (!result) {
      return NextResponse.json({ error: "Could not compute range" }, { status: 400 });
    }

    let summary = result.localSummary;
    let source: "local-rag" | "openai" = "local-rag";

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.3,
            max_tokens: 280,
            messages: [
              {
                role: "system",
                content:
                  "You are a concise assistant for Ethiopian residential landlords. " +
                  "Use ONLY the provided CONTEXT passages and the NUMBERS given. " +
                  "Output 2–4 short sentences: suggested rent, how home condition affects it, stay within the policy band. " +
                  "Do not invent new ETB figures beyond the suggested mid and band.",
              },
              {
                role: "user",
                content: `CONTEXT:\n${result.contextText}\n\nNUMBERS:\n` +
                  `Policy floor ${result.listingRange.floor}, ceiling ${result.listingRange.ceiling}. ` +
                  `Recommended band ${result.listingRange.recommendedMin}–${result.listingRange.recommendedMax}. ` +
                  `RAG suggested mid ${result.suggestedMid} ETB/month. ` +
                  `Condition multiplier ${result.conditionMultiplier}, amenity bump ${result.amenityBump}. ` +
                  `Unit: ${subCity}, ${propertyType}, ${areaSqm} m², condition: ${homeCondition}.`,
              },
            ],
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) {
            summary = text;
            source = "openai";
          }
        }
      } catch {
        /* keep local summary */
      }
    }

    return NextResponse.json({
      suggestedMin: result.suggestedMin,
      suggestedMax: result.suggestedMax,
      suggestedMid: result.suggestedMid,
      summary,
      source,
      retrievedChunkIds: result.retrieved.map((r) => r.id),
      conditionMultiplier: result.conditionMultiplier,
      amenityBump: result.amenityBump,
      policyFloor: result.listingRange.floor,
      policyCeiling: result.listingRange.ceiling,
    });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
