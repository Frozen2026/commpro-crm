import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <div>
        <div className="footer-brand">
          COMMERCIAL <span>PRO</span>
        </div>
        <div className="footer-copy" style={{ marginTop: 4 }}>
          © 2026 Commercial Pro · AI-Powered Insurance Platform · All rights reserved.
        </div>
      </div>
      <div className="footer-links">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/ai-agent">AI Agent</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="https://app.commpro.ai/coi-request">Request a COI</Link>
        <a href="tel:9733077007">(973) 307-7007</a>
        <a href="mailto:info@commercialpro.ai">info@commercialpro.ai</a>
      </div>
    </footer>
  );
}
