import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Contractor Insurance",
  description:
    "GL, workers comp, commercial auto, umbrella, and builders risk for general contractors and trades — fast AI quotes from Commercial Pro.",
};

const trades = [
  ["General Contractors", "Multi-trade GCs running active job sites with additional insured and per-project aggregate needs."],
  ["Carpenters", "Framing and finish carpentry with tools, equipment, and completed operations exposure."],
  ["Electricians", "Licensed electrical contractors needing GL, tools, and often higher umbrella limits."],
  ["Plumbers", "Service and new-construction plumbing with water damage and completed ops considerations."],
  ["Roofers", "Higher-hazard trade placement with specialized appetite matching and equipment floaters."],
  ["Siding Contractors", "Exterior work with height, weather, and property damage exposures."],
];

export default function ContractorsPage() {
  return (
    <main>
      <section className="industry-hero grid-bg">
        <div className="hero-accent-bar" />
        <div className="industry-wrap">
          <div className="section-tag" style={{ color: "var(--accent)" }}>
            Contractors Insurance
          </div>
          <h1 className="hero-h1" style={{ maxWidth: 820 }}>
            Built for <em>The Trades.</em>
          </h1>
          <p className="hero-sub" style={{ maxWidth: 720 }}>
            General liability, workers comp, commercial auto, umbrella — plus every endorsement your GC requires. If you build it, we protect it.
          </p>
          <div className="hero-btns">
            <Link href="/ai-agent" className="btn-primary">
              Get a Quote Online
            </Link>
            <a href="tel:9733077007" className="btn-outline">
              Call for a Free Quote
            </a>
          </div>
        </div>
      </section>

      <div style={{ padding: "72px 0", background: "var(--off-white)" }}>
        <div className="industry-wrap section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag">Who we serve</div>
          <h2 className="section-h2">Every trade. Every crew size.</h2>
          <p className="section-body">
            Whether you&apos;re a solo sub or running a 50-person crew, Commercial Pro has the right coverage at the right price. We specialize in the
            trades — so we know the risks you face and the certificates your GCs demand.
          </p>
          <div className="industry-grid">
            {trades.map(([name, desc]) => (
              <div className="industry-card" key={name}>
                <h3>{name}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 36 }}>
            <Link href="/ai-agent" className="btn-primary">
              Run Contractor AI Quote →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
