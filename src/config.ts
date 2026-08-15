export type WorkdayCompany = {
  name: string;
  host: string;
  site: string;
};

export type CompanySource = {
  /** URL slug on the source's public API (case-sensitive). */
  slug: string;
  /** Display name for the email. Falls back to `slug` if omitted. */
  name?: string;
};

export const config = {
  recipientEmail: "mistrymeet941@gmail.com",

  jobTitles: {
    include: [
      "junior software developer",
      "junior software engineer",
      "entry level software developer",
      "entry level software engineer",
      "associate software developer",
      "associate software engineer",
      "software developer i",
      "software engineer i",
      "new grad software",
      "graduate software",
      "full stack developer",
      "junior full stack",
      "junior frontend",
      "junior front-end",
      "junior backend",
      "junior back-end",
      "junior react",
      "react developer",
      "junior javascript",
      "junior node",
      "junior web developer",
      "application developer",
      "software development intern",
      "software engineering intern",
    ],
    exclude: [
      "senior",
      "staff",
      "principal",
      "lead ",
      "manager",
      "director",
      "architect",
      "vp ",
      "head of",
      "5+ years",
      "7+ years",
      "10+ years",
      "sales",
      "customer service",
      "help desk",
      "helpdesk",
      "security guard",
    ],
  },

  technologies: [
    "javascript",
    "typescript",
    "react",
    "next.js",
    "node",
    "express",
    "java",
    "python",
    "php",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "rest api",
    "full stack",
    "web development",
    "git",
    "github",
    "aws",
    "azure",
    "docker",
  ],

  locations: {
    tier1_alberta: [
      "calgary",
      "edmonton",
      "red deer",
      "lethbridge",
      "medicine hat",
      "fort mcmurray",
      "alberta",
      ", ab",
    ],
    tier2_canada: [
      "toronto",
      "vancouver",
      "ottawa",
      "montreal",
      "winnipeg",
      "regina",
      "saskatoon",
      "halifax",
      "quebec city",
      "ontario",
      "british columbia",
      "quebec",
      "manitoba",
      "saskatchewan",
      "nova scotia",
      "new brunswick",
      "newfoundland",
      "pei",
      "prince edward island",
      ", on",
      ", bc",
      ", qc",
      ", mb",
      ", sk",
      ", ns",
      ", nb",
      ", nl",
      ", pe",
    ],
    allowRemoteCanada: true,
  },

  /**
   * Focus companies — the smaller Canadian tech shops the owner most wants to
   * work at. These get their own "Focus" email section and a +15 score bonus.
   * Matched against `job.company` by case-insensitive substring, so entries
   * here should be human display names (not slugs).
   *
   * Neo Financial is here AND lives in its own dedicated top section.
   */
  focusCompanies: [
    "Neo Financial",
    "Benevity",
    "Clio",
    "Jobber",
    "Absorb",
    "ATB Financial",
    "Helcim",
    "AltaML",
    "Xerris",
    "ZayZoon",
  ],

  /**
   * Tier-2 companies — larger enterprises the owner is also open to. Get their
   * own "Tier 2" email section and a +10 score bonus. Coverage is best-effort
   * via Adzuna (Indeed aggregator) since most of these use Workday/proprietary
   * ATSes that don't expose a friendly per-company JSON API.
   */
  tier2Companies: [
    "RBC",
    "TD",
    "BMO",
    "Shopify",
    "Suncor",
    "Canadian Tire",
    "Amazon",
    "Microsoft",
    "Google",
    "IBM",
    "TELUS",
    "Rogers",
    "WestJet",
    "Nutrien",
    "Cenovus",
    "Deloitte",
    "KPMG",
    "EY",
    "PwC",
    "CGI",
  ],

  // Per-source companies. Each entry is { slug, name? }.
  //   Greenhouse:  visit boards.greenhouse.io/<slug> — if it loads, the slug works.
  //   Lever:       visit jobs.lever.co/<slug> — same test.
  //   Ashby:       visit jobs.ashbyhq.com/<slug>.
  // Slugs below were probed live and returned 200 at project setup time.
  greenhouseCompanies: [
    { slug: "hootsuite", name: "Hootsuite" },
    { slug: "ritual", name: "Ritual" },
    { slug: "flipp", name: "Flipp" },
  ] as CompanySource[],

  leverCompanies: [
    { slug: "wealthsimple", name: "Wealthsimple" },
    { slug: "mistplay", name: "Mistplay" },
    { slug: "plusgrade", name: "Plusgrade" },
    { slug: "altaml", name: "AltaML" },
  ] as CompanySource[],

  ashbyCompanies: [
    { slug: "neofinancial", name: "Neo Financial" },
    { slug: "benevity", name: "Benevity" },
    { slug: "jobber", name: "Jobber" },
    { slug: "absorblms", name: "Absorb" },
    { slug: "zayzoon", name: "ZayZoon" },
  ] as CompanySource[],

  /**
   * Priority company — checked on every run, and its status is included in
   * every email (even the "no jobs today" one). Must reference a company that
   * appears in one of the source lists above so we can fetch it directly.
   */
  priorityCompany: {
    name: "Neo Financial",
    // Where to fetch the raw board for the status count.
    source: "ashby" as const,
    slug: "neofinancial",
  },

  // Workday tenants — each site is bespoke. Populate as owner finds them.
  workdayCompanies: [] as WorkdayCompany[],

  // Adzuna searches. Each entry is a keyword query for the CA endpoint.
  // Kept narrow — every result is filtered again by our strict junior gate,
  // so a broad "software developer" query would waste quota without helping.
  adzunaQueries: [
    "junior software developer",
    "junior software engineer",
    "entry level software developer",
    "new grad software",
    "software developer intern",
    "associate software developer",
    "graduate software engineer",
  ],

  freshness: {
    primaryHours: 24,
    fallbackHours: 48,
  },

  email: {
    maxJobs: 30,
    // Resend sandbox address — swap for a verified domain later.
    fromAddress: "MapleBoard <onboarding@resend.dev>",
    subjectPrefix: "Daily Junior Developer Jobs — Canada",
  },

  network: {
    fetchTimeoutMs: 15_000,
    urlVerifyTimeoutMs: 5_000,
    // A friendly UA so operators can identify our traffic if they look.
    userAgent:
      "MapleBoard/0.1 (+https://github.com/Meet-510/mapleboard) personal job alert bot",
  },
} as const;

export type Config = typeof config;
