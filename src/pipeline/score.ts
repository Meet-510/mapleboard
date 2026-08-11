import { config } from "../config.js";
import type { NormalizedJob } from "../types.js";
import { isCalgaryOrEdmonton } from "../util/location.js";

const JUNIOR_TITLE_RE =
  /(junior|entry.?level|new.?grad|graduate|associate|intern|co-?op|\b(i|1)\b)/i;
const LOW_YEARS_RE = /(0\s*[-–to]\s*[12]|1\s*[-–to]\s*[23]|no experience required)/i;
const FULL_STACK_RE = /full[- ]?stack/i;
const HOURS_MS = 60 * 60 * 1000;

/**
 * Score matches against the config-driven rubric. Score is capped at 100 and
 * reasons are collected for the "why it matches" line in the email.
 */
export function scoreJob(job: NormalizedJob, now: Date = new Date()): NormalizedJob {
  let score = 0;
  const reasons: string[] = [];

  if (JUNIOR_TITLE_RE.test(job.title)) {
    score += 30;
    reasons.push("junior/entry-level title");
  }

  if (LOW_YEARS_RE.test(job.description)) {
    score += 25;
    reasons.push("0–2 years experience");
  }

  if (job.locationTier === "alberta") {
    score += 20;
    reasons.push("Alberta");
    if (isCalgaryOrEdmonton(job.location)) {
      score += 15;
      reasons.push("Calgary/Edmonton");
    }
  }

  if (job.technologies.length > 0) {
    // 5 pts per matched tech, capped at 15.
    const techPts = Math.min(15, job.technologies.length * 5);
    score += techPts;
    reasons.push(`tech: ${job.technologies.slice(0, 4).join(", ")}`);
  }

  if (FULL_STACK_RE.test(job.title) || FULL_STACK_RE.test(job.description)) {
    score += 10;
    reasons.push("full-stack");
  }

  if (job.isMonitoredCompany) {
    score += 10;
    reasons.push("monitored company");
  }

  if (job.datePosted) {
    const ageHrs = (now.getTime() - Date.parse(job.datePosted)) / HOURS_MS;
    if (Number.isFinite(ageHrs) && ageHrs >= 0 && ageHrs <= 12) {
      score += 10;
      reasons.push("posted <12h ago");
    }
  }

  if (job.locationTier === "remote") {
    score += 5;
    reasons.push("remote Canada");
  }

  return {
    ...job,
    matchScore: Math.min(100, score),
    scoreReasons: reasons,
  };
}

export function scoreAll(jobs: NormalizedJob[]): NormalizedJob[] {
  return jobs.map((j) => scoreJob(j));
}
