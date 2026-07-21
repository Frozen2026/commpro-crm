export type IvansNormalizedPolicy = {
  externalId?: string;
  businessName: string;
  insuredFirstName?: string;
  insuredLastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  carrierName: string;
  policyNumber: string;
  lineOfBusiness: string;
  status: "active" | "pending" | "cancelled" | "expired" | "non_renewed";
  premium?: number;
  effectiveDate?: string;
  expirationDate?: string;
  raw?: Record<string, unknown>;
};

export type IvansParseResult = {
  format: "csv" | "tsv" | "json" | "al3" | "unknown";
  policies: IvansNormalizedPolicy[];
  warnings: string[];
};

export type IvansImportSummary = {
  createdClients: number;
  updatedClients: number;
  createdPolicies: number;
  updatedPolicies: number;
  skipped: number;
  errors: string[];
  policies: IvansNormalizedPolicy[];
};

export type IvansMailboxFile = {
  id: string;
  filename?: string;
  remoteName?: string;
  size?: number;
  compressedSize?: number;
  receivedAt?: string;
  classCode?: string;
  sendAccount?: string;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeStatus(value?: string): IvansNormalizedPolicy["status"] {
  const v = (value ?? "").trim().toLowerCase();
  if (["active", "inforce", "in force", "bound"].includes(v)) return "active";
  if (["pending", "quote", "application"].includes(v)) return "pending";
  if (["cancelled", "canceled", "cancel"].includes(v)) return "cancelled";
  if (["expired", "lapse", "lapsed"].includes(v)) return "expired";
  if (["non_renewed", "nonrenewed", "non-renewed"].includes(v)) return "non_renewed";
  return "active";
}

export function normalizeDate(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const raw = value.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  // MM/DD/YYYY
  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }
  // YYYYMMDD
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return undefined;
}

export function normalizePhone(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const digits = digitsOnly(value);
  return digits || undefined;
}

export function pickField(row: Record<string, string>, keys: string[]): string | undefined {
  const entries = Object.entries(row);
  for (const key of keys) {
    const needle = key.toLowerCase().replace(/[\s_-]+/g, "");
    const hit = entries.find(([k]) => k.toLowerCase().replace(/[\s_-]+/g, "") === needle);
    if (hit?.[1]?.trim()) return hit[1].trim();
  }
  return undefined;
}
