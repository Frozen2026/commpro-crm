import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

import { getUserContext } from "@/lib/account-context";
import { isMissingColumnError } from "@/lib/clients-query";
import { persistCoiCertificate } from "@/lib/coi";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyName = url.searchParams.get("company_name") ?? "";
  const phone = url.searchParams.get("phone") ?? "";
  const email = url.searchParams.get("email") ?? "";
  const clientId = (url.searchParams.get("client_id") ?? "").trim();
  const certificateHolderName = (url.searchParams.get("certificate_holder_name") ?? "").trim();
  const certificateHolderAddress = url.searchParams.get("certificate_holder_address") ?? "";
  const policyIds = url.searchParams.getAll("policy_id").map((id) => id.trim()).filter(Boolean);

  if (!clientId) {
    return NextResponse.json({ error: "Client is required." }, { status: 400 });
  }
  if (!certificateHolderName || policyIds.length === 0) {
    return NextResponse.json(
      { error: "Certificate holder and policy selection are required." },
      { status: 400 },
    );
  }

  const context = await getUserContext();
  const admin = getSupabaseAdmin();

  // Verify client exists
  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("id, business_name, first_name, last_name, phone, email")
    .eq("id", clientId)
    .maybeSingle();

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const columns =
    "id, policy_number, carrier_name, line_of_business, effective_date, expiration_date, client_id, status";

  let policies:
    | Array<{
        id: string;
        policy_number: string | null;
        carrier_name: string | null;
        line_of_business: string | null;
        effective_date: string | null;
        expiration_date: string | null;
        client_id?: string | null;
        status?: string | null;
      }>
    | null = null;

  {
    const { data, error } = await admin
      .from("policies")
      .select(columns)
      .eq("account_id", context.accountId)
      .eq("client_id", clientId)
      .in("id", policyIds);

    if (!error) {
      policies = data;
    } else if (!isMissingColumnError(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (!policies) {
    let q = admin.from("policies").select(columns).eq("client_id", clientId).in("id", policyIds);
    if (context.agencyId) {
      q = q.eq("agency_id", context.agencyId);
    }
    const { data, error } = await q;
    if (error) {
      const fallback = await admin
        .from("policies")
        .select(columns)
        .eq("client_id", clientId)
        .in("id", policyIds);
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
      policies = fallback.data;
    } else {
      policies = data;
    }
  }

  if (!policies || policies.length === 0) {
    return NextResponse.json(
      { error: "No matching policies found for this client." },
      { status: 400 },
    );
  }

  // Ensure all requested policies belong to the client
  const allowedIds = new Set(policies.map((policy) => policy.id));
  if (policyIds.some((id) => !allowedIds.has(id))) {
    return NextResponse.json(
      { error: "One or more policies do not belong to this client." },
      { status: 400 },
    );
  }

  const insuredName =
    companyName ||
    client.business_name ||
    [client.first_name, client.last_name].filter(Boolean).join(" ") ||
    "N/A";

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 760;
  const lineGap = 18;

  page.drawText("Certificate of Insurance", {
    x: 40,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0.145, 0.388, 0.922),
  });

  y -= 30;
  const details = [
    `Insured: ${insuredName}`,
    `Client ID: ${clientId}`,
    `Requester Phone: ${phone || client.phone || "N/A"}`,
    `Requester Email: ${email || client.email || "N/A"}`,
    `Certificate Holder: ${certificateHolderName}`,
    `Certificate Holder Address: ${certificateHolderAddress || "N/A"}`,
  ];

  for (const detail of details) {
    page.drawText(detail, { x: 40, y, size: 11, font });
    y -= lineGap;
  }

  y -= 8;
  page.drawText("Policies", { x: 40, y, size: 13, font: boldFont });
  y -= 20;

  for (const policy of policies) {
    const line = `${policy.policy_number ?? "No Number"} | ${policy.carrier_name ?? "Unknown Carrier"} | ${policy.line_of_business ?? "-"} | ${policy.effective_date ?? "-"} to ${policy.expiration_date ?? "-"}`;
    page.drawText(`• ${line}`, { x: 48, y, size: 10, font });
    y -= 14;
  }

  await persistCoiCertificate({
    context,
    clientId,
    policyIds: policies.map((policy) => policy.id),
    certificateHolderName,
    certificateHolderAddress: certificateHolderAddress || null,
    generatedBy: "agent",
  });

  const bytes = await pdf.save();
  const pdfBytes = new Uint8Array(bytes.length);
  pdfBytes.set(bytes);
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

  return new NextResponse(pdfBlob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="coi-${clientId.slice(0, 8)}-${Date.now()}.pdf"`,
    },
  });
}
