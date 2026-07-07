"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { logOps, sanitizeExecutiveError } from "@/lib/ops-log";
import type { GeneratedPlatformCaptions } from "@/lib/gemini/caption-generator";
import {
  generateCaptionsAction,
  saveCaptionPickAction,
  toggleCaptionPostedAction,
} from "@/app/caption-actions";
import {
  CAPTION_PLATFORMS,
  FINALREV_SOUL,
  TOOLTRACE_SOUL,
  type CaptionBrand,
  type CaptionPlatform,
} from "@/lib/pr-toolkit/voice-guides";
import {
  CONTENT_ARCHETYPE_LABELS,
  MARKET_LANDSCAPE,
  archetypesForBrand,
  type ContentArchetype,
} from "@/lib/pr-toolkit/market-intelligence";
import { parseTranscriptFile, TRANSCRIPT_ACCEPT } from "@/lib/pr-toolkit/transcript-parse";
import {
  type CaptionStudioState,
  getPickForPlatform,
  isPlatformPosted,
} from "@/lib/caption-studio/state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlatformLogo } from "@/components/dashboard/platform-logo";
import { CaptionLinkPreview } from "@/components/dashboard/pr-toolkit/caption-link-preview";
import { xThreadOverLimit, xWeightedLength } from "@/lib/social/x-text";
import { cn } from "@/lib/utils";
import {
  PenLine,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  Star,
  Upload,
  FileAudio,
  CheckSquare,
  Square,
} from "lucide-react";

type CaptionStudioPanelProps = {
  weekStart: string;
  geminiConfigured: boolean;
  initialStudioState: CaptionStudioState;
};

type SavedRun = {
  id: string;
  at: string;
  brand: CaptionBrand;
  platforms: CaptionPlatform[];
  captions: GeneratedPlatformCaptions[];
};

const STORAGE_KEY = "social-hq-caption-runs";
const DEFAULT_PLATFORMS: CaptionPlatform[] = ["linkedin", "x", "youtube", "instagram"];
const THREAD_THRESHOLD = 400;

