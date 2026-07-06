"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileUp, Upload, CheckCircle2, AlertCircle, Eye, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MetricoolPdfMeta } from "@/lib/db";

type MetricoolPdfUploadProps = {
  weekStart: string;
  syncedAt: string | null;
  periodLabel?: string | null;
  pdfMeta: MetricoolPdfMeta | null;
  recentPdfs: MetricoolPdfMeta[];
};

function pdfUrl(weekStart: string, disposition: "inline" | "attachment") {
  return `/api/metricool/pdf?week=${encodeURIComponent(weekStart)}&disposition=${disposition}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MetricoolPdfUpload({
  weekStart,
  syncedAt,
  periodLabel,
  pdfMeta,
  recentPdfs,
}: MetricoolPdfUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const hasPdf = Boolean(pdfMeta);
  const displayPeriod = pdfMeta?.period_label || periodLabel;

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setMessage(null);
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("week_start", weekStart);

    startTransition(async () => {
      try {
        const response = await fetch("/api/metricool/pdf", { method: "POST", body: formData });
        const result = (await response.json()) as {
          ok: boolean;
          error?: string;
          periodLabel?: string;
          filename?: string;
          views?: number;
          engagement?: number;
          weekStart?: string;
        };

        if (!result.ok) {
          setMessage({ type: "err", text: result.error ?? "Import failed" });
          return;
        }

        setMessage({
          type: "ok",
          text: `${result.views?.toLocaleString()} views · ${result.engagement?.toLocaleString()} reach`,
        });

        if (result.weekStart && result.weekStart !== weekStart) {
          router.push(`/?week=${result.weekStart}`);
        } else {
          router.refresh();
        }
      } catch {
        setMessage({ type: "err", text: "Upload failed" });
      }
    });
  }

  return (
    <div className="space-y-2">
      {hasPdf && (
        <div className="flex flex-col gap-3 border border-primary/20 bg-primary/5 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
          <FileText className="size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Weekly report on file</p>
            <p className="truncate text-xs text-muted-foreground">
              {pdfMeta!.filename} · {formatFileSize(pdfMeta!.file_size)}
              {displayPeriod ? ` · ${displayPeriod}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Uploaded {new Date(pdfMeta!.uploaded_at).toLocaleString()}
            </p>
          </div>
          <div className="flex w-full shrink-0 gap-2 sm:w-auto">
            <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" asChild>
              <a href={pdfUrl(weekStart, "inline")} target="_blank" rel="noopener noreferrer">
                <Eye className="size-3.5" />
                View
              </a>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
              <a href={pdfUrl(weekStart, "attachment")} download={pdfMeta!.filename}>
                <Download className="size-3.5" />
                Download
              </a>
            </Button>
          </div>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "flex min-h-[44px] cursor-pointer flex-col gap-3 border border-dashed px-3 py-4 transition-colors sm:min-h-0 sm:flex-row sm:items-center sm:gap-4 sm:px-4 sm:py-3",
          dragOver ? "border-primary bg-primary/5" : "border-foreground/10 bg-card/50 hover:border-primary/40",
        )}
      >
        <FileUp className="size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {hasPdf ? "Replace Metricool PDF" : "Drop Metricool PDF"}
          </p>
          <p className="text-xs text-muted-foreground">
            {syncedAt
              ? `Last import ${new Date(syncedAt).toLocaleString()}${periodLabel ? ` · ${periodLabel}` : ""}`
              : "Social Media Insights export — dropped each Monday"}
          </p>
          {message?.type === "ok" && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-primary">
              <CheckCircle2 className="size-3" /> {message.text}
            </p>
          )}
          {message?.type === "err" && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3" /> {message.text}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          className="w-full shrink-0 sm:w-auto"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <Upload className="size-3.5" />
          {pending ? "…" : hasPdf ? "Replace" : "Browse"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {recentPdfs.length > 0 && (
        <div className="border border-foreground/10 bg-card/30 px-3 py-2 sm:px-4">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Recent weekly reports</p>
          <ul className="space-y-1">
            {recentPdfs.map((pdf) => (
              <li key={pdf.week_start} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <Link
                  href={`/?week=${pdf.week_start}`}
                  className={cn(
                    "font-medium hover:underline",
                    pdf.week_start === weekStart ? "text-primary" : "text-foreground/80",
                  )}
                >
                  {pdf.period_label || pdf.week_start}
                </Link>
                <span className="truncate text-muted-foreground">{pdf.filename}</span>
                <span className="text-muted-foreground">
                  {new Date(pdf.uploaded_at).toLocaleDateString()}
                </span>
                <a
                  href={pdfUrl(pdf.week_start, "inline")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
