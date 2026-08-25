import { sfx } from './audio';
import { makeStadiumLayer, renderFrame } from './render';
import {
  PITCH_W,
  PITCH_H,
  WORLD_W,
  WORLD_H,
  GOAL_HALF,
  CY,
  MATCH_LEN,
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
  onFullTime: (
    result: { score: [number, number]; stats: StatsT; win: 'win' | 'draw' | 'loss' }
  ) => void;
  onPhase: (phase: GamePhase) => void;
}

const GRAV = 1250;
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
  cam: CameraT = { x: WORLD_W / 2, y: WORLD_H / 2, zoom: 1, tZoom: 1, shake: 0 };
  score: [number, number] = [0, 0];
  timeLeft = MATCH_LEN;
  activeId = 0;
  chargeFrac = 0;
  crossMark: { x: number; y: number; t: number } | null = null;
  netRipple = { side: 1, amt: 0, y: CY };
  goalT = 0;
  goalTeam: Team | null = null;
  demo = true;
  stats: StatsT = { shots: 0, passes: 0, goalsBlue: 0, goalsWhite: 0, saves: 0 };
  tGlobal = 0;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stadium: HTMLCanvasElement;
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
  private shotFaced = false;
  private lastSentTime = -1;
  private hudAcc = 0;

  constructor(canvas: HTMLCanvasElement, cb: Callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.cb = cb;
    this.stadium = makeStadiumLayer();
    // re-bake once webfonts arrive so board/number lettering is crisp
    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          this.stadium = makeStadiumLayer();
        })
        .catch(() => undefined);
    }
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
    this.cam.tZoom = 1;
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
    this.cam.tZoom = 1;
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
      baseSpeed: gk ? 175 : team === 0 ? 252 : 196,
      runPhase: rand(0, 6), kickT: 0, kickKind: 0, dashT: 0, dashCool: 0,
      tackleCool: 0, aiT: rand(0.1, 0.5), tx: x, ty: y, celebrateT: 0,
      skin: SKINS[id % SKINS.length], hair: HAIRS[(id * 2 + 1) % HAIRS.length],
      lungeT: 0, hasBallGlow: 0,
    });
    this.players = [
      mk(0, 0, false, 10, 300, CY - 90),
      mk(1, 0, false, 7, 260, CY + 150),
      mk(2, 1, false, 9, PITCH_W - 300, CY + 90),
      mk(3, 1, false, 11, PITCH_W - 260, CY - 150),
      mk(4, 1, true, 1, PITCH_W - 40, CY),
    ];
  }

  private resetPositions() {
    const spots: [number, number][] = [
      [PITCH_W / 2 - 62, CY - 34],
      [PITCH_W / 2 - 250, CY + 160],
      [PITCH_W / 2 + 62, CY + 34],
      [PITCH_W / 2 + 250, CY - 160],
      [PITCH_W - 40, CY],
    ];
    this.players.forEach((p, i) => {
      const [sx, sy] = spots[i];
      p.x = sx; p.y = sy; p.vx = 0; p.vy = 0;
      p.tx = sx; p.ty = sy;
      p.dir = p.team === 0 ? 0 : Math.PI;
      p.kickT = 0; p.dashT = 0; p.lungeT = 0; p.celebrateT = 0;
      p.tackleCool = 0; p.aiT = rand(0.1, 0.4);
    });
    const b = this.ball;
    b.x = PITCH_W / 2; b.y = CY; b.z = 0;
    b.vx = 0; b.vy = 0; b.vz = 0;
    b.owner = null; b.freeT = 0.9; b.lastKicker = null;
    this.shotFaced = false;
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
    if (e.code === 'KeyV' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.doDribble();
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

  private canReach(p: PlayerT, r = 46): boolean {
    return (
      this.ball.owner === p ||
      dist(p.x, p.y, this.ball.x, this.ball.y) < r
    );
  }

  private acquire(p: PlayerT) {
    // generous grab: take a loose or even held ball right at the feet
    const b = this.ball;
    if (b.owner && b.owner !== p && b.owner.team !== p.team) {
      b.owner.hasBallGlow = 0;
    }
    b.owner = p;
    b.freeT = 0;
    this.shotFaced = false;
    if (p.team === 1 && p.gk) p.aiT = rand(0.7, 1.05);
  }

  private kick(
    p: PlayerT, speed: number, angle: number, vz: number, kind: number
  ) {
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
    this.shotFaced = false;
    this.spawnDust(b.x, b.y, 6, speed > 600 ? 2.2 : 1.2);
    sfx.kick(clamp(speed / 900, 0.2, 1));
    this.cam.shake = Math.max(this.cam.shake, speed > 640 ? 3 : 1.2);
  }

  private fireShot() {
    if (this.phase !== 'play' && this.phase !== 'demo') return;
    const p = this.demo ? this.nearestToBall(0) : this.active();
    if (!this.canReach(p, 48)) return;
    const b = this.ball;
    const frac = clamp(this.chargeT / 0.85, 0, 1);
    const gx = PITCH_W, gy = CY;
    const err = rand(-1, 1) * (0.05 * (1 - frac) + 0.015);
    const angle = Math.atan2(gy - b.y, gx - b.x) + err;
    const d = dist(b.x, b.y, gx, gy);
    const speed = 560 + 350 * frac;
    const vz = (d < 300 ? 55 : 95) + 210 * frac;
    this.acquire(p);
    this.kick(p, speed, angle, vz, 1);
    if (p.team === 0) this.stats.shots++;
    this.cam.shake = Math.max(this.cam.shake, 2.5 + frac * 2.5);
  }

  private doPass() {
    if (this.phase !== 'play' && this.phase !== 'demo') return;
    const p = this.demo ? this.nearestToBall(0) : this.active();
    if (!this.canReach(p)) return;
    const mate = this.players.find(
      (q) => q.team === p.team && !q.gk && q.id !== p.id
    )!;
    const tx = mate.x + mate.vx * 0.32 + 26 * (p.team === 0 ? 1 : -1);
    const ty = mate.y + mate.vy * 0.32;
    const angle = Math.atan2(ty - this.ball.y, tx - this.ball.x) + rand(-0.025, 0.025);
    this.acquire(p);
    this.kick(p, 475, angle, 18, 2);
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
    const gx = attackRight ? PITCH_W - 170 : 170;
    const tx = gx + rand(-30, 30);
    const ty = clamp(mate.y + rand(-40, 40), CY - 95, CY + 95);
    const dx = tx - b.x, dy = ty - b.y;
    const hd = Math.hypot(dx, dy);
    const t = clamp(hd / 460, 0.45, 1.1);
    const angle = Math.atan2(dy, dx);
    this.acquire(p);
    this.kick(p, hd / t, angle, 0.5 * GRAV * t + 40, 3);
    if (p.team === 0) this.stats.passes++;
    this.crossMark = { x: tx, y: ty, t: 0.9 };
    sfx.pass();
  }

  private doDribble() {
    if (this.phase !== 'play' && this.phase !== 'demo') return;
    const p = this.demo ? this.nearestToBall(0) : this.active();
    if (p.dashCool > 0) return;
    p.dashT = 0.32;
    p.dashCool = 1.15;
    this.spawnDust(p.x, p.y + 2, 8, 1.4);
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
        kind: 'dust', x: x + rand(-5, 5), y: y + rand(-3, 3), z: rand(0, 5),
        vx: rand(-40, 40) * s, vy: rand(-30, 30) * s, vz: rand(20, 70),
        life: rand(0.3, 0.55), maxLife: 0.55, size: rand(2.5, 5),
        color: '#cdb894',
        rot: 0, vrot: 0,
      });
  }

  private spawnConfetti(x: number, y: number, n: number) {
    const cols = ['#4da3ff', '#ffffff', '#ff5fa2', '#ffd23f', '#7dffb0'];
    for (let i = 0; i < n; i++)
      this.particles.push({
        kind: 'confetti', x: x + rand(-30, 30), y: y + rand(-60, 60), z: rand(10, 60),
        vx: rand(-220, 220), vy: rand(-160, 160), vz: rand(180, 460),
        life: rand(0.9, 1.7), maxLife: 1.7, size: rand(5, 9),
        color: cols[i % cols.length], rot: rand(0, 6), vrot: rand(-9, 9),
      });
  }

  private spawnSparks(x: number, y: number, z: number) {
    for (let i = 0; i < 8; i++)
      this.particles.push({
        kind: 'spark', x, y, z: z + rand(0, 10),
        vx: rand(-180, 180), vy: rand(-140, 140), vz: rand(60, 260),
        life: rand(0.2, 0.4), maxLife: 0.4, size: rand(1.5, 3),
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
    for (const p of this.players)
      if (p.team === team) p.celebrateT = 2.3;
    this.cam.tZoom = this.demo ? 1.25 : 1.55;
    this.cam.shake = 4;
    sfx.goalRoar();
    sfx.whistle();
    this.ball.vx *= 0.15;
    this.ball.vy *= 0.15;
    this.ball.vz = 0;
    this.emitHud(true);
    if (!this.demo) this.cb.onGoal(team);
  }

  private emitHud(force = false) {
    const t = Math.ceil(this.timeLeft);
    if (force || t !== this.lastSentTime) {
      this.lastSentTime = t;
      this.cb.onHud([this.score[0], this.score[1]], fmt(this.timeLeft));
    }
  }

  /* ---------------- update ---------------- */

  private tick = (ts: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = clamp((ts - this.last) / 1000, 0.001, 1 / 30);
    this.last = ts;
    if (this.phase !== 'paused') this.update(dt);
    renderFrame(this.ctx, this, this.vw, this.vh, this.dpr, this.stadium);
  };

  private update(dt: number) {
    this.tGlobal += dt;
    this.hudAcc += dt;

    // decays
    this.netRipple.amt = Math.max(0, this.netRipple.amt - dt * 0.55);
    this.cam.shake = Math.max(0, this.cam.shake - dt * 9);
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
          this.cam.tZoom = 1;
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

    // --- charge tracking ---
    if (!this.demo) {
      const a = this.active();
      if (this.input.shoot && this.canReach(a, 48)) {
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

    // --- movement ---
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

    // --- integrate players + separation ---
    for (const p of this.players) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gk) {
        p.x = clamp(p.x, PITCH_W - 190, PITCH_W + 8);
        p.y = clamp(p.y, CY - 140, CY + 140);
      } else {
        p.x = clamp(p.x, -6, PITCH_W + 6);
        p.y = clamp(p.y, -6, PITCH_H + 6);
      }
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 25) {
        p.dir = angLerp(p.dir, Math.atan2(p.vy, p.vx), dt * 11);
        p.runPhase += sp * dt * 0.052;
      }
    }
    for (let i = 0; i < this.players.length; i++)
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i], c = this.players[j];
        const d = dist(a.x, a.y, c.x, c.y);
        if (d < 24 && d > 0.01) {
          const push = ((24 - d) / 2) * 0.6;
          const nx = (a.x - c.x) / d, ny = (a.y - c.y) / d;
          a.x += nx * push; a.y += ny * push;
          c.x -= nx * push; c.y -= ny * push;
        }
      }

    // --- ball: carried or free ---
    if (b.owner) {
      const p = b.owner;
      const lead = p.dashT > 0 ? 10 : 14.5;
      const wob = Math.sin(p.runPhase) * 2.4;
      const txp = p.x + Math.cos(p.dir) * lead + Math.cos(p.dir + Math.PI / 2) * wob * 0.4;
      const typ = p.y + Math.sin(p.dir) * lead * 0.8 + Math.sin(p.dir + Math.PI / 2) * wob * 0.4;
      const k = Math.min(1, dt * 20);
      b.x += (txp - b.x) * k;
      b.y += (typ - b.y) * k;
      b.z = Math.abs(Math.sin(p.runPhase)) * 1.6;
      b.vz = 0;
      b.vx = p.vx; b.vy = p.vy;
      b.spin += Math.hypot(p.vx, p.vy) * dt * 0.035;
    } else {
      // gentle magnet toward the controlled player (forgiving control)
      if (!this.demo && b.freeT <= 0) {
        const a = this.active();
        const d = dist(a.x, a.y, b.x, b.y);
        const bs = Math.hypot(b.vx, b.vy);
        if (d < 72 && d > 1 && bs < 380 && b.z < 22) {
          b.vx += ((a.x - b.x) / d) * 260 * dt * (1 - d / 72);
          b.vy += ((a.y - b.y) / d) * 260 * dt * (1 - d / 72);
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.vz -= GRAV * dt;
      if (b.z <= 0) {
        b.z = 0;
        if (b.vz < -70) {
          sfx.bounce(-b.vz);
          this.spawnDust(b.x, b.y, 3, 0.7);
          b.vz = -b.vz * 0.48;
        } else b.vz = 0;
      }
      if (b.z === 0) {
        const fr = Math.exp(-2.0 * dt);
        b.vx *= fr; b.vy *= fr;
      } else {
        const fr = Math.exp(-0.25 * dt);
        b.vx *= fr; b.vy *= fr;
      }
      const spd = Math.hypot(b.vx, b.vy);
      if (spd > 980) {
        b.vx = (b.vx / spd) * 980;
        b.vy = (b.vy / spd) * 980;
      }
      b.spin += spd * dt * 0.03 * (b.vx >= 0 ? 1 : -1);
      if (spd > 430 && b.z < 70)
        this.trail.push({ x: b.x, y: b.y, z: b.z, life: 1 });
    }
    for (const tr of this.trail) tr.life -= dt * 2.6;
    this.trail = this.trail.filter((t) => t.life > 0);

    // --- pickup ---
    if (!b.owner && b.freeT <= 0 && b.z < 26) {
      const spd = Math.hypot(b.vx, b.vy);
      if (spd < 660) {
        let best: PlayerT | null = null;
        let bd = 1e9;
        for (const p of this.players) {
          const r = p.gk ? 30 : p.team === 0 ? 34 : 27;
          const d = dist(p.x, p.y, b.x, b.y);
          if (d < r && d < bd) { bd = d; best = p; }
        }
        if (best) this.acquire(best);
      }
    }

    // --- shot blocks: fast loose balls can be deflected by bodies ---
    if (!b.owner && b.z < 50 && b.freeT <= 0.05) {
      const spd = Math.hypot(b.vx, b.vy);
      if (spd > 380) {
        for (const p of this.players) {
          if (p === b.lastKicker || p.gk) continue;
          if (dist(p.x, p.y, b.x, b.y) < 17 && p.tackleCool <= 0) {
            p.tackleCool = 0.8;
            if (Math.random() < (p.team === 0 ? 0.62 : 0.34)) {
              b.vx = -b.vx * 0.22 + rand(-130, 130);
              b.vy = -b.vy * 0.22 + rand(-150, 150);
              b.vz = rand(90, 170);
              b.freeT = 0.3;
              this.spawnDust(b.x, b.y, 5, 1.2);
              this.spawnSparks(b.x, b.y, 8);
              sfx.kick(0.3);
              this.cam.shake = Math.max(this.cam.shake, 2.2);
            }
            break;
          }
        }
      }
    }

    // --- tackles ---
    if (b.owner) {
      for (const p of this.players) {
        const o = b.owner!;
        if (p.team === o.team || p.tackleCool > 0) continue;
        if (dist(p.x, p.y, o.x, o.y) < 25) {
          p.tackleCool = p.team === 0 ? 1.35 : 1.7;
          let prob = p.team === 0 ? 0.72 : 0.3;
          if (o.gk) prob *= 0.7;
          if (Math.random() < prob) {
            o.hasBallGlow = 0;
            o.lungeT = 0.3;
            this.acquire(p);
            this.spawnDust(b.x, b.y, 5, 1.1);
            sfx.kick(0.25);
            this.cam.shake = Math.max(this.cam.shake, 1.5);
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
    if (b.owner && b.owner.team === 0) {
      this.activeId = b.owner.id;
      return;
    }
    const p0 = this.players[0], p1 = this.players[1];
    const d0 = dist(p0.x, p0.y, b.x, b.y);
    const d1 = dist(p1.x, p1.y, b.x, b.y);
    const cur = this.activeId === 0 ? d0 : d1;
    const other = this.activeId === 0 ? d1 : d0;
    if (other + 55 < cur) this.activeId = this.activeId === 0 ? 1 : 0;
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
      // has the ball
      const goalD = Math.abs(goalX - b.x);
      let pressure = 1e9;
      for (const f of foes) pressure = Math.min(pressure, dist(f.x, f.y, p.x, p.y));
      if (p.aiT <= 0) {
        p.aiT = rand(0.32, 0.6);
        if (goalD < 330 && Math.random() < 0.5) {
          const err = rand(-0.14, 0.14) * (Math.random() < 0.3 ? 2.3 : 1);
          const angle = Math.atan2(CY - b.y + rand(-30, 30), goalX - b.x) + err * (atkR ? 1 : 1);
          this.kick(p, rand(500, 660), angle, rand(40, 170), 1);
          if (p.team === 0) this.stats.shots++;
        } else if (pressure < 95 && mates.length && Math.random() < 0.55) {
          const m = mates[0];
          const tx = m.x + m.vx * 0.3 + (atkR ? 24 : -24);
          const ty = m.y + m.vy * 0.3;
          this.kick(
            p, 445,
            Math.atan2(ty - b.y, tx - b.x) + rand(-0.045, 0.045),
            20, 2
          );
          if (p.team === 0) this.stats.passes++;
          sfx.pass();
        } else {
          p.tx = clamp(p.x + (atkR ? 1 : -1) * 165, 30, PITCH_W - 30);
          p.ty = clamp(CY + (p.y - CY) * 0.55 + rand(-85, 85), 45, PITCH_H - 45);
        }
      }
      speedF = 0.8;
    } else if (b.owner && b.owner.team === p.team) {
      // teammate has it → offer support ahead
      if (p.aiT <= 0) {
        p.aiT = rand(0.4, 0.75);
        const off = p.id % 2 === 0 ? -150 : 150;
        p.tx = clamp(b.x + (atkR ? 1 : -1) * 185 + rand(-30, 30), 30, PITCH_W - 30);
        p.ty = clamp(b.y + off + rand(-40, 40), 55, PITCH_H - 55);
      }
    } else if (!b.owner) {
      if (p === chaser) {
        p.tx = b.x + b.vx * 0.14;
        p.ty = b.y + b.vy * 0.14;
        speedF = 1;
      } else if (p.aiT <= 0) {
        p.aiT = rand(0.3, 0.55);
        p.tx = clamp(lerp(b.x, ownX, 0.28), 20, PITCH_W - 20);
        p.ty = clamp(lerp(b.y, CY, 0.42), 45, PITCH_H - 45);
      }
    } else {
      // opponent has it
      const holder = b.owner!;
      if (p === chaser) {
        p.tx = holder.x; p.ty = holder.y;
        speedF = 1;
      } else if (p.aiT <= 0) {
        p.aiT = rand(0.35, 0.6);
        p.tx = clamp(lerp(holder.x, ownX, 0.38), 20, PITCH_W - 20);
        p.ty = clamp(lerp(holder.y, CY, 0.5), 45, PITCH_H - 45);
      }
    }

    // move toward target
    const dx = p.tx - p.x, dy = p.ty - p.y;
    const d = Math.hypot(dx, dy);
    const sp = p.baseSpeed * speedF * (p.team === 1 ? 1 : this.demo ? 0.92 : 1);
    if (d > 7) {
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
    const homeX = PITCH_W - 44;

    if (b.owner === gk) {
      gk.aiT -= dt;
      gk.vx = 0; gk.vy = 0;
      if (gk.aiT <= 0) {
        // punt to the more advanced defender
        const mates = this.players.filter((q) => q.team === 1 && !q.gk);
        const m = mates.reduce((a2, c) => (c.x < a2.x ? c : a2));
        const angle = Math.atan2(m.y - b.y + rand(-40, 40), m.x - b.x);
        this.kick(gk, rand(430, 500), angle, rand(220, 300), 2);
      }
      return;
    }

    let ty = clamp(b.y, CY - 88, CY + 88);
    let sp = 150;

    // track threatening balls
    if (b.vx > 300 && PITCH_W - b.x < 430 && !b.owner) {
      const t = (PITCH_W - 26 - b.x) / Math.max(1, b.vx);
      const predY = b.y + b.vy * t;
      ty = clamp(predY, CY - GOAL_HALF + 10, CY + GOAL_HALF - 10);
      sp = 330;

      // one save decision per shot
      if (!this.shotFaced && b.x > PITCH_W - 120) {
        this.shotFaced = true;
        const speed = Math.hypot(b.vx, b.vy);
        const reach = Math.abs(gk.y - b.y) < 38 && b.z < 82;
        const chance = clamp(0.82 - (speed - 300) / 1000, 0.2, 0.68);
        if (reach && Math.random() < chance) {
          b.vx = -Math.abs(b.vx) * 0.22 - 130;
          b.vy = (Math.random() < 0.5 ? -1 : 1) * rand(150, 270);
          b.vz = rand(130, 230);
          b.freeT = 0.5;
          b.owner = null;
          this.stats.saves++;
          this.spawnSparks(b.x, b.y, b.z);
          gk.lungeT = 0.3;
          this.cam.shake = Math.max(this.cam.shake, 3);
          sfx.save();
        }
      }
    }
    if (b.vx <= 40) this.shotFaced = false;

    // pick up slow nearby balls
    if (
      !b.owner && b.freeT <= 0 &&
      dist(gk.x, gk.y, b.x, b.y) < 30 &&
      Math.hypot(b.vx, b.vy) < 300 && b.z < 45
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
    if (b.owner) return; // a carried ball can never cross or score
    const inMouth = Math.abs(b.y - CY) < GOAL_HALF - 2 && b.z < 90;

    // left goal (white scores here)
    if (b.x < 0) {
      if (inMouth) {
        if (b.x < -14 && this.phase !== 'goal') this.scored(1);
        b.vx *= Math.pow(0.02, dt);
        b.vy *= Math.pow(0.05, dt);
        b.x = Math.max(b.x, -38);
      } else {
        b.x = 0;
        b.vx = Math.abs(b.vx) * 0.55;
        sfx.bounce(Math.abs(b.vx));
      }
    }
    // right goal (blue scores here)
    if (b.x > PITCH_W) {
      if (inMouth) {
        if (b.x > PITCH_W + 14 && this.phase !== 'goal') this.scored(0);
        b.vx *= Math.pow(0.02, dt);
        b.vy *= Math.pow(0.05, dt);
        b.x = Math.min(b.x, PITCH_W + 38);
      } else {
        b.x = PITCH_W;
        b.vx = -Math.abs(b.vx) * 0.55;
        sfx.bounce(Math.abs(b.vx));
      }
    }

    // posts
    for (const gx of [0, PITCH_W])
      for (const py2 of [CY - GOAL_HALF, CY + GOAL_HALF]) {
        const d = dist(b.x, b.y, gx, py2);
        if (d < 12 && d > 0.01 && b.z < 95) {
          const nx = (b.x - gx) / d, ny = (b.y - py2) / d;
          const dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            b.vx -= 2 * dot * nx;
            b.vy -= 2 * dot * ny;
            b.vx *= 0.7; b.vy *= 0.7;
            b.x = gx + nx * 12.5;
            b.y = py2 + ny * 12.5;
            this.spawnSparks(b.x, b.y, 20);
            this.cam.shake = Math.max(this.cam.shake, 2.5);
            sfx.post();
          }
        }
      }

    // touchlines (arcade bounce)
    if (b.y < 2) {
      b.y = 2;
      b.vy = Math.abs(b.vy) * 0.55;
      if (Math.abs(b.vy) > 60) sfx.bounce(Math.abs(b.vy));
    }
    if (b.y > PITCH_H - 2) {
      b.y = PITCH_H - 2;
      b.vy = -Math.abs(b.vy) * 0.55;
      if (Math.abs(b.vy) > 60) sfx.bounce(Math.abs(b.vy));
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
        p.vz -= 640 * dt;
        p.vx *= Math.pow(0.3, dt);
        if (p.z < 0) { p.z = 0; p.vz = Math.abs(p.vz) * 0.25; }
      } else if (p.kind === 'dust') {
        p.vz -= 60 * dt;
        p.vx *= Math.pow(0.08, dt);
        p.vy *= Math.pow(0.08, dt);
        if (p.z < 0) p.z = 0;
      } else {
        p.vz -= 800 * dt;
        if (p.z < 0) p.z = 0;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.particles.length > 260) this.particles.splice(0, this.particles.length - 260);
  }

  private updateCamera(dt: number) {
    let tx: number, ty: number;
    if (this.phase === 'goal' && this.goalTeam !== null) {
      tx = this.goalTeam === 0 ? PITCH_W - 40 : 40;
      ty = clamp(this.ball.y, CY - 120, CY + 120);
    } else if (this.demo) {
      tx = this.ball.x;
      ty = this.ball.y;
    } else {
      const a = this.active();
      tx = this.ball.x * 0.62 + a.x * 0.38;
      ty = this.ball.y * 0.62 + a.y * 0.38;
    }
    const k = Math.min(1, dt * (this.phase === 'goal' ? 4.5 : 3.4));
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    this.cam.zoom += (this.cam.tZoom - this.cam.zoom) * Math.min(1, dt * 2.6);

    // clamp so we never show beyond the stadium
    const base = Math.max(this.vw / 1150, this.vh / 760);
    const scale = base * this.cam.zoom;
    const hvx = this.vw / 2 / scale;
    const hvy = this.vh / 2 / scale;
    this.cam.x =
      hvx * 2 >= WORLD_W
        ? WORLD_W / 2
        : clamp(this.cam.x, hvx - 6, WORLD_W - hvx + 6);
    this.cam.y =
      hvy * 2 >= WORLD_H
        ? WORLD_H / 2
        : clamp(this.cam.y, hvy - 6, WORLD_H - hvy + 6);
  }
}
