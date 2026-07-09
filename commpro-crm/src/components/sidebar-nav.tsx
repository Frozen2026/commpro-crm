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
  { href: "/coi-request", label: "COI Request" },
  { href: "/csa-manager", label: "CSA Manager" },
  { href: "/carriers", label: "Carriers" },
  { href: "/ai-chatbot", label: "AI Chatbot" },
  { href: "/twilio", label: "Twilio SMS/Calling" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-[var(--border)] bg-[var(--surface)] p-4 md:h-screen md:w-72 md:border-b-0 md:border-r md:p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-[var(--primary)]" />
        <div>
          <p className="text-sm font-medium text-slate-500">CRM</p>
          <p className="text-lg font-bold tracking-tight text-slate-900">CommPro.ai</p>
        </div>
      </div>
      <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-slate-700 hover:bg-slate-100"
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
