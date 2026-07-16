import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Contractor, Trucking & Cement Company Insurance | AI Quotes in 60 Seconds",
  description:
    "Commercial Pro's AI agent quotes general contractors, cement and concrete companies, and trucking fleets across 8+ major carriers in under 60 seconds.",
};

const industries = [
  {
    href: "/contractors",
    icon: "🏗️",
    name: "General Contractor Insurance",
    desc: "General liability, tools & equipment, completed operations, and builders risk for GCs and subs — from residential remodelers to commercial GCs running multiple active job sites.",
    tag: "Get a Contractor Quote →",
  },
  {
    href: "/commercial-auto",
    icon: "🏭",
    name: "Cement & Concrete Company Insurance",
    desc: "GL, commercial auto for mixer and pump trucks, equipment floaters, and pollution liability for ready-mix, concrete pumping, and cement supply operations.",
    tag: "Get a Concrete Quote →",
  },
  {
    href: "/commercial-auto",
    icon: "🚛",
    name: "Trucking Company Insurance",
    desc: "Commercial auto liability, motor truck cargo, and physical damage for owner-operators to multi-truck fleets. AI scoring on MVRs, loss runs, and radius routes you to the right markets.",
    tag: "Get a Trucking Quote →",
  },
  {
    href: "/uiia-intermodal",
    icon: "📦",
    name: "UIIA-Compliant Insurance for Intermodal Carriers",
    desc: "Auto liability and cargo coverage structured to meet UIIA minimums required by railroads and marine terminals — with COI issuance built to satisfy IEP requirements so you're not stuck at the gate.",
    tag: "Get a UIIA / Drayage Quote →",
  },
];

const propertyTypes = [
  { icon: "🏢", name: "Apartments", desc: "1–500+ unit residential complexes. Vacancy, amenity, and tenant mix underwriting.", tag: "Multi-family" },
  { icon: "🏛️", name: "Office Buildings", desc: "Class A/B/C office. Medical tenants, elevator liability, parking structures.", tag: "Commercial office" },
  { icon: "🏪", name: "Retail / Strip", desc: "Tenant mix, cooking operations, foot traffic GL, anchor dependency.", tag: "Retail" },
  { icon: "🏭", name: "Warehouse", desc: "Light industrial to heavy manufacturing. Hazmat, racking, cold storage.", tag: "Industrial" },
  { icon: "🔀", name: "Mixed-Use", desc: "Residential above commercial. Dominant occupancy rule applied automatically.", tag: "Mixed-use" },
  { icon: "🏨", name: "Hotels", desc: "Franchise or independent. Room count rating, liquor, pool, brand standards.", tag: "Hospitality" },
  { icon: "🏗️", name: "Contractor Yards", desc: "Equipment values, tool floaters, UST liability, fuel storage, vehicle schedule.", tag: "Contractor" },
  { icon: "🍽️", name: "Restaurants", desc: "Hood systems, liquor %, cooking operations, food spoilage, dram shop.", tag: "Food service" },
];

const steps = [
  {
    num: "01",
    title: "Select property type",
    desc: "Choose from 8 commercial property types. The AI agent automatically loads the correct underwriting knowledge module.",
  },
  {
    num: "02",
    title: "Enter property details",
    desc: "Fill in address, TIV, construction, roof year, loss history, and coverage needs. Dynamic fields adapt to your property type.",
  },
  {
    num: "03",
    title: "AI routes to carriers",
    desc: "The agent scores the risk, matches eligible markets, and fires simultaneous quote requests to all qualified carriers.",
  },
  {
    num: "04",
    title: "Compare & bind",
    desc: "Side-by-side carrier comparison with AI recommendation. One click to bind, generate proposal, and issue COI.",
  },
];

const matrixRows = [
  ["Building (replacement cost)", "✓", "✓", "✓", "✓", "✓", "✓"],
  ["General Liability", "✓", "✓", "✓", "✓", "✓", "✓"],
  ["Business Income / Loss of Rents", "✓", "✓", "✓", "✓", "✓", "Opt"],
  ["Umbrella / Excess Liability", "✓", "✓", "✓", "✓", "✓", "✓"],
  ["Equipment Breakdown", "✓", "✓", "Opt", "✓", "✓", "Opt"],
  ["Inland Marine / Tools", "—", "—", "—", "Opt", "—", "✓"],
  ["Liquor Liability", "—", "—", "Opt", "—", "✓", "—"],
  ["Workers Compensation", "Opt", "Opt", "Opt", "Opt", "✓", "Opt"],
  ["Crime / Employee Dishonesty", "Opt", "✓", "✓", "Opt", "✓", "—"],
];

