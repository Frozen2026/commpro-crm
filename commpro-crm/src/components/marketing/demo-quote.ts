export type QuoteResult = {
  risk_score: number;
  risk_label: string;
  risk_color: string;
  risk_summary: string;
  module_used: string;
  carriers_approached: string[];
  quotes: Array<{
    carrier: string;
    annual_premium: number;
    building_limit: string;
    gl_limit: string;
    deductible: string;
    wind_deductible: string;
    carrier_rating: string;
    bindable: boolean;
    recommended: boolean;
    notes: string;
  }>;
  declined_carriers: Array<{ carrier: string; reason: string }>;
  recommendation: string;
  coverage_gaps: string[];
  next_steps: string;
};

export type QuoteRequest = {
  propertyType: string;
  moduleLabel: string;
  address: string;
  yearBuilt: string;
  sqft: string;
  tiv: string;
  construction: string;
  roofYear: string;
  roofType: string;
  losses: string;
  sprinklers: string;
  coverages: string[];
  extras: Record<string, string>;
  rules: string;
  appetite: string;
};

function parseTiv(tiv: string) {
  const n = Number(String(tiv).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 2_000_000;
}

function scoreRisk(input: QuoteRequest) {
  let score = 42;
  if (input.losses === "minor") score += 12;
  if (input.losses === "moderate") score += 22;
  if (input.losses === "significant") score += 35;
  if (input.sprinklers === "partial") score += 6;
  if (input.sprinklers === "none") score += 14;
  if (input.propertyType === "restaurant") score += 18;
  if (input.propertyType === "hotel") score += 10;
  if (input.propertyType === "contractor") score += 8;
  const year = Number(input.yearBuilt);
  if (year && year < 1980) score += 10;
  if (year && year < 1960) score += 8;
  const roofYear = Number(input.roofYear);
  if (roofYear && new Date().getFullYear() - roofYear > 20) score += 12;
  return Math.max(18, Math.min(92, score));
}

export function buildDemoQuote(input: QuoteRequest): QuoteResult {
  const tiv = parseTiv(input.tiv);
  const risk = scoreRisk(input);
  const baseRate = input.propertyType === "restaurant" ? 0.0095 : input.propertyType === "hotel" ? 0.0075 : 0.0058;
  const lossMult = input.losses === "none" ? 0.92 : input.losses === "minor" ? 1 : input.losses === "moderate" ? 1.18 : 1.35;
  const spkMult = input.sprinklers === "full" ? 0.94 : input.sprinklers === "partial" ? 1 : 1.12;
  const premium = Math.round(tiv * baseRate * lossMult * spkMult);

  const quotes = [
    {
      carrier: "Nationwide",
      annual_premium: premium,
      building_limit: input.tiv || `$${tiv.toLocaleString()}`,
      gl_limit: "$1M/$2M",
      deductible: "$5,000",
      wind_deductible: "2% TIV",
      carrier_rating: "A+ (AM Best)",
      bindable: risk < 70,
      recommended: true,
      notes: `Strong appetite match for ${input.moduleLabel.toLowerCase()} based on construction, sprinklers, and loss history.`,
    },
    {
      carrier: "The Hartford",
      annual_premium: Math.round(premium * 1.08),
      building_limit: input.tiv || `$${tiv.toLocaleString()}`,
      gl_limit: "$1M/$2M",
      deductible: "$5,000",
      wind_deductible: "2% TIV",
      carrier_rating: "A+ (AM Best)",
      bindable: risk < 75,
      recommended: false,
      notes: "Competitive on package pricing; may require updated roof documentation.",
    },
    {
      carrier: "Markel Digital",
      annual_premium: Math.round(premium * 1.16),
      building_limit: input.tiv || `$${tiv.toLocaleString()}`,
      gl_limit: "$1M/$2M",
      deductible: "$10,000",
      wind_deductible: "3% TIV",
      carrier_rating: "A (AM Best)",
      bindable: true,
      recommended: false,
      notes: "Flexible on non-standard features; higher deductible offsets premium.",
    },
  ];

  const declined =
    risk > 78
      ? [{ carrier: "Coterie", reason: "Risk score and loss profile outside small-commercial API appetite." }]
      : [{ carrier: "Coterie", reason: "TIV / occupancy outside instant-bind small commercial guidelines." }];

  const risk_label = risk < 40 ? "Favorable" : risk < 65 ? "Moderate" : risk < 80 ? "Elevated" : "High";
  const risk_color = risk < 40 ? "#22c55e" : risk < 65 ? "#f59e0b" : "#ef4444";

  const gaps = [
    !input.coverages.includes("Umbrella") ? "No umbrella / excess liability selected" : null,
    input.propertyType === "restaurant" && !input.coverages.includes("Food Spoilage")
      ? "Food spoilage not selected for restaurant occupancy"
      : null,
    input.propertyType === "contractor" && !input.coverages.some((c) => c.includes("Inland Marine"))
      ? "Tools / inland marine floater not selected for contractor yard"
      : null,
  ].filter(Boolean) as string[];

  return {
    risk_score: risk,
    risk_label,
    risk_color,
    risk_summary: `${input.moduleLabel} at ${input.address || "the submitted location"} scores ${risk}/100 (${risk_label}) using year built ${input.yearBuilt}, ${input.construction.replaceAll("_", " ")}, ${input.sprinklers} sprinklers, and ${input.losses} loss history.`,
    module_used: input.moduleLabel,
    carriers_approached: ["Coterie", "The Hartford", "Markel Digital", "Nationwide", "Liberty Mutual"],
    quotes,
    declined_carriers: declined,
    recommendation: `${quotes[0].carrier} is the best fit for this ${input.moduleLabel.toLowerCase()} risk at approximately $${quotes[0].annual_premium.toLocaleString()}/year, balancing appetite fit, deductible structure, and bindability.`,
    coverage_gaps: gaps.length
      ? gaps
      : ["No major coverage gaps detected in the selected lines — confirm flood zone and ordinance/law separately."],
    next_steps:
      "Review the recommended quote, confirm loss runs and roof documentation, then call (973) 307-7007 or request a COI once bound. Demo quotes are illustrative only.",
  };
}
