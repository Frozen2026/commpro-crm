import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadForm } from "@/app/(app)/leads/lead-form";
import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getUserContext();
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("id, first_name, last_name, business_name, email, phone, source, stage, line_of_business, estimated_premium")
    .eq("id", id)
    .eq("account_id", context.accountId)
    .maybeSingle();

  if (!lead) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Edit Lead</h2>
        <Link href="/leads" className="text-sm font-medium text-[#2563eb]">
          Back to Leads
        </Link>
      </div>
      <LeadForm values={lead} />
    </section>
  );
}
