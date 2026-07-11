import type { Metadata } from "next";

import { AiAgentForm } from "@/components/marketing/ai-agent-form";

export const metadata: Metadata = {
  title: "AI Carrier Agent",
  description:
    "Select your property type and get simultaneous commercial insurance quotes from multiple carriers with AI risk scoring and recommendations.",
};

export default function AiAgentPage() {
  return (
    <main>
      <AiAgentForm />
    </main>
  );
}
