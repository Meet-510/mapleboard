import { config } from "../config.js";
import type { NormalizedJob } from "../types.js";
import { fetchJson } from "../util/http.js";
import { log } from "../util/logger.js";

export type PriorityStatus = {
  companyName: string;
  fetchOk: boolean;
  totalOpenings: number | null; // null if fetch failed
  matchedFilter: number; // passed junior+Canadian+fresh filters this run
  newInThisEmail: number; // will actually appear in this email
  message: string; // one-line human-readable status for the header
};

const ASHBY_BASE = "https://api.ashbyhq.com/posting-api/job-board";

/**
 * Priority company runs an extra guaranteed check so we can always report its
 * status in the email — even when the wider pipeline finds nothing. Retries
 * once on failure since a missing signal for the priority company is a bigger
 * problem than one extra request.
 */
export async function checkPriorityCompany(
  matchedThisScan: NormalizedJob[],
  emailedNow: NormalizedJob[]
): Promise<PriorityStatus> {
  const { name, source, slug } = config.priorityCompany;

  const nameMatches = (j: NormalizedJob) =>
    j.company.toLowerCase() === name.toLowerCase();
  const matchedFilter = matchedThisScan.filter(nameMatches).length;
  const newInThisEmail = emailedNow.filter(nameMatches).length;

  let totalOpenings: number | null = null;
  let fetchOk = false;

  if (source === "ashby") {
    const url = `${ASHBY_BASE}/${encodeURIComponent(slug)}`;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const data = await fetchJson<{ jobs?: unknown[] }>(url);
        fetchOk = true;
        totalOpenings = data.jobs?.length ?? 0;
        break;
      } catch (err) {
        log.warn(`priority ${name} attempt ${attempt} failed`, { error: String(err) });
        if (attempt < 2) await sleep(1000);
      }
    }
  }

  return {
    companyName: name,
    fetchOk,
    totalOpenings,
    matchedFilter,
    newInThisEmail,
    message: buildMessage({
      name,
      fetchOk,
      totalOpenings,
      matchedFilter,
      newInThisEmail,
    }),
  };
}

function buildMessage(s: {
  name: string;
  fetchOk: boolean;
  totalOpenings: number | null;
  matchedFilter: number;
  newInThisEmail: number;
}): string {
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;

  if (!s.fetchOk) {
    return `${s.name}: check failed this scan — will retry on the next run.`;
  }
  if (s.newInThisEmail > 0) {
    return `${s.name}: ${plural(s.newInThisEmail, "new junior posting")} in this scan.`;
  }
  if (s.matchedFilter > 0) {
    return `${s.name}: ${plural(s.matchedFilter, "junior posting")} still open (already sent in an earlier email).`;
  }
  if ((s.totalOpenings ?? 0) > 0) {
    return `${s.name}: ${plural(s.totalOpenings ?? 0, "opening")} listed, but none match your junior filter today.`;
  }
  return `${s.name}: no openings listed today.`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
