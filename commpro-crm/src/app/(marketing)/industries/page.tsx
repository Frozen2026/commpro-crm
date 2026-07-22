import Link from "next/link";
import type { Metadata } from "next";

import { ArrowRight, Building2, Factory, Truck, Workflow } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";

const industries = [
  {
    name: "General Contractors",
    icon: Building2,
    description:
      "Serve GCs and subs with certificate tracking, additional insured endorsements, and project-ready renewals.",
    highlights: [
      "Subcontractor compliance visibility",
      "Additional insured endorsement tracking",
      "Fast COI turnaround for project starts",
    ],
  },
  {
    name: "Cement and Concrete",
    icon: Factory,
    description:
      "Keep fleets, jobsites, and coverage requirements aligned across high-volume, fast-moving operations.",
    highlights: [
      "Fleet and equipment coverage tracking",
      "Jobsite certificate requirements",
      "Renewal planning for seasonal demand",
    ],
  },
  {
    name: "Trucking",
    icon: Truck,
    description:
      "Manage active drivers, fleets, and loss-sensitive accounts with workflows built for motor carriers.",
    highlights: [
      "Driver and unit schedules",
      "Loss-sensitive account monitoring",
      "Auto, cargo, and liability lines in one view",
    ],
  },
  {
    name: "UIIA Intermodal",
    icon: Workflow,
    description:
      "Handle intermodal endorsements, compliance dates, and certificate request volume with confidence.",
    highlights: [
      "UIIA endorsement management",
      "Compliance date tracking",
      "High-volume COI request handling",
    ],
  },
];

export const metadata: Metadata = {
  title: "Industries | CommPro.ai",
  description:
    "CommPro.ai is purpose-built for contractors, cement and concrete, trucking, and UIIA intermodal accounts.",
};

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Purpose-built for the sectors that keep America moving"
        description="CommPro.ai is tuned for the coverage lines, compliance needs, and pace of commercial accounts in construction and freight."
      />

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {industries.map((industry) => {
            const Icon = industry.icon;

            return (
              <article key={industry.name} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-slate-950">{industry.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{industry.description}</p>
                <ul className="mt-5 space-y-2">
                  {industry.highlights.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-4 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Don&apos;t see your niche?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                CommPro.ai adapts to specialty commercial lines. Tell us about your book and we&apos;ll show you a fit.
              </p>
            </div>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Talk to us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
