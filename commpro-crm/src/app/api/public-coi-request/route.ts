import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from "@/lib/supabase/config";

type CoiPayload = {
  insuredName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  holderName?: string;
  holderEmail?: string;
  holderAddress?: string;
  policyType?: string;
  neededBy?: string;
  notes?: string;
};

function trim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isMissingColumnError(message?: string | null) {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("could not find the") ||
    m.includes("schema cache")
  );
}

export async function POST(request: Request) {
  let body: CoiPayload;
  try {
    body = (await request.json()) as CoiPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const insuredName = trim(body.insuredName);
  const email = trim(body.email);
  const holderName = trim(body.holderName);
  const contactName = trim(body.contactName);
  const phone = trim(body.phone);
  const holderEmail = trim(body.holderEmail);
  const holderAddress = trim(body.holderAddress);
  const policyType = trim(body.policyType);
  const neededBy = trim(body.neededBy);
  const notes = trim(body.notes);

  if (!insuredName || !email || !holderName) {
    return NextResponse.json(
      { ok: false, error: "Insured/business name, your email, and certificate holder name are required." },
      { status: 400 },
    );
  }

  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Request could not be saved. Please call (973) 307-7007." },
      { status: 503 },
    );
  }

  const admin = createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const intakeAccountId = process.env.COI_INTAKE_ACCOUNT_ID?.trim() || null;
  const intakeAgencyId =
    process.env.COI_INTAKE_AGENCY_ID?.trim() ||
    process.env.DEFAULT_AGENCY_ID?.trim() ||
    null;

  const { data: leadId, error } = await admin.rpc("submit_website_coi_request", {
    p_insured_name: insuredName,
    p_email: email,
    p_holder_name: holderName,
    p_contact_name: contactName || null,
    p_phone: phone || null,
    p_holder_email: holderEmail || null,
    p_holder_address: holderAddress || null,
    p_policy_type: policyType || null,
    p_needed_by: neededBy || null,
    p_notes: notes || null,
    p_account_id: intakeAccountId,
    p_agency_id: intakeAgencyId,
  });

  if (!error) {
    return NextResponse.json({
      ok: true,
      message: "COI request received. We typically issue same business day.",
      leadId: leadId ?? null,
    });
  }

  console.error("[public-coi-request] rpc failed", error);

  // Fallback for projects that have not applied the RPC migration yet,
  // or where agencies.account_id is missing (common production drift).
  const fallback = await insertLeadFallback(admin, {
    insuredName,
    email,
    holderName,
    contactName,
    phone,
    holderEmail,
    holderAddress,
    policyType,
    neededBy,
    notes,
    intakeAccountId,
    intakeAgencyId,
  });

  if (!fallback.ok) {
    return NextResponse.json(
      { ok: false, error: fallback.error || "Request could not be saved. Please call (973) 307-7007." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "COI request received. We typically issue same business day.",
    leadId: fallback.leadId ?? null,
  });
}

async function findAnyAgency(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: { from: (table: string) => any },
): Promise<{ id: string; account_id?: string | null } | null> {
  {
    const { data, error } = await admin
      .from("agencies")
      .select("id, account_id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!error && data?.id) {
      return {
        id: String(data.id),
        account_id: data.account_id ? String(data.account_id) : null,
      };
    }
    if (error && isMissingColumnError(error.message)) {
      // retry without order / account_id
    } else if (error) {
      console.warn("[public-coi-request] findAnyAgency", error.message);
    }
  }

  const { data, error } = await admin.from("agencies").select("id").limit(1).maybeSingle();
  if (!error && data?.id) {
    return { id: String(data.id), account_id: null };
  }
  if (error) {
    console.warn("[public-coi-request] findAnyAgency id-only", error.message);
  }
  return null;
}

async function findAnyAccount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: { from: (table: string) => any },
): Promise<string | null> {
  const { data, error } = await admin
    .from("accounts")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!error && data?.id) return String(data.id);

  // Retry without order (created_at / schema cache issues)
  const retry = await admin.from("accounts").select("id").limit(1).maybeSingle();
  if (!retry.error && retry.data?.id) return String(retry.data.id);

  if (error && !isMissingColumnError(error.message)) {
    console.warn("[public-coi-request] findAnyAccount", error.message);
  }
  return null;
}

