/**
 * Knowledge chunks for rent RAG — indicative Addis Ababa market & condition premia.
 * Not legal advice; UX guidance only. Retrieval augments landlord pricing at registration.
 */
export interface RentKnowledgeChunk {
  id: string;
  text: string;
  /** Tokens used for lexical retrieval */
  tags: string[];
}

export const RENT_RAG_CHUNKS: RentKnowledgeChunk[] = [
  {
    id: "cond-new",
    tags: ["new_build", "new", "construction", "first", "occupancy", "shell"],
    text: "Newly delivered or never-occupied units (clean shell / first occupancy) typically command 8–15% above the median for the same sub-city and property type, because tenants avoid immediate maintenance and expect modern finishes.",
  },
  {
    id: "cond-excellent",
    tags: ["excellent", "renovated", "upgraded", "modern", "high", "finish"],
    text: "Recently renovated or excellent-condition homes with upgraded kitchen/bath and solid mechanicals justify roughly 5–10% over the neighbourhood typical, comparable to a half-step toward new-build pricing.",
  },
  {
    id: "cond-good",
    tags: ["good", "well", "maintained", "standard", "average"],
    text: "Good, well-maintained stock with ordinary wear matches the published indicative band for the sub-city and type; use the regulator mid-range as the anchor before minor amenity adjustments.",
  },
  {
    id: "cond-fair",
    tags: ["fair", "lived", "older", "cosmetic", "dated"],
    text: "Fair / lived-in units with dated finishes or pending cosmetic work usually trade 8–12% below the band midpoint unless location is exceptionally prime; price to attract tenants who will tolerate minor fixes.",
  },
  {
    id: "cond-needs",
    tags: ["needs", "renovation", "major", "repair", "structural", "fixer"],
    text: "Properties needing significant renovation or with deferred maintenance may need 20–35% haircut versus the indicative midpoint for the same footprint; disclose issues to avoid DARA disputes.",
  },
  {
    id: "loc-tier-prime",
    tags: ["Bole", "Kirkos", "Kazanchis", "Arada", "prime", "central"],
    text: "Prime central sub-cities (Bole, Kirkos, Lideta core, parts of Arada) show the highest rent dispersion: finishing quality and parking swing rents more than raw square metres.",
  },
  {
    id: "loc-tier-outer",
    tags: ["Akaky", "Kaliti", "Lemi", "Kolfe", "outer", "peri"],
    text: "Outer-ring and peri-urban sub-cities cluster tighter around the lower half of indicative bands; condition premia/discounts still apply but with smaller absolute ETB spread.",
  },
  {
    id: "type-villa-house",
    tags: ["villa", "house", "garden", "duplex", "stand", "alone"],
    text: "Detached houses and villas are more sensitive to plot size, generator, and guard services than apartments; a 'needs work' villa may still sit high in absolute ETB if land value is strong.",
  },
  {
    id: "amenity-premium",
    tags: ["parking", "elevator", "generator", "balcony", "security", "internet"],
    text: "Strong amenity bundles (reserved parking, backup generator, elevator in mid-rise, 24h guard) often add 3–8% on top of condition-adjusted rent versus a bare comparable in the same building class.",
  },
  {
    id: "policy-band",
    tags: ["DARA", "regulator", "proclamation", "1320", "band", "indicative"],
    text: "Listings must stay within the platform's computed floor-to-ceiling band derived from indicative sub-city × type tables; RAG adjusts the recommended point inside that band based on home condition and features.",
  },
];
