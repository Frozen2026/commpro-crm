import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UIIA / Intermodal Insurance",
  description:
    "UIIA-compliant auto liability and cargo coverage for drayage and intermodal carriers, with same-day COI issuance for IEP requirements.",
};

export default function UiiaIntermodalPage() {
  return (
    <main>
      <section className="industry-hero grid-bg">
        <div className="hero-accent-bar" />
        <div className="industry-wrap">
          <div className="section-tag" style={{ color: "var(--accent)" }}>
            UIIA / Intermodal
          </div>
          <h1 className="hero-h1" style={{ maxWidth: 900 }}>
            Stay compliant.
            <br />
            <em>Stay moving.</em>
          </h1>
          <p className="hero-sub" style={{ maxWidth: 760 }}>
            Auto liability and cargo coverage structured to meet UIIA minimums required by railroads and marine terminals — with certificate language
            built for IEP requirements so you&apos;re not stuck at the gate.
          </p>
          <div className="hero-btns">
            <Link href="/ai-agent" className="btn-primary">
              Get a UIIA Quote
            </Link>
            <Link href="https://app.commpro.ai/coi-request" className="btn-outline">
              Request a COI
            </Link>
          </div>
        </div>
      </section>

      <div style={{ padding: "72px 0", background: "var(--off-white)" }}>
        <div className="industry-wrap section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag">Why it matters</div>
          <h2 className="section-h2">UIIA coverage without the paperwork maze.</h2>
          <div className="industry-grid">
            {[
              ["Minimum limits", "Coverage structured to meet UIIA auto liability and cargo requirements for interchange access."],
              ["Certificate language", "COIs issued with the intermodal equipment provider named correctly the first time."],
              ["Same-day turnaround", "Request certificates and endorsements without waiting on portal back-and-forth."],
              ["Drayage ready", "Built for carriers moving containers between rail ramps, ports, and warehouses."],
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
