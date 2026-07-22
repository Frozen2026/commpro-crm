import { PublicChatbotWidget } from "@/components/public-chatbot-widget";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_42%,#f7fafc_100%)]" />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <PublicChatbotWidget />
    </div>
  );
}
