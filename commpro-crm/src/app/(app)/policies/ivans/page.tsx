import Link from "next/link";

import { getIvansSyncStatus } from "@/app/(app)/policies/ivans/actions";
import { IvansImportForm } from "@/app/(app)/policies/ivans/ivans-import-form";

export default async function IvansImportPage() {
  const status = await getIvansSyncStatus();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            <Link href="/policies" className="hover:text-[#2563eb]">
              Policies
            </Link>
            <span className="mx-1.5 text-slate-300">/</span>
            IVANS
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            IVANS policy import
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Bring Policy Center downloads and Exchange mailbox files into CommPro — matching
            insureds to clients and upserting policies by policy number.
          </p>
        </div>
      </div>

      <p
        className={`rounded-md border px-3 py-2 text-sm ${
          status.configured
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-slate-50 text-slate-700"
        }`}
      >
        {status.message}
      </p>

      <IvansImportForm apiConfigured={status.configured} />
    </section>
  );
}
