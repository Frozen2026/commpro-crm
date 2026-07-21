"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function PublicCoiRequestForm() {
  const [insuredName, setInsuredName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [holderName, setHolderName] = useState("");
  const [holderEmail, setHolderEmail] = useState("");
  const [holderAddress, setHolderAddress] = useState("");
  const [policyType, setPolicyType] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!insuredName.trim() || !email.trim() || !holderName.trim()) {
      setError("Please fill in insured/business name, your email, and certificate holder name.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/public-coi-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insuredName,
          contactName,
          email,
          phone,
          holderName,
          holderEmail,
          holderAddress,
          policyType,
          neededBy,
          notes,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string }
        | null;

      if (!response.ok || !data?.ok) {
        setError(data?.error || "Something went wrong. Please call (973) 307-7007.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please call (973) 307-7007 or email info@commercialpro.ai.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2";

  if (success) {
    return (
      <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-900">COI request received</h2>
        <p className="text-sm text-emerald-800">
          Thanks — we got your certificate request for <strong>{insuredName}</strong>. We typically issue same business
          day during business hours.
        </p>
        <p className="text-sm text-emerald-800">
          Need it urgently? Call{" "}
          <a href="tel:9733077007" className="font-semibold underline">
            (973) 307-7007
          </a>
          .
        </p>
        <button
          type="button"
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)]"
          onClick={() => {
            setSuccess(false);
            setInsuredName("");
            setContactName("");
            setEmail("");
            setPhone("");
            setHolderName("");
            setHolderEmail("");
            setHolderAddress("");
            setPolicyType("");
            setNeededBy("");
            setNotes("");
          }}
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm" onSubmit={onSubmit}>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Request a Certificate of Insurance</h2>
        <p className="mt-1 text-sm text-slate-600">Same-day turnaround during business hours.</p>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Insured / Business Name</span>
        <input
          name="insuredName"
          className={fieldClass}
          type="text"
          placeholder="Acme Construction LLC"
          value={insuredName}
          onChange={(e) => setInsuredName(e.target.value)}
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Your Name</span>
          <input
            name="contactName"
            className={fieldClass}
            type="text"
            placeholder="Jane Smith"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Your Phone</span>
          <input
            name="phone"
            className={fieldClass}
            type="tel"
            placeholder="(555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Your Email</span>
        <input
          name="email"
          className={fieldClass}
          type="email"
          placeholder="jane@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Certificate Holder Name</span>
        <input
          name="holderName"
          className={fieldClass}
          type="text"
          placeholder="Project owner / GC / landlord"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          required
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Certificate Holder Email</span>
        <input
          name="holderEmail"
          className={fieldClass}
          type="email"
          placeholder="coi@holder.com"
          value={holderEmail}
          onChange={(e) => setHolderEmail(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Certificate Holder Address</span>
        <input
          name="holderAddress"
          className={fieldClass}
          type="text"
          placeholder="123 Main St, City, ST 00000"
          value={holderAddress}
          onChange={(e) => setHolderAddress(e.target.value)}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Coverage Needed</span>
          <select
            name="policyType"
            className={fieldClass}
            value={policyType}
            onChange={(e) => setPolicyType(e.target.value)}
          >
            <option value="">Select...</option>
            <option>General Liability</option>
            <option>Commercial Auto</option>
            <option>Workers Compensation</option>
            <option>Umbrella / Excess</option>
            <option>Builders Risk</option>
            <option>Multiple lines / Other</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Needed By</span>
          <input
            name="neededBy"
            className={fieldClass}
            type="date"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Additional Insured / Special Wording</span>
        <textarea
          name="notes"
          className={fieldClass}
          rows={3}
          placeholder="Additional insured requirements, job location, endorsement language, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {error ? (
        <div className="space-y-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          <p>
            Or reach us now:{" "}
            <a className="font-semibold underline" href="tel:9733077007">
              (973) 307-7007
            </a>{" "}
            ·{" "}
            <a className="font-semibold underline" href="mailto:info@commercialpro.ai">
              info@commercialpro.ai
            </a>
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-95 disabled:opacity-70"
      >
        {loading ? "Submitting…" : "Submit COI Request →"}
      </button>

      <p className="text-xs text-slate-500">
        Already a client with portal access?{" "}
        <Link href="/login?next=/coi" className="font-medium text-[var(--primary)] hover:underline">
          Sign in to generate a COI in the CRM →
        </Link>
      </p>
    </form>
  );
}
