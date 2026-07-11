"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      window.alert("Please fill in your name, email, and message.");
      return;
    }

    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "N/A"}`,
      `Type: ${type || "N/A"}`,
      "",
      "Message:",
      message,
    ].join("\n");

    window.location.href = `mailto:info@commercialpro.ai?subject=${encodeURIComponent(
      `Commercial Pro Inquiry from ${name}`,
    )}&body=${encodeURIComponent(body)}`;
    setSuccess(true);
  }

  return (
    <form className="contact-form-wrap" onSubmit={onSubmit}>
      <div className="contact-form-title">Send us a message</div>
      <div className="cf-field">
        <label htmlFor="cf_name">Full Name</label>
        <input id="cf_name" type="text" placeholder="John Smith" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="cf-field">
        <label htmlFor="cf_email">Email Address</label>
        <input id="cf_email" type="email" placeholder="john@agency.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="cf-field">
        <label htmlFor="cf_phone">Phone Number</label>
        <input id="cf_phone" type="tel" placeholder="(555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="cf-field">
        <label htmlFor="cf_type">I am a...</label>
        <select id="cf_type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Select...</option>
          <option>Independent insurance agent / broker</option>
          <option>Agency owner or principal</option>
          <option>MGA / wholesale broker</option>
          <option>Business owner seeking coverage</option>
          <option>Carrier or technology partner</option>
          <option>Other</option>
        </select>
      </div>
      <div className="cf-field">
        <label htmlFor="cf_msg">What can we help you with?</label>
        <textarea
          id="cf_msg"
          placeholder="Tell us about your business, the lines you write, and what you're looking for in Commercial Pro..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button className="cf-submit" type="submit">
        Send Message →
      </button>
      {success ? (
        <div className="cf-success" style={{ display: "block" }}>
          ✓ Message received! We&apos;ll be in touch within 2 hours during business hours. You can also reach us directly at (973) 307-7007.
        </div>
      ) : null}
      <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-light)" }}>
        Prefer the AI Agent? <Link href="/ai-agent">Get an instant AI quote →</Link>
      </p>
    </form>
  );
}
