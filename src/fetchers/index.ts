import type { RawJob } from "../types.js";
import { log } from "../util/logger.js";
import { fetchGreenhouse } from "./greenhouse.js";
import { fetchLever } from "./lever.js";
import { fetchAshby } from "./ashby.js";
import { fetchWorkday } from "./workday.js";
import { fetchAdzuna } from "./adzuna.js";
import { fetchJobBank } from "./jobbank.js";

/**
 * Runs all fetchers in parallel. A single failing source must not kill the run,
 * so each fetcher already catches its own errors; we still wrap with
 * `allSettled` as a belt-and-suspenders guard.
 */
export async function fetchAll(): Promise<RawJob[]> {
  const runners = [
    { name: "greenhouse", run: fetchGreenhouse },
    { name: "lever", run: fetchLever },
    { name: "ashby", run: fetchAshby },
    { name: "workday", run: fetchWorkday },
    { name: "adzuna", run: fetchAdzuna },
    { name: "jobbank", run: fetchJobBank },
  ] as const;

  const settled = await Promise.allSettled(runners.map((r) => r.run()));
  const jobs: RawJob[] = [];
  settled.forEach((s, i) => {
    const name = runners[i]?.name ?? "unknown";
    if (s.status === "fulfilled") {
      jobs.push(...s.value);
    } else {
      log.error(`${name} crashed`, { reason: String(s.reason) });
    }
  });

  log.info("fetch complete", { total: jobs.length });
  return jobs;
}
