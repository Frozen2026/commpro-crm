import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";

import { MarketingChatbot } from "@/components/marketing/marketing-chatbot";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

import "./globals.css";
import "./marketing.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "General Contractor, Trucking & Cement Company Insurance | AI Quotes in 60 Seconds — Commercial Pro",
    template: "%s — Commercial Pro",
  },
  description:
    "Get bindable commercial insurance quotes for general contractors, cement and concrete companies, and trucking fleets — including UIIA-compliant coverage. AI-powered quoting, 8+ carriers, no portals.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="marketing-root">
          <SiteHeader />
          {children}
          <SiteFooter />
          <MarketingChatbot />
        </div>
      </body>
    </html>
  );
}
