# MapleBoard

Automated daily job alerts for junior software developer positions in Canada, Alberta-first. Runs on GitHub Actions cron, emails via Resend, keeps a permanent SQLite history so the same job never appears twice.

## What you get

Every morning at ~7 AM Mountain Time, an email with:

- Alberta positions first (Calgary/Edmonton scored highest)
- Then rest of Canada, then remote Canada
- Only jobs posted in the last 24 hours (48h fallback if the primary window is thin)
- Deduped across sources and against everything sent before
- Each posting scored 0–100 with a "why it matches" reason
- Every application URL HEAD-verified before send

## Requirements

- Node.js **≥ 22.5** locally (uses the built-in `node:sqlite`; no native builds).
- A GitHub account (private repo).
- A [Resend](https://resend.com) account (free tier: 3000 emails/month).
- An [Adzuna](https://developer.adzuna.com) developer account (free tier: ~1000 calls/month). Adzuna is what gives us Indeed coverage legally.

## Setup

### 1. Get your keys

- **Resend**: sign up, copy your API key from Dashboard → API Keys. For V1 we send from `onboarding@resend.dev` (the sandbox) so no domain setup is needed.
- **Adzuna**: sign up, register an app, copy `App ID` and `App Key`.

### 2. Local install

```bash
npm install
cp .env.example .env
# paste your keys into .env
npm run dry-run
```

`dry-run` fetches everything, runs the whole pipeline, renders the email, but does **not** send or write to history. Use it to sanity-check output.

When you're ready to actually send:

```bash
npm run test-once
```

Check your inbox.

### 3. Push to a private GitHub repo

```bash
git remote add origin https://github.com/<you>/mapleboard.git
git push -u origin main
```

### 4. Add secrets in GitHub

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add:

- `RESEND_API_KEY`
- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`

### 5. Enable Actions

Go to the **Actions** tab. If prompted, enable workflows. Manually trigger **Daily Job Alert** once from the Actions tab (**Run workflow**) to confirm the cloud run succeeds. From then on it runs itself.

## Configuration

Everything the owner might want to change lives in [`src/config.ts`](src/config.ts):

- `recipientEmail` — where the email goes.
- `jobTitles.include` / `.exclude` — keywords that pull a role in or drop it.
- `technologies` — tech-stack keywords that add to the match score.
- `locations` — Alberta cities, other Canadian cities, whether remote-Canada is allowed.
- `monitoredCompanies` — companies that get an extra +10 score and a Monitored badge in the email.
- `greenhouseCompanies` / `leverCompanies` / `ashbyCompanies` — per-source slugs.
  - Discover a Greenhouse slug: try `https://boards.greenhouse.io/<slug>` — if it loads, add the slug.
  - Discover a Lever slug: try `https://jobs.lever.co/<slug>`.
  - Discover an Ashby slug: try `https://jobs.ashbyhq.com/<slug>`.
- `workdayCompanies` — bespoke per tenant. Populate as you find them.
- `adzunaQueries` — the search terms sent to Adzuna's Canada endpoint.
- `freshness` — the 24h / 48h windows.
- `email.maxJobs` — cap on how many jobs a single email can contain.
- `email.fromAddress` — swap to `you@yourdomain.com` once you verify a domain in Resend.

Rebuild + push after editing. No code changes required.

## Sources

| Source | How | Status |
|---|---|---|
| Greenhouse | Public per-company JSON API | ✅ working |
| Lever | Public per-company JSON API | ✅ working |
| Ashby | Public per-company JSON API | ✅ working (populate `ashbyCompanies`) |
| Workday | Per-tenant JSON endpoint | ✅ working (populate `workdayCompanies`) |
| Adzuna | Official API, needs App ID + Key | ✅ working |
| Job Bank Canada | Their public RSS was retired; the XML feed is 403 for anonymous clients | ⚠ disabled — set `MAPLEBOARD_JOBBANK_ENABLED=1` and wire an auth token if you get onto their partner program |

We deliberately **do not** scrape LinkedIn, Indeed, or Glassdoor — that violates their ToS and breaks constantly. Adzuna covers Indeed's inventory legally.

## Local commands

```bash
npm run dry-run     # full pipeline, no email, no history write
npm run test-once   # full pipeline, sends the email, writes history
npm run daily       # same as test-once — what GitHub Actions runs
npm run test        # unit tests (pipeline pure functions)
npm run typecheck   # tsc --noEmit
```

## How it stays free

- GitHub Actions: 2000 free minutes/month on private repos. Each run is ~2 min. Cost: ≪ 100 min/month.
- Resend: 3000 emails/month free. We send 1/day: 30/month.
- Adzuna: ~1000 calls/month free. Config uses 5 queries × 30 days ≈ 150/month.
- SQLite: the file itself lives in your repo. No hosting cost.

Total: **$0/month**.

## Files

```
src/
  index.ts                 # orchestrator — the daily run
  config.ts                # ⭐ everything user-editable
  types.ts                 # shared types
  fetchers/                # one file per source
  pipeline/                # normalize → dedupe → freshness → filter → score → verify
  db/                      # SQLite via node:sqlite
  email/                   # HTML template + Resend sender
  util/
data/mapleboard.db         # committed job history
.github/workflows/daily.yml
```

## Guardrails

- **No fake data.** If sources return nothing, the email says "no new jobs today" — not filler.
- **No unverifiable postings.** If a source doesn't provide a posted-date, the posting is only kept when the title clearly matches a junior/entry pattern.
- **URL verification.** Every URL is HEAD-checked before send. Broken links are dropped.
- **Never commit `.env`.** Enforced via `.gitignore`.

## License

Personal use.
