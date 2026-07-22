import Link from "next/link";
import type { Metadata } from "next";

import { ArrowRight, Check } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";

const plans = [
  {
    name: "Starter",
    price: "$49",
    cadence: "per user / month",
    description: "For small agencies getting organized with a modern CRM.",
    features: [
      "Lead and client CRM",
      "Policy and renewal tracking",
      "COI request intake",
      "Email support",
    ],
    cta: { label: "Start free trial", href: "/signup" },
    featured: false,
  },
  {
    name: "Growth",
    price: "$99",
    cadence: "per user / month",
    description: "For growing teams that want AI intake and automation.",
    features: [
      "Everything in Starter",
      "AI-assisted quote intake",
      "Commissions and claims",
      "Twilio SMS and voice",
      "Priority support",
    ],
    cta: { label: "Book a demo", href: "/contact" },
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "tailored to your book",
    description: "For MGAs and multi-agency operations with advanced needs.",
    features: [
      "Everything in Growth",
      "Role-based permissions at scale",
      "Custom carrier connections",
      "Dedicated onboarding",
      "SLA and security review",
    ],
    cta: { label: "Contact sales", href: "/contact" },
    featured: false,
  },
];

export const metadata: Metadata = {
  title: "Pricing | CommPro.ai",
  description: "Simple, per-seat pricing for agencies of every size. Start with a free trial or book a demo.",
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple pricing that scales with your agency"
        description="Start with a free trial and upgrade as your team grows. No long-term contracts to get going."
      />

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col rounded-3xl border p-7 shadow-[0_14px_40px_rgba(15,23,42,0.06)] ${
                plan.featured
                  ? "border-slate-950 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.featured ? (
                <span className="mb-4 inline-flex w-fit items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                  Most popular
                </span>
              ) : null}
              <h3 className={`text-lg font-bold ${plan.featured ? "text-white" : "text-slate-950"}`}>{plan.name}</h3>
              <div className="mt-4 flex items-end gap-2">
                <span className={`text-4xl font-black tracking-tight ${plan.featured ? "text-white" : "text-slate-950"}`}>
                  {plan.price}
                </span>
                <span className={`pb-1 text-sm ${plan.featured ? "text-white/60" : "text-slate-500"}`}>{plan.cadence}</span>
              </div>
              <p className={`mt-3 text-sm leading-6 ${plan.featured ? "text-white/70" : "text-slate-600"}`}>
                {plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className={`flex gap-3 text-sm ${plan.featured ? "text-white/85" : "text-slate-700"}`}>
                    <Check className={`mt-0.5 h-4 w-4 flex-none ${plan.featured ? "text-blue-300" : "text-blue-600"}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${
                  plan.featured
                    ? "bg-white text-slate-950 hover:bg-slate-100"
                    : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                {plan.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          All plans include unlimited leads and clients. Prices shown in USD.
        </p>
      </section>
    </>
  );
}
