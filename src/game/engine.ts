import { sfx } from './audio';
import { renderFrame } from './render';
import {
  PITCH_W,
  PITCH_H,
  GOAL_HALF,
  CY,
  MATCH_LEN,
  NET_DEPTH,
  clamp,
  lerp,
  dist,
  rand,
  type BallT,
  type CameraT,
  type GamePhase,
  type GameView,
  type InputState,
  type ParticleT,
  type PlayerT,
  type StatsT,
  type Team,
  type TrailDot,
} from './types';

export interface Callbacks {
  onHud: (score: [number, number], timeStr: string) => void;
  onGoal: (team: Team) => void;
  onFullTime: (r: {
    score: [number, number];
    stats: StatsT;
    win: 'win' | 'draw' | 'loss';
  }) => void;
  onPhase: (phase: GamePhase) => void;
}

const GRAV = 2000;
const SKINS = ['#e8b98d', '#c98e5f', '#8d5a3b', '#f0c9a0'];
const HAIRS = ['#241a12', '#11141b', '#5a3a1e', '#7a4a22', '#d8b25a'];

const fmt = (t: number) => {
  const s = Math.max(0, Math.ceil(t));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const angLerp = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * clamp(t, 0, 1);
};

export class Game implements GameView {
  phase: GamePhase = 'demo';
  players: PlayerT[] = [];
  ball: BallT = {
    x: PITCH_W / 2, y: CY, z: 0, vx: 0, vy: 0, vz: 0, spin: 0,
    owner: null, freeT: 0, lastKicker: null,
  };
  particles: ParticleT[] = [];
  trail: TrailDot[] = [];
  cam: CameraT = { x: PITCH_W / 2, y: CY, zoom: 1 };
  score: [number, number] = [0, 0];
  timeLeft = MATCH_LEN;
  activeId = 0;
  chargeFrac = 0;
  crossMark: { x: number; y: number; t: number } | null = null;
  netRipple: { side: -1 | 1; amt: number; y: number } = { side: 1, amt: 0, y: CY };
  goalT = 0;
  goalTeam: Team | null = null;
  demo = true;
  stats: StatsT = { shots: 0, passes: 0, goalsBlue: 0, goalsWhite: 0, saves: 0 };
  tGlobal = 0;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: Callbacks;
  private raf = 0;
  private last = 0;
  private vw = 800;
  private vh = 450;
  private dpr = 1;
  private input: InputState = { mx: 0, my: 0, shoot: false };
  private keys = new Set<string>();
  private chargeT = 0;
  private switchT = 0;
  private kickT = 0;
  private prePause: GamePhase = 'play';
  private lastSentTime = -1;
  private hudAcc = 0;

  constructor(canvas: HTMLCanvasElement, cb: Callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.cb = cb;
    this.buildPlayers();
    this.resetPositions();
    this.onResize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('visibilitychange', this.onVis);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('visibilitychange', this.onVis);
    sfx.ambientStop();
  }

  /* ---------------- public API ---------------- */

  startMatch() {
    this.demo = false;
    this.score = [0, 0];
    this.stats = { shots: 0, passes: 0, goalsBlue: 0, goalsWhite: 0, saves: 0 };
    this.timeLeft = MATCH_LEN;
    this.lastSentTime = -1;
    this.particles = [];
    this.trail = [];
    this.resetPositions();
    this.phase = 'kickoff';
    this.kickT = 1.1;
    this.cb.onPhase('kickoff');
    this.emitHud(true);
    sfx.ambientStart();
  }

  backToMenu() {
    this.demo = true;
    this.score = [0, 0];
    this.particles = [];
    this.resetPositions();
    this.phase = 'demo';
    sfx.ambientStop();
    this.cb.onPhase('demo');
  }

  pauseToggle() {
    if (this.phase === 'paused') {
      this.phase = this.prePause;
      this.cb.onPhase(this.phase);
    } else if (this.phase === 'play' || this.phase === 'kickoff') {
      this.prePause = this.phase;
      this.phase = 'paused';
      this.cb.onPhase('paused');
    }
  }

  setMove(x: number, y: number) {
    this.input.mx = clamp(x, -1, 1);
    this.input.my = clamp(y, -1, 1);
  }
  pressShoot() {
    this.input.shoot = true;
  }
  releaseShoot() {
    if (this.input.shoot) this.fireShot();
    this.input.shoot = false;
    this.chargeT = 0;
    this.chargeFrac = 0;
  }
  pass() {
    this.doPass();
  }
  cross() {
    this.doCross();
  }
  dribble() {
    this.doDribble();
  }

  /* ---------------- setup ---------------- */

