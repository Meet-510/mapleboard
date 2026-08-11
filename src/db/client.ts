import { DatabaseSync } from "node:sqlite";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NormalizedJob } from "../types.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = resolve(HERE, "../../data/mapleboard.db");
const SCHEMA_PATH = resolve(HERE, "./schema.sql");

/**
 * Uses Node's built-in `node:sqlite` (stable in v24; experimental behind
 * `--experimental-sqlite` in v22.5+). Chose over `better-sqlite3` because it
 * ships with Node — no native build, no Python dependency, one less thing to
 * break in CI or on a fresh install.
 */
export class JobDb {
  private db: DatabaseSync;

  constructor(path: string = DEFAULT_DB_PATH) {
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    const schema = readFileSync(SCHEMA_PATH, "utf8");
    this.db.exec(schema);
  }

  /** Returns the set of job ids we have already emailed. */
  getEmailedIds(ids: string[]): Set<string> {
    if (ids.length === 0) return new Set();
    const found = new Set<string>();
    const chunkSize = 500;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => "?").join(",");
      const stmt = this.db.prepare(
        `SELECT id FROM jobs WHERE date_emailed IS NOT NULL AND id IN (${placeholders})`
      );
      for (const row of stmt.all(...chunk) as Array<{ id: string }>) {
        found.add(row.id);
      }
    }
    return found;
  }

  /** Upsert a batch of jobs and mark them as emailed at `emailedAt`. */
  markEmailed(jobs: NormalizedJob[], emailedAt: string): void {
    const insert = this.db.prepare(
      `INSERT INTO jobs (
        id, company, title, location, location_tier, url, source,
        employment_type, technologies, match_score, date_posted,
        date_discovered, date_emailed, applied, ignored
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
      ON CONFLICT(id) DO UPDATE SET
        date_emailed = COALESCE(jobs.date_emailed, excluded.date_emailed),
        match_score  = MAX(jobs.match_score, excluded.match_score)`
    );

    this.db.exec("BEGIN");
    try {
      for (const j of jobs) {
        insert.run(
          j.id,
          j.company,
          j.title,
          j.location,
          j.locationTier,
          j.url,
          j.source,
          j.employmentType,
          JSON.stringify(j.technologies),
          j.matchScore,
          j.datePosted,
          j.dateDiscovered,
          emailedAt
        );
      }
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  close(): void {
    this.db.close();
  }
}
