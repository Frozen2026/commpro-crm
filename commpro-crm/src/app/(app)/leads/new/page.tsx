import Link from "next/link";

import { LeadForm } from "@/app/(app)/leads/lead-form";

export default function NewLeadPage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">New Lead</h2>
        <Link href="/leads" className="text-sm font-medium text-[#2563eb]">
          Back to Leads
        </Link>
      </div>
      <LeadForm />
    </section>
  );
}
