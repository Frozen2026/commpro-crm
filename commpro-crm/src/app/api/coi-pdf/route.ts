import { NextResponse } from "next/server";

import { getUserContext } from "@/lib/account-context";
import { generateCoiPdfBytes } from "@/lib/coi/generate-coi-pdf";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyName = url.searchParams.get("company_name") ?? "";
  const phone = url.searchParams.get("phone") ?? "";
  const email = url.searchParams.get("email") ?? "";
  const certificateHolderName = url.searchParams.get("certificate_holder_name") ?? "";
  const certificateHolderAddress = url.searchParams.get("certificate_holder_address") ?? "";
  const clientId = url.searchParams.get("client_id") ?? "";
  const policyIds = url.searchParams.getAll("policy_id");

  if (!certificateHolderName || policyIds.length === 0) {
    return NextResponse.json({ error: "Certificate holder and policy selection are required." }, { status: 400 });
  }

  const context = await getUserContext();
  const supabase = await createClient();

  let query = supabase
    .from("policies")
    .select("policy_number, carrier_name, line_of_business, effective_date, expiration_date, client_id")
    .eq("account_id", context.accountId)
    .in("id", policyIds)
    .eq("status", "active");

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data: policies, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bytes = await generateCoiPdfBytes({
    insuredName: companyName,
    requesterPhone: phone,
    requesterEmail: email,
    certificateHolderName,
    certificateHolderAddress,
    policies: policies ?? [],
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="coi-${Date.now()}.pdf"`,
    },
  });
}
