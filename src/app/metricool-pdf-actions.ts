"use server";

import { revalidatePath } from "next/cache";
import { importMetricoolPdfBuffer } from "@/lib/metricool/pdf-import";

export async function importMetricoolPdf(formData: FormData) {
  const file = formData.get("pdf") as File | null;
  const weekOverride = formData.get("week_start") as string | null;

  if (!file || file.size === 0) {
    return { ok: false as const, error: "No PDF file provided" };
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false as const, error: "File must be a PDF" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importMetricoolPdfBuffer(buffer, file.name, weekOverride);

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/");
  revalidatePath(`/?week=${result.weekStart}`);

  return {
    ok: true as const,
    weekStart: result.weekStart,
    periodLabel: result.periodLabel,
    filename: result.filename,
    report: result.report,
  };
}
