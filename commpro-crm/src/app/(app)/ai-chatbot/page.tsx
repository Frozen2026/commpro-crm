import { sendChatMessage } from "@/app/(app)/ai-chatbot/actions";
import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export default async function AiChatbotPage() {
  const context = await getUserContext();
  const supabase = await createClient();

  const [{ data: conversation }, { data: kbRows }] = await Promise.all([
    supabase
      .from("ai_conversations")
      .select("id, messages, updated_at")
      .eq("account_id", context.accountId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("chatbot_knowledge_base")
      .select("topic, line_of_business")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  const messages = (conversation?.messages as ChatMessage[] | null) ?? [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">AI Chatbot</h2>
        <p className="mt-1 text-sm text-slate-600">Ask the assistant for operational guidance and save conversation context in Supabase.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-[var(--border)] bg-white p-5 xl:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Conversation</h3>
          <div className="mt-3 max-h-[420px] space-y-3 overflow-auto rounded-md border border-[var(--border)] bg-slate-50 p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.createdAt}-${index}`}
                className={`rounded-md px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-6 bg-[#2563eb] text-white"
                    : "mr-6 bg-white text-slate-800 border border-[var(--border)]"
                }`}
              >
                <p className="font-medium">{message.role === "user" ? "You" : "CommPro Assistant"}</p>
                <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">No conversation history yet. Ask your first question below.</p>
            ) : null}
          </div>

          <form action={sendChatMessage} className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700" htmlFor="prompt">
              Ask a question
            </label>
            <textarea
              id="prompt"
              name="prompt"
              rows={4}
              required
              placeholder="Example: Help me prioritize this week\'s renewals by retention risk."
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
              Send to Assistant
            </button>
          </form>
        </article>

        <aside className="rounded-xl border border-[var(--border)] bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Knowledge Base Topics</h3>
          <div className="mt-3 space-y-2">
            {(kbRows ?? []).map((row, index) => (
              <div key={`${row.topic}-${index}`} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                <p className="font-medium text-slate-900">{row.topic}</p>
                <p className="text-xs text-slate-500">{row.line_of_business ?? "General"}</p>
              </div>
            ))}
            {(kbRows ?? []).length === 0 ? <p className="text-sm text-slate-500">No active knowledge base entries found.</p> : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
