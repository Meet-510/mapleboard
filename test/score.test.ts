import { describe, expect, it } from "vitest";
import { scoreJob } from "../src/pipeline/score.js";
import type { NormalizedJob } from "../src/types.js";

function job(overrides: Partial<NormalizedJob>): NormalizedJob {
  return {
    id: "id",
    source: "greenhouse",
    company: "Acme",
    title: "Software Developer",
    location: "Toronto, ON",
    locationTier: "canada",
    url: "https://example.com/x",
    description: "",
    datePosted: null,
    dateDiscovered: new Date().toISOString(),
    employmentType: "full_time",
    technologies: [],
    matchScore: 0,
    scoreReasons: [],
    section: "general",
    fallbackWindow: false,
    ...overrides,
  };
}

describe("scoreJob", () => {
  it("gives 0 to a plain Toronto software dev role", () => {
    // No junior signal, no tech match, no Alberta, no monitored — baseline 0.
    expect(scoreJob(job({})).matchScore).toBe(0);
  });

  it("adds 30 for a junior title", () => {
    expect(scoreJob(job({ title: "Junior Software Developer" })).matchScore).toBe(30);
  });

  it("adds 20 for Alberta, 15 more for Calgary/Edmonton", () => {
    const cal = scoreJob(
      job({ location: "Calgary, AB", locationTier: "alberta" })
    );
    expect(cal.matchScore).toBe(35);
    const redDeer = scoreJob(
      job({ location: "Red Deer, AB", locationTier: "alberta" })
    );
    expect(redDeer.matchScore).toBe(20);
  });

  it("caps score at 100", () => {
    const scored = scoreJob(
      job({
        title: "Junior Full Stack Developer",
        description: "0-2 years experience. React, Node, TypeScript, SQL.",
        location: "Calgary, AB",
        locationTier: "alberta",
        technologies: ["react", "node", "typescript", "sql"],
        section: "focus",
        datePosted: new Date().toISOString(),
      })
    );
    expect(scored.matchScore).toBeLessThanOrEqual(100);
    expect(scored.matchScore).toBe(100);
  });

  it("populates human-readable reasons", () => {
    const scored = scoreJob(
      job({
        title: "Junior Developer",
        location: "Calgary, AB",
        locationTier: "alberta",
      })
    );
    expect(scored.scoreReasons.join(" ")).toMatch(/junior/i);
    expect(scored.scoreReasons.join(" ")).toMatch(/alberta/i);
  });
});
