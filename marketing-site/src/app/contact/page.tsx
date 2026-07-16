import Link from "next/link";
import type { Metadata } from "next";

import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Commercial Pro — licensed insurance professionals with same-day response.",
};

export default function ContactPage() {
  return (
    <main>
      <div className="legal-hero grid-bg">
        <div className="hero-accent-bar" />
        <div className="legal-hero-inner">
          <div className="section-tag" style={{ color: "var(--accent)" }}>
            Get in touch
          </div>
          <h1 className="legal-h1">
            Contact <em>Commercial Pro</em>
          </h1>
          <p className="legal-lead">Licensed insurance professionals ready to help. Same-day response guaranteed.</p>
        </div>
      </div>

      <div className="contact-grid">
        <div className="contact-info">
          <div className="contact-info-title">
            Let&apos;s talk <em>commercial.</em>
          </div>
          <p style={{ fontSize: 15, color: "var(--text-mid)", lineHeight: 1.75, marginBottom: 24 }}>
            Whether you&apos;re an agent exploring the platform, a carrier interested in API integration, or a business owner who needs coverage — we
            respond the same day.
          </p>
          <div className="contact-detail">
            <div className="contact-icon">📞</div>
            <div>
              <div className="contact-label">Phone / Text</div>
              <div className="contact-value">
                <a href="tel:9733077007">(973) 307-7007</a>
              </div>
            </div>
          </div>
          <div className="contact-detail">
            <div className="contact-icon">✉️</div>
            <div>
              <div className="contact-label">Email</div>
              <div className="contact-value">
                <a href="mailto:info@commercialpro.ai">info@commercialpro.ai</a>
              </div>
            </div>
          </div>
          <div className="contact-detail">
            <div className="contact-icon">🤖</div>
            <div>
              <div className="contact-label">Try the AI Agent</div>
              <div className="contact-value">
                <Link href="/ai-agent" style={{ color: "var(--accent)" }}>
                  Get an instant AI quote →
                </Link>
              </div>
            </div>
          </div>
          <div className="contact-detail">
            <div className="contact-icon">⏱️</div>
            <div>
              <div className="contact-label">Response Time</div>
              <div className="contact-value" style={{ fontSize: 14, color: "var(--text-mid)" }}>
                Same business day. Usually within 2 hours.
              </div>
            </div>
          </div>
          <div className="contact-detail">
            <div className="contact-icon">🏢</div>
            <div>
              <div className="contact-label">What we handle</div>
              <div className="contact-value" style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.6 }}>
                Commercial property · Auto fleets · Contractors · Non-profit · Cyber · Flood · Security guards
              </div>
            </div>
          </div>
        </div>
        <div>
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
