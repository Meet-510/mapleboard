import { describe, expect, it } from "vitest";
import { applyFreshness } from "../src/pipeline/freshness.js";
import type { NormalizedJob } from "../src/types.js";

function job(overrides: Partial<NormalizedJob>): NormalizedJob {
  return {
    id: "id",
    source: "adzuna",
    company: "Acme",
    title: "Software Developer",
    location: "Calgary, AB",
    locationTier: "alberta",
    url: "https://example.com/x",
    description: "",
    datePosted: null,
    dateDiscovered: new Date().toISOString(),
    employmentType: "full_time",
    technologies: [],
    matchScore: 0,
    scoreReasons: [],
    isMonitoredCompany: false,
    fallbackWindow: false,
    ...overrides,
  };
}

const NOW = new Date("2026-08-10T12:00:00Z");

function hoursAgo(h: number): string {
  return new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString();
}

describe("applyFreshness", () => {
  it("keeps jobs ≤ 24h as primary", () => {
    const out = applyFreshness([job({ datePosted: hoursAgo(12) })], NOW);
    expect(out).toHaveLength(1);
    expect(out[0]?.fallbackWindow).toBe(false);
  });

  it("keeps jobs 24–48h as fallback", () => {
    const out = applyFreshness([job({ datePosted: hoursAgo(36) })], NOW);
    expect(out).toHaveLength(1);
    expect(out[0]?.fallbackWindow).toBe(true);
  });

  it("drops jobs > 48h", () => {
    expect(applyFreshness([job({ datePosted: hoursAgo(72) })], NOW)).toHaveLength(0);
  });

  it("keeps undated jobs only if title suggests junior", () => {
    const junior = job({ title: "Junior Software Developer", datePosted: null });
    const generic = job({ title: "Software Developer", datePosted: null });
    const out = applyFreshness([junior, generic], NOW);
    expect(out).toHaveLength(1);
    expect(out[0]?.title).toBe("Junior Software Developer");
    expect(out[0]?.fallbackWindow).toBe(true);
  });

  it("treats future-dated postings as fresh", () => {
    const future = job({ datePosted: hoursAgo(-2) });
    expect(applyFreshness([future], NOW)).toHaveLength(1);
  });

  it("drops jobs with invalid datePosted", () => {
    expect(applyFreshness([job({ datePosted: "not-a-date" })], NOW)).toHaveLength(0);
  });
});
