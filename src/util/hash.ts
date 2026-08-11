import { createHash } from "node:crypto";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Deterministic dedupe key across sources.
 * Same company + normalized title + normalized location → same id.
 */
export function jobHash(company: string, title: string, location: string): string {
  const key = [normalize(company), normalize(title), normalize(location)].join("|");
  return createHash("sha256").update(key).digest("hex").slice(0, 32);
}
