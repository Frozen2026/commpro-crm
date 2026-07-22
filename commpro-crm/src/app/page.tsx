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

import { PublicChatbotWidget } from "@/components/public-chatbot-widget";

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

export const metadata: Metadata = {
  title: "CommPro.ai | Insurance for Builders and Haulers",
  description: "CommPro.ai helps agencies serve contractors, trucking, concrete, and intermodal accounts.",
};

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-[var(--off-white,#f7f9fc)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(232,147,26,0.14),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(27,58,92,0.12),_transparent_30%),linear-gradient(180deg,var(--steel-pale)_0%,var(--background)_45%,#ffffff_100%)]" />

      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--steel-dark)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--accent)] font-[family-name:var(--font-barlow-condensed)] text-sm font-black text-[var(--steel-dark)]">
              CP
            </div>
            <div>
              <p className="font-[family-name:var(--font-barlow-condensed)] text-xl font-black uppercase tracking-wide">
                Commercial <span className="text-[var(--accent)]">Pro</span>
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7aafd4]">
                AI-Powered Insurance Platform
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            <Link href="/" className="font-[family-name:var(--font-barlow-condensed)] text-sm font-bold uppercase tracking-wide text-white/90 hover:text-[var(--accent)]">
              Home
            </Link>
            <Link href="/coi-request" className="font-[family-name:var(--font-barlow-condensed)] text-sm font-bold uppercase tracking-wide text-white/90 hover:text-[var(--accent)]">
              Get AI Quote
            </Link>
            <Link href="/coi-request" className="font-[family-name:var(--font-barlow-condensed)] text-sm font-bold uppercase tracking-wide text-white/90 hover:text-[var(--accent)]">
              COI Request
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded bg-[var(--accent)] px-4 py-2 font-[family-name:var(--font-barlow-condensed)] text-sm font-extrabold uppercase tracking-[0.06em] text-[var(--steel-dark)] transition hover:bg-[var(--accent-dark)]"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-14 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded border border-[var(--accent)]/30 bg-[rgba(232,147,26,0.12)] px-4 py-2 text-sm font-semibold text-[var(--steel)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
            Built for commercial teams behind construction and freight
          </div>

          <h1 className="mt-6 font-[family-name:var(--font-barlow-condensed)] text-5xl font-black uppercase leading-[0.92] tracking-tight text-[var(--steel)] sm:text-6xl lg:text-7xl">
            Insurance for the Companies That Build Pour and Haul America
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)] sm:text-xl">
            CommPro.ai gives your agency a modern CRM, faster quote intake, COI request handling, and AI-guided workflows for contractors, fleets, and specialty accounts.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/coi-request"
              className="inline-flex items-center justify-center gap-2 rounded bg-[var(--accent)] px-6 py-3.5 font-[family-name:var(--font-barlow-condensed)] text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--steel-dark)] transition hover:bg-[var(--accent-dark)]"
            >
              Get AI Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded border-2 border-[var(--steel)] bg-transparent px-6 py-3.5 font-[family-name:var(--font-barlow-condensed)] text-sm font-bold uppercase tracking-[0.06em] text-[var(--steel)] transition hover:bg-[var(--steel-pale)]"
            >
              View the CRM
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(13,31,51,0.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                  Live workflow snapshot
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-barlow-condensed)] text-2xl font-black uppercase text-[var(--steel)]">
                  Built for high-velocity accounts
                </h2>
              </div>
              <div className="rounded bg-[var(--steel-pale)] px-3 py-1 font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-wide text-[var(--steel-light)]">
                AI-ready
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                { title: "New quote request", detail: "Concrete contractor with upcoming certificate requirements" },
                { title: "COI follow-up", detail: "Trucking account needs endorsement confirmation today" },
                { title: "Renewal priority", detail: "Intermodal customer with a 30-day renewal window" },
              ].map((item, index) => (
                <div key={item.title} className="rounded-md border border-[var(--border)] bg-[var(--background)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded bg-[var(--steel)] font-[family-name:var(--font-barlow-condensed)] text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--steel)]">{item.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-md bg-[var(--steel-dark)] p-4 text-white">
                <p className="font-[family-name:var(--font-barlow-condensed)] text-xs uppercase tracking-[0.2em] text-[#7aafd4]">
                  Quote velocity
                </p>
                <p className="mt-2 font-[family-name:var(--font-barlow-condensed)] text-2xl font-black text-[var(--accent)]">24/7</p>
                <p className="mt-1 text-sm text-[#a8c4da]">Always available intake</p>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-[var(--steel-pale)] p-4 text-[var(--steel)]">
                <p className="font-[family-name:var(--font-barlow-condensed)] text-xs uppercase tracking-[0.2em] text-[var(--steel-light)]">
                  COI requests
                </p>
                <p className="mt-2 font-[family-name:var(--font-barlow-condensed)] text-2xl font-black">Managed</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">Centralized, trackable, and prompt</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <p className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
            Industries
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-barlow-condensed)] text-3xl font-black uppercase tracking-tight text-[var(--steel)] sm:text-4xl">
            Focused on the sectors that keep jobs moving
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {industries.map((industry) => {
            const Icon = industry.icon;
            return (
              <article key={industry.name} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--steel-light)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--steel)] text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-barlow-condensed)] text-xl font-extrabold uppercase text-[var(--steel)]">
                  {industry.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{industry.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
              Features
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-barlow-condensed)] text-3xl font-black uppercase tracking-tight text-[var(--steel)] sm:text-4xl">
              CRM capabilities your team can run every day
            </h2>
          </div>
          <Link href="/login" className="inline-flex items-center gap-2 font-[family-name:var(--font-barlow-condensed)] text-sm font-bold uppercase tracking-wide text-[var(--steel)] hover:text-[var(--accent)]">
            Sign in to the CRM <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[var(--steel-pale)] text-[var(--steel)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-[family-name:var(--font-barlow-condensed)] text-xl font-extrabold uppercase text-[var(--steel)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-8">
        <div className="rounded-lg bg-[var(--steel-dark)] px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
                COI Request
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-barlow-condensed)] text-3xl font-black uppercase tracking-tight sm:text-4xl">
                Move certificate requests out of email and into a clean workflow.
              </h2>
            </div>
            <Link
              href="/coi-request"
              className="inline-flex items-center justify-center gap-2 rounded bg-[var(--accent)] px-6 py-3 font-[family-name:var(--font-barlow-condensed)] text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--steel-dark)] transition hover:bg-[var(--accent-dark)]"
            >
              Get AI Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicChatbotWidget />
    </main>
  );
}
