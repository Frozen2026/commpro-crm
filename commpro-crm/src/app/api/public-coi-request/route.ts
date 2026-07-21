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
  const intakeAgencyId = process.env.COI_INTAKE_AGENCY_ID?.trim() || null;

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

  if (error) {
    console.error("[public-coi-request] rpc failed", error);

    // Fallback for projects that have not applied the RPC migration yet.
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
  }

  return NextResponse.json({
    ok: true,
    message: "COI request received. We typically issue same business day.",
    leadId: leadId ?? null,
  });
}

async function insertLeadFallback(
  admin: ReturnType<typeof createClient>,
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
  let accountId = input.intakeAccountId;
  let agencyId = input.intakeAgencyId;

  if (!accountId) {
    const { data: account, error } = await admin
      .from("accounts")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !account?.id) {
      return { ok: false as const, error: "Request could not be routed. Please call (973) 307-7007." };
    }
    accountId = account.id;
  }

  if (!agencyId) {
    const { data: agency, error } = await admin
      .from("agencies")
      .select("id")
      .eq("account_id", accountId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !agency?.id) {
      return { ok: false as const, error: "Request could not be routed. Please call (973) 307-7007." };
    }
    agencyId = agency.id;
  }

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

  const { error: insertError } = await admin.from("leads").insert({
    account_id: accountId,
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
  });

  if (insertError) {
    console.error("[public-coi-request] fallback insert failed", insertError);
    return { ok: false as const, error: "Request could not be saved. Please call (973) 307-7007." };
  }

  return { ok: true as const };
}
