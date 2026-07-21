import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { generateCoiPdfBytes, pdfBytesToBase64 } from "@/lib/coi/generate-coi-pdf";
import {
  findClientsForCoi,
  loadActivePoliciesForClient,
  pickConfidentClient,
  resolveIntakeAccountId,
  resolveIntakeAgencyId,
} from "@/lib/coi/lookup-client";
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

  const intakeAccountIdEnv = process.env.COI_INTAKE_ACCOUNT_ID?.trim() || null;
  const intakeAgencyIdEnv = process.env.COI_INTAKE_AGENCY_ID?.trim() || null;

  const accountId = await resolveIntakeAccountId(admin, intakeAccountIdEnv);
  if (!accountId) {
    return NextResponse.json(
      { ok: false, error: "Request could not be routed. Please call (973) 307-7007." },
      { status: 503 },
    );
  }

  const agencyId = await resolveIntakeAgencyId(admin, accountId, intakeAgencyIdEnv);
  if (!agencyId) {
    return NextResponse.json(
      { ok: false, error: "Request could not be routed. Please call (973) 307-7007." },
      { status: 503 },
    );
  }

  // Always log a lead for audit / follow-up.
  const leadResult = await createCoiLead(admin, {
    accountId,
    agencyId,
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
  });

  // Match CRM client + active policies, then auto-issue PDF when confident.
  let issueStatus: "issued" | "queued" | "no_policies" | "ambiguous" = "queued";
  let matchedClient: { id: string; businessName: string | null } | null = null;
  let policySummaries: Array<{
    id: string;
    policyNumber: string | null;
    carrierName: string | null;
    lineOfBusiness: string | null;
  }> = [];
  let pdfBase64: string | null = null;
  let pdfFilename: string | null = null;
  let message = "COI request received. We typically issue same business day.";

  try {
    const candidates = await findClientsForCoi(admin, accountId, { insuredName, email, phone });
    const client = pickConfidentClient(candidates);

    if (!client && candidates.length > 1) {
      issueStatus = "ambiguous";
      message =
        "We found multiple matching clients. Your request was saved — our team will confirm and issue the COI shortly.";
    } else if (!client) {
      issueStatus = "queued";
      message =
        "We could not automatically match this insured in our CRM. Your request was saved — we typically issue same business day.";
    } else {
      matchedClient = { id: client.id, businessName: client.business_name };
      const policies = await loadActivePoliciesForClient(admin, accountId, client.id, policyType || undefined);

      if (!policies.length) {
        issueStatus = "no_policies";
        message =
          "We matched your account but found no active policies. Your request was saved — our team will follow up.";
      } else {
        const bytes = await generateCoiPdfBytes({
          insuredName: client.business_name || insuredName,
          requesterName: contactName,
          requesterPhone: phone,
          requesterEmail: email,
          certificateHolderName: holderName,
          certificateHolderAddress: holderAddress,
          certificateHolderEmail: holderEmail,
          policies,
          notes,
        });

        pdfBase64 = pdfBytesToBase64(bytes);
        pdfFilename = `coi-${(client.business_name || insuredName).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Date.now()}.pdf`;
        policySummaries = policies.map((p) => ({
          id: p.id,
          policyNumber: p.policy_number,
          carrierName: p.carrier_name,
          lineOfBusiness: p.line_of_business,
        }));
        issueStatus = "issued";
        message = "COI generated from your CRM client record and active policies.";

        // Best-effort audit row (table may lack insert grants / storage path requirements).
        try {
          await admin.from("coi_certificates").insert({
            account_id: accountId,
            agency_id: agencyId,
            client_id: client.id,
            policy_ids: policies.map((p) => p.id),
            certificate_holder_name: holderName,
            certificate_holder_address: holderAddress || null,
            pdf_storage_path: `inline/${pdfFilename}`,
            pdf_url: null,
            delivery_method: "website_download",
            sent_to_email: email,
            generated_by: "public_request",
          });
        } catch (auditError) {
          console.warn("[public-coi-request] coi_certificates insert skipped", auditError);
        }
      }
    }
  } catch (lookupError) {
    console.error("[public-coi-request] client/policy lookup failed", lookupError);
    // Lead already saved; keep queued success.
  }

  return NextResponse.json({
    ok: true,
    status: issueStatus,
    message,
    leadId: leadResult.leadId,
    client: matchedClient,
    policies: policySummaries,
    pdfBase64,
    pdfFilename,
  });
}

async function createCoiLead(
  admin: SupabaseClient,
  input: {
    accountId: string;
    agencyId: string;
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
  },
) {
  const { data: leadId, error } = await admin.rpc("submit_website_coi_request", {
    p_insured_name: input.insuredName,
    p_email: input.email,
    p_holder_name: input.holderName,
    p_contact_name: input.contactName || null,
    p_phone: input.phone || null,
    p_holder_email: input.holderEmail || null,
    p_holder_address: input.holderAddress || null,
    p_policy_type: input.policyType || null,
    p_needed_by: input.neededBy || null,
    p_notes: input.notes || null,
    p_account_id: input.accountId,
    p_agency_id: input.agencyId,
  });

  if (!error) {
    return { leadId: (leadId as string | null) ?? null };
  }

  console.error("[public-coi-request] rpc failed", error);

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

  const { data: inserted, error: insertError } = await admin
    .from("leads")
    .insert({
      account_id: input.accountId,
      agency_id: input.agencyId,
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
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    console.error("[public-coi-request] lead insert failed", insertError);
  }

  return { leadId: inserted?.id ?? null };
}
