import type { NormalizedJob, LocationTier, EmploymentType } from "../types.js";
import type { PriorityStatus } from "../pipeline/priority.js";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function relativeAge(iso: string | null, now: Date = new Date()): string {
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
  const monitoredTag = job.isMonitoredCompany
    ? `<span style="background:#0ea5e9;color:#fff;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:6px;">Monitored</span>`
    : "";

  return `
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px;background:#ffffff;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:16px;font-weight:600;color:#0f172a;">
            ${index}. ${esc(job.title)}
            ${fallbackTag}${monitoredTag}
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

function section(title: string, jobs: NormalizedJob[], now: Date): string {
  if (jobs.length === 0) return "";
  const cards = jobs.map((j, i) => jobCard(j, i + 1, now)).join("\n");
  return `
    <div style="margin-top:28px;">
      <div style="border-bottom:2px solid #dc2626;padding-bottom:6px;margin-bottom:16px;">
        <h2 style="margin:0;color:#0f172a;font-size:18px;">${esc(title)} <span style="color:#94a3b8;font-weight:400;font-size:14px;">(${jobs.length})</span></h2>
      </div>
      ${cards}
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
  const buckets: Record<LocationTier, NormalizedJob[]> = {
    alberta: jobs.filter((j) => j.locationTier === "alberta"),
    canada: jobs.filter((j) => j.locationTier === "canada"),
    remote: jobs.filter((j) => j.locationTier === "remote"),
  };
  const monitored = jobs.filter((j) => j.isMonitoredCompany);

  if (jobs.length === 0) {
    return renderEmpty(dateStr, now, priority);
  }

  const summary = `
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center;color:#334155;">
      <div style="font-size:15px;">This scan found <strong>${jobs.length}</strong> new opportunities.</div>
      <div style="margin-top:6px;font-size:13px;color:#64748b;">
        Alberta: <strong>${buckets.alberta.length}</strong> ·
        Rest of Canada: <strong>${buckets.canada.length}</strong> ·
        Remote: <strong>${buckets.remote.length}</strong>
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
      ${section("Alberta", buckets.alberta, now)}
      ${section("Rest of Canada", buckets.canada, now)}
      ${section("Remote Canada", buckets.remote, now)}
      ${
        monitored.length > 0
          ? section("Companies You Monitor", monitored, now)
          : ""
      }
      <div style="text-align:center;margin-top:32px;color:#94a3b8;font-size:11px;">
        Sent by MapleBoard · Sources: Greenhouse, Lever, Ashby, Workday, Adzuna
      </div>
    </div>
  `.trim();

  const text = renderText(jobs, buckets, dateStr, now, priority);

  return {
    subject: `Daily Junior Developer Jobs — Canada — ${dateStr} (${jobs.length})`,
    html,
    text,
  };
}

function priorityBanner(p?: PriorityStatus): string {
  if (!p) return "";
  // Colour reflects state: red on fetch failure, green on new roles, amber on
  // "openings but nothing junior", grey for the quiet-day baseline.
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

function renderText(
  jobs: NormalizedJob[],
  buckets: Record<LocationTier, NormalizedJob[]>,
  dateStr: string,
  now: Date,
  priority?: PriorityStatus
): string {
  const lines: string[] = [
    `MapleBoard — Daily Junior Developer Jobs — Canada — ${dateStr}`,
    ``,
  ];
  if (priority) {
    lines.push(`Priority: ${priority.message}`, ``);
  }
  lines.push(
    `Found ${jobs.length} new opportunities.`,
    `Alberta: ${buckets.alberta.length} | Rest of Canada: ${buckets.canada.length} | Remote: ${buckets.remote.length}`,
    ``
  );
  const addSection = (title: string, rows: NormalizedJob[]) => {
    if (rows.length === 0) return;
    lines.push(`--- ${title.toUpperCase()} (${rows.length}) ---`);
    rows.forEach((j, i) => {
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
  };
  addSection("Alberta", buckets.alberta);
  addSection("Rest of Canada", buckets.canada);
  addSection("Remote Canada", buckets.remote);
  return lines.filter((l) => l !== undefined).join("\n");
}

function renderEmpty(dateStr: string, now: Date, priority?: PriorityStatus): Rendered {
  const html = `
    <div style="max-width:640px;margin:0 auto;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;background:#f1f5f9;">
      <div style="text-align:center;">
        <h1 style="color:#dc2626;margin:0;font-size:22px;">MapleBoard</h1>
        <div style="color:#64748b;font-size:13px;margin-top:4px;">${esc(dateStr)}</div>
      </div>
      ${priorityBanner(priority)}
      <div style="text-align:center;margin-top:24px;color:#334155;font-size:15px;">
        No new junior developer jobs matched this scan.
      </div>
      <div style="text-align:center;margin-top:8px;color:#94a3b8;font-size:12px;">
        The scan ran successfully — sources returned nothing new in the last 24–48h window.
      </div>
    </div>
  `.trim();
  const priorityLine = priority ? `Priority: ${priority.message}\n\n` : "";
  return {
    subject: `Daily Junior Developer Jobs — Canada — ${dateStr} (no new jobs)`,
    html,
    text: `MapleBoard — ${dateStr}\n\n${priorityLine}No new junior developer jobs matched this scan. Sources returned nothing new in the last 24–48h window.\n\n(Now: ${now.toISOString()})`,
  };
}
