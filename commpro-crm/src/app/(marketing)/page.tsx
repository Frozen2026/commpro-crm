import Link from "next/link";
import type { Metadata } from "next";

import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  Factory,
  FileSearch,
  PhoneCall,
  ShieldCheck,
  Truck,
  Workflow,
} from "lucide-react";

const industries = [
  {
    name: "General Contractors",
    description: "Streamline certificates, subcontractor compliance, and project-ready renewals.",
    icon: Building2,
  },
  {
    name: "Cement and Concrete",
    description: "Track fleet, jobsite, and policy requirements across fast-moving operations.",
    icon: Factory,
  },
  {
    name: "Trucking",
    description: "Keep active drivers, fleets, and loss-sensitive accounts organized in one place.",
    icon: Truck,
  },
  {
    name: "UIIA Intermodal",
    description: "Manage endorsements, compliance dates, and request volumes with confidence.",
    icon: Workflow,
  },
];

const features = [
  {
    title: "Pipeline and account CRM",
    description: "Track prospects, accounts, and policy activity with a workflow built for commercial insurance teams.",
    icon: BarChart3,
  },
  {
    title: "AI-assisted quote intake",
    description: "Capture risk details faster and move high-intent submissions into the quoting workflow.",
    icon: Bot,
  },
  {
    title: "COI request management",
    description: "Centralize certificate requests, follow-ups, and fulfillment so service teams stay ahead of deadlines.",
    icon: FileSearch,
  },
  {
    title: "Renewals and outreach",
    description: "Prioritize renewal activity and communication with a clear view of upcoming opportunities.",
    icon: PhoneCall,
  },
  {
    title: "Built-in compliance visibility",
    description: "Keep carrier, policy, and customer requirements visible across the full account lifecycle.",
    icon: ShieldCheck,
  },
  {
    title: "Connected team workflows",
    description: "Align producers, account managers, and service teams around the same operating system.",
    icon: Workflow,
  },
];

const stats = [
  { value: "24/7", label: "Always-on AI quote intake" },
  { value: "1 place", label: "Leads, policies, COIs, and renewals" },
  { value: "4 sectors", label: "Contractors, concrete, trucking, intermodal" },
];

export const metadata: Metadata = {
  title: "CommPro.ai | Insurance CRM for Builders and Haulers",
  description:
    "CommPro.ai helps commercial insurance agencies serve contractors, trucking, concrete, and intermodal accounts with a modern CRM, AI quote intake, and COI workflows.",
};

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-14 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900 shadow-sm shadow-blue-100/60">
            <CheckCircle2 className="h-4 w-4" />
            Built for the commercial insurance teams behind America&apos;s construction and freight economy
          </div>

          <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Insurance for the Companies That Build Pour and Haul America
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            CommPro.ai gives your agency a modern CRM, faster quote intake, COI request handling, and AI-guided workflows for contractors, fleets, and specialty accounts.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Book a demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
            >
              Explore features
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Faster intake", value: "AI-guided quotes" },
              { label: "Operational clarity", value: "CRM + service workflows" },
              { label: "Compliance focus", value: "COIs and renewals" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(30,64,175,0.92))] blur-2xl opacity-20" />
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Live workflow snapshot</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Built for high-velocity accounts</h2>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">AI-ready</div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                { title: "New quote request", detail: "Concrete contractor with upcoming certificate requirements" },
                { title: "COI follow-up", detail: "Trucking account needs endorsement confirmation today" },
                { title: "Renewal priority", detail: "Intermodal customer with a 30-day renewal window" },
              ].map((item, index) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">Quote velocity</p>
                <p className="mt-2 text-2xl font-black">24/7</p>
                <p className="mt-1 text-sm text-white/70">Always available intake</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
                <p className="text-xs uppercase tracking-[0.22em] text-blue-700">COI requests</p>
                <p className="mt-2 text-2xl font-black">Managed</p>
                <p className="mt-1 text-sm text-blue-800">Centralized, trackable, and prompt</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-4 lg:px-8">
        <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:grid-cols-3 sm:p-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="text-3xl font-black tracking-tight text-slate-950">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Industries</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Focused on the sectors that keep jobs moving</h2>
          </div>
          <Link href="/industries" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950">
            See all industries <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {industries.map((industry) => {
            const Icon = industry.icon;

            return (
              <article key={industry.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-950">{industry.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{industry.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Features</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">CRM capabilities your team can run every day</h2>
          </div>
          <Link href="/features" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950">
            Explore all features <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_38px_rgba(15,23,42,0.06)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/55">Ready when you are</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">See how CommPro.ai runs your agency&apos;s day.</h2>
            </div>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Book a demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
