import { config } from "../config.js";
import type { NormalizedJob } from "../types.js";

/**
 * Split jobs into primary (≤24h) and fallback (24–48h) freshness buckets.
 * Jobs with no `datePosted` are kept only when their title clearly matches
 * a junior/entry pattern — otherwise we can't attest to their age.
 */
export function applyFreshness(
  jobs: NormalizedJob[],
  now: Date = new Date()
): NormalizedJob[] {
  const primaryMs = config.freshness.primaryHours * 60 * 60 * 1000;
  const fallbackMs = config.freshness.fallbackHours * 60 * 60 * 1000;
  const kept: NormalizedJob[] = [];

  for (const j of jobs) {
    if (!j.datePosted) {
      // Undated postings pass only if the title screams junior/entry — otherwise
      // we would fill the email with stale roles the source never dated.
      if (titleSuggestsJunior(j.title)) {
        kept.push({ ...j, fallbackWindow: true });
      }
      continue;
    }
    const posted = Date.parse(j.datePosted);
    if (Number.isNaN(posted)) continue;
    const ageMs = now.getTime() - posted;
    if (ageMs < 0) {
      // Future-dated (source clock skew) — treat as fresh.
      kept.push(j);
    } else if (ageMs <= primaryMs) {
      kept.push(j);
    } else if (ageMs <= fallbackMs) {
      kept.push({ ...j, fallbackWindow: true });
    }
  }

  return kept;
}

function titleSuggestsJunior(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.includes("junior") ||
    t.includes("entry") ||
    t.includes("new grad") ||
    t.includes("graduate") ||
    t.includes("intern") ||
    t.includes("associate") ||
    /\b(i|1)\b/.test(t) // "Software Engineer I"
  );
}
