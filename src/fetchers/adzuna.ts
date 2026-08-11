import { config } from "../config.js";
import type { RawJob } from "../types.js";
import { fetchJson } from "../util/http.js";
import { log } from "../util/logger.js";

type AdzunaResult = {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  redirect_url: string;
  description?: string;
  created?: string; // ISO
  contract_time?: string; // "full_time" | "part_time"
  contract_type?: string; // "permanent" | "contract"
};

type AdzunaResponse = {
  count?: number;
  results?: AdzunaResult[];
};

export async function fetchAdzuna(): Promise<RawJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    log.warn("adzuna skipped — ADZUNA_APP_ID / ADZUNA_APP_KEY not set");
    return [];
  }

  const results: RawJob[] = [];

  // Adzuna's `max_days_old` bounds server-side; we still filter to 24h later.
  await Promise.all(
    config.adzunaQueries.map(async (query) => {
      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: "50",
        what: query,
        sort_by: "date",
        max_days_old: "2",
        "content-type": "application/json",
      });
      const url = `https://api.adzuna.com/v1/api/jobs/ca/search/1?${params.toString()}`;
      try {
        const data = await fetchJson<AdzunaResponse>(url);
        for (const r of data.results ?? []) {
          results.push({
            source: "adzuna",
            sourceId: r.id,
            company: r.company?.display_name ?? "Unknown",
            title: r.title,
            location: r.location?.display_name ?? "",
            url: r.redirect_url,
            description: r.description ?? "",
            datePosted: r.created,
            employmentType:
              r.contract_type === "contract"
                ? "contract"
                : r.contract_time === "full_time"
                  ? "full_time"
                  : "unknown",
          });
        }
        log.info(`adzuna:"${query}" fetched`, { count: (data.results ?? []).length });
      } catch (err) {
        log.warn(`adzuna:"${query}" failed`, { error: String(err) });
      }
    })
  );

  return results;
}