const testimonials = [
  {
    quote:
      "I used to spend 3 hours quoting a single apartment complex across 4 carrier portals. Commercial Pro does it in under a minute. The AI recommendation alone saved me from placing a client with the wrong carrier twice.",
    name: "Marcus T.",
    title: "Independent P&C Agent, Tampa FL",
  },
  {
    quote:
      "The coverage gap analysis is what sold me. The agent flagged that my client's restaurant didn't have food spoilage coverage before I even thought to ask. That's the kind of thing that prevents E&O claims.",
    name: "Sandra R.",
    title: "Commercial Lines Broker, Atlanta GA",
  },
  {
    quote:
      "We white-labeled Commercial Pro for our MGA network. Our agents went from 8 carrier logins to one platform. Submission volume is up 40% and declination rates dropped because the appetite matching is accurate.",
    name: "David K.",
    title: "President, Commercial Lines MGA",
  },
];

function Cell({ value }: { value: string }) {
  if (value === "✓") return <span className="ck">✓</span>;
  if (value === "Opt") return <span className="co">Opt</span>;
  return <>{value}</>;
}

export default function HomePage() {
  return (
    <main>
      <section className="hero grid-bg">
        <div className="hero-accent-bar" />
        <svg className="skyline" viewBox="0 0 1400 200" preserveAspectRatio="xMidYMax slice" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <rect x="0" y="110" width="1400" height="90" />
          <rect x="20" y="70" width="55" height="130" />
          <rect x="32" y="52" width="30" height="20" />
          <rect x="95" y="40" width="75" height="160" />
          <rect x="110" y="22" width="45" height="20" />
          <rect x="130" y="14" width="8" height="10" />
          <rect x="190" y="80" width="48" height="120" />
          <rect x="258" y="30" width="88" height="170" />
          <rect x="274" y="12" width="56" height="20" />
          <rect x="300" y="4" width="8" height="12" />
          <rect x="368" y="62" width="64" height="138" />
          <rect x="454" y="22" width="96" height="178" />
          <rect x="472" y="5" width="58" height="19" />
          <rect x="499" y="0" width="5" height="8" />
          <rect x="572" y="55" width="58" height="145" />
          <rect x="652" y="38" width="82" height="162" />
          <rect x="668" y="20" width="50" height="20" />
          <rect x="756" y="72" width="52" height="128" />
          <rect x="830" y="28" width="90" height="172" />
          <rect x="848" y="10" width="54" height="20" />
          <rect x="872" y="2" width="7" height="12" />
          <rect x="942" y="58" width="62" height="142" />
          <rect x="1026" y="44" width="77" height="156" />
          <rect x="1042" y="26" width="46" height="20" />
          <rect x="1125" y="78" width="57" height="122" />
          <rect x="1204" y="34" width="86" height="166" />
          <rect x="1221" y="16" width="52" height="20" />
          <rect x="1244" y="8" width="7" height="12" />
          <rect x="1312" y="68" width="58" height="132" />
        </svg>
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-eyebrow">The future of commercial insurance</div>
            <h1 className="hero-h1">
              Insurance for the Companies That <em>Build, Pour & Haul America.</em>
            </h1>
            <p className="hero-sub">
              Commercial Pro&apos;s AI agent quotes <strong>general contractors, cement and concrete companies, and trucking fleets</strong> — including
              UIIA-compliant coverage for drayage and intermodal carriers — across 8+ major carriers simultaneously. No portals. No phone tag. Real
              bindable quotes in under 60 seconds.
            </p>
            <div className="hero-btns">
              <Link href="/ai-agent" className="btn-primary">
                Run AI Quote Now
              </Link>
              <a href="tel:+19733077007" className="btn-outline">
                Talk to a Specialist → (973) 307-7007
              </a>
            </div>
          </div>
        </div>
        <div className="hero-prop-bar">
          <div className="hero-prop-inner">
            {["General Contractors", "Cement & Concrete", "Trucking Fleets", "UIIA / Intermodal", "Builders Risk", "Construction Bonds"].map(
              (label, index) => (
                <div className={`prop-badge${index === 0 ? " hi" : ""}`} key={label}>
                  {label}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <div className="trust-bar">
        {["8 property types", "8+ major carriers", "Real-time AI quoting", "Same-day binding", "Instant COI issuance"].map((item) => (
          <div className="trust-item" key={item}>
            <div className="trust-dot" />
            {item}
          </div>
        ))}
      </div>

      <div style={{ background: "var(--off-white)", padding: "72px 0", borderTop: "1px solid var(--border)" }}>
        <div className="section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag">Industries we specialize in</div>
          <h2 className="section-h2">
            Insurance for contractors,
            <br />
            concrete, and the road.
          </h2>
          <p className="section-body">
            Purpose-built coverage for the trades and fleets that move the economy — matched in real time to carriers with appetite for your class of
            business.
          </p>
          <div className="prop-grid">
            {industries.map((item) => (
              <Link className="prop-card" href={item.href} key={item.name} style={{ cursor: "pointer" }}>
                <div className="prop-card-icon">{item.icon}</div>
                <div className="prop-card-name">{item.name}</div>
                <div className="prop-card-desc">{item.desc}</div>
                <div className="prop-card-tag">{item.tag}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--white)", padding: "72px 0" }}>
        <div className="section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag">What we cover</div>
          <h2 className="section-h2">
            Every property.
            <br />
            Every owner.
          </h2>
          <p className="section-body">
            One platform handles all commercial property types. Select your property type and our AI agent loads the right underwriting module
            automatically.
          </p>
          <div className="prop-grid">
            {propertyTypes.map((item) => (
              <Link className="prop-card" href="/ai-agent" key={item.name}>
                <div className="prop-card-icon">{item.icon}</div>
                <div className="prop-card-name">{item.name}</div>
                <div className="prop-card-desc">{item.desc}</div>
                <div className="prop-card-tag">{item.tag}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="how-bg" style={{ padding: "72px 0" }}>
        <div className="section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag">How it works</div>
          <h2 className="section-h2">
            Quote in minutes.
            <br />
            Not hours.
          </h2>
          <p className="section-body">
            Commercial Pro&apos;s AI agent replaces the entire manual quoting workflow — from carrier portal login to comparison spreadsheet.
          </p>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div className="step-item" key={step.num}>
                <div className="step-num">{step.num}</div>
                <div className="step-line" />
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
                {index < steps.length - 1 ? <div className="step-arrow">→</div> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-bg" style={{ padding: 0 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="stat-row">
            {[
              ["8", "Property types"],
              ["8+", "Major carriers"],
              ["<60s", "Quote time"],
              ["$0", "Per-quote fee"],
            ].map(([val, label]) => (
              <div className="stat-block" key={label}>
                <div className="stat-val">{val}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="matrix-bg" style={{ padding: "72px 0" }}>
        <div className="section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag" style={{ color: "var(--accent)" }}>
            Coverage by type
          </div>
          <h2 className="section-h2" style={{ color: "var(--white)" }}>
            What&apos;s covered
            <br />
            for you.
          </h2>
          <div className="matrix-scroll">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>Coverage Line</th>
                  <th>Apartments</th>
                  <th>Office</th>
                  <th>Retail</th>
                  <th>Warehouse</th>
                  <th>Hotel</th>
                  <th>Contractor</th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    {row.slice(1).map((cell, index) => (
                      <td key={`${row[0]}-${index}`}>
                        <Cell value={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: "#6B99BB", marginTop: 12, fontStyle: "italic" }}>
            ✓ = Standard · Opt = Optional · — = Not applicable. Coverage specifics vary by carrier and property details.
          </p>
        </div>
      </div>

      <div style={{ padding: "72px 0", background: "var(--off-white)" }}>
        <div className="section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag">What agents say</div>
          <h2 className="section-h2">
            Built for agents
            <br />
            who mean business.
          </h2>
          <div className="test-grid">
            {testimonials.map((item) => (
              <div className="test-card" key={item.name}>
                <div className="test-stars">★★★★★</div>
                <p className="test-quote">&ldquo;{item.quote}&rdquo;</p>
                <div className="test-name">{item.name}</div>
                <div className="test-title">{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--white)", padding: "72px 0", borderTop: "1px solid var(--border)" }}>
        <div className="section-wrap" style={{ paddingTop: 0, paddingBottom: 0, maxWidth: 900 }}>
          <div className="section-tag">Frequently asked</div>
          <h2 className="section-h2">
            Coverage questions,
            <br />
            answered.
          </h2>
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 20 }}>
            <details style={{ background: "var(--off-white)", border: "1px solid var(--border)", borderRadius: 6, padding: "20px 24px" }}>
              <summary
                style={{
                  fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--steel)",
                  cursor: "pointer",
                }}
              >
                Do I need special insurance to sign a UIIA agreement?
              </summary>
              <p style={{ marginTop: 14, color: "var(--text-mid)", lineHeight: 1.7 }}>
                Yes. The Uniform Intermodal Interchange and Facilities Access Agreement requires motor carriers to carry minimum auto liability and
                cargo coverage, with specific certificate language naming the intermodal equipment provider, before you can interchange chassis at rail
                ramps or marine terminals. Commercial Pro issues UIIA-compliant certificates of insurance same-day.
              </p>
            </details>
            <details style={{ background: "var(--off-white)", border: "1px solid var(--border)", borderRadius: 6, padding: "20px 24px" }}>
              <summary
                style={{
                  fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--steel)",
                  cursor: "pointer",
                }}
              >
                What insurance does a general contractor need to bid a job?
              </summary>
              <p style={{ marginTop: 14, color: "var(--text-mid)", lineHeight: 1.7 }}>
                Most GCs need general liability (often with specific per-project or aggregate limits required by the project owner), workers&apos;
                compensation, commercial auto for job-site vehicles, and often a builders risk policy for the structure under construction. Many bids
                also require a certificate naming the property owner as additional insured.
              </p>
            </details>
            <details style={{ background: "var(--off-white)", border: "1px solid var(--border)", borderRadius: 6, padding: "20px 24px" }}>
              <summary
                style={{
                  fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--steel)",
                  cursor: "pointer",
                }}
              >
                Can cement and concrete companies get commercial auto for mixer trucks?
              </summary>
              <p style={{ marginTop: 14, color: "var(--text-mid)", lineHeight: 1.7 }}>
                Yes — mixer trucks, pump trucks, and other specialized concrete vehicles are rated differently than standard commercial auto. Commercial
                Pro&apos;s AI agent routes these to carriers with appetite for heavy specialized equipment rather than generic fleet markets that will
                decline or overprice the risk.
              </p>
            </details>
          </div>
        </div>
      </div>

      <div className="home-cta grid-bg">
        <div className="home-cta-inner">
          <div className="home-cta-left">
            <div className="cta-h2">
              Ready to quote
              <br />
              <em>smarter?</em>
            </div>
            <p>Get your first commercial property quote from the AI agent in under 60 seconds. No signup required for the demo.</p>
          </div>
          <div className="cta-options">
            <div className="cta-option">
              <div className="cta-option-label">Try the AI agent</div>
              <Link href="/ai-agent" className="btn-primary" style={{ fontSize: 17, padding: "15px 32px" }}>
                Launch AI Agent →
              </Link>
              <div className="cta-note">Free demo · All 8 property types</div>
            </div>
            <div className="cta-divider" />
            <div className="cta-option">
              <div className="cta-option-label">Talk to a specialist</div>
              <a href="tel:9733077007" className="cta-phone">
                (973) 307-7007
              </a>
              <div className="cta-note">Real people. Same-day response.</div>
            </div>
            <div className="cta-divider" />
            <div className="cta-option">
              <div className="cta-option-label">Email us</div>
              <a
                href="mailto:info@commercialpro.ai"
                style={{
                  fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--accent)",
                  textDecoration: "none",
                }}
              >
                info@commercialpro.ai
              </a>
              <div className="cta-note">We respond within 2 hours.</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
