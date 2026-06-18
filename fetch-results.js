/* Fetches 2026 World Cup results from football-data.org and writes
 * results.json in the shape the page expects.
 *
 * Needs an env var FOOTBALL_DATA_TOKEN (a free key from
 * https://www.football-data.org/client/register). Runs on Node 18+.
 *
 * Scoring model handled by the page, not here. This script only
 * records, per team: the ordered list of group results (W/D/L) and
 * the furthest knockout stage reached.
 */

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const COMP  = process.env.WC_COMP || 'WC';          // World Cup competition code
const fs    = require('fs');

if (!TOKEN) { console.error('Missing FOOTBALL_DATA_TOKEN secret.'); process.exit(1); }

/* The API's team names on the left, the names used in the page on the
 * right. If a team shows up unmapped, the script warns you — add it here. */
const ALIAS = {
  'Turkey': 'Türkiye', 'Türkiye': 'Türkiye',
  'DR Congo': 'Congo DR', 'Democratic Republic of the Congo': 'Congo DR', 'Congo DR': 'Congo DR',
  'Ivory Coast': "Côte d'Ivoire", "Côte d'Ivoire": "Côte d'Ivoire", "Cote d'Ivoire": "Côte d'Ivoire",
  'Bosnia and Herzegovina': 'Bosnia & Herz.', 'Bosnia-Herzegovina': 'Bosnia & Herz.',
  'Cape Verde': 'Cabo Verde', 'Cabo Verde': 'Cabo Verde',
  'United States': 'USA', 'United States of America': 'USA', 'USA': 'USA',
  'South Korea': 'South Korea', 'Korea Republic': 'South Korea',
};
const norm = n => ALIAS[n] || n;

/* Map the API stage strings to a depth. The pool scores nothing extra
 * for the round of 16, so LAST_32 and LAST_16 share the "qualified" tier. */
const STAGE_RANK = { GROUP_STAGE:0, LAST_32:1, LAST_16:1, QUARTER_FINALS:2, SEMI_FINALS:3, THIRD_PLACE:3, FINAL:4 };
function reachedKey(rank, wonFinal) {
  if (wonFinal) return 'W';
  if (rank >= 4) return 'F';
  if (rank >= 3) return 'SF';
  if (rank >= 2) return 'QF';
  if (rank >= 1) return 'R32';
  return 'group';
}

(async () => {
  const url = `https://api.football-data.org/v4/competitions/${COMP}/matches`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': TOKEN } });
  if (!res.ok) { console.error('API error', res.status, await res.text()); process.exit(1); }
  const data = await res.json();
  const matches = (data.matches || []).filter(m => m.status === 'FINISHED');

  const teams = {};                                   // name -> { g:[], rank, wonFinal }
  const ensure = n => (teams[n] || (teams[n] = { g: [], rank: 0, wonFinal: false }));
  const groupRows = [];                               // collected then ordered by matchday

  for (const m of matches) {
    const home = norm(m.homeTeam?.name || m.homeTeam?.shortName || '');
    const away = norm(m.awayTeam?.name || m.awayTeam?.shortName || '');
    if (!home || !away) continue;
    const stage  = m.stage || 'GROUP_STAGE';
    const winner = m.score?.winner;                   // HOME_TEAM | AWAY_TEAM | DRAW

    if (stage === 'GROUP_STAGE') {
      let hr, ar;
      if (winner === 'DRAW')           { hr = 'D'; ar = 'D'; }
      else if (winner === 'HOME_TEAM') { hr = 'W'; ar = 'L'; }
      else if (winner === 'AWAY_TEAM') { hr = 'L'; ar = 'W'; }
      else continue;
      groupRows.push({ team: home, md: m.matchday || 0, date: m.utcDate || '', res: hr });
      groupRows.push({ team: away, md: m.matchday || 0, date: m.utcDate || '', res: ar });
    } else {
      const rank = STAGE_RANK[stage] ?? 0;            // both teams reached this stage
      ensure(home).rank = Math.max(ensure(home).rank, rank);
      ensure(away).rank = Math.max(ensure(away).rank, rank);
      if (stage === 'FINAL') {
        if (winner === 'HOME_TEAM') ensure(home).wonFinal = true;
        if (winner === 'AWAY_TEAM') ensure(away).wonFinal = true;
      }
    }
  }

  groupRows.sort((a, b) => (a.md - b.md) || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const r of groupRows) ensure(r.team).g.push(r.res);

  const out = { updated: new Date().toISOString(), teams: {} };
  for (const [name, t] of Object.entries(teams)) {
    out.teams[name] = { g: t.g, reached: reachedKey(t.rank, t.wonFinal) };
  }

  fs.writeFileSync('results.json', JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote results.json: ${Object.keys(out.teams).length} teams, ${matches.length} finished matches.`);
})().catch(e => { console.error(e); process.exit(1); });
