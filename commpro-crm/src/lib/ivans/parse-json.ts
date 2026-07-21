import {
  normalizeDate,
  normalizePhone,
  normalizeStatus,
  type IvansNormalizedPolicy,
  type IvansParseResult,
} from "@/lib/ivans/types";

/**
 * Parse Policy Center / IVANS JSON exports (array or { policies: [] } shapes).
 */
export function parseIvansJson(text: string): IvansParseResult {
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { format: "json", policies: [], warnings: ["Invalid JSON."] };
  }

  const rows = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { policies?: unknown })?.policies)
      ? ((parsed as { policies: unknown[] }).policies as unknown[])
      : Array.isArray((parsed as { data?: unknown })?.data)
        ? ((parsed as { data: unknown[] }).data as unknown[])
        : null;

  if (!rows) {
    return { format: "json", policies: [], warnings: ["JSON must be an array of policies or { policies: [] }."] };
  }

  const policies: IvansNormalizedPolicy[] = [];

  rows.forEach((row, index) => {
    if (!row || typeof row !== "object") {
      warnings.push(`Item ${index + 1}: not an object.`);
      return;
    }
    const r = row as Record<string, unknown>;
    const businessName = str(
      r.businessName ?? r.business_name ?? r.insuredName ?? r.namedInsured ?? r.clientName,
    );
    const policyNumber = str(r.policyNumber ?? r.policy_number ?? r.policyNo ?? r.policy);
    const carrierName = str(r.carrierName ?? r.carrier_name ?? r.carrier ?? r.company) || "Unknown Carrier";
    const lineOfBusiness =
      str(r.lineOfBusiness ?? r.line_of_business ?? r.lob ?? r.coverage) || "Commercial";

    if (!businessName || !policyNumber) {
      warnings.push(`Item ${index + 1}: skipped (needs insured name and policy number).`);
      return;
    }

    policies.push({
      externalId: str(r.externalId ?? r.id ?? r.transactionId),
      businessName,
      insuredFirstName: str(r.firstName ?? r.insuredFirstName),
      insuredLastName: str(r.lastName ?? r.insuredLastName),
      email: str(r.email),
      phone: normalizePhone(str(r.phone)),
      address: str(r.address ?? r.street),
      city: str(r.city),
      state: str(r.state),
      zip: str(r.zip ?? r.postalCode),
      carrierName,
      policyNumber,
      lineOfBusiness,
      status: normalizeStatus(str(r.status)),
      premium: num(r.premium),
      effectiveDate: normalizeDate(str(r.effectiveDate ?? r.effective_date)),
      expirationDate: normalizeDate(str(r.expirationDate ?? r.expiration_date)),
      raw: r,
    });
  });

  return { format: "json", policies, warnings };
}

function str(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return undefined;
}
