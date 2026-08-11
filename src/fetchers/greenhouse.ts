import { config } from "../config.js";
import type { RawJob } from "../types.js";
import { fetchJson } from "../util/http.js";
import { log } from "../util/logger.js";

type GhResponse = {
  jobs?: Array<{
    id: number;
    title: string;
    absolute_url: string;
    updated_at?: string;
    location?: { name?: string };
    content?: string; // HTML
    metadata?: Array<{ name: string; value: unknown }> | null;
  }>;
};

export async function fetchGreenhouse(): Promise<RawJob[]> {
  const results: RawJob[] = [];

  await Promise.all(
    config.greenhouseCompanies.map(async (slug) => {
      const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
        slug
      )}/jobs?content=true`;
      try {
        const data = await fetchJson<GhResponse>(url);
        for (const j of data.jobs ?? []) {
          results.push({
            source: "greenhouse",
            sourceId: String(j.id),
            company: slug,
            title: j.title,
            location: j.location?.name ?? "",
            url: j.absolute_url,
            description: j.content ?? "",
            datePosted: j.updated_at,
          });
        }
        log.info(`greenhouse:${slug} fetched`, { count: (data.jobs ?? []).length });
      } catch (err) {
        log.warn(`greenhouse:${slug} failed`, { error: String(err) });
      }
    })
  );

  return results;
}
