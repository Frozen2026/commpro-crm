import Link from "next/link";
import type { Metadata } from "next";

import { ArrowRight, Compass, Heart, Target } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";

const values = [
  {
    title: "Built for operators",
    icon: Target,
    description: "We design around the daily reality of producers, account managers, and service teams.",
  },
  {
    title: "Clarity over clutter",
    icon: Compass,
    description: "Every workflow reduces busywork so your team can focus on accounts and relationships.",
  },
  {
    title: "Customer obsession",
    icon: Heart,
    description: "We partner closely with agencies to ship what actually moves the needle.",
  },
];

export const metadata: Metadata = {
  title: "About | CommPro.ai",
  description:
    "CommPro.ai builds the operating system for commercial insurance agencies serving construction and freight accounts.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="The operating system for commercial insurance agencies"
        description="CommPro.ai was built to give agencies serving contractors, concrete, trucking, and intermodal accounts one modern place to work."
      />

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Our mission</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Commercial insurance runs on speed, accuracy, and follow-through. Yet too many agencies still juggle
              spreadsheets, inboxes, and disconnected tools. CommPro.ai brings the pipeline, policies, COIs, renewals,
              commissions, and claims into a single system — with AI that helps capture and route work faster.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              We focus on the sectors that keep America building and moving, and we obsess over the workflows that make
              those books profitable to service.
            </p>
          </div>

          <div className="grid gap-4">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <article key={value.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_38px_rgba(15,23,42,0.06)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{value.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-4 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/55">Join us</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Let&apos;s modernize your agency together.</h2>
            </div>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Get in touch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
