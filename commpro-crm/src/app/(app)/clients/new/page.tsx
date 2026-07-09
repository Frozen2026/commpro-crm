import Link from "next/link";

import { ClientForm } from "@/app/(app)/clients/client-form";

export default function NewClientPage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">New Client</h2>
        <Link href="/clients" className="text-sm font-medium text-[#2563eb]">
          Back to Clients
        </Link>
      </div>
      <ClientForm />
    </section>
  );
}
