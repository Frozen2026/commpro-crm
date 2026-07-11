"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { buildDemoQuote, type QuoteResult } from "@/components/marketing/demo-quote";
import { PROPERTY_MODULES, PROPERTY_TYPE_ORDER } from "@/components/marketing/property-modules";

const stepDefs = [
  { ico: "📋", txt: "Capturing ACORD property data..." },
  { ico: "🎯", txt: "Running carrier appetite matcher..." },
  { ico: "📡", txt: "Firing simultaneous quote requests..." },
  { ico: "✨", txt: "Normalizing responses & scoring risk..." },
];

export function AiAgentForm() {
  const [propertyType, setPropertyType] = useState<string>("apartment");
  const activeModule = PROPERTY_MODULES[propertyType];
  const [fields, setFields] = useState<Record<string, string>>(() => ({
    f_addr: activeModule.defaults.f_addr,
    f_year: activeModule.defaults.f_year,
    f_sqft: activeModule.defaults.f_sqft,
    f_tiv: activeModule.defaults.f_tiv,
    f_const: "joisted_masonry",
    f_roofyr: activeModule.defaults.f_roofyr,
    f_rooftype: "shingle",
    f_losses: "minor",
    f_spk: "full",
    ...Object.fromEntries(activeModule.dynFields.map((field) => [field.id, field.def ?? field.opts?.[0] ?? ""])),
  }));
  const [coverages, setCoverages] = useState<string[]>(activeModule.defCovs);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [status, setStatus] = useState("Awaiting submission");
  const [, startTransition] = useTransition();

  const dynDefaults = useMemo(
    () => Object.fromEntries(activeModule.dynFields.map((field) => [field.id, field.def ?? field.opts?.[0] ?? ""])),
    [activeModule],
  );

  function selectType(nextType: string) {
    const next = PROPERTY_MODULES[nextType];
    setPropertyType(nextType);
    setCoverages(next.defCovs);
    setFields((current) => ({
      ...current,
      ...next.defaults,
      f_const: current.f_const || "joisted_masonry",
      f_rooftype: current.f_rooftype || "shingle",
      f_losses: current.f_losses || "minor",
      f_spk: current.f_spk || "full",
      ...Object.fromEntries(next.dynFields.map((field) => [field.id, field.def ?? field.opts?.[0] ?? ""])),
    }));
    setResult(null);
    setStatus("Awaiting submission");
    setStepIndex(-1);
  }

  function updateField(id: string, value: string) {
    setFields((current) => ({ ...current, [id]: value }));
  }

  function toggleCoverage(cov: string) {
    setCoverages((current) => (current.includes(cov) ? current.filter((item) => item !== cov) : [...current, cov]));
  }

  async function runAgent() {
    setRunning(true);
    setResult(null);
    setStatus("Agent running...");
    setStepIndex(0);

    for (let i = 0; i < stepDefs.length; i += 1) {
      setStepIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 450 + i * 120));
    }

    const quote = buildDemoQuote({
      propertyType,
      moduleLabel: activeModule.label,
      address: fields.f_addr || "",
      yearBuilt: fields.f_year || "",
      sqft: fields.f_sqft || "",
      tiv: fields.f_tiv || "",
      construction: fields.f_const || "frame",
      roofYear: fields.f_roofyr || "",
      roofType: fields.f_rooftype || "",
      losses: fields.f_losses || "none",
      sprinklers: fields.f_spk || "none",
      coverages,
      extras: Object.fromEntries(
        activeModule.dynFields.map((field) => [field.id.replace(/^f_/, ""), fields[field.id] ?? dynDefaults[field.id] ?? ""]),
      ),
      rules: activeModule.rules,
      appetite: activeModule.appetite,
    });

    startTransition(() => {
      setResult(quote);
      setStatus(`${quote.quotes.length} quotes · ${quote.module_used}`);
      setRunning(false);
      setStepIndex(stepDefs.length);
    });
  }

  return (
    <>
      <div className="agent-hero grid-bg">
        <div className="hero-accent-bar" />
        <div className="agent-hero-inner">
          <div className="agent-hero-grid">
            <div>
              <div className="section-tag" style={{ color: "var(--accent)" }}>
                AI Carrier Agent
              </div>
              <h1 className="agent-h1">
                Quote every
                <br />
                <em>carrier. Now.</em>
              </h1>
              <p className="agent-lead">
                Select your property type, enter the details, and our AI agent routes to every eligible carrier
                simultaneously — returning real quotes with a clear recommendation in under 60 seconds.
              </p>
              <div className="agent-features">
                {[
                  "All 8 commercial property types with dedicated knowledge modules",
                  "Simultaneous quotes from Coterie, Hartford, Markel, Nationwide & more",
                  "AI risk scoring, appetite matching, and coverage gap analysis",
                  "Plain-English recommendation — not just numbers",
                  "No EZLynx. No per-quote fees. You own the carrier relationships.",
                ].map((item) => (
                  <div className="agent-feat" key={item}>
                    <div className="agent-feat-icon">✓</div>
                    <div>{item}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }}>
              <div
                style={{
                  width: "100%",
                  fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "#7AAFD4",
                  marginBottom: 4,
                }}
              >
                Active carrier connections
              </div>
              {["Coterie ✓", "Hartford ✓", "Markel ✓", "Nationwide ✓", "Liberty Mutual ✓"].map((carrier) => (
                <div className="carrier-pill" style={{ fontSize: 12, padding: "6px 12px" }} key={carrier}>
                  {carrier}
                </div>
              ))}
              <div className="carrier-pill" style={{ fontSize: 12, padding: "6px 12px", opacity: 0.5 }}>
                Travelers (soon)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="disclaimer-banner">
        <div className="disclaimer-banner-inner">
          <strong>Important:</strong> Quotes generated by the Commercial Pro AI Agent are illustrative estimates based
          on self-reported data and AI-modeled underwriting assumptions. They are <strong>not binding</strong> and do
          not represent a final insurance offer. All coverage is subject to full underwriting review, carrier approval,
          and applicable state regulations. Commercial Pro is a licensed insurance platform. Coverage is placed through
          licensed agents. <Link href="/privacy">Privacy Policy</Link> · <Link href="/contact">Contact Us</Link>
        </div>
      </div>

      <div className="agent-main">
        <div className="agent-card">
          <div className="agent-card-hdr">
            <div className="agent-card-title">📋 Get AI Quote Form</div>
            <div className="module-badge" style={{ margin: 0, fontSize: 10 }}>
              {activeModule.icon} {activeModule.label} Module
            </div>
          </div>
          <div className="agent-card-body">
            <div className="type-grid">
              {PROPERTY_TYPE_ORDER.map((type) => {
                const item = PROPERTY_MODULES[type];
                return (
                  <button
                    type="button"
                    key={type}
                    className={`type-btn${propertyType === type ? " active" : ""}`}
                    onClick={() => selectType(type)}
                  >
                    <span className="t-ico">{item.icon}</span>
                    <span className="t-lbl">{item.label.split(" / ")[0].split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>

            <div className="fld">
              <label htmlFor="f_addr">Property Address</label>
              <input id="f_addr" type="text" value={fields.f_addr || ""} onChange={(e) => updateField("f_addr", e.target.value)} />
            </div>
            <div className="fld2">
              <div className="fld">
                <label htmlFor="f_year">Year Built</label>
                <input id="f_year" type="number" value={fields.f_year || ""} onChange={(e) => updateField("f_year", e.target.value)} />
              </div>
              <div className="fld">
                <label htmlFor="f_sqft">Square Footage</label>
                <input id="f_sqft" type="text" value={fields.f_sqft || ""} onChange={(e) => updateField("f_sqft", e.target.value)} />
              </div>
            </div>
            <div className="fld2">
              <div className="fld">
                <label htmlFor="f_tiv">Total Insured Value</label>
                <input id="f_tiv" type="text" value={fields.f_tiv || ""} onChange={(e) => updateField("f_tiv", e.target.value)} />
              </div>
              <div className="fld">
                <label htmlFor="f_const">Construction</label>
                <select id="f_const" value={fields.f_const || "frame"} onChange={(e) => updateField("f_const", e.target.value)}>
                  <option value="frame">Frame</option>
                  <option value="joisted_masonry">Joisted Masonry</option>
                  <option value="masonry">Masonry</option>
                  <option value="fire_resistive">Fire Resistive</option>
                </select>
              </div>
            </div>
            <div className="fld2">
              <div className="fld">
                <label htmlFor="f_roofyr">Roof Year</label>
                <input id="f_roofyr" type="number" value={fields.f_roofyr || ""} onChange={(e) => updateField("f_roofyr", e.target.value)} />
              </div>
              <div className="fld">
                <label htmlFor="f_rooftype">Roof Type</label>
                <select id="f_rooftype" value={fields.f_rooftype || "shingle"} onChange={(e) => updateField("f_rooftype", e.target.value)}>
                  <option value="shingle">Arch. Shingle</option>
                  <option value="metal">Metal</option>
                  <option value="tile">Tile</option>
                  <option value="flat">Flat/TPO</option>
                </select>
              </div>
            </div>
            <div className="fld2">
              <div className="fld">
                <label htmlFor="f_losses">Loss History</label>
                <select id="f_losses" value={fields.f_losses || "none"} onChange={(e) => updateField("f_losses", e.target.value)}>
                  <option value="none">No losses</option>
                  <option value="minor">1–2 minor (&lt;$50K)</option>
                  <option value="moderate">3–4 or $50K–$200K</option>
                  <option value="significant">5+ or &gt;$200K</option>
                </select>
              </div>
              <div className="fld">
                <label htmlFor="f_spk">Sprinklers</label>
                <select id="f_spk" value={fields.f_spk || "full"} onChange={(e) => updateField("f_spk", e.target.value)}>
                  <option value="full">Full</option>
                  <option value="partial">Partial</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>

            <div className="fld2">
              {activeModule.dynFields.map((field) => (
                <div className="fld" key={field.id}>
                  <label htmlFor={field.id}>{field.lbl}</label>
                  {field.type === "select" ? (
                    <select
                      id={field.id}
                      value={fields[field.id] ?? field.opts?.[0] ?? ""}
                      onChange={(e) => updateField(field.id, e.target.value)}
                    >
                      {(field.opts || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={field.id}
                      type={field.type}
                      value={fields[field.id] ?? field.def ?? ""}
                      onChange={(e) => updateField(field.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="fld">
              <label>Coverage Lines</label>
              <div className="cov-grid">
                {activeModule.covs.map((cov) => (
                  <label className="cov-item" key={cov}>
                    <input type="checkbox" checked={coverages.includes(cov)} onChange={() => toggleCoverage(cov)} />
                    {cov}
                  </label>
                ))}
              </div>
            </div>

            <button type="button" className="btn-run" disabled={running} onClick={() => void runAgent()}>
              <span>{running ? "⏳" : "🤖"}</span>
              <span>{running ? "Running Agent..." : "Run AI Carrier Agent"}</span>
            </button>
          </div>
        </div>

        <div className="agent-card">
          <div className="agent-card-hdr">
            <div className="agent-card-title">🤖 AI Agent Output</div>
            <div className="out-status">{status}</div>
          </div>
          <div className="agent-card-body">
            {!result && stepIndex < 0 ? (
              <div className="placeholder">
                <div className="ph-ico">🏗️</div>
                <div className="ph-txt">
                  Select a property type, fill in the details, and click Run AI Carrier Agent to get real quotes from
                  multiple carriers.
                </div>
              </div>
            ) : null}

            {running || (stepIndex >= 0 && !result) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {stepDefs.map((step, index) => {
                  const done = index < stepIndex || Boolean(result);
                  const active = index === stepIndex && !result;
                  return (
                    <div
                      key={step.txt}
                      className={`step-row show${done ? " done" : ""}${active ? " running" : ""}`}
                    >
                      <div className="step-ico">{done ? "✓" : step.ico}</div>
                      <div className="step-txt">{step.txt}</div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {result ? <QuoteResults result={result} /> : null}
          </div>
        </div>
      </div>
    </>
  );
}

function QuoteResults({ result }: { result: QuoteResult }) {
  const riskPct = Math.min(100, result.risk_score || 50);

  return (
    <div>
      <div className="risk-row">
        <div className="risk-num" style={{ color: result.risk_color }}>
          {result.risk_score}
        </div>
        <div className="risk-info">
          <div className="risk-lbl">
            Risk Score — <strong style={{ color: result.risk_color }}>{result.risk_label}</strong> · {result.module_used}
          </div>
          <div className="risk-bar">
            <div className="risk-fill" style={{ width: `${riskPct}%`, background: result.risk_color }} />
          </div>
          <div className="risk-note">{result.risk_summary}</div>
        </div>
      </div>

      {result.declined_carriers.length ? (
        <div style={{ marginBottom: 10 }}>
          {result.declined_carriers.map((item) => (
            <div className="declined-item" key={item.carrier}>
              ✗ <strong>{item.carrier}:</strong> {item.reason}
            </div>
          ))}
        </div>
      ) : null}

      <div
        style={{
          fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--text-light)",
          marginBottom: 8,
        }}
      >
        {result.quotes.length} quotes returned
      </div>

      <div className="quotes-wrap">
        {result.quotes.map((quote) => (
          <div className={`q-card${quote.recommended ? " rec" : ""}`} key={quote.carrier}>
            {quote.recommended ? <div className="rec-tag">⭐ Recommended</div> : null}
            <div className="q-hdr">
              <div className="q-name">{quote.carrier}</div>
              <div className="q-rating">{quote.carrier_rating}</div>
            </div>
            <div className="q-premium">
              ${quote.annual_premium.toLocaleString()} <span>/ year</span>
            </div>
            <div className="q-dets">
              <div className="q-det">
                <div className="q-det-l">Building Limit</div>
                <div className="q-det-v">{quote.building_limit}</div>
              </div>
              <div className="q-det">
                <div className="q-det-l">GL Limit</div>
                <div className="q-det-v">{quote.gl_limit}</div>
              </div>
              <div className="q-det">
                <div className="q-det-l">Deductible</div>
                <div className="q-det-v">{quote.deductible}</div>
              </div>
              <div className="q-det">
                <div className="q-det-l">Wind Ded.</div>
                <div className="q-det-v">{quote.wind_deductible}</div>
              </div>
              <div className="q-det">
                <div className="q-det-l">Bindable</div>
                <div className="q-det-v" style={{ color: quote.bindable ? "var(--green)" : "var(--amber)" }}>
                  {quote.bindable ? "✓ Yes" : "⏳ Referral"}
                </div>
              </div>
            </div>
            {quote.notes ? <div className="q-note">{quote.notes}</div> : null}
          </div>
        ))}
      </div>

      <div className="rec-box">
        <div className="rec-ttl">🤖 AI Recommendation</div>
        <div className="rec-txt">{result.recommendation}</div>
      </div>
      <div className="gaps-box">
        <div className="gaps-ttl">⚠️ Coverage Gaps</div>
        {result.coverage_gaps.map((gap) => (
          <div className="gap-item" key={gap}>
            → {gap}
          </div>
        ))}
      </div>
      <div className="next-box">
        <div className="next-ttl">📋 Next Steps</div>
        <div className="next-txt">{result.next_steps}</div>
      </div>
    </div>
  );
}
