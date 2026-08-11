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

  monitoredCompanies: [
    "Neo Financial",
    "RBC",
    "TD",
    "BMO",
    "ATB Financial",
    "Shopify",
    "Benevity",
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
  ] as CompanySource[],

  ashbyCompanies: [
    { slug: "neofinancial", name: "Neo Financial" },
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
  adzunaQueries: [
    "junior software developer",
    "junior software engineer",
    "entry level software developer",
    "new grad software",
    "software developer intern",
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
