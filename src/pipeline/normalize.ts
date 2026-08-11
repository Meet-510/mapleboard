import * as cheerio from "cheerio";
import { config } from "../config.js";
import type { NormalizedJob, RawJob, EmploymentType } from "../types.js";
import { classifyLocation } from "../util/location.js";
import { jobHash } from "../util/hash.js";

function stripHtml(html: string): string {
  if (!html) return "";
  // Cheap path — most fetchers already return plain text.
  if (!html.includes("<")) return html;
  const $ = cheerio.load(html);
  return $.text().replace(/\s+/g, " ").trim();
}

function detectTechnologies(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const tech of config.technologies) {
    // Word-boundary match to avoid "java" hitting "javascript".
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(tech)}([^a-z0-9]|$)`, "i");
    if (re.test(lower)) found.add(tech);
  }
  return [...found];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inferEmploymentType(
  provided: EmploymentType | undefined,
  title: string
): EmploymentType {
  if (provided && provided !== "unknown") return provided;
  const t = title.toLowerCase();
  if (t.includes("intern") || t.includes("co-op") || t.includes("coop")) return "intern";
  if (t.includes("contract")) return "contract";
  return "full_time";
}

function isMonitored(company: string): boolean {
  const c = company.toLowerCase();
  return config.monitoredCompanies.some((m) => {
    const ml = m.toLowerCase();
    return c === ml || c.includes(ml);
  });
}

/**
 * Convert RawJob → NormalizedJob. Drops jobs that:
 *   - lack a URL or title (unusable)
 *   - can't be placed in Canada
 * Scoring happens in `score.ts`; this stage leaves matchScore=0.
 */
export function normalizeAll(raws: RawJob[]): NormalizedJob[] {
  const nowIso = new Date().toISOString();
  const out: NormalizedJob[] = [];

  for (const r of raws) {
    if (!r.title || !r.url) continue;
    const tier = classifyLocation(r.location);
    if (!tier) continue;

    const description = stripHtml(r.description ?? "");
    const employmentType = inferEmploymentType(r.employmentType, r.title);
    const technologies = detectTechnologies(`${r.title} ${description}`);
    const id = jobHash(r.company, r.title, r.location);

    out.push({
      id,
      source: r.source,
      company: r.company,
      title: r.title.trim(),
      location: r.location.trim(),
      locationTier: tier,
      url: r.url,
      description,
      datePosted: r.datePosted ?? null,
      dateDiscovered: nowIso,
      employmentType,
      technologies,
      matchScore: 0,
      scoreReasons: [],
      isMonitoredCompany: isMonitored(r.company),
      fallbackWindow: false,
    });
  }

  return out;
}
