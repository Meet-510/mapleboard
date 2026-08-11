import type { NormalizedJob, SourceName } from "../types.js";

// URL preference order: official careers > major ATS > aggregators.
const SOURCE_RANK: Record<SourceName, number> = {
  greenhouse: 2,
  lever: 2,
  ashby: 2,
  workday: 3, // often the company's own careers site
  jobbank: 4,
  adzuna: 5,
};

function pickBetter(a: NormalizedJob, b: NormalizedJob): NormalizedJob {
  const aRank = SOURCE_RANK[a.source];
  const bRank = SOURCE_RANK[b.source];
  if (aRank !== bRank) return aRank < bRank ? a : b;
  // Tiebreaker: keep the record with a real datePosted.
  if (a.datePosted && !b.datePosted) return a;
  if (b.datePosted && !a.datePosted) return b;
  return a;
}

/**
 * Collapse jobs sharing the same dedupe id, keeping the best-URL variant
 * while merging technology lists.
 */
export function dedupe(jobs: NormalizedJob[]): NormalizedJob[] {
  const byId = new Map<string, NormalizedJob>();
  for (const j of jobs) {
    const existing = byId.get(j.id);
    if (!existing) {
      byId.set(j.id, j);
      continue;
    }
    const winner = pickBetter(existing, j);
    const loser = winner === existing ? j : existing;
    const mergedTech = Array.from(new Set([...winner.technologies, ...loser.technologies]));
    byId.set(j.id, { ...winner, technologies: mergedTech });
  }
  return [...byId.values()];
}
