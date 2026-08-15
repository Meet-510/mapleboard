import { describe, expect, it } from "vitest";
import { dedupe } from "../src/pipeline/dedupe.js";
import type { NormalizedJob } from "../src/types.js";

function job(overrides: Partial<NormalizedJob>): NormalizedJob {
  return {
    id: "id-1",
    source: "adzuna",
    company: "Acme",
    title: "Junior Dev",
    location: "Calgary, AB",
    locationTier: "alberta",
    url: "https://example.com/apply",
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

describe("dedupe", () => {
  it("collapses duplicates and prefers the better source", () => {
    const jobs = [
      job({ id: "x", source: "adzuna", url: "https://adzuna/x" }),
      job({ id: "x", source: "greenhouse", url: "https://ghs/x" }),
    ];
    const out = dedupe(jobs);
    expect(out).toHaveLength(1);
    expect(out[0]?.source).toBe("greenhouse");
    expect(out[0]?.url).toBe("https://ghs/x");
  });

  it("merges technology lists", () => {
    const jobs = [
      job({ id: "y", technologies: ["react"] }),
      job({ id: "y", technologies: ["node", "react"] }),
    ];
    const out = dedupe(jobs);
    expect(out).toHaveLength(1);
    expect(out[0]?.technologies.sort()).toEqual(["node", "react"]);
  });

  it("keeps distinct jobs", () => {
    const jobs = [job({ id: "a" }), job({ id: "b" }), job({ id: "c" })];
    expect(dedupe(jobs)).toHaveLength(3);
  });
});
