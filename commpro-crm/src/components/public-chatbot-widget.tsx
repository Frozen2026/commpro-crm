"use client";

import { useMemo, useState } from "react";

import { Bot, MessageSquare, Minus, Send, X } from "lucide-react";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: "Hi, I can help with quote intake, COI requests, and renewal workflows. What kind of account are you working on?",
  },
];

export function PublicChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);

  const quickReplies = useMemo(
    () => ["General contractor quote", "Need a COI", "Track renewal risk"],
    [],
  );

  function getReply(input: string) {
    const normalized = input.toLowerCase();

    if (normalized.includes("coi")) {
      return "I can help route COI requests to the right workflow. Start with the certificate holder, policy details, and any endorsement language.";
    }

    if (normalized.includes("renewal")) {
      return "For renewals, focus on expiration date, current loss activity, and accounts with the highest retention risk first.";
    }

    if (normalized.includes("quote") || normalized.includes("contractor") || normalized.includes("truck")) {
      return "For a quick quote, collect class codes, locations, vehicles or equipment, and the requested effective date.";
    }

    return "Tell me whether this is a quote, COI, or renewal workflow and I'll point you to the next step.";
  }

  function sendMessage(text: string) {
    const value = text.trim();

    if (!value) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", content: value },
      { role: "assistant", content: getReply(value) },
    ]);
    setDraft("");
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      {open ? (
        <section className="w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--steel-dark)] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">CommPro AI Assistant</p>
                <p className="text-xs text-white/65">Always-on quoting and COI guidance</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Minimize chatbot"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[24rem] space-y-3 overflow-auto px-4 py-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-[var(--steel)] text-white"
                      : "border border-[var(--border)] bg-[var(--steel-pale)] text-[var(--foreground)]"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-2 pt-1">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => sendMessage(reply)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          <form
            className="flex items-center gap-2 border-t border-slate-200 px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(draft);
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about a quote, COI, or renewal..."
              className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
            <button
              type="submit"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--steel-dark)] transition hover:bg-[var(--accent-dark)]"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-3 rounded-full bg-[var(--steel-dark)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(13,31,51,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--steel)]"
          aria-label="Open chatbot"
        >
          <MessageSquare className="h-4 w-4" />
          AI Assistant
          <X className="h-4 w-4 rotate-45 opacity-60" />
        </button>
      )}
    </div>
  );
}