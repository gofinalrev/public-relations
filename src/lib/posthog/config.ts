export const POSTHOG_CONFIG = {
  host: process.env.POSTHOG_HOST ?? "https://us.posthog.com",
  /** FinalRev manufacturing app (cad_upload, order_paid, etc.) */
  finalrevProjectId: process.env.POSTHOG_PROJECT_ID ?? "209711",
  /** Tooltrace designer funnel (upload_image, generate_tool_outline, download_cad) */
  tooltraceProjectId: process.env.POSTHOG_TOOLTRACE_PROJECT_ID ?? "167207",
  personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY ?? process.env.POSTHOG_API_KEY ?? "",
  tooltraceHostnames: (
    process.env.POSTHOG_TOOLTRACE_HOSTNAMES ?? "tooltrace.ai,www.tooltrace.ai,staging.tooltrace.ai"
  ).split(","),
  finalrevHostnames: (process.env.POSTHOG_FINALREV_HOSTNAMES ?? "finalrev.com,www.finalrev.com,staging.finalrev.com").split(
    ",",
  ),
};

export function isPostHogConfigured(): boolean {
  return Boolean(POSTHOG_CONFIG.personalApiKey && POSTHOG_CONFIG.tooltraceProjectId);
}