  private buildPlayers() {
    const mk = (
      id: number, team: Team, gk: boolean, num: number, x: number, y: number
    ): PlayerT => ({
      id, team, gk, num, x, y, vx: 0, vy: 0,
      dir: team === 0 ? 0 : Math.PI,
      baseSpeed: gk ? 290 : team === 0 ? 400 : 315,
      runPhase: rand(0, 6), kickT: 0, kickKind: 0, dashT: 0, dashCool: 0,
      tackleCool: 0, aiT: rand(0.1, 0.5), tx: x, ty: y,
      celebrateT: 0, lungeT: 0, hasBallGlow: 0, shotFaced: false,
      skin: SKINS[id % SKINS.length], hair: HAIRS[(id * 2 + 1) % HAIRS.length],
    });
    this.players = [
      mk(0, 0, false, 10, 500, CY - 140),
      mk(1, 0, false, 7, 420, CY + 240),
      mk(2, 1, false, 9, PITCH_W - 500, CY + 140),
      mk(3, 1, false, 11, PITCH_W - 420, CY - 240),
      mk(4, 1, true, 1, PITCH_W - 72, CY),
      mk(5, 0, true, 12, 72, CY),
    ];
  }

  private resetPositions() {
    const spots: [number, number][] = [
      [PITCH_W / 2 - 100, CY - 55],
      [PITCH_W / 2 - 400, CY + 260],
      [PITCH_W / 2 + 100, CY + 55],
      [PITCH_W / 2 + 400, CY - 260],
      [PITCH_W - 72, CY],
      [72, CY],
    ];
    this.players.forEach((p, i) => {
      const [sx, sy] = spots[i];
      p.x = sx; p.y = sy; p.vx = 0; p.vy = 0;
      p.tx = sx; p.ty = sy;
      p.dir = p.team === 0 ? 0 : Math.PI;
      p.kickT = 0; p.lungeT = 0; p.celebrateT = 0;
      p.dashT = 0; p.dashCool = 0;
      p.tackleCool = 0; p.aiT = rand(0.1, 0.4); p.shotFaced = false;
    });
    const b = this.ball;
    b.x = PITCH_W / 2; b.y = CY; b.z = 0;
    b.vx = 0; b.vy = 0; b.vz = 0;
    b.owner = null; b.freeT = 0.9; b.lastKicker = null;
    this.activeId = 0;
    this.trail = [];
  }

  /* ---------------- input ---------------- */

