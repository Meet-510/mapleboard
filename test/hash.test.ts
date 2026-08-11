import { describe, expect, it } from "vitest";
import { jobHash } from "../src/util/hash.js";

describe("jobHash", () => {
  it("is deterministic", () => {
    expect(jobHash("Acme", "Junior Dev", "Calgary, AB")).toEqual(
      jobHash("Acme", "Junior Dev", "Calgary, AB")
    );
  });

  it("ignores case and punctuation", () => {
    expect(jobHash("Acme, Inc.", "Junior Dev!", "Calgary, AB")).toEqual(
      jobHash("acme inc", "junior dev", "calgary ab")
    );
  });

  it("differs when any component differs", () => {
    const base = jobHash("Acme", "Junior Dev", "Calgary, AB");
    expect(jobHash("Acme", "Junior Dev", "Edmonton, AB")).not.toEqual(base);
    expect(jobHash("Acme", "Senior Dev", "Calgary, AB")).not.toEqual(base);
    expect(jobHash("Beta", "Junior Dev", "Calgary, AB")).not.toEqual(base);
  });
});