async function resolveIntakeTargets(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: { from: (table: string) => any },
  intakeAccountId: string | null,
  intakeAgencyId: string | null,
): Promise<{ accountId: string | null; agencyId: string | null; error?: string }> {
  let accountId = intakeAccountId;
  let agencyId = intakeAgencyId;

  // Prefer any existing agency (do NOT require agencies.account_id — production often lacks it)
  if (agencyId) {
    const { data, error } = await admin
      .from("agencies")
      .select("id, account_id")
      .eq("id", agencyId)
      .maybeSingle();
    if (error || !data?.id) {
      // Env id may be stale; fall through to discovery
      agencyId = null;
    } else if (!accountId && data.account_id) {
      accountId = String(data.account_id);
    }
  }

  if (!agencyId) {
    // Try agency linked to account when account_id column exists
    if (accountId) {
      const { data, error } = await admin
        .from("agencies")
        .select("id")
        .eq("account_id", accountId)
        .limit(1)
        .maybeSingle();
      if (!error && data?.id) {
        agencyId = String(data.id);
      }
    }
  }

  if (!agencyId) {
    const anyAgency = await findAnyAgency(admin);
    if (anyAgency?.id) {
      agencyId = anyAgency.id;
      if (!accountId && anyAgency.account_id) {
        accountId = anyAgency.account_id;
      }
    }
  }

  if (!accountId) {
    accountId = await findAnyAccount(admin);
  }

  // Last resort: create a Default Agency so public COI never dead-ends
  if (!agencyId) {
    const createAttempts: Record<string, unknown>[] = [];
    if (accountId) {
      createAttempts.push({ account_id: accountId, name: "Default Agency", status: "active" });
    }
    createAttempts.push({ name: "Default Agency", status: "active" });

    for (const row of createAttempts) {
      const { data, error } = await admin.from("agencies").insert(row).select("id").maybeSingle();
      if (!error && data?.id) {
        agencyId = String(data.id);
        break;
      }
      if (error) {
        console.warn("[public-coi-request] agency create", error.message);
      }
    }
  }

  if (!agencyId) {
    return {
      accountId,
      agencyId: null,
      error: "Request could not be routed. Please call (973) 307-7007.",
    };
  }

  return { accountId, agencyId };
}

async function insertLeadFallback(
  // Loose typing: service-role client generics vary by supabase-js version.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: { from: (table: string) => any },
  input: {
    insuredName: string;
    email: string;
    holderName: string;
    contactName: string;
    phone: string;
    holderEmail: string;
    holderAddress: string;
    policyType: string;
    neededBy: string;
    notes: string;
    intakeAccountId: string | null;
    intakeAgencyId: string | null;
  },
) {
  const targets = await resolveIntakeTargets(
    admin,
    input.intakeAccountId,
    input.intakeAgencyId,
  );
  if (!targets.agencyId) {
    return {
      ok: false as const,
      error: targets.error || "Request could not be routed. Please call (973) 307-7007.",
    };
  }

  const accountId = targets.accountId;
  const agencyId = targets.agencyId;

  const summary = [
    "PUBLIC COI REQUEST",
    `Insured / Business: ${input.insuredName}`,
    `Requestor Name: ${input.contactName || "N/A"}`,
    `Requestor Email: ${input.email}`,
    `Requestor Phone: ${input.phone || "N/A"}`,
    `Certificate Holder: ${input.holderName}`,
    `Holder Email: ${input.holderEmail || "N/A"}`,
    `Holder Address: ${input.holderAddress || "N/A"}`,
    `Coverage / Policy Type: ${input.policyType || "N/A"}`,
    `Needed By: ${input.neededBy || "ASAP"}`,
    `Additional Instructions: ${input.notes || "N/A"}`,
  ].join("\n");

  const base = {
    agency_id: agencyId,
    first_name: input.contactName || "COI",
    last_name: input.contactName ? null : "Request",
    business_name: input.insuredName,
    email: input.email,
    phone: input.phone || null,
    source: "website-coi",
    stage: "new",
    line_of_business: input.policyType || "COI Request",
    ai_notes: summary,
  };

  const attempts: Record<string, unknown>[] = [
    {
      ...base,
      ...(accountId ? { account_id: accountId } : {}),
      external_source: "website-coi",
      external_id: `${input.email.toLowerCase()}-${Date.now()}`,
      raw_data: {
        insuredName: input.insuredName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        holderName: input.holderName,
        holderEmail: input.holderEmail,
        holderAddress: input.holderAddress,
        policyType: input.policyType,
        neededBy: input.neededBy,
        notes: input.notes,
        submittedAt: new Date().toISOString(),
      },
    },
    {
      ...base,
      ...(accountId ? { account_id: accountId } : {}),
      external_source: "website-coi",
      external_id: `${input.email.toLowerCase()}-${Date.now()}`,
    },
    {
      ...base,
      ...(accountId ? { account_id: accountId } : {}),
    },
    { ...base },
  ];

  let lastError: { message: string } | null = null;
  for (const payload of attempts) {
    const { data, error } = await admin.from("leads").insert(payload).select("id").maybeSingle();
    if (!error) {
      return { ok: true as const, leadId: data?.id ? String(data.id) : null };
    }
    lastError = error;
    // Keep trying leaner payloads for missing-column / null-account cases
    console.warn("[public-coi-request] lead insert attempt failed", error.message);
  }

  console.error("[public-coi-request] fallback insert failed", lastError);
  return { ok: false as const, error: "Request could not be saved. Please call (973) 307-7007." };
}
