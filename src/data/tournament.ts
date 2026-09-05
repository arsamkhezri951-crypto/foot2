/* ============================================================
   Knockout Cup mode — Quarter Finals → Semi Finals → Final.
   The user's own tie is ALWAYS played on the real match engine;
   all other ties are simulated. Draws in the user's tie are
   decided by a simulated penalty shoot-out.
   ============================================================ */

import { CLUBS, clubById, type Club } from './clubs';

const CUP_KEY = 'magic-football:cup';

export interface Tie {
  a: number;
  b: number;
  sa?: number; // score a (filled when played)
  sb?: number;
  winner?: number;
  pens?: string; // e.g. "5–4"
  userTie?: boolean;
}

export interface CupState {
  clubId: number;
  stage: number; // 0 = QF, 1 = SF, 2 = F, 3 = finished
  rounds: Tie[][]; // [QF(4), SF(2), F(1)]
  champion?: number;
}

export const STAGE_NAMES = ['QF', 'SF', 'F'] as const;

/* ---------------- helpers ---------------- */

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clampI = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

function simulateScore(a: Club, b: Club): [number, number] {
  const ea = 1.15 + (a.atk - b.def) / 26 + (a.ovr - b.ovr) / 38;
  const eb = 1.15 + (b.atk - a.def) / 26 + (b.ovr - a.ovr) / 38;
  let sa = clampI(Math.round(ea + rand(-1.1, 1.1)), 0, 5);
  let sb = clampI(Math.round(eb + rand(-1.1, 1.1)), 0, 5);
  if (sa === sb) (Math.random() < 0.5 ? sa++ : sb++); // cups need a winner
  return [sa, sb];
}

function simulateTie(t: Tie): Tie {
  const [sa, sb] = simulateScore(clubById(t.a), clubById(t.b));
  return {
    ...t,
    sa,
    sb,
    winner: sa > sb ? t.a : t.b,
  };
}

/** simulated penalty shoot-out for a drawn user tie */
function shootOut(t: Tie, userFirst: boolean): Tie {
  const a = clubById(t.a);
  const b = clubById(t.b);
  const pa = 0.5 + (a.ovr - b.ovr) / 60;
  const userWins =
    Math.random() < (userFirst ? pa : 1 - pa);
  const high = 4 + Math.floor(Math.random() * 3); // 4..6
  const low = high - 1 - Math.floor(Math.random() * 2); // 2..high-1
  const [wa, wb] = userFirst
    ? userWins
      ? [high, low]
      : [low, high]
    : userWins
      ? [low, high]
      : [high, low];
  return {
    ...t,
    winner: userWins ? (userFirst ? t.a : t.b) : userFirst ? t.b : t.a,
    pens: `${wa}–${wb}`,
    userTie: true,
  };
}

/* ---------------- draw & lifecycle ---------------- */

export function startCup(clubId: number): CupState {
  // shuffled draw, user always placed in the first tie
  const others = CLUBS.map((c) => c.id)
    .filter((id) => id !== clubId)
    .sort(() => Math.random() - 0.5);
  const qf: Tie[] = [{ a: clubId, b: others[0], userTie: true }];
  for (let i = 1; i < others.length; i += 2)
    qf.push({ a: others[i], b: others[i + 1] });
  return { clubId, stage: 0, rounds: [qf, [], []] };
}

/**
 * Record the user's REAL engine result for the current stage,
 * decide draws on penalties, simulate the remaining ties and
 * build the next round.
 */
export function completeCupStage(
  st: CupState,
  userGoals: number,
  oppGoals: number
): CupState {
  const rounds = st.rounds.map((r) => r.map((t) => ({ ...t })));
  const ties = rounds[st.stage];

  // find & resolve the user's tie
  const idx = ties.findIndex((t) => t.userTie);
  const t = ties[idx];
  const userIsA = t.a === st.clubId;
  const sa = userIsA ? userGoals : oppGoals;
  const sb = userIsA ? oppGoals : userGoals;
  ties[idx] =
    sa === sb
      ? shootOut({ ...t, sa, sb }, userIsA)
      : { ...t, sa, sb, winner: sa > sb ? t.a : t.b, userTie: true };

  // simulate the rest of this round
  for (let i = 0; i < ties.length; i++)
    if (i !== idx && ties[i].winner === undefined) ties[i] = simulateTie(ties[i]);

  const winners = ties.map((x) => x.winner!);
  const next: CupState = { ...st, rounds };

  if (st.stage < 2) {
    const nextTies: Tie[] = [];
    for (let i = 0; i < winners.length; i += 2)
      nextTies.push({
        a: winners[i],
        b: winners[i + 1],
        userTie: winners[i] === st.clubId || winners[i + 1] === st.clubId,
      });
    rounds[st.stage + 1] = nextTies;
    next.stage = st.stage + 1;
  } else {
    next.stage = 3;
    next.champion = winners[0];
  }
  return next;
}

export const userOut = (st: CupState) =>
  st.stage === 3 && st.champion !== st.clubId;

export const cupFinished = (st: CupState) => st.stage === 3;

/** opponent of the user in the current stage (if still in the cup) */
export function currentOpponent(st: CupState): number | null {
  if (cupFinished(st)) return null;
  const tie = st.rounds[st.stage].find((t) => t.userTie);
  if (!tie) return null;
  return tie.a === st.clubId ? tie.b : tie.a;
}

/* ---------------- persistence ---------------- */

export function loadCup(): CupState | null {
  try {
    const s = localStorage.getItem(CUP_KEY);
    if (!s) return null;
    const p = JSON.parse(s) as CupState;
    if (
      typeof p?.clubId !== 'number' ||
      typeof p?.stage !== 'number' ||
      !Array.isArray(p?.rounds) ||
      p.rounds.length !== 3
    )
      return null;
    return p;
  } catch {
    return null;
  }
}

export function saveCup(st: CupState) {
  try {
    localStorage.setItem(CUP_KEY, JSON.stringify(st));
  } catch {
    /* non-fatal */
  }
}

export function clearCup() {
  try {
    localStorage.removeItem(CUP_KEY);
  } catch {
    /* non-fatal */
  }
}
