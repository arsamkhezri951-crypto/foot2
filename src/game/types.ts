// ---- World geometry (world units) ----
export const PITCH_W = 1050;
export const PITCH_H = 680;
export const MARGIN = 240; // stands / atmosphere around the pitch
export const WORLD_W = PITCH_W + MARGIN * 2;
export const WORLD_H = PITCH_H + MARGIN * 2;

export const GOAL_HALF = 74; // half width of the goal mouth
export const GOAL_DEPTH = 46; // net depth behind the line
export const GOAL_H = 96; // crossbar height (for z checks)
export const CY = PITCH_H / 2; // 340

export const MATCH_LEN = 180; // seconds

export type Team = 0 | 1; // 0 = blue (player), 1 = white/pink (AI)

export type GamePhase =
  | 'demo'
  | 'kickoff'
  | 'play'
  | 'goal'
  | 'fulltime'
  | 'paused';

export interface PlayerT {
  id: number;
  team: Team;
  gk: boolean;
  num: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: number; // facing angle (rad)
  baseSpeed: number;
  runPhase: number; // leg cycle
  kickT: number; // kick anim countdown
  kickKind: number; // 0 normal, 1 shoot, 2 pass, 3 cross
  dashT: number; // dribble burst
  dashCool: number;
  tackleCool: number;
  aiT: number; // AI re-decision timer
  tx: number; // AI target
  ty: number;
  celebrateT: number;
  skin: string;
  hair: string;
  lungeT: number; // failed tackle lunge anim
  hasBallGlow: number;
}

export interface BallT {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spin: number;
  owner: PlayerT | null;
  freeT: number; // possession lockout after a kick
  lastKicker: PlayerT | null;
}

export type ParticleKind = 'dust' | 'confetti' | 'spark' | 'grass';

export interface ParticleT {
  kind: ParticleKind;
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

export interface InputState {
  mx: number; // -1..1 joystick / keys
  my: number;
  shoot: boolean; // held
}

export interface CameraT {
  x: number;
  y: number;
  zoom: number; // multiplier over base scale
  tZoom: number;
  shake: number;
}

export interface StatsT {
  shots: number;
  passes: number;
  goalsBlue: number;
  goalsWhite: number;
  saves: number;
}

export interface GameView {
  phase: GamePhase;
  players: PlayerT[];
  ball: BallT;
  particles: ParticleT[];
  trail: TrailDot[];
  cam: CameraT;
  score: [number, number];
  timeLeft: number;
  activeId: number;
  chargeFrac: number; // 0..1 shoot charge
  crossMark: { x: number; y: number; t: number } | null;
  netRipple: { side: number; amt: number; y: number };
  goalT: number;
  goalTeam: Team | null;
  demo: boolean;
  stats: StatsT;
  tGlobal: number;
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const clamp = (v: number, a: number, b: number) =>
  v < a ? a : v > b ? b : v;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const dist = (ax: number, ay: number, bx: number, by: number) =>
  Math.hypot(ax - bx, ay - by);
