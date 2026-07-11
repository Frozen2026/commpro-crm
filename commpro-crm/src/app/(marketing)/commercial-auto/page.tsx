import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commercial Auto Insurance",
  description:
    "Commercial auto for construction, cement, concrete, and trucking fleets — liability, cargo, and physical damage with AI market matching.",
};

const fleets = [
  ["Construction fleets", "Pickups, dump trucks, and job-site vehicles with hired/non-owned exposures."],
  ["Cement & concrete", "Mixer trucks, pump trucks, and specialized heavy equipment rated correctly."],
  ["Trucking fleets", "Owner-operators to multi-truck fleets with cargo and physical damage options."],
  ["Service vans", "Plumbers, electricians, and HVAC fleets with tools and inland marine needs."],
  ["Heavy specialty", "Non-standard equipment routed to carriers with appetite instead of generic markets."],
  ["Radius & commodity", "AI scoring on MVRs, loss runs, radius, and commodity to reduce declinations."],
];

export default function CommercialAutoPage() {
  return (
    <main>
      <section className="industry-hero grid-bg">
        <div className="hero-accent-bar" />
        <div className="industry-wrap">
          <div className="section-tag" style={{ color: "var(--accent)" }}>
            Commercial Auto
          </div>
          <h1 className="hero-h1" style={{ maxWidth: 900 }}>
            Every truck.
            <br />
            Every fleet.
            <br />
            <em>Every industry.</em>
          </h1>
          <p className="hero-sub" style={{ maxWidth: 720 }}>
            All-industry fleet coverage for construction, cement, trucking, and specialty vehicles — with AI routing to carriers that actually write the
            class.
          </p>
          <div className="hero-btns">
            <Link href="/ai-agent" className="btn-primary">
              Get AI Quote
            </Link>
            <a href="tel:9733077007" className="btn-outline">
              Talk to a Specialist
            </a>
          </div>
        </div>
      </section>

      <div style={{ padding: "72px 0", background: "var(--white)" }}>
        <div className="industry-wrap section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag">Fleet specialties</div>
          <h2 className="section-h2">Built for the vehicles that move the work.</h2>
          <div className="industry-grid">
            {fleets.map(([name, desc]) => (
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
