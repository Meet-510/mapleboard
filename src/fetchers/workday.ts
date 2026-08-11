import { config } from "../config.js";
import type { RawJob } from "../types.js";
import { fetchJson } from "../util/http.js";
import { log } from "../util/logger.js";

type WorkdayJobPosting = {
  title: string;
  externalPath: string; // e.g. "/en-US/RBC_CAREERS/job/Toronto/Junior-Dev_R-1234"
  locationsText?: string;
  postedOn?: string; // often relative, e.g. "Posted 2 Days Ago"
  bulletFields?: string[];
};

type WorkdayResponse = {
  total?: number;
  jobPostings?: WorkdayJobPosting[];
};

/**
 * Workday is the trickiest source: each tenant hosts its own bespoke API at
 *   POST https://{host}/wday/cxs/{tenant}/{site}/jobs
 * The tenant is embedded in the host (subdomain). Only host + site are configurable.
 *
 * We ask for CA-country postings via a facet when possible. `postedOn` is often
 * a human-relative string, so we intentionally leave `datePosted` unset and let
 * downstream code treat these as "unknown-age" (i.e. only kept if title matches).
 */
export async function fetchWorkday(): Promise<RawJob[]> {
  const results: RawJob[] = [];

  await Promise.all(
    config.workdayCompanies.map(async (co) => {
      // Tenant is the first path segment of Workday's /wday/cxs URL. It equals
      // the leftmost DNS label of the host (e.g. rbc.wd3.myworkdayjobs.com → "rbc").
      const tenant = co.host.split(".")[0];
      if (!tenant) {
        log.warn(`workday:${co.name} skipped — cannot derive tenant from host`, {
          host: co.host,
        });
        return;
      }
      const url = `https://${co.host}/wday/cxs/${tenant}/${co.site}/jobs`;
      const body = JSON.stringify({
        appliedFacets: {},
        limit: 20,
        offset: 0,
        searchText: "junior developer",
      });
      try {
        const data = await fetchJson<WorkdayResponse>(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        for (const j of data.jobPostings ?? []) {
          const jobUrl = `https://${co.host}${j.externalPath}`;
          results.push({
            source: "workday",
            sourceId: j.externalPath,
            company: co.name,
            title: j.title,
            location: j.locationsText ?? "",
            url: jobUrl,
            // Workday's `postedOn` is often relative — leave undefined so the
            // pipeline treats freshness as unknown rather than fabricating.
          });
        }
        log.info(`workday:${co.name} fetched`, { count: (data.jobPostings ?? []).length });
      } catch (err) {
        log.warn(`workday:${co.name} failed`, { error: String(err) });
      }
    })
  );

  return results;
}