  private onResize = () => {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.canvas.width = Math.round(this.vw * this.dpr);
    this.canvas.height = Math.round(this.vh * this.dpr);
    this.canvas.style.width = `${this.vw}px`;
    this.canvas.style.height = `${this.vh}px`;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
      e.preventDefault();
    this.keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Space') this.pressShoot();
    if (e.code === 'KeyX' || e.code === 'KeyK') this.doPass();
    if (e.code === 'KeyC' || e.code === 'KeyL') this.doCross();
    if (e.code === 'KeyV' || e.code === 'ShiftLeft' || e.code === 'ShiftRight')
      this.doDribble();
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (!this.demo) this.pauseToggle();
    }
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    if (e.code === 'Space') this.releaseShoot();
  };
  private onVis = () => {
    if (document.hidden && (this.phase === 'play' || this.phase === 'kickoff'))
      this.pauseToggle();
  };

  private keyMove(): [number, number] {
    let x = 0, y = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) x -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) x += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) y -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) y += 1;
    const l = Math.hypot(x, y);
    return l > 0 ? [x / l, y / l] : [0, 0];
  }

  /* ---------------- actions ---------------- */

  private active(): PlayerT {
    return this.players[this.activeId];
  }

  private canReach(p: PlayerT, r = 74): boolean {
    return this.ball.owner === p || dist(p.x, p.y, this.ball.x, this.ball.y) < r;
  }

  private acquire(p: PlayerT) {
    const b = this.ball;
    if (b.owner && b.owner !== p && b.owner.team !== p.team) b.owner.hasBallGlow = 0;
    b.owner = p;
    b.freeT = 0;
    if (p.gk) p.aiT = rand(0.7, 1.05);
  }

  private kick(p: PlayerT, speed: number, angle: number, vz: number, kind: number) {
    const b = this.ball;
    if (b.owner && b.owner !== p) b.owner.hasBallGlow = 0;
    b.owner = null;
    b.lastKicker = p;
    b.freeT = 0.4;
    b.vx = Math.cos(angle) * speed;
    b.vy = Math.sin(angle) * speed;
    b.vz = vz;
    p.kickT = 0.32;
    p.kickKind = kind;
    this.spawnDust(b.x, b.y, 6, speed > 950 ? 2.2 : 1.2);
    sfx.kick(clamp(speed / 1400, 0.2, 1));
  }

  private fireShot() {
    if (this.phase !== 'play' && this.phase !== 'demo') return;
    const p = this.demo ? this.nearestToBall(0) : this.active();
    if (!this.canReach(p, 78)) return;
    const b = this.ball;
    const frac = clamp(this.chargeT / 0.85, 0, 1);
    const gx = PITCH_W, gy = CY;
    const err = rand(-1, 1) * (0.05 * (1 - frac) + 0.015);
    const angle = Math.atan2(gy - b.y, gx - b.x) + err;
    const d = dist(b.x, b.y, gx, gy);
    const speed = 880 + 540 * frac;
    const vz = (d < 480 ? 90 : 160) + 330 * frac;
    this.acquire(p);
    this.kick(p, speed, angle, vz, 1);
    if (p.team === 0) this.stats.shots++;
  }

  private doPass() {
    if (this.phase !== 'play' && this.phase !== 'demo') return;
    const p = this.demo ? this.nearestToBall(0) : this.active();
    if (!this.canReach(p)) return;
    const mate = this.players.find(
      (q) => q.team === p.team && !q.gk && q.id !== p.id
    )!;
    const tx = mate.x + mate.vx * 0.32 + 42 * (p.team === 0 ? 1 : -1);
    const ty = mate.y + mate.vy * 0.32;
    const angle = Math.atan2(ty - this.ball.y, tx - this.ball.x) + rand(-0.025, 0.025);
    this.acquire(p);
    this.kick(p, 750, angle, 26, 2);
    if (p.team === 0) this.stats.passes++;
    sfx.pass();
  }

  private doCross() {
    if (this.phase !== 'play' && this.phase !== 'demo') return;
    const p = this.demo ? this.nearestToBall(0) : this.active();
    if (!this.canReach(p)) return;
    const b = this.ball;
    const attackRight = p.team === 0;
    const mate = this.players.find(
      (q) => q.team === p.team && !q.gk && q.id !== p.id
    )!;
    const gx = attackRight ? PITCH_W - 280 : 280;
    const tx = gx + rand(-50, 50);
    const ty = clamp(mate.y + rand(-60, 60), CY - 150, CY + 150);
    const dx = tx - b.x, dy = ty - b.y;
    const hd = Math.max(1, Math.hypot(dx, dy));
    const t = clamp(hd / 720, 0.45, 1.1);
    const angle = Math.atan2(dy, dx);
    this.acquire(p);
    this.kick(p, hd / t, angle, 0.5 * GRAV * t + 60, 3);
    if (p.team === 0) this.stats.passes++;
    this.crossMark = { x: tx, y: ty, t: 0.9 };
    sfx.pass();
  }

  private doDribble() {
    if (this.phase !== 'play' && this.phase !== 'demo') return;
    const p = this.demo ? this.nearestToBall(0) : this.active();
    if (p.dashCool > 0) return;
    p.dashT = 0.34;
    p.dashCool = 1.05;
    this.spawnDust(p.x, p.y + 3, 9, 1.5);
    sfx.dash();
    if (this.ball.owner === p) this.ball.freeT = 0; // keep it glued
  }

  private nearestToBall(team: Team): PlayerT {
    let best = this.players[0];
    let bd = 1e9;
    for (const p of this.players) {
      if (p.team !== team || p.gk) continue;
      const d = dist(p.x, p.y, this.ball.x, this.ball.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  /* ---------------- particles ---------------- */

  private spawnDust(x: number, y: number, n: number, s: number) {
    for (let i = 0; i < n; i++)
      this.particles.push({
        kind: 'dust', x: x + rand(-8, 8), y: y + rand(-5, 5), z: rand(0, 8),
        vx: rand(-60, 60) * s, vy: rand(-50, 50) * s, vz: rand(30, 100),
        life: rand(0.3, 0.55), maxLife: 0.55, size: rand(3.5, 7),
        color: '#cdb894', rot: 0, vrot: 0,
      });
  }

  private spawnConfetti(x: number, y: number, n: number) {
    const cols = ['#4da3ff', '#ffffff', '#ff5fa2', '#ffd23f', '#7dffb0'];
    for (let i = 0; i < n; i++)
      this.particles.push({
        kind: 'confetti', x: x + rand(-50, 50), y: y + rand(-90, 90), z: rand(20, 120),
        vx: rand(-320, 320), vy: rand(-240, 240), vz: rand(260, 640),
        life: rand(0.9, 1.7), maxLife: 1.7, size: rand(6, 11),
        color: cols[i % cols.length], rot: rand(0, 6), vrot: rand(-9, 9),
      });
  }

  private spawnSparks(x: number, y: number, z: number) {
    for (let i = 0; i < 8; i++)
      this.particles.push({
        kind: 'spark', x, y, z: z + rand(0, 14),
        vx: rand(-260, 260), vy: rand(-200, 200), vz: rand(90, 360),
        life: rand(0.2, 0.4), maxLife: 0.4, size: rand(2, 4),
        color: '#ffe9a8', rot: 0, vrot: 0,
      });
  }

  /* ---------------- scoring / flow ---------------- */

  private scored(team: Team) {
    if (this.phase === 'goal') return;
    this.score[team]++;
    if (team === 0) this.stats.goalsBlue++;
    else this.stats.goalsWhite++;
    this.phase = 'goal';
    this.goalTeam = team;
    this.goalT = this.demo ? 1.5 : 2.6;
    this.netRipple = { side: team === 0 ? 1 : -1, amt: 1, y: this.ball.y };
    const gx = team === 0 ? PITCH_W : 0;
    this.spawnConfetti(gx, this.ball.y, this.demo ? 26 : 60);
    for (const p of this.players) if (p.team === team) p.celebrateT = 2.3;
    sfx.goalRoar();
    sfx.whistle();
    this.ball.vx *= 0.15;
    this.ball.vy *= 0.15;
    this.ball.vz = 0;
    this.emitHud();
    if (!this.demo) this.cb.onGoal(team);
  }

  private emitHud(force = false) {
    const t = Math.ceil(this.timeLeft);
    if (force || t !== this.lastSentTime) {
      this.lastSentTime = t;
      this.cb.onHud([this.score[0], this.score[1]], fmt(this.timeLeft));
    }
  }

  /* ---------------- main loop ---------------- */

  private tick = (ts: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = clamp((ts - this.last) / 1000, 0.001, 1 / 30);
    this.last = ts;
    if (this.phase !== 'paused') this.update(dt);
    renderFrame(this.ctx, this, this.vw, this.vh, this.dpr);
  };

  private update(dt: number) {
    this.tGlobal += dt;
    this.hudAcc += dt;

    this.netRipple.amt = Math.max(0, this.netRipple.amt - dt * 0.55);
    if (this.crossMark) {
      this.crossMark.t -= dt;
      if (this.crossMark.t <= 0) this.crossMark = null;
    }
    for (const p of this.players) {
      p.kickT = Math.max(0, p.kickT - dt);
      p.dashT = Math.max(0, p.dashT - dt);
      p.dashCool = Math.max(0, p.dashCool - dt);
      p.tackleCool = Math.max(0, p.tackleCool - dt);
      p.lungeT = Math.max(0, p.lungeT - dt);
      p.celebrateT = Math.max(0, p.celebrateT - dt);
      const glowTarget = this.ball.owner === p ? 1 : 0;
      p.hasBallGlow += (glowTarget - p.hasBallGlow) * Math.min(1, dt * 8);
    }

    switch (this.phase) {
      case 'demo':
      case 'play':
        this.sim(dt);
        if (this.phase === 'play') {
          this.timeLeft -= dt;
          if (this.hudAcc > 0.25) {
            this.hudAcc = 0;
            this.emitHud();
          }
          if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.phase = 'fulltime';
            this.emitHud(true);
            sfx.whistle(true);
            sfx.ambientStop();
            if (this.score[0] > this.score[1])
              this.spawnConfetti(PITCH_W / 2, CY, 80);
            this.cb.onPhase('fulltime');
            this.cb.onFullTime({
              score: [this.score[0], this.score[1]],
              stats: { ...this.stats },
              win:
                this.score[0] > this.score[1]
                  ? 'win'
                  : this.score[0] < this.score[1]
                    ? 'loss'
                    : 'draw',
            });
          }
        }
        break;
      case 'kickoff':
        this.kickT -= dt;
        for (const p of this.players) {
          p.x += (p.tx - p.x) * Math.min(1, dt * 6);
          p.y += (p.ty - p.y) * Math.min(1, dt * 6);
          p.vx = 0; p.vy = 0;
        }
        this.updateCamera(dt);
        if (this.kickT <= 0) {
          this.phase = this.demo ? 'demo' : 'play';
          this.ball.freeT = 0.15;
          sfx.whistle();
          if (!this.demo) this.cb.onPhase('play');
        }
        break;
      case 'goal':
        this.goalT -= dt;
        this.ball.vx *= Math.pow(0.03, dt);
        this.ball.vy *= Math.pow(0.03, dt);
        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;
        this.updateParticles(dt);
        this.updateCamera(dt);
        if (this.goalT <= 0) {
          this.resetPositions();
          this.phase = 'kickoff';
          this.kickT = this.demo ? 0.8 : 1.0;
          if (!this.demo) this.cb.onPhase('kickoff');
        }
        return;
      case 'fulltime':
        for (const p of this.players) {
          p.vx *= 0.9; p.vy *= 0.9;
          if (this.score[0] >= this.score[1] && p.team === 0) p.celebrateT = 1;
        }
        this.updateParticles(dt);
        this.updateCamera(dt);
        return;
      default:
        break;
    }

    this.updateParticles(dt);
    this.updateCamera(dt);
  }

  /* ---------------- simulation ---------------- */

  private sim(dt: number) {
    const b = this.ball;
    b.freeT = Math.max(0, b.freeT - dt);

    // shot charge tracking
    if (!this.demo) {
      const a = this.active();
      if (this.input.shoot && this.canReach(a, 78)) {
        this.chargeT = Math.min(0.95, this.chargeT + dt);
        this.chargeFrac = clamp(this.chargeT / 0.85, 0, 1);
      } else {
        this.chargeT = 0;
        this.chargeFrac = 0;
      }
      this.switchT -= dt;
      if (this.switchT <= 0) this.autoSwitch();
    } else {
      this.chargeFrac = 0;
    }

    // movement
    if (!this.demo) {
      let [mx, my] = [this.input.mx, this.input.my];
      if (Math.hypot(mx, my) < 0.08) [mx, my] = this.keyMove();
      this.controlPlayer(this.active(), mx, my, dt);
    }
    for (const p of this.players) {
      if (p.gk) this.gkUpdate(p, dt);
      else if (this.demo || !(p.team === 0 && p.id === this.activeId))
        this.aiField(p, dt);
    }

    // integrate + soft separation
    for (const p of this.players) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gk) {
        p.x =
          p.team === 1
            ? clamp(p.x, PITCH_W - 310, PITCH_W + 10)
            : clamp(p.x, -10, 310);
        p.y = clamp(p.y, CY - 230, CY + 230);
      } else {
        p.x = clamp(p.x, -10, PITCH_W + 10);
        p.y = clamp(p.y, -10, PITCH_H + 10);
      }
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 25) {
        p.dir = angLerp(p.dir, Math.atan2(p.vy, p.vx), dt * 11);
        p.runPhase += sp * dt * 0.033;
      }
    }
    for (let i = 0; i < this.players.length; i++)
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i], c = this.players[j];
        const d = dist(a.x, a.y, c.x, c.y);
        if (d < 38 && d > 0.01) {
          const push = ((38 - d) / 2) * 0.6;
          const nx = (a.x - c.x) / d, ny = (a.y - c.y) / d;
          a.x += nx * push; a.y += ny * push;
          c.x -= nx * push; c.y -= ny * push;
        }
      }

    // ball: carried or free
    if (b.owner) {
      const p = b.owner;
      const lead = p.dashT > 0 ? 18 : 23;
      const wob = Math.sin(p.runPhase) * 3.6;
      const txp = p.x + Math.cos(p.dir) * lead + Math.cos(p.dir + Math.PI / 2) * wob * 0.4;
      const typ = p.y + Math.sin(p.dir) * lead * 0.8 + Math.sin(p.dir + Math.PI / 2) * wob * 0.4;
      const k = Math.min(1, dt * 20);
      b.x += (txp - b.x) * k;
      b.y += (typ - b.y) * k;
      b.z = Math.abs(Math.sin(p.runPhase)) * 2.4;
      b.vz = 0;
      b.vx = p.vx; b.vy = p.vy;
      b.spin += Math.hypot(p.vx, p.vy) * dt * 0.025;
    } else {
      // forgiving magnet toward the controlled player
      if (!this.demo && b.freeT <= 0) {
        const a = this.active();
        const d = dist(a.x, a.y, b.x, b.y);
        const bs = Math.hypot(b.vx, b.vy);
        if (d < 115 && d > 1 && bs < 600 && b.z < 34) {
          b.vx += ((a.x - b.x) / d) * 420 * dt * (1 - d / 115);
          b.vy += ((a.y - b.y) / d) * 420 * dt * (1 - d / 115);
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.vz -= GRAV * dt;
      if (b.z <= 0) {
        b.z = 0;
        if (b.vz < -110) {
          sfx.bounce(-b.vz);
          this.spawnDust(b.x, b.y, 3, 0.7);
          b.vz = -b.vz * 0.48;
        } else b.vz = 0;
      }
      const fr = Math.exp((b.z === 0 ? -2.0 : -0.25) * dt);
      b.vx *= fr; b.vy *= fr;
      const spd = Math.hypot(b.vx, b.vy);
      if (spd > 1500) {
        b.vx = (b.vx / spd) * 1500;
        b.vy = (b.vy / spd) * 1500;
      }
      b.spin += spd * dt * 0.02 * (b.vx >= 0 ? 1 : -1);
      if (spd > 680 && b.z < 110) this.trail.push({ x: b.x, y: b.y, z: b.z, life: 1 });
    }
    for (const tr of this.trail) tr.life -= dt * 2.6;
    this.trail = this.trail.filter((t) => t.life > 0);

    // pickup
    if (!b.owner && b.freeT <= 0 && b.z < 40) {
      const spd = Math.hypot(b.vx, b.vy);
      if (spd < 1000) {
        let best: PlayerT | null = null;
        let bd = 1e9;
        for (const p of this.players) {
          const r = p.gk ? 50 : p.team === 0 ? 55 : 45;
          const d = dist(p.x, p.y, b.x, b.y);
          if (d < r && d < bd) { bd = d; best = p; }
        }
        if (best) this.acquire(best);
      }
    }

    // shot blocks by bodies
    if (!b.owner && b.z < 80 && b.freeT <= 0.05) {
      const spd = Math.hypot(b.vx, b.vy);
      if (spd > 620) {
        for (const p of this.players) {
          if (p === b.lastKicker || p.gk) continue;
          if (dist(p.x, p.y, b.x, b.y) < 27 && p.tackleCool <= 0) {
            p.tackleCool = 0.8;
            if (Math.random() < (p.team === 0 ? 0.62 : 0.34)) {
              b.vx = -b.vx * 0.22 + rand(-200, 200);
              b.vy = -b.vy * 0.22 + rand(-220, 220);
              b.vz = rand(140, 260);
              b.freeT = 0.3;
              this.spawnDust(b.x, b.y, 5, 1.2);
              this.spawnSparks(b.x, b.y, 12);
              sfx.kick(0.3);
            }
            break;
          }
        }
      }
    }

    // tackles
    if (b.owner) {
      for (const p of this.players) {
        const o = b.owner!;
        if (p.team === o.team || p.gk || p.tackleCool > 0) continue;
        if (dist(p.x, p.y, o.x, o.y) < 40) {
          p.tackleCool = p.team === 0 ? 1.35 : 1.7;
          let prob = p.team === 0 ? 0.72 : 0.3;
          if (o.gk) prob *= 0.7;
          if (o.dashT > 0) prob *= 0.45; // dribbling protects the ball
          if (Math.random() < prob) {
            o.hasBallGlow = 0;
            o.lungeT = 0.3;
            this.acquire(p);
            this.spawnDust(b.x, b.y, 5, 1.1);
            sfx.kick(0.25);
          } else {
            p.lungeT = 0.3;
          }
        }
      }
    }

    this.ballBoundsAndGoal(dt);
  }

  private autoSwitch() {
    this.switchT = 0.12;
    const b = this.ball;
    if (b.owner && b.owner.team === 0 && !b.owner.gk) {
      this.activeId = b.owner.id;
      return;
    }
    const p0 = this.players[0], p1 = this.players[1];
    const d0 = dist(p0.x, p0.y, b.x, b.y);
    const d1 = dist(p1.x, p1.y, b.x, b.y);
    const cur = this.activeId === 0 ? d0 : d1;
    const other = this.activeId === 0 ? d1 : d0;
    if (other + 88 < cur) this.activeId = this.activeId === 0 ? 1 : 0;
  }

  private controlPlayer(p: PlayerT, mx: number, my: number, dt: number) {
    const l = Math.hypot(mx, my);
    const sp = p.baseSpeed * (p.dashT > 0 ? 1.55 : 1);
    if (l > 0.05) {
      const k = Math.min(1, dt * 9.5);
      p.vx += (mx * sp - p.vx) * k;
      p.vy += (my * sp - p.vy) * k;
    } else {
      const k = Math.min(1, dt * 11);
      p.vx -= p.vx * k;
      p.vy -= p.vy * k;
    }
  }

  /* ---------------- AI ---------------- */

  private aiField(p: PlayerT, dt: number) {
    const b = this.ball;
    const atkR = p.team === 0; // blue attacks right
    const goalX = atkR ? PITCH_W : 0;
    const ownX = atkR ? 0 : PITCH_W;
    const mates = this.players.filter(
      (q) => q.team === p.team && !q.gk && q.id !== p.id
    );
    const foes = this.players.filter((q) => q.team !== p.team && !q.gk);
    const aiList = this.demo
      ? this.players.filter((q) => q.team === p.team && !q.gk)
      : p.team === 1
        ? this.players.filter((q) => q.team === 1 && !q.gk)
        : [p];
    const chaser = aiList.reduce((a2, c) =>
      dist(c.x, c.y, b.x, b.y) < dist(a2.x, a2.y, b.x, b.y) ? c : a2
    );
    let speedF = 0.86;

    p.aiT -= dt;
    if (b.owner === p) {
      const goalD = Math.abs(goalX - b.x);
      let pressure = 1e9;
      for (const f of foes) pressure = Math.min(pressure, dist(f.x, f.y, p.x, p.y));
      if (p.aiT <= 0) {
        p.aiT = rand(0.32, 0.6);
        if (goalD < 540 && Math.random() < 0.5) {
          const err = rand(-0.14, 0.14) * (Math.random() < 0.3 ? 2.3 : 1);
          const angle =
            Math.atan2(CY - b.y + rand(-50, 50), goalX - b.x) + err;
          this.kick(p, rand(800, 1050), angle, rand(70, 280), 1);
          if (p.team === 0) this.stats.shots++;
        } else if (pressure < 150 && mates.length && Math.random() < 0.55) {
          const m = mates[0];
          const tx = m.x + m.vx * 0.3 + (atkR ? 38 : -38);
          const ty = m.y + m.vy * 0.3;
          this.kick(
            p, 700,
            Math.atan2(ty - b.y, tx - b.x) + rand(-0.045, 0.045),
            30, 2
          );
          if (p.team === 0) this.stats.passes++;
          sfx.pass();
        } else {
          p.tx = clamp(p.x + (atkR ? 1 : -1) * 260, 50, PITCH_W - 50);
          p.ty = clamp(CY + (p.y - CY) * 0.55 + rand(-130, 130), 70, PITCH_H - 70);
        }
      }
      speedF = 0.8;
    } else if (b.owner && b.owner.team === p.team) {
      if (p.aiT <= 0) {
        p.aiT = rand(0.4, 0.75);
        const off = p.id % 2 === 0 ? -240 : 240;
        p.tx = clamp(b.x + (atkR ? 1 : -1) * 300 + rand(-50, 50), 50, PITCH_W - 50);
        p.ty = clamp(b.y + off + rand(-60, 60), 90, PITCH_H - 90);
      }
    } else if (!b.owner) {
      if (p === chaser) {
        p.tx = b.x + b.vx * 0.14;
        p.ty = b.y + b.vy * 0.14;
        speedF = 1;
      } else if (p.aiT <= 0) {
        p.aiT = rand(0.3, 0.55);
        p.tx = clamp(lerp(b.x, ownX, 0.28), 30, PITCH_W - 30);
        p.ty = clamp(lerp(b.y, CY, 0.42), 70, PITCH_H - 70);
      }
    } else {
      const holder = b.owner!;
      if (p === chaser) {
        p.tx = holder.x; p.ty = holder.y;
        speedF = 1;
      } else if (p.aiT <= 0) {
        p.aiT = rand(0.35, 0.6);
        p.tx = clamp(lerp(holder.x, ownX, 0.38), 30, PITCH_W - 30);
        p.ty = clamp(lerp(holder.y, CY, 0.5), 70, PITCH_H - 70);
      }
    }

    const dx = p.tx - p.x, dy = p.ty - p.y;
    const d = Math.hypot(dx, dy);
    const sp = p.baseSpeed * speedF;
    if (d > 10) {
      const k = Math.min(1, dt * 7.5);
      p.vx += ((dx / d) * sp - p.vx) * k;
      p.vy += ((dy / d) * sp - p.vy) * k;
    } else {
      p.vx *= Math.pow(0.02, dt);
      p.vy *= Math.pow(0.02, dt);
    }
  }

  private gkUpdate(gk: PlayerT, dt: number) {
    const b = this.ball;
    const defRight = gk.team === 1;
    const homeX = defRight ? PITCH_W - 72 : 72;

    if (b.owner === gk) {
      gk.aiT -= dt;
      gk.vx = 0; gk.vy = 0;
      if (gk.aiT <= 0) {
        const mates = this.players.filter((q) => q.team === gk.team && !q.gk);
        const m = mates.reduce((a2, c) =>
          defRight ? (c.x > a2.x ? c : a2) : (c.x < a2.x ? c : a2)
        );
        const angle = Math.atan2(m.y - b.y + rand(-60, 60), m.x - b.x);
        this.kick(gk, rand(690, 800), angle, rand(340, 460), 2);
      }
      return;
    }

    let ty = clamp(b.y, CY - 140, CY + 140);
    let sp = 240;
    const toward = defRight ? b.vx > 480 : b.vx < -480;
    const distToGoal = defRight ? PITCH_W - b.x : b.x;

    if (toward && distToGoal < 700 && !b.owner) {
      const t = Math.max(0.05, (distToGoal - 40) / Math.abs(b.vx));
      const predY = b.y + b.vy * t;
      ty = clamp(predY, CY - GOAL_HALF + 16, CY + GOAL_HALF - 16);
      sp = 520;

      if (!gk.shotFaced && distToGoal < 200) {
        gk.shotFaced = true;
        const speed = Math.hypot(b.vx, b.vy);
        const reach = Math.abs(gk.y - b.y) < 62 && b.z < 130;
        const chance = clamp(0.82 - (speed - 480) / 1500, 0.2, 0.68);
        if (reach && Math.random() < chance) {
          b.vx = (defRight ? -1 : 1) * (Math.abs(b.vx) * 0.22 + 200);
          b.vy = (Math.random() < 0.5 ? -1 : 1) * rand(240, 420);
          b.vz = rand(200, 360);
          b.freeT = 0.5;
          b.owner = null;
          if (gk.team === 1) this.stats.saves++;
          this.spawnSparks(b.x, b.y, b.z);
          gk.lungeT = 0.3;
          sfx.save();
        }
      }
    }
    if (!toward) gk.shotFaced = false;

    if (
      !b.owner && b.freeT <= 0 &&
      dist(gk.x, gk.y, b.x, b.y) < 48 &&
      Math.hypot(b.vx, b.vy) < 470 && b.z < 70
    ) {
      this.acquire(gk);
      sfx.save();
      return;
    }

    const k = Math.min(1, dt * 8);
    gk.vx += (0 - gk.vx) * Math.min(1, dt * 6);
    const dyT = ty - gk.y;
    gk.vy += (clamp(dyT, -sp, sp) - gk.vy) * k;
    gk.x += (homeX - gk.x) * Math.min(1, dt * 5);
  }

  /* ---------------- bounds & goals ---------------- */

  private ballBoundsAndGoal(dt: number) {
    const b = this.ball;
    if (b.owner) return;
    const inMouth = Math.abs(b.y - CY) < GOAL_HALF - 3 && b.z < 140;

    if (b.x < 0) {
      if (inMouth) {
        if (b.x < -22 && this.phase !== 'goal') this.scored(1);
        b.vx *= Math.pow(0.02, dt);
        b.vy *= Math.pow(0.05, dt);
        b.x = Math.max(b.x, -(NET_DEPTH - 8));
      } else {
        b.x = 0;
        b.vx = Math.abs(b.vx) * 0.55;
        sfx.bounce(Math.abs(b.vx));
      }
    }
    if (b.x > PITCH_W) {
      if (inMouth) {
        if (b.x > PITCH_W + 22 && this.phase !== 'goal') this.scored(0);
        b.vx *= Math.pow(0.02, dt);
        b.vy *= Math.pow(0.05, dt);
        b.x = Math.min(b.x, PITCH_W + NET_DEPTH - 8);
      } else {
        b.x = PITCH_W;
        b.vx = -Math.abs(b.vx) * 0.55;
        sfx.bounce(Math.abs(b.vx));
      }
    }

    for (const gx of [0, PITCH_W])
      for (const py2 of [CY - GOAL_HALF, CY + GOAL_HALF]) {
        const d = dist(b.x, b.y, gx, py2);
        if (d < 19 && d > 0.01 && b.z < 145) {
          const nx = (b.x - gx) / d, ny = (b.y - py2) / d;
          const dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            b.vx -= 2 * dot * nx;
            b.vy -= 2 * dot * ny;
            b.vx *= 0.7; b.vy *= 0.7;
            b.x = gx + nx * 19.5;
            b.y = py2 + ny * 19.5;
            this.spawnSparks(b.x, b.y, 30);
            sfx.post();
          }
        }
      }

    if (b.y < 3) {
      b.y = 3;
      b.vy = Math.abs(b.vy) * 0.55;
      if (Math.abs(b.vy) > 90) sfx.bounce(Math.abs(b.vy));
    }
    if (b.y > PITCH_H - 3) {
      b.y = PITCH_H - 3;
      b.vy = -Math.abs(b.vy) * 0.55;
      if (Math.abs(b.vy) > 90) sfx.bounce(Math.abs(b.vy));
    }
  }

  /* ---------------- particles & camera ---------------- */

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.rot += p.vrot * dt;
      if (p.kind === 'confetti') {
        p.vz -= 900 * dt;
        p.vx *= Math.pow(0.3, dt);
        if (p.z < 0) { p.z = 0; p.vz = Math.abs(p.vz) * 0.25; }
      } else if (p.kind === 'dust') {
        p.vz -= 90 * dt;
        p.vx *= Math.pow(0.08, dt);
        p.vy *= Math.pow(0.08, dt);
        if (p.z < 0) p.z = 0;
      } else {
        p.vz -= 1100 * dt;
        if (p.z < 0) p.z = 0;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.particles.length > 260)
      this.particles.splice(0, this.particles.length - 260);
  }

  private updateCamera(dt: number) {
    const b = this.ball;
    let tx: number, ty: number;
    if (this.phase === 'goal' && this.goalTeam !== null) {
      tx = this.goalTeam === 0 ? PITCH_W - 120 : 120;
      ty = clamp(b.y, CY - 160, CY + 160);
    } else if (this.demo) {
      tx = b.x;
      ty = b.y;
    } else {
      const a = this.active();
      tx = b.x * 0.72 + a.x * 0.28;
      ty = b.y * 0.72 + a.y * 0.28;
    }
    const spd = Math.hypot(b.vx, b.vy);
    // zoom out a touch for fast counters, in for tight control — always smooth
    const tzoom = this.phase === 'goal' ? 1.18 : clamp(1.1 - (spd / 1400) * 0.28, 0.82, 1.1);
    const k = 1 - Math.exp(-dt * 3.0);
    const kz = 1 - Math.exp(-dt * 2.0);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    this.cam.zoom += (tzoom - this.cam.zoom) * kz;
    this.cam.x = clamp(this.cam.x, -40, PITCH_W + 40);
    this.cam.y = clamp(this.cam.y, 60, PITCH_H - 60);
  }
}
