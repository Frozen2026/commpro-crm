"use client";

import { useEffect } from "react";

type ErrorConsoleLoggerProps = {
  error: string | null;
  supabaseError: {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
    status?: number;
  } | null;
};

export function ErrorConsoleLogger({ error, supabaseError }: ErrorConsoleLoggerProps) {
  useEffect(() => {
    if (!error && !supabaseError) {
      return;
    }

    console.error("[clients.new] Supabase/server action error", {
      uiError: error,
      supabase: supabaseError,
    });
  }, [error, supabaseError]);

  return null;
}
