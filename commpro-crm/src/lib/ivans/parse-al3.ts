import {
  normalizeDate,
  normalizePhone,
  normalizeStatus,
  type IvansNormalizedPolicy,
  type IvansParseResult,
} from "@/lib/ivans/types";

/**
 * Pragmatic ACORD AL3 parser for common commercial download groups.
 * AL3 is carrier-quirky; this extracts best-effort named insured + policy fields
 * from group/element style text commonly found in mailbox downloads.
 */
export function parseIvansAl3(text: string): IvansParseResult {
  const warnings: string[] = [];
  const policies: IvansNormalizedPolicy[] = [];

  // Split into transactions on 1MHG / 2TCG headers when present.
  const chunks = text
    .split(/(?=1MHG|2TCG)/i)
    .map((c) => c.trim())
    .filter(Boolean);

  const units = chunks.length ? chunks : [text];

  for (const [index, unit] of units.entries()) {
    const elements = extractElements(unit);

    const businessName =
      elements["5G1.01"] ||
      elements["5G1.02"] ||
      elements["NAMED_INSURED"] ||
      elements["INSURED_NAME"] ||
      findByLabel(unit, [/named\s+insured[:\s]+(.+)/i, /insured name[:\s]+(.+)/i]);

    const policyNumber =
      elements["6L1.01"] ||
      elements["POLICY_NUMBER"] ||
      findByLabel(unit, [/policy\s*(?:number|no\.?|#)[:\s]+([A-Z0-9\-]+)/i]);

    const carrierName =
      elements["CARRIER"] ||
      elements["COMPANY_NAME"] ||
      findByLabel(unit, [/carrier[:\s]+(.+)/i, /company[:\s]+(.+)/i]) ||
      "Unknown Carrier";

    const lineOfBusiness =
      elements["6L1.02"] ||
      elements["LOB"] ||
      findByLabel(unit, [/line of business[:\s]+(.+)/i, /\bLOB[:\s]+(.+)/i]) ||
      "Commercial";

    const effectiveDate = normalizeDate(
      elements["6L1.03"] || findByLabel(unit, [/effective[:\s]+([0-9\/\-]+)/i]),
    );
    const expirationDate = normalizeDate(
      elements["6L1.04"] || findByLabel(unit, [/expir(?:ation|y)[:\s]+([0-9\/\-]+)/i]),
    );
    const status = normalizeStatus(elements["STATUS"] || findByLabel(unit, [/status[:\s]+([A-Za-z ]+)/i]));
    const email = elements["EMAIL"] || findByLabel(unit, [/email[:\s]+(\S+@\S+)/i]);
    const phone = normalizePhone(elements["PHONE"] || findByLabel(unit, [/phone[:\s]+([0-9()\-\s.]+)/i]));

    if (!businessName || !policyNumber) {
      warnings.push(`AL3 transaction ${index + 1}: could not find named insured and policy number.`);
      continue;
    }

    policies.push({
      businessName: clean(businessName),
      carrierName: clean(carrierName),
      policyNumber: clean(policyNumber),
      lineOfBusiness: clean(lineOfBusiness),
      status,
      effectiveDate,
      expirationDate,
      email: email ? clean(email) : undefined,
      phone,
      raw: elements,
    });
  }

  if (!policies.length && !warnings.length) {
    warnings.push("No AL3 policy transactions detected.");
  }

  return { format: "al3", policies, warnings };
}

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function findByLabel(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function extractElements(text: string): Record<string, string> {
  const out: Record<string, string> = {};

  // Patterns like: 5G1.01=ACME LLC  or  6L1 01 ACME...
  const eqMatches = text.matchAll(/\b([0-9A-Z]{2,4}\.[0-9]{2})\s*[:=]\s*([^\n|;]+)/gi);
  for (const match of eqMatches) {
    out[match[1]!.toUpperCase()] = match[2]!.trim();
  }

  const spaced = text.matchAll(/\b([0-9][A-Z][0-9])\s+([0-9]{2})\s+([^\n]+)/gi);
  for (const match of spaced) {
    out[`${match[1]!.toUpperCase()}.${match[2]}`] = match[3]!.trim();
  }

  // KEY=VALUE pairs
  const kv = text.matchAll(/\b([A-Z][A-Z0-9_]{2,})\s*[:=]\s*([^\n|;]+)/g);
  for (const match of kv) {
    out[match[1]!.toUpperCase()] = match[2]!.trim();
  }

  return out;
}
