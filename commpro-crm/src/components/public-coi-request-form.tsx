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

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!insuredName.trim() || !email.trim() || !holderName.trim()) {
      window.alert("Please fill in insured/business name, your email, and certificate holder name.");
      return;
    }

    const body = [
      "COI REQUEST",
      "",
      `Insured / Business: ${insuredName}`,
      `Requestor Name: ${contactName || "N/A"}`,
      `Requestor Email: ${email}`,
      `Requestor Phone: ${phone || "N/A"}`,
      "",
      `Certificate Holder: ${holderName}`,
      `Holder Email: ${holderEmail || "N/A"}`,
      `Holder Address: ${holderAddress || "N/A"}`,
      "",
      `Coverage / Policy Type: ${policyType || "N/A"}`,
      `Needed By: ${neededBy || "ASAP"}`,
      "",
      "Additional Instructions:",
      notes || "N/A",
    ].join("\n");

    window.location.href = `mailto:info@commercialpro.ai?subject=${encodeURIComponent(
      `COI Request — ${insuredName}`,
    )}&body=${encodeURIComponent(body)}`;
    setSuccess(true);
  }

  const fieldClass =
    "w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2";

  return (
    <form className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm" onSubmit={onSubmit}>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Request a Certificate of Insurance</h2>
        <p className="mt-1 text-sm text-slate-600">Same-day turnaround during business hours.</p>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Insured / Business Name</span>
        <input
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
          <select className={fieldClass} value={policyType} onChange={(e) => setPolicyType(e.target.value)}>
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
          <input className={fieldClass} type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Additional Insured / Special Wording</span>
        <textarea
          className={fieldClass}
          rows={3}
          placeholder="Additional insured requirements, job location, endorsement language, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <button
        type="submit"
        className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-95"
      >
        Submit COI Request →
      </button>

      {success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Request started. Send the email that opens to complete it — we typically issue same business day. Or call{" "}
          <a href="tel:9733077007" className="font-semibold underline">
            (973) 307-7007
          </a>
          .
        </p>
      ) : null}

      <p className="text-xs text-slate-500">
        Already a client with portal access?{" "}
        <Link href="/login?next=/coi" className="font-medium text-[var(--primary)] hover:underline">
          Sign in to generate a COI in the CRM →
        </Link>
      </p>
    </form>
  );
}
