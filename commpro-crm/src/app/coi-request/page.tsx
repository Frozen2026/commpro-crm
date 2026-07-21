import type { Metadata } from "next";
import Link from "next/link";

import { PublicCoiRequestForm } from "@/components/public-coi-request-form";

export const metadata: Metadata = {
  title: "Request a COI | Commercial Pro",
  description:
    "Request a certificate of insurance from Commercial Pro. Same-day COI issuance for contractors, fleets, and commercial accounts.",
};

// Avoid stale prerender/CDN copies of the form client bundle after deploys.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PublicCoiRequestPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="https://commpro.ai" className="text-lg font-bold tracking-tight text-slate-900 no-underline">
            Commercial <span className="text-[var(--primary)]">Pro</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <a href="tel:9733077007" className="font-medium text-slate-700 no-underline hover:text-slate-950">
              (973) 307-7007
            </a>
            <Link
              href="https://commpro.ai/ai-agent"
              className="rounded-md bg-[var(--primary)] px-3 py-1.5 font-semibold text-[var(--primary-foreground)] no-underline hover:opacity-95"
            >
              Get AI Quote
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">Certificates</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Request a COI</h1>
          <p className="text-base leading-relaxed text-slate-600">
            Tell us who needs the certificate and which coverages to show. Include additional insured language and the
            job location so we can issue it correctly the first time.
          </p>
          <ul className="space-y-3 text-sm text-slate-700">
            <li>
              <span className="font-semibold text-slate-900">Turnaround:</span> Same business day in most cases
            </li>
            <li>
              <span className="font-semibold text-slate-900">Need it now?</span>{" "}
              <a href="tel:9733077007" className="font-medium">
                (973) 307-7007
              </a>
            </li>
            <li>
              <span className="font-semibold text-slate-900">Include:</span> Holder name & address · additional insured
              wording · job/site · coverages required
            </li>
          </ul>
          <p className="text-sm text-slate-500">
            Already signed in to the CRM? Open{" "}
            <Link href="/coi" className="font-medium text-[var(--primary)] hover:underline">
              COI generator →
            </Link>
          </p>
        </div>

        <PublicCoiRequestForm />
      </main>
    </div>
  );
}
