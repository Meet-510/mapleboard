import { config } from "../config.js";
import type { NormalizedJob } from "../types.js";
import { httpFetch } from "../util/http.js";
import { log } from "../util/logger.js";

const BAD_URL_HINTS = [
  "/search",
  "/jobs?",
  "/careers?",
  "/results?",
  // Bare careers roots — we want a specific job page, not the landing.
  "/careers/",
];

function looksLikeSearchOrRoot(url: string): boolean {
  const lower = url.toLowerCase();
  // Only reject if the URL LOOKS like a search/root AND has no job-id-looking segment.
  if (!BAD_URL_HINTS.some((h) => lower.includes(h))) return false;
  // If there's a numeric or uuid-ish tail, it's likely a specific posting.
  return !/\/(\d{4,}|[a-f0-9-]{8,})(?:\/|$|\?)/i.test(lower);
}

async function verify(url: string): Promise<boolean> {
  try {
    const res = await httpFetch(url, {
      method: "HEAD",
      timeoutMs: config.network.urlVerifyTimeoutMs,
    });
    if (res.status >= 200 && res.status < 400) return true;
    // Some sites don't support HEAD — fall back to GET.
    if (res.status === 405 || res.status === 403) {
      const getRes = await httpFetch(url, {
        method: "GET",
        timeoutMs: config.network.urlVerifyTimeoutMs,
      });
      return getRes.status >= 200 && getRes.status < 400;
    }
    return false;
  } catch (err) {
    log.debug(`verify failed for ${url}`, { error: String(err) });
    return false;
  }
}

/**
 * Verify each job's URL. Runs verifications in parallel; drops jobs whose
 * URL 404s, times out, or looks like a search-result page.
 */
export async function verifyUrls(jobs: NormalizedJob[]): Promise<NormalizedJob[]> {
  const results = await Promise.all(
    jobs.map(async (j) => {
      if (looksLikeSearchOrRoot(j.url)) return null;
      const ok = await verify(j.url);
      return ok ? j : null;
    })
  );
  return results.filter((j): j is NormalizedJob => j !== null);
}
