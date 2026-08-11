import { describe, expect, it } from "vitest";
import { classifyLocation, isCalgaryOrEdmonton } from "../src/util/location.js";

describe("classifyLocation", () => {
  it("classifies Alberta cities as alberta", () => {
    expect(classifyLocation("Calgary, AB")).toBe("alberta");
    expect(classifyLocation("Edmonton, Alberta, Canada")).toBe("alberta");
    expect(classifyLocation("Red Deer")).toBe("alberta");
  });

  it("classifies other Canadian cities as canada", () => {
    expect(classifyLocation("Toronto, ON")).toBe("canada");
    expect(classifyLocation("Vancouver, British Columbia")).toBe("canada");
    expect(classifyLocation("Montréal, QC")).toBe("canada");
  });

  it("classifies remote-Canada as remote", () => {
    expect(classifyLocation("Remote - Canada")).toBe("remote");
    expect(classifyLocation("Remote")).toBe("remote");
    expect(classifyLocation("Anywhere in Canada")).toBe("remote");
  });

  it("rejects clearly non-Canadian remote", () => {
    expect(classifyLocation("Remote - US")).toBeNull();
    expect(classifyLocation("Remote, United States")).toBeNull();
    expect(classifyLocation("Remote - EMEA")).toBeNull();
  });

  it("rejects non-Canadian cities", () => {
    expect(classifyLocation("New York, NY")).toBeNull();
    expect(classifyLocation("London, UK")).toBeNull();
  });

  it("returns null on empty input", () => {
    expect(classifyLocation("")).toBeNull();
  });

  it("isCalgaryOrEdmonton", () => {
    expect(isCalgaryOrEdmonton("Calgary, AB")).toBe(true);
    expect(isCalgaryOrEdmonton("Edmonton")).toBe(true);
    expect(isCalgaryOrEdmonton("Red Deer, AB")).toBe(false);
    expect(isCalgaryOrEdmonton("Toronto, ON")).toBe(false);
  });
});
