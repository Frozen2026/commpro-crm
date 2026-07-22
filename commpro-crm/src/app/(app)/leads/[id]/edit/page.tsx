import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadForm } from "@/app/(app)/leads/lead-form";
import { getUserContext } from "@/lib/account-context";
import { isMissingColumnError, loadClientsForContext } from "@/lib/clients-query";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getUserContext();
  const admin = getSupabaseAdmin();

  let lead: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    business_name: string | null;
    email: string | null;
    phone: string | null;
    source: string | null;
    stage: string | null;
    line_of_business: string | null;
    estimated_premium: number | null;
    raw_data?: Record<string, unknown> | null;
  } | null = null;

  {
    const { data, error } = await admin
      .from("leads")
      .select(
        "id, first_name, last_name, business_name, email, phone, source, stage, line_of_business, estimated_premium, raw_data",
      )
      .eq("id", id)
      .eq("account_id", context.accountId)
      .maybeSingle();

    if (!error) {
      lead = data;
    } else if (isMissingColumnError(error.message)) {
      const retry = await admin
        .from("leads")
        .select(
          "id, first_name, last_name, business_name, email, phone, source, stage, line_of_business, estimated_premium",
        )
        .eq("id", id)
        .maybeSingle();
      lead = retry.data;
    }
  }

  if (!lead) {
    notFound();
  }

  const isWebsiteCoi =
    (lead.source ?? "").toLowerCase().includes("coi") ||
    (lead.source ?? "").toLowerCase() === "website-coi";

  let matchedClientId: string | null = null;
  if (isWebsiteCoi && lead.business_name) {
    const { data: clients } = await loadClientsForContext(
      context,
      "id, business_name, first_name, last_name",
    );
    const needle = lead.business_name.toLowerCase();
    const match = clients.find((client) =>
      (client.business_name ?? "").toLowerCase().includes(needle),
    );
    matchedClientId = match?.id ?? null;
  }

  const raw = lead.raw_data ?? {};
  const holderName =
    typeof raw.certificate_holder_name === "string"
      ? raw.certificate_holder_name
      : typeof raw.holder_name === "string"
        ? raw.holder_name
        : "";
  const holderAddress =
    typeof raw.certificate_holder_address === "string"
      ? raw.certificate_holder_address
      : typeof raw.holder_address === "string"
        ? raw.holder_address
        : "";

  const fulfillHref = matchedClientId
    ? `/coi?client_id=${matchedClientId}&company_name=${encodeURIComponent(lead.business_name ?? "")}&holder_name=${encodeURIComponent(holderName)}&holder_address=${encodeURIComponent(holderAddress)}`
    : `/coi?company_name=${encodeURIComponent(lead.business_name ?? "")}&holder_name=${encodeURIComponent(holderName)}&holder_address=${encodeURIComponent(holderAddress)}`;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Edit Lead</h2>
        <div className="flex flex-wrap items-center gap-3">
          {isWebsiteCoi ? (
            <Link
              href={fulfillHref}
              className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white"
            >
              Fulfill COI
            </Link>
          ) : null}
          <Link href="/leads" className="text-sm font-medium text-[var(--primary)]">
            Back to Leads
          </Link>
        </div>
      </div>
      {isWebsiteCoi ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Website COI request
          {matchedClientId
            ? " — matched to an existing client."
            : " — create or match a client, then fulfill from COI Request."}
        </p>
      ) : null}
      <LeadForm values={lead} />
    </section>
  );
}
