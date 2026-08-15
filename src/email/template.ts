import type {
  NormalizedJob,
  Section,
  EmploymentType,
} from "../types.js";
import type { PriorityStatus } from "../pipeline/priority.js";
import { config } from "../config.js";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function relativeAge(iso: string | null, now: Date): string {
  if (!iso) return "Posted date unknown";
  const posted = Date.parse(iso);
  if (Number.isNaN(posted)) return "Posted date unknown";
  const hrs = Math.max(0, Math.round((now.getTime() - posted) / (60 * 60 * 1000)));
  if (hrs < 1) return "Posted just now";
  if (hrs < 24) return `Posted ${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `Posted ${days}d ago`;
}

function employmentLabel(t: EmploymentType): string {
  switch (t) {
    case "full_time":
      return "Full-Time";
    case "intern":
      return "Internship";
    case "contract":
      return "Contract";
    default:
      return "Full-Time";
  }
}

function employmentBadge(t: EmploymentType): string {
  const color =
    t === "intern" ? "#3b82f6" : t === "contract" ? "#8b5cf6" : "#16a34a";
  return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">${esc(
    employmentLabel(t)
  )}</span>`;
}

function jobCard(job: NormalizedJob, index: number, now: Date): string {
  const techLine =
    job.technologies.length > 0
      ? `<div style="color:#475569;font-size:13px;margin-top:4px;">Tech: ${esc(
          job.technologies.slice(0, 6).join(", ")
        )}</div>`
      : "";
  const whyLine =
    job.scoreReasons.length > 0
      ? `<div style="color:#64748b;font-size:12px;margin-top:4px;font-style:italic;">Why it matches: ${esc(
          job.scoreReasons.slice(0, 4).join(" · ")
        )}</div>`
      : "";
  const fallbackTag = job.fallbackWindow
    ? `<span style="background:#f59e0b;color:#fff;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:6px;">48h fallback</span>`
    : "";

  return `
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px;background:#ffffff;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:16px;font-weight:600;color:#0f172a;">
            ${index}. ${esc(job.title)}
            ${fallbackTag}
          </div>
          <div style="color:#334155;font-size:14px;margin-top:2px;">
            ${esc(job.company)} · ${esc(job.location)}
          </div>
          <div style="color:#64748b;font-size:12px;margin-top:4px;">
            ${esc(relativeAge(job.datePosted, now))} · ${employmentBadge(job.employmentType)}
          </div>
          ${techLine}
          ${whyLine}
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="background:#dcfce7;color:#166534;padding:4px 10px;border-radius:12px;font-weight:700;font-size:13px;">
            ${job.matchScore}%
          </div>
        </div>
      </div>
      <div style="margin-top:12px;">
        <a href="${esc(job.url)}" style="display:inline-block;background:#dc2626;color:#ffffff;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
          → Apply
        </a>
        <span style="color:#94a3b8;font-size:11px;margin-left:8px;">via ${esc(job.source)}</span>
      </div>
    </div>
  `.trim();
}

type SectionMeta = {
  key: Section;
  title: string;
  accent: string; // border colour
  subtitle: string;
  /** If the section is empty, show this note instead of hiding it. */
  emptyNote?: string;
};

const SECTION_ORDER: SectionMeta[] = [
  {
    key: "neo",
    title: "Neo Financial",
    accent: "#dc2626",
    subtitle: "Priority company — checked every scan.",
    emptyNote:
      "No new Neo Financial junior roles in this scan. See the priority banner above for the full board status.",
  },
  {
    key: "focus",
    title: "Focus Companies",
    accent: "#0ea5e9",
    subtitle: "The smaller Canadian tech shops on your target list.",
    emptyNote: "No new junior postings from your focus companies this scan.",
  },
  {
    key: "general",
    title: "Rest of Canada",
    accent: "#16a34a",
    subtitle: "Everything else surfaced by the scan.",
  },
  {
    key: "tier2",
    title: "Tier 2 Companies",
    accent: "#8b5cf6",
    subtitle: "Larger enterprises you're also open to.",
    emptyNote: "No new junior postings from tier-2 companies this scan.",
  },
];

// Within a section, Alberta postings surface first.
const TIER_ORDER = { alberta: 0, canada: 1, remote: 2 } as const;

function sortForSection(jobs: NormalizedJob[]): NormalizedJob[] {
  return [...jobs].sort((a, b) => {
    if (a.locationTier !== b.locationTier) {
      return TIER_ORDER[a.locationTier] - TIER_ORDER[b.locationTier];
    }
    return b.matchScore - a.matchScore;
  });
}

function sectionBlock(meta: SectionMeta, jobs: NormalizedJob[], now: Date): string {
  const sorted = sortForSection(jobs);
  const body =
    sorted.length > 0
      ? sorted.map((j, i) => jobCard(j, i + 1, now)).join("\n")
      : meta.emptyNote
        ? `<div style="color:#64748b;font-size:13px;padding:12px;background:#ffffff;border-radius:8px;border:1px dashed #cbd5e1;">${esc(meta.emptyNote)}</div>`
        : "";
  if (!body) return "";

  return `
    <div style="margin-top:28px;">
      <div style="border-bottom:2px solid ${meta.accent};padding-bottom:6px;margin-bottom:8px;">
        <h2 style="margin:0;color:#0f172a;font-size:18px;">
          ${esc(meta.title)}
          <span style="color:#94a3b8;font-weight:400;font-size:14px;">(${sorted.length})</span>
        </h2>
      </div>
      <div style="color:#64748b;font-size:12px;margin-bottom:12px;">${esc(meta.subtitle)}</div>
      ${body}
    </div>
  `.trim();
}

