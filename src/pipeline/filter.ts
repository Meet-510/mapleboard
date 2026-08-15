import { config } from "../config.js";
import type { NormalizedJob } from "../types.js";

// "5+ years" is always a hard gate — the plus makes intent unambiguous.
const YEARS_PLUS_GATE = /\b(\d+)\s*\+\s*years?\b/gi;

// "5 years ... experience" within 60 chars — catches "5 years of professional
// experience" and similar phrasings without matching narrative sentences
// like "5 years ago we adopted..." that never mention experience.
const YEARS_NEAR_EXP_GATE =
  /\b(\d+)\s*years?\b[^.!?\n]{0,60}\b(?:experience|exp)\b/gi;

// Must be a software/dev role — signal in title OR description.
const SOFTWARE_ROLE =
  /\b(software|developer|engineer|programm(?:er|ing)|coding|full[- ]?stack|front[- ]?end|back[- ]?end|web development|application developer|devops|sre)\b/i;

// Title-level junior signal.
const JUNIOR_TITLE =
  /\b(junior|jr\.?|entry[- ]?level|associate|intern(?:ship)?|co[- ]?op|new[- ]?grad(?:uate)?|graduate|(?:software|full[- ]?stack|front[- ]?end|back[- ]?end|web|application)\s+(?:engineer|developer)\s+i)\b/i;

// Description-level junior signal — 0-2 or 1-3 years, "no experience", etc.
const JUNIOR_DESC =
  /\b(0\s*[-–to]{1,2}\s*[12]\s*years?|1\s*[-–to]{1,2}\s*[23]\s*years?|no experience required|entry[- ]?level|new[- ]?grad(?:uate)?|recent graduate)\b/i;

/**
 * Drop jobs that fail the strict junior filter. A posting must:
 *   - not carry a senior/staff/manager/etc. title keyword
 *   - not gate on 5+ years of experience
 *   - actually be a software role (title or description evidence)
 *   - have a junior signal in the title OR the description
 * All four checks must pass. Missing evidence is disqualifying — better a
 * quieter email than one padded with ambiguous senior roles.
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

  if (!SOFTWARE_ROLE.test(title) && !SOFTWARE_ROLE.test(desc)) return true;

  if (!JUNIOR_TITLE.test(title) && !JUNIOR_DESC.test(desc)) return true;

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
