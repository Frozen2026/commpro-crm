"use server";

import { revalidatePath } from "next/cache";

import { getUserContext } from "@/lib/account-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

function requiredTwilioEnv() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Missing Twilio environment variables. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.");
  }

  return { accountSid, authToken, fromNumber };
}

export async function sendSmsAction(formData: FormData) {
  const toNumber = String(formData.get("to_number") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!toNumber || !body) {
    throw new Error("Phone number and message body are required.");
  }

  const context = await getUserContext();
  const { accountSid, authToken, fromNumber } = requiredTwilioEnv();

  const payload = new URLSearchParams({
    To: toNumber,
    From: fromNumber,
    Body: body,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
    cache: "no-store",
  });

  const result = (await response.json()) as {
    sid?: string;
    status?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(result.message || "Failed to send SMS.");
  }

  await supabaseAdmin.from("sms_messages").insert({
    account_id: context.accountId,
    agency_id: context.agencyId,
    related_type: "manual",
    related_id: context.accountId,
    user_id: context.userId,
    direction: "outbound",
    from_number: fromNumber,
    to_number: toNumber,
    body,
    twilio_sid: result.sid ?? null,
    status: result.status ?? "queued",
  });

  revalidatePath("/twilio");
}

export async function placeCallAction(formData: FormData) {
  const toNumber = String(formData.get("to_number") ?? "").trim();
  if (!toNumber) {
    throw new Error("Phone number is required.");
  }

  const context = await getUserContext();
  const { accountSid, authToken, fromNumber } = requiredTwilioEnv();

  const voiceUrl = process.env.TWILIO_VOICE_URL ?? "http://demo.twilio.com/docs/voice.xml";

  const payload = new URLSearchParams({
    To: toNumber,
    From: fromNumber,
    Url: voiceUrl,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
    cache: "no-store",
  });

  const result = (await response.json()) as {
    sid?: string;
    status?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(result.message || "Failed to place call.");
  }

  await supabaseAdmin.from("calls").insert({
    account_id: context.accountId,
    agency_id: context.agencyId,
    related_type: "manual",
    related_id: context.accountId,
    user_id: context.userId,
    direction: "outbound",
    from_number: fromNumber,
    to_number: toNumber,
    twilio_call_sid: result.sid ?? null,
    status: result.status ?? "initiated",
  });

  revalidatePath("/twilio");
}
