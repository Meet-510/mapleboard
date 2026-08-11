import * as cheerio from "cheerio";
import type { RawJob } from "../types.js";
import { fetchText } from "../util/http.js";
import { log } from "../util/logger.js";

/**
 * Job Bank Canada — DISABLED by default.
 *
 * Job Bank retired their public RSS feeds (`?rss=1` returns the HTML search
 * page) and their XML feed at `/xmlfeed/jobposting` returns HTTP 403 for
 * anonymous callers. Programmatic access now requires enrolment in their
 * job-board partner program (contact ESDC).
 *
 * To re-enable once you have partner access, set the env var
 * `MAPLEBOARD_JOBBANK_ENABLED=1` and, if their partner API requires it, wire
 * an auth token into the `httpFetch` call below.
 */

const QUERIES: Array<{ q: string; loc: string }> = [
  { q: "junior software developer", loc: "Alberta" },
  { q: "junior software developer", loc: "Canada" },
  { q: "entry level software", loc: "Alberta" },
  { q: "entry level software", loc: "Canada" },
  { q: "software developer", loc: "Calgary, AB" },
  { q: "software developer", loc: "Edmonton, AB" },
];

function parseTitleAndCompany(rssTitle: string): { title: string; company: string } {
  const dashIdx = rssTitle.lastIndexOf(" - ");
  if (dashIdx > 0) {
    return {
      title: rssTitle.slice(0, dashIdx).trim(),
      company: rssTitle.slice(dashIdx + 3).trim(),
    };
  }
  return { title: rssTitle.trim(), company: "Unknown" };
}

function parseLocationFromDescription(desc: string): string {
  const m = desc.match(/Location:\s*([^<\n]+?)(?:<|Salary:|$)/i);
  return m?.[1]?.trim() ?? "";
}

export async function fetchJobBank(): Promise<RawJob[]> {
  if (process.env.MAPLEBOARD_JOBBANK_ENABLED !== "1") {
    log.info("jobbank disabled — set MAPLEBOARD_JOBBANK_ENABLED=1 to enable (requires partner access)");
    return [];
  }

  const results: RawJob[] = [];

  await Promise.all(
    QUERIES.map(async ({ q, loc }) => {
      const params = new URLSearchParams({
        searchstring: q,
        locationstring: loc,
        sort: "D",
        rss: "1",
      });
      const url = `https://www.jobbank.gc.ca/jobsearch/jobsearch?${params.toString()}`;
      try {
        const xml = await fetchText(url);
        if (!xml.trimStart().startsWith("<?xml") && !xml.includes("<rss")) {
          log.warn(`jobbank:"${q}" @ ${loc} returned non-RSS (partner auth likely required)`);
          return;
        }
        const $ = cheerio.load(xml, { xmlMode: true });
        const items = $("item");
        items.each((_, el) => {
          const $el = $(el);
          const rssTitle = $el.find("title").first().text();
          const link = $el.find("link").first().text();
          const description = $el.find("description").first().text();
          const pubDate = $el.find("pubDate").first().text();
          if (!rssTitle || !link) return;
          const { title, company } = parseTitleAndCompany(rssTitle);
          const location = parseLocationFromDescription(description) || loc;
          results.push({
            source: "jobbank",
            sourceId: link,
            company,
            title,
            location,
            url: link,
            description,
            datePosted: pubDate ? new Date(pubDate).toISOString() : undefined,
          });
        });
        log.info(`jobbank:"${q}" @ ${loc} fetched`, { count: items.length });
      } catch (err) {
        log.warn(`jobbank:"${q}" @ ${loc} failed`, { error: String(err) });
      }
    })
  );

  return results;
}
