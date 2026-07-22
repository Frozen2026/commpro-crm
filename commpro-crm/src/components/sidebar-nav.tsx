"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/clients", label: "Clients" },
  { href: "/policies", label: "Policies" },
  { href: "/renewals", label: "Renewals" },
  { href: "/commissions", label: "Commissions" },
  { href: "/claims", label: "Claims" },
  { href: "/coi", label: "COI Request" },
  { href: "/csa-manager", label: "CSA Manager" },
  { href: "/carriers", label: "Carriers" },
  { href: "/ai-chatbot", label: "AI Chatbot" },
  { href: "/ops", label: "Ops Brain" },
  { href: "/twilio", label: "Twilio SMS/Calling" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-[var(--border-dark)] bg-[var(--steel-dark)] p-4 text-white md:h-screen md:w-72 md:border-b-0 md:border-r md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent)] font-[family-name:var(--font-barlow-condensed)] text-sm font-black text-[var(--steel-dark)]">
          CP
        </div>
        <div>
          <p className="font-[family-name:var(--font-barlow-condensed)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7aafd4]">
            Commercial Pro
          </p>
          <p className="font-[family-name:var(--font-barlow-condensed)] text-lg font-black tracking-wide text-white">
            CommPro CRM
          </p>
        </div>
      </div>
      <nav className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[var(--accent)] text-[var(--steel-dark)]"
                  : "text-[#a8c4da] hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
