import { config } from "../config.js";
import type { NormalizedJob } from "../types.js";

// "5+ years" is always a hard gate — the plus makes intent unambiguous.
const YEARS_PLUS_GATE = /\b(\d+)\s*\+\s*years?\b/gi;

// "5 years ... experience" within 60 chars — catches "5 years of professional
// experience" and similar phrasings without matching narrative sentences
// like "5 years ago we adopted..." that never mention experience.
const YEARS_NEAR_EXP_GATE =
  /\b(\d+)\s*years?\b[^.!?\n]{0,60}\b(?:experience|exp)\b/gi;

/**
 * Drop jobs that fail the exclusion rules. Strict on the title (a "Senior"
 * kills it), narrower on the description: only clear years-of-experience
 * gates disqualify a posting.
 */
export function excludeUnwanted(jobs: NormalizedJob[]): NormalizedJob[] {
  return jobs.filter((j) => !isExcluded(j));
}

export function isExcluded(job: NormalizedJob): boolean {
  const title = job.title.toLowerCase();
  const desc = job.description.toLowerCase();

  for (const kw of config.jobTitles.exclude) {
    if (title.includes(kw)) return true;
  }

  if (hasHardYearsGate(desc)) return true;

  return false;
}

function hasHardYearsGate(desc: string): boolean {
  for (const re of [YEARS_PLUS_GATE, YEARS_NEAR_EXP_GATE]) {
    re.lastIndex = 0;
    for (const m of desc.matchAll(re)) {
      const yearsStr = m[1];
      if (!yearsStr) continue;
      const years = Number(yearsStr);
      if (Number.isFinite(years) && years >= 5) return true;
    }
  }
  return false;
}