function priorityBanner(p?: PriorityStatus): string {
  if (!p) return "";
  const bg = !p.fetchOk
    ? "#fee2e2"
    : p.newInThisEmail > 0
      ? "#dcfce7"
      : (p.totalOpenings ?? 0) > 0
        ? "#fef3c7"
        : "#f1f5f9";
  const border = !p.fetchOk
    ? "#dc2626"
    : p.newInThisEmail > 0
      ? "#16a34a"
      : (p.totalOpenings ?? 0) > 0
        ? "#f59e0b"
        : "#94a3b8";
  return `
    <div style="background:${bg};border-left:4px solid ${border};padding:12px 16px;border-radius:6px;margin-bottom:16px;">
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Priority company</div>
      <div style="font-size:14px;color:#0f172a;margin-top:2px;">${esc(p.message)}</div>
    </div>
  `.trim();
}

export type Rendered = {
  subject: string;
  html: string;
  text: string;
};

export function renderEmail(
  jobs: NormalizedJob[],
  now: Date = new Date(),
  priority?: PriorityStatus
): Rendered {
  const dateStr = now.toISOString().slice(0, 10);
  const bySection: Record<Section, NormalizedJob[]> = {
    neo: jobs.filter((j) => j.section === "neo"),
    focus: jobs.filter((j) => j.section === "focus"),
    tier2: jobs.filter((j) => j.section === "tier2"),
    general: jobs.filter((j) => j.section === "general"),
  };

  const summary = `
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center;color:#334155;">
      <div style="font-size:15px;">This scan surfaced <strong>${jobs.length}</strong> junior role${jobs.length === 1 ? "" : "s"}.</div>
      <div style="margin-top:6px;font-size:13px;color:#64748b;">
        Neo: <strong>${bySection.neo.length}</strong> ·
        Focus: <strong>${bySection.focus.length}</strong> ·
        Rest of Canada: <strong>${bySection.general.length}</strong> ·
        Tier 2: <strong>${bySection.tier2.length}</strong>
      </div>
    </div>
  `.trim();

  const html = `
    <div style="max-width:640px;margin:0 auto;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;background:#f1f5f9;">
      <div style="text-align:center;margin-bottom:12px;">
        <h1 style="margin:0;color:#dc2626;font-size:24px;">MapleBoard</h1>
        <div style="color:#64748b;font-size:13px;">Junior Developer Jobs · Canada · ${esc(dateStr)}</div>
      </div>
      ${priorityBanner(priority)}
      ${summary}
      ${SECTION_ORDER.map((meta) => sectionBlock(meta, bySection[meta.key], now)).join("\n")}
      <div style="text-align:center;margin-top:32px;color:#94a3b8;font-size:11px;">
        Sent by MapleBoard · Sources: Greenhouse, Lever, Ashby, Workday, Adzuna
      </div>
    </div>
  `.trim();

  const text = renderText(jobs, bySection, dateStr, now, priority);

  const subjectCount =
    jobs.length === 0 ? "no new jobs" : `${jobs.length}`;
  return {
    subject: `${config.email.subjectPrefix} — ${dateStr} (${subjectCount})`,
    html,
    text,
  };
}

function renderText(
  jobs: NormalizedJob[],
  bySection: Record<Section, NormalizedJob[]>,
  dateStr: string,
  now: Date,
  priority?: PriorityStatus
): string {
  const lines: string[] = [
    `MapleBoard — Junior Developer Jobs — Canada — ${dateStr}`,
    ``,
  ];
  if (priority) lines.push(`Priority: ${priority.message}`, ``);
  lines.push(
    `Total: ${jobs.length} · Neo: ${bySection.neo.length} · Focus: ${bySection.focus.length} · Rest of Canada: ${bySection.general.length} · Tier 2: ${bySection.tier2.length}`,
    ``
  );

  for (const meta of SECTION_ORDER) {
    const sorted = sortForSection(bySection[meta.key]);
    lines.push(`--- ${meta.title.toUpperCase()} (${sorted.length}) ---`);
    if (sorted.length === 0) {
      lines.push(meta.emptyNote ?? "(none)", "");
      continue;
    }
    sorted.forEach((j, i) => {
      lines.push(
        `${i + 1}. ${j.title}  [${j.matchScore}%]`,
        `   ${j.company} · ${j.location}`,
        `   ${relativeAge(j.datePosted, now)} · ${employmentLabel(j.employmentType)}${
          j.fallbackWindow ? " · [48h fallback]" : ""
        }`,
        j.technologies.length > 0 ? `   Tech: ${j.technologies.slice(0, 6).join(", ")}` : "",
        `   Apply: ${j.url}`,
        ""
      );
    });
  }

  return lines.filter((l) => l !== undefined).join("\n");
}
