import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/supabase/config";

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

  const summary = [
    "PUBLIC COI REQUEST",
    `Insured / Business: ${insuredName}`,
    `Requestor Name: ${contactName || "N/A"}`,
    `Requestor Email: ${email}`,
    `Requestor Phone: ${phone || "N/A"}`,
    `Certificate Holder: ${holderName}`,
    `Holder Email: ${holderEmail || "N/A"}`,
    `Holder Address: ${holderAddress || "N/A"}`,
    `Coverage / Policy Type: ${policyType || "N/A"}`,
    `Needed By: ${neededBy || "ASAP"}`,
    `Additional Instructions: ${notes || "N/A"}`,
  ].join("\n");

  if (!supabaseServiceRoleKey) {
    console.error("[public-coi-request] Missing SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json(
      {
        ok: false,
        error: "Request could not be saved. Please call (973) 307-7007.",
      },
      { status: 503 },
    );
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const intakeAccountId = process.env.COI_INTAKE_ACCOUNT_ID?.trim() || "";
  const intakeAgencyId = process.env.COI_INTAKE_AGENCY_ID?.trim() || "";

  let accountId = intakeAccountId;
  let agencyId = intakeAgencyId;

  if (!accountId) {
    const { data: account, error: accountError } = await admin
      .from("accounts")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (accountError || !account?.id) {
      console.error("[public-coi-request] account lookup failed", accountError);
      return NextResponse.json(
        { ok: false, error: "Request could not be routed. Please call (973) 307-7007." },
        { status: 503 },
      );
    }
    accountId = account.id;
  }

  if (!agencyId) {
    const { data: agency, error: agencyError } = await admin
      .from("agencies")
      .select("id")
      .eq("account_id", accountId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (agencyError || !agency?.id) {
      console.error("[public-coi-request] agency lookup failed", agencyError);
      return NextResponse.json(
        { ok: false, error: "Request could not be routed. Please call (973) 307-7007." },
        { status: 503 },
      );
    }
    agencyId = agency.id;
  }

  const firstName = contactName || "COI";
  const lastName = contactName ? null : "Request";

  const { error: insertError } = await admin.from("leads").insert({
    account_id: accountId,
    agency_id: agencyId,
    first_name: firstName,
    last_name: lastName,
    business_name: insuredName,
    email,
    phone: phone || null,
    source: "website-coi",
    stage: "new",
    line_of_business: policyType || "COI Request",
    ai_notes: summary,
    external_source: "website-coi",
    external_id: `${email.toLowerCase()}-${Date.now()}`,
    raw_data: {
      insuredName,
      contactName,
      email,
      phone,
      holderName,
      holderEmail,
      holderAddress,
      policyType,
      neededBy,
      notes,
      submittedAt: new Date().toISOString(),
    },
  });

  if (insertError) {
    console.error("[public-coi-request] lead insert failed", insertError);
    return NextResponse.json(
      { ok: false, error: "Request could not be saved. Please call (973) 307-7007." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "COI request received. We typically issue same business day.",
  });
}
