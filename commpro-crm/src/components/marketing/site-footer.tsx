import Link from "next/link";

import { marketingNavLinks } from "@/components/marketing/nav-links";

const productLinks = marketingNavLinks.filter((link) => link.href !== "/");

const resourceLinks = [
  { href: "/coi-request", label: "COI request" },
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Create account" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-3 text-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
              C
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">CommPro.ai</p>
              <p className="text-base font-semibold">Commercial insurance CRM</p>
            </div>
          </Link>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            The operating system for agencies serving contractors, trucking, concrete, and intermodal accounts.
            Modern CRM, AI-assisted quoting, and COI workflows in one place.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Product</p>
          <ul className="mt-4 space-y-3">
            {productLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-slate-600 transition hover:text-slate-950">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Get started</p>
          <ul className="mt-4 space-y-3">
            {resourceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-slate-600 transition hover:text-slate-950">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {year} CommPro.ai. All rights reserved.</p>
          <p>Built for commercial insurance teams.</p>
        </div>
      </div>
    </footer>
  );
}
