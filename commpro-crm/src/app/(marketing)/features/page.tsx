import Link from "next/link";
import type { Metadata } from "next";

import {
  ArrowRight,
  BarChart3,
  Bot,
  FileSearch,
  PhoneCall,
  ReceiptText,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";

const featureGroups = [
  {
    title: "Sales and pipeline",
    icon: BarChart3,
    points: [
      "Lead pipeline with stages from new to bound",
      "Account and client records in one system",
      "Owner assignment and activity history",
    ],
  },
  {
    title: "AI quote intake",
    icon: Bot,
    points: [
      "Always-on assistant captures risk details",
      "Route high-intent submissions to quoting",
      "Structured data ready for carriers",
    ],
  },
  {
    title: "COI workflows",
    icon: FileSearch,
    points: [
      "Centralized certificate requests",
      "PDF certificate generation",
      "Holder memory for repeat requests",
    ],
  },
  {
    title: "Policies and renewals",
    icon: PhoneCall,
    points: [
      "Policy tracking with status and dates",
      "Renewal prioritization by risk",
      "Proactive outreach reminders",
    ],
  },
  {
    title: "Commissions and claims",
    icon: ReceiptText,
    points: [
      "Commission reconciliation and splits",
      "Claims tracking with adjuster details",
      "Audit trail across the lifecycle",
    ],
  },
  {
    title: "Compliance and security",
    icon: ShieldCheck,
    points: [
      "Row-level access by account and role",
      "Carrier and policy requirement visibility",
      "Role-based permissions for every team",
    ],
  },
  {
    title: "Team workflows",
    icon: Users,
    points: [
      "Producers, account managers, and CSRs aligned",
      "Tasks and follow-ups in shared views",
      "Consistent process across the agency",
    ],
  },
  {
    title: "Automation-ready",
    icon: Workflow,
    points: [
      "Twilio SMS and voice integration",
      "Public chatbot for lead capture",
      "Built to connect to your stack",
    ],
  },
];

export const metadata: Metadata = {
  title: "Features | CommPro.ai",
  description:
    "Explore CommPro.ai features: pipeline CRM, AI quote intake, COI workflows, renewals, commissions, claims, and role-based compliance.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Everything your agency needs to run commercial insurance"
        description="One connected system for producers, account managers, and service teams — from first touch to renewal."
      />

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureGroups.map((group) => {
            const Icon = group.icon;

            return (
              <article key={group.title} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_38px_rgba(15,23,42,0.06)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">{group.title}</h3>
                <ul className="mt-3 space-y-2">
                  {group.points.map((point) => (
                    <li key={point} className="flex gap-2 text-sm leading-6 text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-blue-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-4 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/55">See it live</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Walk through the features with our team.</h2>
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
