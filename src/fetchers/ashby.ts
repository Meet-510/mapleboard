import { config } from "../config.js";
import type { RawJob, EmploymentType } from "../types.js";
import { fetchJson } from "../util/http.js";
import { log } from "../util/logger.js";

type AshbyResponse = {
  jobs?: Array<{
    id: string;
    title: string;
    jobUrl?: string;
    location?: string;
    departmentName?: string;
    employmentType?: string; // "FullTime" | "Intern" | "Contract" | ...
    publishedAt?: string;
    descriptionHtml?: string;
    descriptionPlain?: string;
  }>;
};

function mapAshbyEmployment(t?: string): EmploymentType {
  if (!t) return "unknown";
  const s = t.toLowerCase();
  if (s.includes("intern")) return "intern";
  if (s.includes("contract")) return "contract";
  if (s.includes("full")) return "full_time";
  return "unknown";
}

export async function fetchAshby(): Promise<RawJob[]> {
  const results: RawJob[] = [];

  await Promise.all(
    config.ashbyCompanies.map(async (co) => {
      const displayName = co.name ?? co.slug;
      const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(co.slug)}`;
      try {
        const data = await fetchJson<AshbyResponse>(url);
        for (const j of data.jobs ?? []) {
          results.push({
            source: "ashby",
            sourceId: j.id,
            company: displayName,
            title: j.title,
            location: j.location ?? "",
            url: j.jobUrl ?? "",
            description: j.descriptionPlain ?? j.descriptionHtml ?? "",
            datePosted: j.publishedAt,
            employmentType: mapAshbyEmployment(j.employmentType),
          });
        }
        log.info(`ashby:${co.slug} fetched`, { count: (data.jobs ?? []).length });
      } catch (err) {
        log.warn(`ashby:${co.slug} failed`, { error: String(err) });
      }
    })
  );

  return results;
}
