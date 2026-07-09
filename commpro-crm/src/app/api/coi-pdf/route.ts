import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

import { getUserContext } from "@/lib/account-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyName = url.searchParams.get("company_name") ?? "";
  const phone = url.searchParams.get("phone") ?? "";
  const email = url.searchParams.get("email") ?? "";
  const certificateHolderName = url.searchParams.get("certificate_holder_name") ?? "";
  const certificateHolderAddress = url.searchParams.get("certificate_holder_address") ?? "";
  const policyIds = url.searchParams.getAll("policy_id");

  if (!certificateHolderName || policyIds.length === 0) {
    return NextResponse.json({ error: "Certificate holder and policy selection are required." }, { status: 400 });
  }

  const context = await getUserContext();
  const supabase = await createServerSupabaseClient();

  const { data: policies, error } = await supabase
    .from("policies")
    .select("policy_number, carrier_name, line_of_business, effective_date, expiration_date")
    .eq("account_id", context.accountId)
    .in("id", policyIds)
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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
    `Requested Company: ${companyName || "N/A"}`,
    `Requester Phone: ${phone || "N/A"}`,
    `Requester Email: ${email || "N/A"}`,
    `Certificate Holder: ${certificateHolderName}`,
    `Certificate Holder Address: ${certificateHolderAddress || "N/A"}`,
  ];

  for (const detail of details) {
    page.drawText(detail, { x: 40, y, size: 11, font });
    y -= lineGap;
  }

  y -= 8;
  page.drawText("Active Policies", { x: 40, y, size: 13, font: boldFont });
  y -= 20;

  for (const policy of policies ?? []) {
    const line = `${policy.policy_number ?? "No Number"} | ${policy.carrier_name ?? "Unknown Carrier"} | ${policy.line_of_business ?? "-"} | ${policy.effective_date ?? "-"} to ${policy.expiration_date ?? "-"}`;
    page.drawText(`• ${line}`, { x: 48, y, size: 10, font });
    y -= 14;
  }

  const bytes = await pdf.save();
  const pdfBytes = new Uint8Array(bytes.length);
  pdfBytes.set(bytes);
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

  return new NextResponse(pdfBlob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="coi-${Date.now()}.pdf"`,
    },
  });
}
