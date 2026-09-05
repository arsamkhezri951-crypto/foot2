/* ============================================================
   Career / Season mode — 8 clubs, single round-robin (7 matchdays).
   The user's own match is ALWAYS played on the real match engine;
   only the other three fixtures per matchday are simulated.
   ============================================================ */

import { CLUBS, clubById, type Club } from './clubs';

const CAREER_KEY = 'magic-football:career';

export interface TableRow {
  clubId: number;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
}

export interface FixtureResult {
  home: number;
  away: number;
  gh: number;
  ga: number;
  userMatch?: boolean;
}

export interface CareerState {
  clubId: number;
  matchday: number; // 1..7 (8 = season over)
  table: TableRow[];
  rounds: FixtureResult[][]; // results per completed matchday
}

export const MATCHDAYS = CLUBS.length - 1; // 7

/* ---------------- round-robin fixtures (circle method) ---------------- */

function allFixtures(): [number, number][][] {
  const ids = CLUBS.map((c) => c.id);
  const rounds: [number, number][][] = [];
  const rest = ids.slice(1);
  for (let r = 0; r < MATCHDAYS; r++) {
    const arr = [ids[0], ...rest];
    const pairs: [number, number][] = [];
    for (let i = 0; i < ids.length / 2; i++) {
      const a = arr[i];
      const b = arr[ids.length - 1 - i];
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    rest.unshift(rest.pop()!); // rotate
  }
  return rounds;
}

const FIXTURES = allFixtures();

export const matchdayFixtures = (matchday: number): [number, number][] =>
  FIXTURES[matchday - 1] ?? [];

export const userFixture = (
  st: CareerState
): { home: number; away: number; opponent: number } => {
  const pair = matchdayFixtures(st.matchday).find(
    ([a, b]) => a === st.clubId || b === st.clubId
  ) ?? [st.clubId, 0];
  const opponent = pair[0] === st.clubId ? pair[1] : pair[0];
  return { home: pair[0], away: pair[1], opponent };
};

/* ---------------- simple score simulation (rating-weighted) ---------------- */

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clampI = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

export function simulateScore(a: Club, b: Club): [number, number] {
  const ea = 1.2 + (a.atk - b.def) / 24 + (a.ovr - b.ovr) / 40;
  const eb = 1.2 + (b.atk - a.def) / 24 + (b.ovr - a.ovr) / 40;
  return [
    clampI(Math.round(ea + rand(-1.15, 1.15)), 0, 6),
    clampI(Math.round(eb + rand(-1.15, 1.15)), 0, 6),
  ];
}

/* ---------------- table helpers ---------------- */

function blankTable(): TableRow[] {
  return CLUBS.map((c) => ({
    clubId: c.id,
    p: 0,
    w: 0,
    d: 0,
    l: 0,
    gf: 0,
    ga: 0,
  }));
}

export const points = (r: TableRow) => r.w * 3 + r.d;
export const goalDiff = (r: TableRow) => r.gf - r.ga;

export function standings(table: TableRow[]): TableRow[] {
  return [...table].sort(
    (a, b) =>
      points(b) - points(a) ||
      goalDiff(b) - goalDiff(a) ||
      b.gf - a.gf ||
      a.clubId - b.clubId
  );
}

function applyResult(table: TableRow[], home: number, away: number, gh: number, ga: number) {
  const h = table.find((r) => r.clubId === home)!;
  const a = table.find((r) => r.clubId === away)!;
  h.p++;
  a.p++;
  h.gf += gh;
  h.ga += ga;
  a.gf += ga;
  a.ga += gh;
  if (gh > ga) {
    h.w++;
    a.l++;
  } else if (gh < ga) {
    a.w++;
    h.l++;
  } else {
    h.d++;
    a.d++;
  }
}

/* ---------------- state lifecycle ---------------- */

export function startCareer(clubId: number): CareerState {
  return { clubId, matchday: 1, table: blankTable(), rounds: [] };
}

/**
 * Record the user's REAL engine result, simulate the other three
 * fixtures of the matchday, update the table and advance.
 */
export function completeMatchday(
  st: CareerState,
  userGoals: number,
  oppGoals: number
): CareerState {
  const fx = matchdayFixtures(st.matchday);
  const table = st.table.map((r) => ({ ...r }));
  const results: FixtureResult[] = [];

  for (const [h, a] of fx) {
    let gh: number, ga: number;
    const isUser = h === st.clubId || a === st.clubId;
    if (isUser) {
      gh = h === st.clubId ? userGoals : oppGoals;
      ga = h === st.clubId ? oppGoals : userGoals;
    } else {
      [gh, ga] = simulateScore(clubById(h), clubById(a));
    }
    applyResult(table, h, a, gh, ga);
    results.push({ home: h, away: a, gh, ga, userMatch: isUser });
  }

  return {
    clubId: st.clubId,
    matchday: st.matchday + 1,
    table,
    rounds: [...st.rounds, results],
  };
}

export const seasonOver = (st: CareerState) => st.matchday > MATCHDAYS;

/* ---------------- persistence ---------------- */

export function loadCareer(): CareerState | null {
  try {
    const s = localStorage.getItem(CAREER_KEY);
    if (!s) return null;
    const p = JSON.parse(s) as CareerState;
    if (
      typeof p?.clubId !== 'number' ||
      typeof p?.matchday !== 'number' ||
      !Array.isArray(p?.table) ||
      p.table.length !== CLUBS.length
    )
      return null;
    return p;
  } catch {
    return null;
  }
}

export function saveCareer(st: CareerState) {
  try {
    localStorage.setItem(CAREER_KEY, JSON.stringify(st));
  } catch {
    /* storage full/unavailable — non-fatal */
  }
}

export function clearCareer() {
  try {
    localStorage.removeItem(CAREER_KEY);
  } catch {
    /* non-fatal */
  }
}
