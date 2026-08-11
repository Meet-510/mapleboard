import { config } from "../config.js";
import type { RawJob, EmploymentType } from "../types.js";
import { fetchJson } from "../util/http.js";
import { log } from "../util/logger.js";

type LeverPosting = {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  createdAt?: number; // epoch ms
  categories?: {
    location?: string;
    commitment?: string; // "Full-time", "Contract", "Intern"
    team?: string;
  };
  descriptionPlain?: string;
  description?: string;
};

function mapCommitment(commitment?: string): EmploymentType {
  if (!commitment) return "unknown";
  const c = commitment.toLowerCase();
  if (c.includes("intern")) return "intern";
  if (c.includes("contract")) return "contract";
  if (c.includes("full")) return "full_time";
  return "unknown";
}

export async function fetchLever(): Promise<RawJob[]> {
  const results: RawJob[] = [];

  await Promise.all(
    config.leverCompanies.map(async (slug) => {
      const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
      try {
        const postings = await fetchJson<LeverPosting[]>(url);
        for (const p of postings) {
          results.push({
            source: "lever",
            sourceId: p.id,
            company: slug,
            title: p.text,
            location: p.categories?.location ?? "",
            url: p.hostedUrl,
            description: p.descriptionPlain ?? p.description ?? "",
            datePosted: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
            employmentType: mapCommitment(p.categories?.commitment),
          });
        }
        log.info(`lever:${slug} fetched`, { count: postings.length });
      } catch (err) {
        log.warn(`lever:${slug} failed`, { error: String(err) });
      }
    })
  );

  return results;
}
