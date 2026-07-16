import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Construction Bonds",
  description: "Bid, performance, payment, and license bonds for contractors — talk to Commercial Pro for same-day guidance.",
};

export default function BondsPage() {
  return (
    <main>
      <section className="industry-hero grid-bg">
        <div className="hero-accent-bar" />
        <div className="industry-wrap">
          <div className="section-tag" style={{ color: "var(--accent)" }}>
            Bonds
          </div>
          <h1 className="hero-h1" style={{ maxWidth: 820 }}>
            Construction bonds that <em>keep jobs moving.</em>
          </h1>
          <p className="hero-sub" style={{ maxWidth: 720 }}>
            Bid, performance, payment, and license bonds for contractors who need to qualify fast and stay compliant on public and private work.
          </p>
          <div className="hero-btns">
            <a href="tel:9733077007" className="btn-primary">
              Call (973) 307-7007
            </a>
            <Link href="/contact" className="btn-outline">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <div style={{ padding: "72px 0", background: "var(--white)" }}>
        <div className="industry-wrap section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="industry-grid">
            {[
              ["Bid bonds", "Secure the right to bid without tying up cash unnecessarily."],
              ["Performance bonds", "Assure project owners the work will be completed as contracted."],
              ["Payment bonds", "Protect subcontractors and suppliers on bonded projects."],
              ["License bonds", "Meet state and municipal contractor licensing requirements."],
            ].map(([name, desc]) => (
              <div className="industry-card" key={name}>
                <h3>{name}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
