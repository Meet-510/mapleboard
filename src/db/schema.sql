CREATE TABLE IF NOT EXISTS jobs (
  id                TEXT PRIMARY KEY,
  company           TEXT NOT NULL,
  title             TEXT NOT NULL,
  location          TEXT NOT NULL,
  location_tier     TEXT NOT NULL,
  url               TEXT NOT NULL,
  source            TEXT NOT NULL,
  employment_type   TEXT,
  technologies      TEXT,
  match_score       INTEGER NOT NULL,
  date_posted       TEXT,
  date_discovered   TEXT NOT NULL,
  date_emailed      TEXT,
  applied           INTEGER DEFAULT 0,
  ignored           INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_date_emailed ON jobs(date_emailed);
CREATE INDEX IF NOT EXISTS idx_company      ON jobs(company);
