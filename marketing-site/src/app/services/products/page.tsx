import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products & Services",
  description: "Commercial property, liability, auto, bonds, and specialty lines placed through Commercial Pro.",
};

const products = [
  ["Commercial Property", "Apartments, office, retail, warehouse, hotels, and more.", "/ai-agent"],
  ["Builders Risk", "Course-of-construction coverage for new builds and renovations.", "/ai-agent"],
  ["General Liability", "Third-party bodily injury, property damage, and defense.", "/ai-agent"],
  ["Contractors", "GL, tools & equipment, and completed operations for the trades.", "/contractors"],
  ["Commercial Auto", "Construction, cement, trucking, and specialty fleets.", "/commercial-auto"],
  ["Construction Bonds", "Bid, performance, payment, and license bonds.", "/bonds"],
  ["Cyber Liability", "Data breach, ransomware, and liability protection.", "/ai-agent"],
  ["UIIA / Intermodal", "Compliant auto liability and cargo for drayage carriers.", "/uiia-intermodal"],
];

export default function ProductsPage() {
  return (
    <main>
      <section className="industry-hero grid-bg">
        <div className="hero-accent-bar" />
        <div className="industry-wrap">
          <div className="section-tag" style={{ color: "var(--accent)" }}>
            Products & Services
          </div>
          <h1 className="hero-h1">
            What we <em>place</em>
          </h1>
          <p className="hero-sub" style={{ maxWidth: 700 }}>
            One platform for the commercial lines that keep contractors, fleets, and property owners covered.
          </p>
        </div>
      </section>

      <div style={{ padding: "72px 0", background: "var(--off-white)" }}>
        <div className="industry-wrap section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="industry-grid">
            {products.map(([name, desc, href]) => (
              <Link className="industry-card" href={href} key={name} style={{ display: "block" }}>
                <h3>{name}</h3>
                <p>{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
