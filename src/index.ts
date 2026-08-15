import { config } from "./config.js";
import { fetchAll } from "./fetchers/index.js";
import { normalizeAll } from "./pipeline/normalize.js";
import { dedupe } from "./pipeline/dedupe.js";
import { applyFreshness } from "./pipeline/freshness.js";
import { excludeUnwanted } from "./pipeline/filter.js";
import { scoreAll } from "./pipeline/score.js";
import { verifyUrls } from "./pipeline/verify-url.js";
import { checkPriorityCompany } from "./pipeline/priority.js";
import { JobDb } from "./db/client.js";
import { renderEmail } from "./email/template.js";
import { sendEmail } from "./email/send.js";
import { log } from "./util/logger.js";
import type { NormalizedJob, LocationTier, Section } from "./types.js";

const TIER_ORDER: Record<LocationTier, number> = {
  alberta: 0,
  canada: 1,
  remote: 2,
};

// Section priority for the global cap: Neo and Focus must survive first,
// then Tier 2, then General. Template renders sections in a different order
// (Neo → Focus → General → Tier 2), but that's a display concern.
const SECTION_CUT_ORDER: Record<Section, number> = {
  neo: 0,
  focus: 1,
  tier2: 2,
  general: 3,
};

function sortForCap(jobs: NormalizedJob[]): NormalizedJob[] {
  return [...jobs].sort((a, b) => {
    if (a.section !== b.section) {
      return SECTION_CUT_ORDER[a.section] - SECTION_CUT_ORDER[b.section];
    }
    if (a.locationTier !== b.locationTier) {
      return TIER_ORDER[a.locationTier] - TIER_ORDER[b.locationTier];
    }
    return b.matchScore - a.matchScore;
  });
}

function parseDryRun(argv: string[]): boolean {
  // --dry-run, --dry-run=true, --dry-run=false
  for (const a of argv) {
    if (a === "--dry-run") return true;
    if (a.startsWith("--dry-run=")) {
      return a.slice("--dry-run=".length).toLowerCase() !== "false";
    }
  }
  return false;
}

async function main(): Promise<number> {
  const startedAt = Date.now();
  const dryRun = parseDryRun(process.argv.slice(2));
  log.info("mapleboard run starting", { dryRun });

  // 1. Fetch
  const raw = await fetchAll();

  // 2. Normalize (drops non-Canadian, extracts tech, sets tier)
  const normalized = normalizeAll(raw);
  log.info("normalized", { in: raw.length, out: normalized.length });

  // 3. Dedupe within today's batch
  const deduped = dedupe(normalized);
  log.info("deduped", { in: normalized.length, out: deduped.length });

  // 4. Freshness (≤24h primary, 24–48h fallback)
  const fresh = applyFreshness(deduped);
  log.info("freshness filtered", { in: deduped.length, out: fresh.length });

  // 5. Exclusion filter
  const kept = excludeUnwanted(fresh);
  log.info("exclusion filtered", { in: fresh.length, out: kept.length });

  // 6. Score
  const scored = scoreAll(kept);

  // 7. Drop already-emailed
  const db = new JobDb();
  const previouslyEmailed = db.getEmailedIds(scored.map((j) => j.id));
  const fresh_only = scored.filter((j) => !previouslyEmailed.has(j.id));
  log.info("history filtered", {
    in: scored.length,
    out: fresh_only.length,
    previouslyEmailed: previouslyEmailed.size,
  });

  // 8. Verify URLs (drop broken links)
  const verified = await verifyUrls(fresh_only);
  log.info("url-verified", { in: fresh_only.length, out: verified.length });

  // 9. Sort by section priority + cap. Neo and Focus always survive because
  //    they sort before Tier 2 / General.
  const sorted = sortForCap(verified);
  const capped = sorted.slice(0, config.email.maxJobs);
  if (sorted.length > config.email.maxJobs) {
    log.info("capped by maxJobs", { total: sorted.length, sent: capped.length });
  }

  // 10. Priority-company check (always runs, even on empty scans)
  const priority = await checkPriorityCompany(kept, capped);
  log.info("priority status", {
    company: priority.companyName,
    fetchOk: priority.fetchOk,
    total: priority.totalOpenings,
    matched: priority.matchedFilter,
    new: priority.newInThisEmail,
  });

  // 11. Render + send
  const rendered = renderEmail(capped, new Date(), priority);
  log.info("email rendered", { subject: rendered.subject, count: capped.length });

  const sendResult = await sendEmail(rendered, { dryRun });
  if (!sendResult.ok) {
    log.error("email send failed", { error: sendResult.error });
    db.close();
    return 1;
  }
  if ("skipped" in sendResult && sendResult.skipped) {
    log.info("email skipped", { reason: sendResult.reason });
  } else {
    log.info("email sent", { id: (sendResult as { id: string }).id });
  }

  // 12. Persist (only after a real send — a dry-run must not poison history)
  if (!dryRun && capped.length > 0) {
    db.markEmailed(capped, new Date().toISOString());
    log.info("history updated", { newRows: capped.length });
  }

  db.close();
  log.info("mapleboard run complete", {
    ms: Date.now() - startedAt,
    emailed: capped.length,
  });
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    log.error("fatal", { error: String(err), stack: (err as Error)?.stack });
    process.exit(1);
  });