export function CaptionStudioPanel({
  weekStart,
  geminiConfigured,
  initialStudioState,
}: CaptionStudioPanelProps) {
  const [brand, setBrand] = useState<CaptionBrand>("finalrev");
  const [platforms, setPlatforms] = useState<CaptionPlatform[]>(DEFAULT_PLATFORMS);
  const [transcript, setTranscript] = useState("");
  const [videoNotes, setVideoNotes] = useState("");
  const [useWeekContext, setUseWeekContext] = useState(true);
  const [appendUtm, setAppendUtm] = useState(true);
  const [xThreadMode, setXThreadMode] = useState(false);
  const [contentArchetype, setContentArchetype] = useState<ContentArchetype>("auto");
  const [showVoice, setShowVoice] = useState(false);
  const [showMarket, setShowMarket] = useState(false);
  const [generationMeta, setGenerationMeta] = useState<{
    detectedArchetype?: string;
    audience?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcribeStatus, setTranscribeStatus] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedPlatformCaptions[] | null>(null);
  const [studioState, setStudioState] = useState<CaptionStudioState>(initialStudioState);
  const [history, setHistory] = useState<SavedRun[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [transcribePending, setTranscribePending] = useState(false);
  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStudioState(initialStudioState);
  }, [initialStudioState]);

  useEffect(() => {
    if (!geminiConfigured) {
      logOps("Caption Studio needs GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) in .env.local.");
    }
  }, [geminiConfigured]);

  useEffect(() => {
    setContentArchetype("auto");
  }, [brand]);

  useEffect(() => {
    if (transcript.length >= THREAD_THRESHOLD && platforms.includes("x")) {
      setXThreadMode(true);
    }
  }, [transcript.length, platforms]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw) as SavedRun[]);
    } catch {
      /* ignore */
    }
  }, []);

  function togglePlatform(id: CaptionPlatform) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function saveRun(captions: GeneratedPlatformCaptions[]) {
    const run: SavedRun = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      brand,
      platforms,
      captions,
    };
    const next = [run, ...history].slice(0, 8);
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  async function handleTranscriptFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const text = await file.text();
    setTranscript(parseTranscriptFile(file.name, text));
    setError(null);
  }

  async function handleMediaTranscribe(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setTranscribePending(true);
    setTranscribeStatus(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("media", file);
      const res = await fetch("/api/caption/transcribe", { method: "POST", body: formData });
      const data = (await res.json()) as { ok: boolean; transcript?: string; error?: string };
      if (!data.ok || !data.transcript) {
        setError(sanitizeExecutiveError(data.error ?? "Transcription failed", "Transcription failed"));
        return;
      }
      setTranscript(data.transcript);
      setTranscribeStatus(`Transcribed from ${file.name}`);
    } catch {
      setError("Transcription upload failed");
    } finally {
      setTranscribePending(false);
    }
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateCaptionsAction({
        brand,
        platforms,
        transcript,
        videoNotes: videoNotes.trim() || undefined,
        weekStart,
        useWeekContext,
        appendUtm,
        xThreadMode: xThreadMode && platforms.includes("x"),
        contentArchetype,
      });
      if (!result.ok) {
        setError(sanitizeExecutiveError(result.error, "Caption generation failed."));
        return;
      }
      setResults(result.captions);
      setGenerationMeta({
        detectedArchetype: result.detectedArchetype,
        audience: result.audience,
      });
      saveRun(result.captions);
    });
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function loadRun(run: SavedRun) {
    setBrand(run.brand);
    setPlatforms(run.platforms);
    setResults(run.captions);
    setError(null);
  }

  function pickOption(platform: CaptionPlatform, optionIndex: number, text: string) {
    startTransition(async () => {
      const result = await saveCaptionPickAction(weekStart, {
        platform,
        optionIndex,
        text,
        brand,
        pickedAt: new Date().toISOString(),
      });
      if (result.ok) setStudioState(result.state);
    });
  }

  function togglePosted(platform: CaptionPlatform, posted: boolean) {
    startTransition(async () => {
      const result = await toggleCaptionPostedAction(weekStart, platform, posted);
      setStudioState(result.state);
    });
  }

  const savedPicks = studioState.picks;

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PenLine className="size-5 text-primary" />
            Caption studio
          </CardTitle>
          <CardDescription>
            Paste a transcript or upload audio. Generates four caption options per platform using brand voice and this period&apos;s metrics.
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

          <div>
            <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
              Platforms
            </Label>
            <div className="flex flex-wrap gap-2">
              {CAPTION_PLATFORMS.map((p) => {
                const active = platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      "flex min-h-[44px] items-center gap-1.5 border px-2.5 py-1.5 text-xs font-medium transition-colors sm:min-h-0",
                      active
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-foreground/[0.08] text-muted-foreground",
                    )}
                  >
                    <PlatformLogo platformOrSlug={p.id} size="sm" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="content-archetype" className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
              Content angle
            </Label>
            <select
              id="content-archetype"
              value={contentArchetype}
              onChange={(e) => setContentArchetype(e.target.value as ContentArchetype)}
              className="w-full border border-foreground/[0.08] bg-background px-3 py-2 text-sm sm:max-w-md"
            >
              {archetypesForBrand(brand).map((id) => (
                <option key={id} value={id}>
                  {CONTENT_ARCHETYPE_LABELS[id]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="transcript" className="mb-2 block">
              Transcript
            </Label>
            <div
              className="mb-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleTranscriptFiles(e.dataTransfer.files);
              }}
            >
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={transcribePending}
                onClick={() => transcriptInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                <Upload className="size-3.5" />
                .txt / .srt
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!geminiConfigured || transcribePending}
                onClick={() => mediaInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                <FileAudio className="size-3.5" />
                {transcribePending ? "Transcribing…" : "Audio / short clip"}
              </Button>
              {transcribeStatus && (
                <span className="self-center text-[11px] text-primary">{transcribeStatus}</span>
              )}
            </div>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste, drop .txt/.srt, or transcribe mp3/m4a/mp4 (max 20 MB)…"
              rows={8}
              className="font-mono text-sm"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Long edits: export .srt from Descript. Short clips: use audio/short clip (Gemini).
            </p>
            <input
              ref={transcriptInputRef}
              type="file"
              accept={TRANSCRIPT_ACCEPT}
              className="hidden"
              onChange={(e) => void handleTranscriptFiles(e.target.files)}
            />
            <input
              ref={mediaInputRef}
              type="file"
              accept="audio/*,video/mp4,video/quicktime,video/webm,.mp3,.m4a,.wav,.mp4,.mov"
              className="hidden"
              onChange={(e) => void handleMediaTranscribe(e.target.files)}
            />
          </div>

          <div>
            <Label htmlFor="video-notes" className="mb-2 block">
              Video notes <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="video-notes"
              value={videoNotes}
              onChange={(e) => setVideoNotes(e.target.value)}
              placeholder="Datron fly-cut on 6061, Gridfinity drawer before/after…"
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
                checked={appendUtm}
                onChange={(e) => setAppendUtm(e.target.checked)}
                className="size-4 accent-primary"
              />
              <span>Append UTM links</span>
            </label>
            {platforms.includes("x") && (
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={xThreadMode}
                  onChange={(e) => setXThreadMode(e.target.checked)}
                  className="size-4 accent-primary"
                />
                <span>X thread mode (1/3, 2/3, 3/3)</span>
              </label>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={pending || !geminiConfigured || !transcript.trim() || platforms.length === 0}
              className="w-full min-h-[44px] sm:w-auto sm:min-h-0"
            >
              {pending ? "Generating…" : "Generate 4 options per platform"}
            </Button>
            <button
              type="button"
              onClick={() => setShowVoice((v) => !v)}
              className="flex min-h-[44px] items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:min-h-0 sm:justify-start"
            >
              {showVoice ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              soul.md
            </button>
            <button
              type="button"
              onClick={() => setShowMarket((v) => !v)}
              className="flex min-h-[44px] items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:min-h-0 sm:justify-start"
            >
              {showMarket ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              Market context
            </button>
          </div>

          {showVoice && (
            <pre className="max-h-64 overflow-auto border border-foreground/[0.08] bg-muted/30 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {brand === "finalrev" ? FINALREV_SOUL : TOOLTRACE_SOUL}
            </pre>
          )}

          {showMarket && (
            <pre className="max-h-64 overflow-auto border border-foreground/[0.08] bg-muted/30 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {MARKET_LANDSCAPE}
            </pre>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {savedPicks.length > 0 && (
        <Card className="border-primary/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saved picks · this week</CardTitle>
            <CardDescription>Star an option below, then mark posted when live on each platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedPicks.map((pick) => {
              const label = CAPTION_PLATFORMS.find((p) => p.id === pick.platform)?.label ?? pick.platform;
              const posted = isPlatformPosted(studioState, pick.platform);
              return (
                <div
                  key={pick.platform}
                  className="flex flex-col gap-2 border border-foreground/[0.08] p-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3"
                >
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => togglePosted(pick.platform, !posted)}
                    className="flex min-h-[44px] shrink-0 items-center gap-1.5 text-sm sm:min-h-0"
                  >
                    {posted ? (
                      <CheckSquare className="size-4 text-primary" />
                    ) : (
                      <Square className="size-4 text-muted-foreground" />
                    )}
                    <PlatformLogo platformOrSlug={pick.platform} size="sm" />
                    <span className={cn("font-medium", posted && "text-muted-foreground line-through")}>
                      {label}
                    </span>
                    {posted && (
                      <Badge variant="secondary" className="text-[10px]">
                        posted
                      </Badge>
                    )}
                  </button>
                  <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground sm:line-clamp-3">
                    {pick.text}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="self-end sm:self-auto"
                    onClick={() => copyText(pick.text, `saved-${pick.platform}`)}
                  >
                    {copied === `saved-${pick.platform}` ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {generationMeta && (generationMeta.detectedArchetype || generationMeta.audience) && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {generationMeta.detectedArchetype && (
            <Badge variant="outline" className="font-normal">
              archetype: {generationMeta.detectedArchetype}
            </Badge>
          )}
          {generationMeta.audience && (
            <Badge variant="outline" className="font-normal">
              audience: {generationMeta.audience}
            </Badge>
          )}
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {results.map((group) => {
            const hint = CAPTION_PLATFORMS.find((p) => p.id === group.platform);
            const savedPick = getPickForPlatform(studioState, group.platform);
            return (
              <Card key={group.platform}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PlatformLogo platformOrSlug={group.platform} size="sm" />
                    {hint?.label ?? group.platform}
                    {group.platform === "x" && xThreadMode && (
                      <Badge variant="outline" className="text-[10px] font-normal">
                        thread
                      </Badge>
                    )}
                    {hint?.charHint && !xThreadMode && group.platform === "x" && (
                      <Badge variant="outline" className="text-[10px] font-normal">
                        aim ≤{hint.charHint} chars
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {group.options.map((option, i) => {
                    const key = `${group.platform}-${i}`;
                    const meta = group.optionMeta?.[i];
                    const isWinner = savedPick?.optionIndex === i;
                    const overLimit =
                      group.platform === "x" &&
                      (xThreadMode
                        ? xThreadOverLimit(option)
                        : hint?.charHint
                          ? xWeightedLength(option) > hint.charHint
                          : false);
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex flex-col border p-3",
                          isWinner
                            ? "border-primary/50 bg-primary/[0.06] ring-1 ring-primary/20"
                            : "border-foreground/[0.08]",
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge variant={isWinner ? "default" : "secondary"} className="text-[10px]">
                              {isWinner ? "picked" : `option ${i + 1}`}
                            </Badge>
                            {meta?.style && (
                              <Badge variant="outline" className="text-[10px] font-normal">
                                {meta.style}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {!xThreadMode && group.platform === "x" && (
                              <span
                                className={cn(
                                  "text-[10px] tabular-nums",
                                  overLimit ? "text-amber-600" : "text-muted-foreground",
                                )}
                                title="X weighted character count"
                              >
                                {xWeightedLength(option)}/280
                              </span>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant={isWinner ? "default" : "ghost"}
                              title="Save as this week's pick"
                              disabled={pending}
                              onClick={() => pickOption(group.platform, i, option)}
                            >
                              <Star className={cn("size-3.5", isWinner && "fill-current")} />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => copyText(option, key)}
                            >
                              {copied === key ? (
                                <Check className="size-3.5" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">{option}</p>
                        {meta?.hookType && (
                          <p className="mt-2 text-[10px] text-muted-foreground">hook: {meta.hookType}</p>
                        )}
                        <CaptionLinkPreview text={option} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              Recent runs
            </CardTitle>
            <CardDescription>Browser only. Reload a past generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => loadRun(run)}
                className="flex w-full flex-col gap-1 border border-foreground/[0.06] p-3 text-left text-sm hover:border-primary/30 hover:bg-primary/[0.03] sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:p-2"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <PlatformLogo platformOrSlug={run.brand} size="sm" />
                  <span className="font-medium capitalize">{run.brand}</span>
                  <span className="break-all text-muted-foreground">{run.platforms.join(", ")}</span>
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(run.at).toLocaleString()}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
