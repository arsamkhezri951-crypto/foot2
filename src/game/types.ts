export type Team = 0 | 1; // 0 = BLUE (attacks right), 1 = WHITE/PINK (attacks left)
export type GamePhase =
  | 'demo'
  | 'kickoff'
  | 'play'
  | 'goal'
  | 'paused'
  | 'fulltime';

/* ---------------- pitch geometry (world units; pitch TL = 0,0) ------------- */
export const PITCH_W = 1560; // big, spacious, real-ratio pitch
export const PITCH_H = 1000;
export const CY = PITCH_H / 2;
export const GOAL_HALF = 140; // half of the goal mouth (generous arcade goals)
export const GOAL_H = 96; // crossbar height (3D)
export const NET_DEPTH = 68; // how deep the net extends behind the line (3D)
export const MARGIN = 235; // grass apron around the pitch
export const WORLD_W = PITCH_W + MARGIN * 2;
export const WORLD_H = PITCH_H + MARGIN * 2;

export const MATCH_LEN = 180; // seconds — quick arcade match

/* ---------------- entities ---------------- */
export interface PlayerT {
  id: number;
  team: Team;
  gk: boolean;
  num: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: number; // facing angle
  baseSpeed: number;
  runPhase: number;
  kickT: number;
  kickKind: number; // 1 shoot, 2 pass, 3 cross
  dashT: number; // dribble burst remaining
  dashCool: number; // dribble cooldown remaining
  tackleCool: number;
  aiT: number;
  tx: number;
  ty: number;
  celebrateT: number;
  lungeT: number;
  hasBallGlow: number;
  shotFaced: boolean; // GK: already decided on the current shot
  skin: string;
  hair: string;
}

export interface BallT {
  x: number;
  y: number;
  z: number; // height above grass
  vx: number;
  vy: number;
  vz: number;
  spin: number;
  owner: PlayerT | null;
  freeT: number; // time before anyone may pick it up
  lastKicker: PlayerT | null;
}

export interface ParticleT {
  kind: 'dust' | 'confetti' | 'spark';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rot: number;
  vrot: number;
}

export interface TrailDot {
  x: number;
  y: number;
  z: number;
  life: number;
}

export interface StatsT {
  shots: number;
  passes: number;
  goalsBlue: number;
  goalsWhite: number;
  saves: number;
}

export interface InputState {
  mx: number;
  my: number;
  shoot: boolean;
}

export interface CameraT {
  x: number; // smoothed focus point (world)
  y: number;
  zoom: number; // smoothed zoom factor
}

/* ---------------- view the renderer reads ---------------- */
export interface GameView {
  players: PlayerT[];
  ball: BallT;
  particles: ParticleT[];
  trail: TrailDot[];
  activeId: number;
  chargeFrac: number;
  crossMark: { x: number; y: number; t: number } | null;
  netRipple: { side: -1 | 1; amt: number; y: number };
  tGlobal: number;
  phase: GamePhase;
  demo: boolean;
  cam: CameraT;
}

/* ---------------- helpers ---------------- */
export const clamp = (v: number, a: number, b: number) =>
  v < a ? a : v > b ? b : v;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const dist = (x1: number, y1: number, x2: number, y2: number) =>
  Math.hypot(x2 - x1, y2 - y1);
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
