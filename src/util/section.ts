import { config } from "../config.js";

/**
 * Every job lands in exactly one section, decided in this priority order:
 *   neo → focus → tier2 → general
 * Neo Financial is intentionally hoisted out of `focus` so it always has its
 * own top-of-email section even when the focus list is busy.
 */
export type Section = "neo" | "focus" | "tier2" | "general";

const NEO_NAME = config.priorityCompany.name.toLowerCase();

function includesAny(haystack: string, needles: readonly string[]): boolean {
  for (const n of needles) {
    if (haystack.includes(n.toLowerCase())) return true;
  }
  return false;
}

export function classifySection(companyName: string): Section {
  const c = companyName.toLowerCase();
  if (c === NEO_NAME || c.includes(NEO_NAME)) return "neo";

  // Focus list without Neo (Neo is above).
  const focusWithoutNeo = config.focusCompanies.filter(
    (name) => name.toLowerCase() !== NEO_NAME
  );
  if (includesAny(c, focusWithoutNeo)) return "focus";

  if (includesAny(c, config.tier2Companies)) return "tier2";
  return "general";
}
