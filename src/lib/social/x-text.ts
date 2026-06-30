import twitter from "twitter-text";

const X_LIMIT = 280;

export function xWeightedLength(text: string): number {
  return twitter.parseTweet(text).weightedLength;
}

export function xFitsLimit(text: string, limit = X_LIMIT): boolean {
  return xWeightedLength(text) <= limit;
}

export function xRemaining(text: string, limit = X_LIMIT): number {
  return limit - xWeightedLength(text);
}

/** Split "1/3 … 2/3 … 3/3 …" thread captions into individual tweets */
export function parseXThreadParts(text: string): string[] {
  const parts = text.split(/\n(?=\d+\/\d+\s*\n)/);
  return parts
    .map((block) => block.replace(/^\d+\/\d+\s*\n?/, "").trim())
    .filter(Boolean);
}

export function xThreadOverLimit(text: string, limit = X_LIMIT): boolean {
  const tweets = parseXThreadParts(text);
  if (tweets.length === 0) return !xFitsLimit(text, limit);
  return tweets.some((t) => !xFitsLimit(t, limit));
}
