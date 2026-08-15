export type SourceName =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "workday"
  | "adzuna"
  | "jobbank";

export type LocationTier = "alberta" | "canada" | "remote";

export type EmploymentType = "full_time" | "intern" | "contract" | "unknown";

/**
 * Raw shape produced by a fetcher — minimal, source-shaped.
 * The pipeline normalizes these into `NormalizedJob`.
 */
export type RawJob = {
  source: SourceName;
  sourceId: string; // stable id within source, used for logging only
  company: string;
  title: string;
  location: string; // free-text as source provides
  url: string;
  description?: string;
  datePosted?: string; // ISO, if source provides
  employmentType?: EmploymentType;
};

export type Section = "neo" | "focus" | "tier2" | "general";

export type NormalizedJob = {
  id: string; // sha256 dedupe hash
  source: SourceName;
  company: string;
  title: string;
  location: string;
  locationTier: LocationTier;
  section: Section;
  url: string;
  description: string;
  datePosted: string | null; // ISO or null if unknown
  dateDiscovered: string; // ISO
  employmentType: EmploymentType;
  technologies: string[];
  matchScore: number; // 0..100
  scoreReasons: string[]; // human-readable "why it matches"
  fallbackWindow: boolean; // true if kept only by the 48h fallback
};

export type JobRow = {
  id: string;
  company: string;
  title: string;
  location: string;
  location_tier: LocationTier;
  url: string;
  source: SourceName;
  employment_type: EmploymentType;
  technologies: string; // JSON array
  match_score: number;
  date_posted: string | null;
  date_discovered: string;
  date_emailed: string | null;
  applied: 0 | 1;
  ignored: 0 | 1;
};
