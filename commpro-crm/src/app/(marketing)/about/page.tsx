import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Commercial Pro was built by agents for agents — AI infrastructure that makes commercial property quoting dramatically faster.",
};

export default function AboutPage() {
  return (
    <main>
      <section className="about-hero grid-bg">
        <div className="hero-accent-bar" />
        <div className="about-hero-inner">
          <div className="section-tag" style={{ color: "var(--accent)" }}>
            Who we are
          </div>
          <h1 className="about-h1">
            Built by agents.
            <br />
            <em>For agents.</em>
          </h1>
          <p className="about-lead">
            Commercial Pro was founded on a single frustration: commercial property agents were spending more time navigating carrier portals than
            actually serving clients. We built the platform we always wished existed.
          </p>
        </div>
      </section>

      <div className="about-mission">
        <div className="about-mission-inner">
          <div>
            <div className="section-tag">Our mission</div>
            <div className="mission-statement">
              Give every agent the power of <em>an entire underwriting team.</em>
            </div>
          </div>
          <div className="mission-body">
            <p>
              Commercial insurance is complex. A single apartment complex submission can touch 4 different carrier portals, 6 ACORD forms, and 3 hours
              of an agent&apos;s day — before a single quote comes back. We think that&apos;s broken.
            </p>
            <p>
              Commercial Pro exists to automate everything between the client conversation and the bound policy. Our AI agent handles carrier
              selection, appetite matching, payload formatting, quote interpretation, and recommendation — so agents can focus on relationships and
              advice.
            </p>
            <p>
              We&apos;re not a marketplace. We&apos;re not a lead gen platform. We&apos;re an intelligent infrastructure layer that makes commercial
              property agents dramatically more productive and profitable.
            </p>
          </div>
        </div>
      </div>

      <div className="about-values" style={{ padding: "72px 0" }}>
        <div className="section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag">What we stand for</div>
          <h2 className="section-h2">Our values.</h2>
          <div className="values-grid">
            {[
              [
                "01",
                "Agents first",
                "Every feature we build starts with one question: does this make an agent's day better? We don't build for insurers or investors — we build for the licensed professional doing the work.",
              ],
              [
                "02",
                "Radical transparency",
                "We show agents exactly why the AI recommended a carrier, exactly what coverage gaps exist, and exactly what it will cost. No black boxes. No hidden fees. No surprises at claims time.",
              ],
              [
                "03",
                "Accuracy over speed",
                "Fast quotes that are wrong cost agents clients and E&O exposure. We'd rather take an extra second to get the appetite right than send to a carrier that will decline it.",
              ],
              [
                "04",
                "Own your data",
                "Your client relationships, submission history, and binding data belong to you — not us. We'll never sell your data or use it to compete with you. Your book is your book.",
              ],
            ].map(([num, title, desc]) => (
              <div className="value-item" key={num}>
                <div className="value-num">{num}</div>
                <div className="value-line" />
                <div className="value-title">{title}</div>
                <div className="value-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="about-team-bg" style={{ padding: "72px 0" }}>
        <div className="section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag" style={{ color: "var(--accent)" }}>
            The team
          </div>
          <h2 className="section-h2" style={{ color: "var(--white)" }}>
            Insurance people.
            <br />
            Technology builders.
          </h2>
          <p className="section-body" style={{ color: "#A8C4DA" }}>
            Our team combines decades of commercial insurance experience with modern AI and software engineering. We speak both languages fluently.
          </p>
          <div className="team-grid">
            {[
              [
                "👨‍💼",
                "C. Babb",
                "Founder & CEO",
                "20+ years in commercial insurance. Former agency principal specializing in commercial property and contractors. Founded Commercial Pro to solve the quoting problem he lived every day.",
              ],
              [
                "👩‍💻",
                "Technology Team",
                "Platform Engineering",
                "Full-stack engineers and AI specialists building the carrier integration layer, ACORD data engine, and the AI orchestration system that powers the quoting agent.",
              ],
              [
                "📋",
                "Underwriting Advisors",
                "Knowledge & Accuracy",
                "Licensed commercial underwriters who review and validate our carrier appetite rules, knowledge modules, and coverage recommendations. The human intelligence behind the AI.",
              ],
              [
                "🤝",
                "Join Us",
                "We're hiring",
                "We're looking for commercial insurance professionals who want to help build the future of the industry. If that's you, reach out at careers@commercialpro.ai",
              ],
            ].map(([avatar, name, role, bio]) => (
              <div className="team-card" key={name}>
                <div className="team-avatar">{avatar}</div>
                <div className="team-info">
                  <div className="team-name">{name}</div>
                  <div className="team-role">{role}</div>
                  <div className="team-bio">{bio}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="about-tech" style={{ padding: "72px 0" }}>
        <div className="section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag">The technology</div>
          <h2 className="section-h2">
            How the AI agent
            <br />
            actually works.
          </h2>
          <div className="tech-grid" style={{ marginTop: 32 }}>
            <div className="tech-visual">
              <div
                style={{
                  fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  marginBottom: 16,
                }}
              >
                Quote lifecycle
              </div>
              <div className="tech-flow">
                {[
                  ["📋", "ACORD data capture", "Dynamic forms map to ACORD 125/140 standards. Every field feeds the canonical property object."],
                  ["🎯", "Knowledge module injection", "Property type detected → correct underwriting rules loaded into the AI agent's context."],
                  ["🔍", "Risk scoring", "AI scores 1–100. Flags hard knockouts before wasting carrier API calls on dead submissions."],
                  ["📡", "Parallel carrier requests", "All eligible carriers hit simultaneously via adapter layer. No waiting for slowest carrier."],
                  ["✨", "AI analysis & recommendation", "Normalizes all responses, flags coverage gaps, recommends best fit with plain-English reasoning."],
                ].map(([icon, title, desc]) => (
                  <div className="tech-step" key={title}>
                    <div className="tech-step-icon">{icon}</div>
                    <div>
                      <div className="tech-step-title">{title}</div>
                      <div className="tech-step-desc">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="tech-features">
              {[
                ["🏗️", "8 knowledge modules", "One per property type. Each contains underwriting rules, carrier appetite, required fields, and pricing factors."],
                ["🔌", "Direct carrier APIs", "No EZLynx. No middleware fees. Direct REST API and ACORD XML integrations with each carrier."],
                ["🤖", "Claude AI engine", "Powered by Anthropic's Claude — commercial property expertise baked into every system prompt."],
                ["📄", "Instant COI issuance", "ACORD 25 certificates generated in under 1 second after binding. Certificate holder tracking built in."],
              ].map(([icon, title, desc]) => (
                <div className="tech-feat" key={title}>
                  <div className="tech-feat-icon">{icon}</div>
                  <div>
                    <div className="tech-feat-title">{title}</div>
                    <div className="tech-feat-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="about-carriers">
        <div className="section-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="section-tag">Carrier network</div>
          <h2 className="section-h2">
            Connected to
            <br />
            the markets
            <br />
            that matter.
          </h2>
          <p className="section-body">
            We build and maintain direct API integrations with major commercial property carriers — no aggregator, no middleware, no per-quote fees.
          </p>
          <div className="carrier-logos">
            {["Coterie", "The Hartford", "Markel Digital", "Nationwide", "Liberty Mutual"].map((name) => (
              <div className="carrier-logo" key={name}>
                {name}
              </div>
            ))}
            {["Travelers (coming)", "Chubb (coming)", "Cincinnati (coming)", "Surplus Lines (coming)"].map((name) => (
              <div className="carrier-logo coming" key={name}>
                {name}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/ai-agent" className="btn-primary">
              Try the AI Agent
            </Link>
            <a href="tel:9733077007" className="btn-primary" style={{ background: "var(--steel)" }}>
              Talk to Us: (973) 307-7007
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
