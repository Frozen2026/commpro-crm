"use client";

import { useState } from "react";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const starter: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi! I can help with coverage questions for general contractors, cement/concrete, trucking, or UIIA/intermodal. What can I help with?",
  },
];

function replyFor(input: string) {
  const text = input.toLowerCase();

  if (text.includes("uiia") || text.includes("intermodal") || text.includes("drayage")) {
    return "UIIA-compliant auto liability and cargo coverage is required before chassis interchange. We can issue same-day certificates with the IEP named correctly — start a quote on the AI Agent page or call (973) 307-7007.";
  }

  if (text.includes("contractor") || text.includes("gc") || text.includes("builders")) {
    return "Most GCs need GL (often with additional insured / per-project aggregate), workers comp, commercial auto, and builders risk for active jobs. Launch the AI Agent and choose Contractor to get a multi-carrier estimate.";
  }

  if (text.includes("cement") || text.includes("concrete") || text.includes("mixer")) {
    return "Cement and concrete operations usually need GL, commercial auto for mixer/pump trucks, equipment floaters, and sometimes pollution liability. Our AI Agent routes specialized fleets to carriers with the right appetite.";
  }

  if (text.includes("truck") || text.includes("fleet") || text.includes("cargo")) {
    return "For trucking we quote auto liability, motor truck cargo, and physical damage. Share radius, commodity, and fleet size — or run a quote in the AI Agent for a side-by-side carrier view.";
  }

  if (text.includes("coi") || text.includes("certificate")) {
    return "You can request a COI from the Request a COI link in the nav. Have the certificate holder name, address, and any additional insured wording ready.";
  }

  return "Tell me whether you need contractor, concrete, trucking, or UIIA coverage and I’ll point you to the right next step. You can also call (973) 307-7007.";
}

export function MarketingChatbot() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(starter);

  function send(text: string) {
    const value = text.trim();
    if (!value) return;

    setMessages((current) => [
      ...current,
      { role: "user", content: value },
      { role: "assistant", content: replyFor(value) },
    ]);
    setDraft("");
  }

  return (
    <div className="cp-chat">
      {open ? (
        <section className="cp-panel open" aria-label="CommPro Assistant">
          <div className="cp-head">
            <strong>💬 CommPro Assistant</strong>
            <button type="button" className="cp-x" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>
          <div className="cp-body">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`cp-msg ${message.role}`}>
                {message.content}
              </div>
            ))}
          </div>
          <form
            className="cp-foot"
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about coverage..."
              aria-label="Message"
            />
            <button type="submit">Send</button>
          </form>
          <div className="cp-note">Not insurance advice. We may save your conversation.</div>
        </section>
      ) : (
        <button type="button" className="cp-fab" onClick={() => setOpen(true)} aria-label="Open chat">
          💬
        </button>
      )}
    </div>
  );
}
