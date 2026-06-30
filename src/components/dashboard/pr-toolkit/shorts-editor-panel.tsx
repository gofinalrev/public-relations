"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { logOps, sanitizeExecutiveError } from "@/lib/ops-log";
import type { ShortClipCandidate, ShortsAnalysis } from "@/lib/shorts/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import { cn } from "@/lib/utils";
import {
  Clapperboard,
  Copy,
  Check,
  Download,
  Film,
  Loader2,
  Sparkles,
  Upload,
  Zap,
  Play,
  Pause,
} from "lucide-react";
import type { CaptionBrand } from "@/lib/pr-toolkit/voice-guides";
import { TRANSCRIPT_ACCEPT } from "@/lib/pr-toolkit/transcript-parse";

type ShortsEditorPanelProps = {
  weekStart: string;
  geminiConfigured: boolean;
  weekContextSummary?: string;
};

function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-500";
  if (score >= 70) return "text-primary";
  if (score >= 55) return "text-amber-500";
  return "text-muted-foreground";
}

export function ShortsEditorPanel({
  geminiConfigured,
  weekContextSummary,
}: ShortsEditorPanelProps) {
  const [brand, setBrand] = useState<CaptionBrand>("finalrev");
  const [videoNotes, setVideoNotes] = useState("");
  const [useWeekContext, setUseWeekContext] = useState(true);
  const [burnCaption, setBurnCaption] = useState(true);
  const [speedBoost, setSpeedBoost] = useState(true);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [srtText, setSrtText] = useState<string | undefined>();
  const [analysis, setAnalysis] = useState<ShortsAnalysis | null>(null);
  const [ffmpegReady, setFfmpegReady] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!geminiConfigured) {
      logOps("Shorts editor needs GOOGLE_GENERATIVE_AI_API_KEY in .env.local.");
    }
  }, [geminiConfigured]);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  function handleVideoFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setSourceFile(file);
    setAnalysis(null);
    setError(null);
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(URL.createObjectURL(file));
  }

  async function handleSrtFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const text = await file.text();
    setSrtText(text);
    setStatus(`SRT loaded: ${file.name}`);
  }

  function handleAnalyze() {
    if (!sourceFile) return;
    setError(null);
    setStatus(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("video", sourceFile);
      formData.append("brand", brand);
      if (videoNotes.trim()) formData.append("videoNotes", videoNotes.trim());
      if (useWeekContext && weekContextSummary) formData.append("weekContext", weekContextSummary);
      if (srtText) formData.append("srt", srtText);

      const res = await fetch("/api/shorts/analyze", { method: "POST", body: formData });
      const data = (await res.json()) as {
        ok: boolean;
        analysis?: ShortsAnalysis;
        ffmpegReady?: boolean;
        error?: string;
      };

      if (!data.ok || !data.analysis) {
        setError(sanitizeExecutiveError(data.error ?? "Analysis failed", "Analysis failed"));
        return;
      }

      setAnalysis(data.analysis);
      setFfmpegReady(data.ffmpegReady ?? false);
      setActiveClipId(data.analysis.clips[0]?.id ?? null);
      setStatus(`Found ${data.analysis.clips.length} clip candidates · ${formatTimestamp(data.analysis.durationSec)} source`);
    });
  }

  function previewClip(clip: ShortClipCandidate) {
    setActiveClipId(clip.id);
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = clip.startSec;
    void el.play().catch(() => undefined);
  }

  useEffect(() => {
    const el = videoRef.current;
    const clip = analysis?.clips.find((c) => c.id === activeClipId);
    if (!el || !clip) return;

    const onTime = () => {
      if (el.currentTime >= clip.endSec) {
        el.pause();
        el.currentTime = clip.startSec;
      }
    };
    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [activeClipId, analysis]);

  async function exportClip(clip: ShortClipCandidate) {
    if (!analysis) return;
    setExportingId(clip.id);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("sessionId", analysis.sessionId);
      formData.append("startSec", String(clip.startSec));
      formData.append("durationSec", String(clip.durationSec));
      formData.append("editStyle", clip.editStyle);
      formData.append("overlayText", clip.overlayText);
      formData.append("burnCaption", String(burnCaption));
      formData.append("speedBoost", String(speedBoost));

      const res = await fetch("/api/shorts/render", { method: "POST", body: formData });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        const expired = err.error?.toLowerCase().includes("session");
        if (expired && sourceFile) {
          const retry = new FormData();
          retry.append("video", sourceFile);
          retry.append("startSec", String(clip.startSec));
          retry.append("durationSec", String(clip.durationSec));
          retry.append("editStyle", clip.editStyle);
          retry.append("overlayText", clip.overlayText);
          retry.append("burnCaption", String(burnCaption));
          retry.append("speedBoost", String(speedBoost));
          const retryRes = await fetch("/api/shorts/render", { method: "POST", body: retry });
          if (!retryRes.ok) {
            const retryErr = (await retryRes.json()) as { error?: string };
            setError(sanitizeExecutiveError(retryErr.error ?? "Export failed", "Export failed"));
            return;
          }
          const blob = await retryRes.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${clip.vibe}-${Math.round(clip.startSec)}s-short.mp4`;
          a.click();
          URL.revokeObjectURL(url);
          return;
        }
        setError(sanitizeExecutiveError(err.error ?? "Export failed", "Export failed"));
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${clip.vibe}-${Math.round(clip.startSec)}s-short.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Re-analyze the file and try again.");
    } finally {
      setExportingId(null);
    }
  }

  async function exportAll() {
    if (!analysis) return;
    for (const clip of analysis.clips) {
      await exportClip(clip);
    }
  }

  async function copyPack(clip: ShortClipCandidate) {
    const text = [
      clip.youtubeTitle,
      "",
      clip.youtubeDescription,
      "",
      clip.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(clip.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const activeClip = analysis?.clips.find((c) => c.id === activeClipId);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-foreground/[0.08] bg-gradient-to-br from-background via-background to-primary/[0.04]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clapperboard className="size-5 text-primary" />
            Shorts editor
          </CardTitle>
          <CardDescription>
            Upload footage to detect clip candidates, export vertical Shorts, and generate publish copy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["finalrev", "tooltrace"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBrand(b)}
                className={cn(
                  "flex min-h-[44px] items-center gap-2 border px-3 py-2 text-sm font-medium transition-colors sm:min-h-0",
                  brand === b
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-foreground/[0.08] text-muted-foreground hover:text-foreground",
                )}
              >
                <PlatformLogo platformOrSlug={b} size="sm" />
                {b === "finalrev" ? "finalREV" : "Tooltrace"}
              </button>
            ))}
          </div>

          <div
            className="relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-primary/30 bg-primary/[0.03] p-6 transition-colors hover:border-primary/50 hover:bg-primary/[0.06]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleVideoFile(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-8 text-primary/70" />
            <p className="text-sm font-medium">
              {sourceFile ? sourceFile.name : "Drop mp4 / mov footage"}
            </p>
            <p className="text-center text-[11px] text-muted-foreground">
              Supports long files. Optional .srt improves timestamp accuracy.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              className="hidden"
              onChange={(e) => handleVideoFile(e.target.files)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => srtInputRef.current?.click()}
            >
              <Film className="size-3.5" />
              Attach .srt (optional)
            </Button>
            <input
              ref={srtInputRef}
              type="file"
              accept={TRANSCRIPT_ACCEPT}
              className="hidden"
              onChange={(e) => void handleSrtFile(e.target.files)}
            />
          </div>

          <div>
            <Label htmlFor="shorts-notes" className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
              Footage notes
            </Label>
            <Textarea
              id="shorts-notes"
              value={videoNotes}
              onChange={(e) => setVideoNotes(e.target.value)}
              placeholder="Datron fly-cut reveal, failed first pass, satisfying finish…"
              rows={2}
              className="text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={useWeekContext}
                onChange={(e) => setUseWeekContext(e.target.checked)}
                className="size-4 accent-primary"
              />
              <span>This week&apos;s metrics</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={burnCaption}
                onChange={(e) => setBurnCaption(e.target.checked)}
                className="size-4 accent-primary"
              />
              <span>Burn hook caption</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={speedBoost}
                onChange={(e) => setSpeedBoost(e.target.checked)}
                className="size-4 accent-primary"
              />
              <span>Speed ramp and punch zoom</span>
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              onClick={handleAnalyze}
              disabled={pending || !geminiConfigured || !sourceFile}
              className="min-h-[44px] w-full sm:w-auto sm:min-h-0"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Scanning footage…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Analyze footage
                </>
              )}
            </Button>
            {analysis && ffmpegReady && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void exportAll()}
                disabled={Boolean(exportingId)}
                className="min-h-[44px] w-full sm:w-auto sm:min-h-0"
              >
                <Download className="size-4" />
                Export all Shorts
              </Button>
            )}
            {status && <span className="text-[11px] text-primary">{status}</span>}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {!ffmpegReady && analysis && (
            <p className="text-xs text-muted-foreground">
              Analysis complete. Export requires local ffmpeg.
            </p>
          )}
        </CardContent>
      </Card>

      {sourceUrl && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Source preview</CardTitle>
          </CardHeader>
          <CardContent>
            <video
              ref={videoRef}
              src={sourceUrl}
              controls
              playsInline
              className="mx-auto max-h-[320px] w-full max-w-[200px] rounded-md bg-black object-contain"
            />
            {activeClip && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Previewing clip {formatTimestamp(activeClip.startSec)} → {formatTimestamp(activeClip.endSec)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {analysis && (
        <div className="grid gap-3 sm:grid-cols-2">
          {analysis.clips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              active={activeClipId === clip.id}
              exporting={exportingId === clip.id}
              copied={copied === clip.id}
              ffmpegReady={ffmpegReady}
              onPreview={() => previewClip(clip)}
              onExport={() => void exportClip(clip)}
              onCopy={() => void copyPack(clip)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClipCard({
  clip,
  active,
  exporting,
  copied,
  ffmpegReady,
  onPreview,
  onExport,
  onCopy,
}: {
  clip: ShortClipCandidate;
  active: boolean;
  exporting: boolean;
  copied: boolean;
  ffmpegReady: boolean;
  onPreview: () => void;
  onExport: () => void;
  onCopy: () => void;
}) {
  const editLabel =
    clip.editStyle === "punch_zoom" ? "Punch zoom" : clip.editStyle === "hard_cut" ? "Hard cut" : "Smooth hold";

  return (
    <Card
      className={cn(
        "transition-shadow",
        active && "ring-2 ring-primary/40",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm leading-snug">{clip.hook}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{clip.why}</CardDescription>
          </div>
          <div className="text-right">
            <p className={cn("text-2xl font-bold tabular-nums", scoreColor(clip.viralScore))}>
              {clip.viralScore}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Score</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px] capitalize">
            {clip.vibe}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {clip.durationSec.toFixed(1)}s
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {editLabel}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono">
            {formatTimestamp(clip.startSec)}
          </Badge>
        </div>

        <p className="rounded-md bg-foreground/[0.04] px-3 py-2 text-center text-sm font-bold uppercase tracking-wide">
          {clip.overlayText}
        </p>

        <p className="text-xs text-muted-foreground line-clamp-3">{clip.transcript}</p>

        <p className="text-xs font-medium">{clip.youtubeTitle}</p>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={onPreview}>
            {active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            Preview
          </Button>
          {ffmpegReady && (
            <Button type="button" size="sm" onClick={onExport} disabled={exporting}>
              {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
              {exporting ? "Rendering…" : "Export 9:16"}
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" onClick={onCopy}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "YT pack"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
