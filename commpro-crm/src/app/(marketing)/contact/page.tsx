import type { Metadata } from "next";

import { Clock, Mail, MessageSquare } from "lucide-react";

import { ContactForm } from "@/components/marketing/contact-form";
import { PageHero } from "@/components/marketing/page-hero";

const contactDetails = [
  {
    title: "Email us",
    icon: Mail,
    detail: "hello@commpro.ai",
  },
  {
    title: "Chat with the assistant",
    icon: MessageSquare,
    detail: "Use the AI assistant in the corner for quick questions.",
  },
  {
    title: "Response time",
    icon: Clock,
    detail: "We typically reply within one business day.",
  },
];

export const metadata: Metadata = {
  title: "Contact | CommPro.ai",
  description: "Book a demo or get in touch with the CommPro.ai team.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your agency"
        description="Book a demo, ask a question, or tell us about your book of business. We'll get back to you quickly."
      />

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-4">
            {contactDetails.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_38px_rgba(15,23,42,0.06)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </article>
              );
            })}
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
