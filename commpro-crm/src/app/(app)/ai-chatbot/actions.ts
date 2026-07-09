"use server";

import { revalidatePath } from "next/cache";

import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as Record<string, unknown>;
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string" &&
        typeof candidate.createdAt === "string"
      );
    })
    .map((item) => {
      const candidate = item as Record<string, unknown>;
      return {
        role: candidate.role as "user" | "assistant",
        content: candidate.content as string,
        createdAt: candidate.createdAt as string,
      };
    });
}

function buildAssistantReply(userPrompt: string, kbContent?: string | null) {
  if (kbContent) {
    return `Based on your knowledge base, here is a recommendation:\n\n${kbContent}`;
  }

  return [
    "I can help with insurance CRM workflows.",
    "Try asking for: renewal retention strategy, claims triage checklist, or commission reconciliation steps.",
    `Your message was: ${userPrompt}`,
  ].join("\n\n");
}

export async function sendChatMessage(formData: FormData) {
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!prompt) {
    return;
  }

  const context = await getUserContext();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: kbRows } = await supabase
    .from("chatbot_knowledge_base")
    .select("content")
    .eq("is_active", true)
    .or(`topic.ilike.%${prompt}%,content.ilike.%${prompt}%`)
    .limit(1);

  const assistantReply = buildAssistantReply(prompt, kbRows?.[0]?.content ?? null);

  const { data: existingConversation } = await supabase
    .from("ai_conversations")
    .select("id, messages")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingMessages = normalizeMessages(existingConversation?.messages);

  const userMessage: ChatMessage = {
    role: "user",
    content: prompt,
    createdAt: new Date().toISOString(),
  };

  const assistantMessage: ChatMessage = {
    role: "assistant",
    content: assistantReply,
    createdAt: new Date().toISOString(),
  };

  const nextMessages = existingMessages.concat(userMessage, assistantMessage).slice(-30);

  if (existingConversation?.id) {
    await supabase
      .from("ai_conversations")
      .update({
        account_id: context.accountId,
        agency_id: context.agencyId,
        messages: nextMessages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingConversation.id);
  } else {
    await supabase.from("ai_conversations").insert({
      user_id: user.id,
      account_id: context.accountId,
      agency_id: context.agencyId,
      title: "CommPro Assistant",
      messages: nextMessages,
    });
  }

  revalidatePath("/ai-chatbot");
}
