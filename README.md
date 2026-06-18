# World Cup Sweepstake — self-updating leaderboard

A single-page leaderboard for the 9-person pool. It reads `results.json`,
which a scheduled GitHub Action rewrites once a day from a free football
results API. Hosted free on GitHub Pages, so you get one permanent link
that refreshes itself.

## What's in here

- `index.html` — the page (reads `results.json`)
- `results.json` — current results (auto-updated daily; safe to hand-edit)
- `scripts/fetch-results.js` — pulls results from the API
- `.github/workflows/update.yml` — runs the script once a day
- the player rosters live near the top of `index.html` (`PLAYERS`)

## One-time setup (about 15–20 minutes)

### 1. Put the files on GitHub
1. Create a free account at github.com, then a new repository (e.g. `world-cup-sweepstake`).
2. Upload everything in this folder, keeping the structure (the `.github/workflows`
   and `scripts` folders matter).

### 2. Turn on the website
1. Repo → **Settings → Pages**.
2. Under "Build and deployment", set Source to **Deploy from a branch**, branch
   `main`, folder `/ (root)`. Save.
3. After a minute your link appears there, like
   `https://YOURNAME.github.io/world-cup-sweepstake/` — that's what you share.

### 3. Get a free results key
1. Register at https://www.football-data.org/client/register — you'll get an API token by email.
2. Repo → **Settings → Secrets and variables → Actions → New repository secret**.
3. Name it exactly `FOOTBALL_DATA_TOKEN`, paste the token as the value, save.

### 4. Test the daily job
1. Repo → **Actions** tab → enable workflows if prompted.
2. Click **Update results → Run workflow** to run it once now.
3. If it's green, it'll then run on its own every day. Open your Pages link to check.

## If the API doesn't cover the 2026 World Cup on the free plan

The free tier covers the World Cup, but availability and timing can vary, and
results land with a short delay (not live-minute). Two fallbacks:

- **Edit `results.json` by hand** anytime — the page just reads that file.
  Add results to a team's `g` list (`"W"`/`"D"`/`"L"`) and, once the knockouts
  start, set `reached` to `"R32"`, `"QF"`, `"SF"`, `"F"` or `"W"`. Commit and
  the link updates.
- **Swap APIs**: the only API-specific code is in `scripts/fetch-results.js`.
  API-Football (api-sports.io) is a common alternative.

## Team names

If the API spells a country differently from the page (e.g. "Turkey" vs
"Türkiye"), add it to the `ALIAS` map in `scripts/fetch-results.js`. The script
prints a note when it sees a name it doesn't recognise.

## Scoring

Group win 2 · draw 1 · qualify +4 · quarter-final +6 · semi-final +8 ·
final +10 · champions +15. Knockout bonuses stack. Reaching the round of 16
scores nothing on its own — confirm that's how your pool intends it.
