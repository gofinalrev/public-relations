"use client";

import { useEffect } from "react";
import { logOps } from "@/lib/ops-log";

/** Renders nothing; mirrors server-side ops notes to the browser console for local debugging. */
export function OpsLogSink({ messages }: { messages: string[] }) {
  useEffect(() => {
    for (const message of messages) {
      logOps(message);
    }
  }, [messages]);

  return null;
}
