import { config } from "../config.js";
import type { LocationTier } from "../types.js";

const REMOTE_HINTS = ["remote", "anywhere", "work from home", "wfh"];
const CANADA_HINTS = ["canada", "canadian"];

function normalize(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Classify a free-text location string into one of our three tiers.
 * Returns null if we can't confidently place it in Canada (excluded from send).
 */
export function classifyLocation(raw: string): LocationTier | null {
  if (!raw) return null;
  const s = normalize(raw);

  const isAlberta = config.locations.tier1_alberta.some((k) => s.includes(k));
  if (isAlberta) return "alberta";

  const isCanadaCity = config.locations.tier2_canada.some((k) => s.includes(k));
  if (isCanadaCity) return "canada";

  const looksRemote = REMOTE_HINTS.some((k) => s.includes(k));
  const mentionsCanada = CANADA_HINTS.some((k) => s.includes(k));

  if (looksRemote && (mentionsCanada || config.locations.allowRemoteCanada)) {
    // Bare "Remote" is a judgment call — we accept it under allowRemoteCanada
    // but we intentionally reject "Remote - US" style strings via the checks below.
    if (/remote\s*[-,–]\s*(us|united states|usa|uk|europe|emea|apac|india)/i.test(raw)) {
      return null;
    }
    return "remote";
  }

  // No clear Canadian signal — drop.
  return null;
}

export function isAlberta(raw: string): boolean {
  return classifyLocation(raw) === "alberta";
}

export function isCalgaryOrEdmonton(raw: string): boolean {
  const s = normalize(raw);
  return s.includes("calgary") || s.includes("edmonton");
}
