"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const productGroups = [
  {
    label: "Commercial Property",
    items: [
      {
        href: "/ai-agent",
        icon: "🏢",
        name: "Commercial Property",
        desc: "Apartments, office, retail, warehouse, hotels & more",
      },
      {
        href: "/ai-agent",
        icon: "🏚️",
        name: "Builders Risk",
        desc: "Course-of-construction coverage for new builds & renos",
      },
      {
        href: "/ai-agent",
        icon: "🌊",
        name: "Flood",
        desc: "NFIP & private flood for commercial properties",
      },
    ],
  },
  {
    label: "Liability & Casualty",
    items: [
      {
        href: "/ai-agent",
        icon: "⚖️",
        name: "General Liability",
        desc: "Third-party bodily injury, property damage & defense",
      },
      {
        href: "/contractors",
        icon: "🏗️",
        name: "Contractors",
        desc: "GL, tools & equipment, completed operations",
      },
      {
        href: "/ai-agent",
        icon: "🛡️",
        name: "Security Guards",
        desc: "GL, professional liability & workers comp for guard firms",
      },
    ],
  },
  {
    label: "Auto & Transportation",
    items: [
      {
        href: "/commercial-auto",
        icon: "🚗",
        name: "Commercial Auto",
        desc: "All industry fleets — construction, cement, trucking & more",
      },
    ],
  },
  {
    label: "Bonds",
    items: [
      {
        href: "/bonds",
        icon: "📋",
        name: "Construction Bonds",
        desc: "Bid, performance, payment & license bonds",
      },
    ],
  },
  {
    label: "Specialty Lines",
    items: [
      {
        href: "/ai-agent",
        icon: "🔒",
        name: "Cyber Liability",
        desc: "Data breach, ransomware & liability protection",
      },
      {
        href: "/ai-agent",
        icon: "🤝",
        name: "Non-Profit",
        desc: "D&O, GL, property & volunteers coverage",
      },
    ],
  },
];

function navActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return <SiteHeaderInner key={pathname} pathname={pathname} />;
}

function SiteHeaderInner({ pathname }: { pathname: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setProductsOpen(false);
      }
    }

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <header className="topbar">
      <div className="brand-wrap">
        <Link href="/">
          <div className="brand">
            COMMERCIAL <span>PRO</span>
          </div>
          <div className="brand-sub">AI-Powered Insurance Platform</div>
        </Link>
        <nav className={`nav-links${mobileOpen ? " mobile-open" : ""}`}>
          <Link className={`nav-link${navActive(pathname, "/") ? " active" : ""}`} href="/">
            Home
          </Link>
          <Link className={`nav-link${navActive(pathname, "/about") ? " active" : ""}`} href="/about">
            About Us
          </Link>
          <Link className={`nav-link${navActive(pathname, "/ai-agent") ? " active" : ""}`} href="/ai-agent">
            AI Agent
          </Link>
          <Link className={`nav-link${navActive(pathname, "/contact") ? " active" : ""}`} href="/contact">
            Contact
          </Link>

          <div className={`nav-dropdown${productsOpen ? " open" : ""}`} ref={dropdownRef}>
            <button type="button" className="nav-dropdown-trigger" onClick={() => setProductsOpen((open) => !open)}>
              Products <span className="nav-dropdown-arrow" />
            </button>
            <div className="nav-dropdown-menu">
              {productGroups.map((group, index) => (
                <div key={group.label}>
                  {index > 0 ? <div className="dd-divider" /> : null}
                  <div className="dd-section-label">{group.label}</div>
                  {group.items.map((item) => (
                    <Link
                      key={item.name}
                      className="dd-item"
                      href={item.href}
                      onClick={() => {
                        setProductsOpen(false);
                        setMobileOpen(false);
                      }}
                    >
                      <div className="dd-icon">{item.icon}</div>
                      <div className="dd-text">
                        <div className="dd-name">{item.name}</div>
                        <div className="dd-desc">{item.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <Link className="nav-link nav-link-portal" href="https://app.commpro.ai/coi-request" title="Request a Certificate of Insurance">
            📄 Request a COI
          </Link>
          <Link className="nav-link nav-link-portal" href="/ai-agent" title="Submit a new account">
            📤 Get AI Quote
          </Link>
        </nav>
      </div>
      <div className="nav-right">
        <div className="ai-status">
          <div className="ai-dot" />
          AI Online
        </div>
        <a href="tel:9733077007" className="top-phone" aria-label="Call (973) 307-7007">
          (973) 307-7007
        </a>
        <Link href="/ai-agent" className="btn-nav">
          Get AI Quote
        </Link>
        <button
          type="button"
          className="menu-btn"
          aria-label="Menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          ☰
        </button>
      </div>
    </header>
  );
}
