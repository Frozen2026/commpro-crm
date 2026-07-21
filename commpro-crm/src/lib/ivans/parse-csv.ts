import {
  normalizeDate,
  normalizePhone,
  normalizeStatus,
  pickField,
  type IvansNormalizedPolicy,
  type IvansParseResult,
} from "@/lib/ivans/types";

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    // Skip fully empty rows
    if (row.some((c) => c.trim())) rows.push(row);
    row = [];
  };

  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]!;
    const next = input[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === "\t") {
      pushCell();
    } else if (ch === "\n") {
      pushCell();
      pushRow();
    } else if (ch === "\r") {
      // ignore
    } else {
      cell += ch;
    }
  }
  pushCell();
  pushRow();
  return rows;
}

export function parseIvansCsv(text: string): IvansParseResult {
  const warnings: string[] = [];
  const table = parseCsvRows(text);
  if (table.length < 2) {
    return { format: "csv", policies: [], warnings: ["CSV has no data rows."] };
  }

  const headers = table[0]!.map((h) => h.trim());
  const policies: IvansNormalizedPolicy[] = [];

  for (let i = 1; i < table.length; i += 1) {
    const values = table[i]!;
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });

    const businessName =
      pickField(row, [
        "business_name",
        "insured_name",
        "named_insured",
        "client_name",
        "account_name",
        "company_name",
      ]) || "";
    const policyNumber =
      pickField(row, ["policy_number", "policy_no", "policynumber", "policy#", "policy"]) || "";
    const carrierName =
      pickField(row, ["carrier_name", "carrier", "company", "writing_company", "insurer"]) || "Unknown Carrier";
    const lineOfBusiness =
      pickField(row, ["line_of_business", "lob", "coverage", "product", "policy_type"]) || "Commercial";

    if (!businessName || !policyNumber) {
      warnings.push(`Row ${i + 1}: skipped (needs insured/business name and policy number).`);
      continue;
    }

    policies.push({
      externalId: pickField(row, ["external_id", "ivans_id", "transaction_id", "id"]),
      businessName,
      insuredFirstName: pickField(row, ["first_name", "insured_first_name"]),
      insuredLastName: pickField(row, ["last_name", "insured_last_name"]),
      email: pickField(row, ["email", "insured_email", "contact_email"]),
      phone: normalizePhone(pickField(row, ["phone", "insured_phone", "contact_phone"])),
      address: pickField(row, ["address", "street", "mailing_address"]),
      city: pickField(row, ["city"]),
      state: pickField(row, ["state"]),
      zip: pickField(row, ["zip", "postal_code", "zipcode"]),
      carrierName,
      policyNumber,
      lineOfBusiness,
      status: normalizeStatus(pickField(row, ["status", "policy_status"])),
      premium: Number(pickField(row, ["premium", "annual_premium", "written_premium"]) || "") || undefined,
      effectiveDate: normalizeDate(pickField(row, ["effective_date", "eff_date", "inception_date"])),
      expirationDate: normalizeDate(pickField(row, ["expiration_date", "exp_date", "expiry_date"])),
      raw: row,
    });
  }

  return { format: "csv", policies, warnings };
}
