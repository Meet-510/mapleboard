import { describe, expect, it } from "vitest";
import { excludeUnwanted, isExcluded } from "../src/pipeline/filter.js";
import type { NormalizedJob } from "../src/types.js";

function job(overrides: Partial<NormalizedJob>): NormalizedJob {
  return {
    id: "id",
    source: "greenhouse",
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

describe("isExcluded", () => {
  it("drops senior/staff/lead/manager titles", () => {
    expect(isExcluded(job({ title: "Senior Software Developer" }))).toBe(true);
    expect(isExcluded(job({ title: "Staff Engineer" }))).toBe(true);
    expect(isExcluded(job({ title: "Engineering Manager" }))).toBe(true);
    expect(isExcluded(job({ title: "Lead Developer" }))).toBe(true);
  });

  it("keeps junior/entry titles", () => {
    expect(isExcluded(job({ title: "Junior Software Developer" }))).toBe(false);
    expect(isExcluded(job({ title: "Software Engineer I" }))).toBe(false);
    expect(isExcluded(job({ title: "Software Developer" }))).toBe(false);
  });

  it("drops jobs whose description gates on 5+ years", () => {
    expect(
      isExcluded(
        job({ description: "Requires 7+ years of experience with distributed systems." })
      )
    ).toBe(true);
    expect(
      isExcluded(job({ description: "5 years of professional experience required." }))
    ).toBe(true);
  });

  it("keeps jobs asking for 1–3 years", () => {
    expect(
      isExcluded(job({ description: "1-3 years of experience preferred." }))
    ).toBe(false);
  });
});

describe("excludeUnwanted", () => {
  it("filters in bulk", () => {
    const jobs = [
      job({ title: "Junior Software Developer" }),
      job({ title: "Senior Software Developer" }),
      job({ title: "Software Engineer I" }),
    ];
    expect(excludeUnwanted(jobs)).toHaveLength(2);
  });
});
