import {
  PITCH_W,
  PITCH_H,
  CY,
  GOAL_HALF,
  GOAL_H,
  NET_DEPTH,
  MARGIN,
  clamp,
  type GameView,
  type PlayerT,
} from './types';

const TAU = Math.PI * 2;

/* ================= camera & projection =================
   Broadcast-style camera: sits behind & above the action, looking down
   at a fixed pitch angle. Screen y grows downward; world y grows toward
   the far goal. We use a painter's algorithm with depth-sorted draws.  */

interface Proj {
  (x: number, y: number, z: number): { x: number; y: number; s: number; d: number } | null;
}
interface CamMat {
  a: number; b: number; c: number; d: number; e: number; f: number;
}

const CAM_H = 860; // camera height above the pitch
const TILT = 0.5; // radians below horizontal — broadcast-style look-down
const BACK = 1550; // camera ground anchor sits this far behind the focus point

function makeProjection(g: GameView, vw: number, vh: number): { P: Proj; m: CamMat } {
  /* Broadcast camera: ground anchor at (cam.x, cam.y - BACK), height CAM_H,
     looking forward (+y) and down by TILT. Correct perspective division:
     points ahead of the camera project below the horizon; the focus point
     (where the ball usually is) is anchored at ~60% of the viewport height,
     and zoom scales around that anchor.                        */
  const sinA = Math.sin(TILT);
  const cosA = Math.cos(TILT);
  const zoom = g.cam.zoom;

  // depth of the focus plane (ball plane) from the camera
  const D_BALL = BACK * sinA + CAM_H * cosA;

  // focal length: wide screens are width-constrained (frame ~1900 world
  // units across), tall/portrait screens are height-constrained (the ground
  // strip must cover the whole viewport). Result: pitch always fills screen.
  const F = Math.max(vh * 0.44, (vw * D_BALL) / 1900) * zoom;

  const cx = g.cam.x;
  const camY = g.cam.y - BACK;

  // vertical camera-space offset of the focus point → anchor it at 60% vh
  const ballDrop = (BACK * cosA - CAM_H * sinA) / D_BALL;
  const sy = vh * 0.6 + F * ballDrop;

  const P: Proj = (x, y, z) => {
    const dx = x - cx;
    const dy = y - camY; // forward distance from the camera ground anchor
    const dz = CAM_H - z; // camera height above the point

    const depth = dy * sinA + dz * cosA;
    if (depth < 24) return null; // behind camera / too close
    const s = F / depth; // screen px per world unit at this depth
    return {
      x: vw / 2 + dx * s,
      y: sy - (dy * cosA - dz * sinA) * s,
      s,
      d: depth,
    };
  };

  // affine ground matrix for drawing ellipses/arcs on the pitch plane
  // ground point (x,y,0) → screen. Derive from P at z=0 (null-guarded).
  const p0 = P(0, 0, 0);
  const px1 = P(10, 0, 0);
  const py1 = P(0, 10, 0);
  const m: CamMat =
    p0 && px1 && py1
      ? {
          a: (px1.x - p0.x) / 10,
          b: 0,
          c: 0,
          d: (py1.y - p0.y) / 10,
          e: p0.x,
          f: p0.y,
        }
      : { a: 1, b: 0, c: 0, d: 1, e: vw / 2, f: vh / 2 };
  return { P, m };
}

/* draw an ellipse/arc on the ground plane by sampling points */
function strokeArc(
  ctx: CanvasRenderingContext2D,
  m: CamMat,
  cx: number,
  cy: number,
  rx: number,
  rot: number,
  a0: number,
  a1: number,
  segs: number,
  color: string,
  width: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  let started = false;
  const P2 = (ang: number) => {
    const x = cx + Math.cos(ang + rot) * rx;
    const y = cy + Math.sin(ang + rot) * rx * 0.42; // perspective squash handled by world coords
    return { x, y };
  };
  for (let i = 0; i <= segs; i++) {
    const ang = a0 + ((a1 - a0) * i) / segs;
    const p = P2(ang);
    const sp = groundPoint(m, p.x, p.y);
    if (!sp) {
      started = false;
      continue;
    }
    if (!started) {
      ctx.moveTo(sp.x, sp.y);
      started = true;
    } else ctx.lineTo(sp.x, sp.y);
  }
  ctx.stroke();
}

let GPROJ: { P: Proj; m: CamMat } | null = null;
function groundPoint(
  m: CamMat,
  x: number,
  y: number
): { x: number; y: number } | null {
  if (!GPROJ) return null;
  const p = GPROJ.P(x, y, 0);
  if (!p) return null;
  return { x: p.x, y: p.y };
}

function fillQuad(
  ctx: CanvasRenderingContext2D,
  m: CamMat,
  pts: [number, number, number][],
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  let started = false;
  for (const [x, y, z] of pts) {
    const p = GPROJ!.P(x, y, z);
    if (!p) continue;
    if (!started) {
      ctx.moveTo(p.x, p.y);
      started = true;
    } else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fill();
}

function line3(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  color: string,
  width: number
) {
  const a = GPROJ!.P(x1, y1, z1);
  const b = GPROJ!.P(x2, y2, z2);
  if (!a || !b) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

/* ================= static world ================= */

let crowdSeed: { x: number; y: number; c: string; s: number; ph: number }[] | null = null;
function buildCrowd() {
  if (crowdSeed) return;
  crowdSeed = [];
  const colors = ['#c33d54', '#3d6cc3', '#e0a53f', '#4fc377', '#b054d6', '#e8e2d0', '#5a9fd6', '#d66a3d'];
  // stands around the pitch
  const rows = 7;
  const spacing = 34;
  for (let side = 0; side < 4; side++) {
    for (let r = 0; r < rows; r++) {
      const n = side < 2 ? 44 : 26;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        let x: number, y: number;
        const off = MARGIN * 0.42 + r * spacing;
        if (side === 0) { x = -MARGIN + t * (PITCH_W + 2 * MARGIN); y = -off; }
        else if (side === 1) { x = -MARGIN + t * (PITCH_W + 2 * MARGIN); y = PITCH_H + off; }
        else if (side === 2) { x = -off; y = -MARGIN * 0.5 + t * (PITCH_H + MARGIN); }
        else { x = PITCH_W + off; y = -MARGIN * 0.5 + t * (PITCH_H + MARGIN); }
        x += (Math.random() - 0.5) * 14;
        y += (Math.random() - 0.5) * 10;
        crowdSeed.push({
          x, y,
          c: colors[(Math.random() * colors.length) | 0],
          s: 0.8 + Math.random() * 0.5,
          ph: Math.random() * TAU,
        });
      }
    }
  }
}

function drawWorld(ctx: CanvasRenderingContext2D, P: Proj, g: GameView, vw: number, vh: number) {
  buildCrowd();
  buildSpecks();

  // sky / night gradient
  const sky = ctx.createLinearGradient(0, 0, 0, vh);
  sky.addColorStop(0, '#060b18');
  sky.addColorStop(0.5, '#0b1526');
  sky.addColorStop(1, '#101f33');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, vw, vh);

  // ground apron (grass outside pitch)
  const apron: [number, number, number][] = [
    [-MARGIN, -MARGIN, 0],
    [PITCH_W + MARGIN, -MARGIN, 0],
    [PITCH_W + MARGIN, PITCH_H + MARGIN, 0],
    [-MARGIN, PITCH_H + MARGIN, 0],
  ];
  fillQuad(ctx, null as unknown as CamMat, apron, '#1d5c33');

  // mow stripes on the pitch
  const stripes = 16;
  for (let i = 0; i < stripes; i++) {
    const x0 = (PITCH_W / stripes) * i;
    const x1 = x0 + PITCH_W / stripes;
    fillQuad(
      ctx, null as unknown as CamMat,
      [[x0, 0, 0], [x1, 0, 0], [x1, PITCH_H, 0], [x0, PITCH_H, 0]],
      i % 2 === 0 ? '#2e9e4f' : '#289248'
    );
  }

  // subtle vignette light pool in the middle
  const c0 = P(PITCH_W / 2, CY, 0);
  if (c0) {
    const pool = ctx.createRadialGradient(c0.x, c0.y, 10, c0.x, c0.y, 560 * c0.s * 1.4);
    pool.addColorStop(0, 'rgba(255,255,220,0.10)');
    pool.addColorStop(1, 'rgba(255,255,220,0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(c0.x, c0.y, 340 * c0.s, 200 * c0.s, 0, 0, TAU);
    ctx.fill();
  }

  // grass specks
  for (const s of specks!) {
    const p = P(s.x, s.y, 0);
    if (!p) continue;
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#dfe6ee';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, Math.max(2, 5.4 * p.s), Math.max(1, 2.3 * p.s), 0, 0, TAU);
    ctx.fill();
  }
}

/* ================= shadows ================= */
function drawShadows(ctx: CanvasRenderingContext2D, P: Proj, g: GameView) {
  ctx.fillStyle = 'rgba(6,22,12,0.34)';
  for (const p of g.players) {
    const s = P(p.x, p.y, 0);
    if (!s) continue;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 4 * s.s, 19 * s.s, 7.6 * s.s, 0, 0, TAU);
    ctx.fill();
  }
  const b = g.ball;
  const bs = P(b.x, b.y, 0);
  if (bs) {
    const f = clamp(1 - b.z / 340, 0.3, 1);
    ctx.fillStyle = `rgba(6,22,12,${0.36 * f})`;
    ctx.beginPath();
    ctx.ellipse(bs.x, bs.y + 3 * bs.s, (12 * f + 3) * bs.s, (5 * f + 1.4) * bs.s, 0, 0, TAU);
    ctx.fill();
  }
}

/* ================= players & ball ================= */
const KITS = {
  blue: { shirt1: '#4d97ff', shirt2: '#1b5fd6', trim: '#eaf2ff', shorts: '#123e8c', socks: '#1b5fd6', num: '#eaf2ff', sleeve: '#2b6fe8', cap: '#123e8c' },
  white: { shirt1: '#ffffff', shirt2: '#dde3ee', trim: '#ff5fa2', shorts: '#ff5fa2', socks: '#f2f5fb', num: '#2a3049', sleeve: '#ff5fa2', cap: '#ff5fa2' },
  gkB: { shirt1: '#3fd97c', shirt2: '#12944a', trim: '#eafff2', shorts: '#0c6b35', socks: '#12944a', num: '#eafff2', sleeve: '#1cb35d', cap: '#0c6b35' },
  gkY: { shirt1: '#ffd23f', shirt2: '#d99a12', trim: '#fff7dd', shorts: '#8f6406', socks: '#d99a12', num: '#5c4305', sleeve: '#e8b62a', cap: '#8f6406' },
};

function rr(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerT, g: GameView) {
  const pr = GPROJ!.P(p.x, p.y, 0);
  if (!pr) return;
  const s = pr.s * 1.02;
  const t = g.tGlobal;

  ctx.save();
  ctx.translate(pr.x, pr.y);
  ctx.scale(s, s);

  const kit = p.gk ? (p.team === 0 ? KITS.gkB : KITS.gkY) : p.team === 0 ? KITS.blue : KITS.white;
  const moving = Math.hypot(p.vx, p.vy) > 30;
  const dash = p.dashT > 0;

  // selection + ball glow on the ground
  if (p.hasBallGlow > 0.02) {
    ctx.fillStyle = `rgba(140,255,190,${0.18 * p.hasBallGlow})`;
    ctx.beginPath();
    ctx.ellipse(0, 2, 21, 8.6, 0, 0, TAU);
    ctx.fill();
  }
  if (p.id === g.activeId && !g.demo) {
    const a = 0.55 + Math.sin(t * 6) * 0.18;
    ctx.strokeStyle = `rgba(93,178,255,${a})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(0, 2.5, 24 + Math.sin(t * 6) * 2, 10, 0, 0, TAU);
    ctx.stroke();
  }
  if (dash) {
    ctx.strokeStyle = `rgba(255,210,63,${0.35 + p.dashT})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 2.5, 27, 11, 0, 0, TAU);
    ctx.stroke();
  }

  const legSwing = moving ? Math.sin(p.runPhase) : 0;
  const px = Math.cos(p.dir), py2 = Math.sin(p.dir);
  const nx = -py2, ny = px;
  const kick = p.kickT > 0 ? Math.sin((1 - p.kickT / 0.32) * Math.PI) : 0;

  // feet stay planted: hips bob slightly, legs swing from the hip
  const hipY = -24 + Math.abs(legSwing) * -1.6;
  const stride = 9 * legSwing + kick * 10;

  // legs
  ctx.lineCap = 'round';
  ctx.lineWidth = 6.4;
  // back leg
  ctx.strokeStyle = kit.socks;
  ctx.beginPath();
  ctx.moveTo(nx * 5.4, hipY + 6);
  ctx.lineTo(nx * 5.4 + px * -stride * 0.8, -3 + Math.max(0, -legSwing) * -2);
  ctx.stroke();
  // front / kicking leg
  ctx.strokeStyle = kit.socks;
  ctx.beginPath();
  ctx.moveTo(nx * -5.4, hipY + 6);
  ctx.lineTo(nx * -5.4 + px * (stride * 0.8 + kick * 9), -3 + Math.max(0, legSwing) * -2 - kick * 4);
  ctx.stroke();
  // boots
  for (const side of [1, -1]) {
    const swing = side === 1 ? -stride * 0.8 : stride * 0.8 + kick * 9;
    const fx = nx * 5.4 * side + px * swing;
    const fy = -3 + (side === 1 ? Math.max(0, -legSwing) : Math.max(0, legSwing)) * -2 - (side === -1 ? kick * 4 : 0);
    ctx.fillStyle = '#171c28';
    ctx.beginPath();
    ctx.ellipse(fx + px * 1.9, fy - 1.2, 5, 2.9, Math.atan2(py2, px), 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = kit.shorts;
  rr(ctx, -12, hipY - 2, 24, 13, 5.4);
  ctx.fill();

  const tg = ctx.createLinearGradient(0, hipY - 34, 0, hipY - 4);
  tg.addColorStop(0, kit.shirt1);
  tg.addColorStop(1, kit.shirt2);
  ctx.fillStyle = tg;
  rr(ctx, -12.6, hipY - 32, 25.2, 31, 7);
  ctx.fill();

  // sleeves + arms swing
  const armSwing = moving ? Math.sin(p.runPhase + Math.PI) * 6 : 0;
  ctx.fillStyle = p.gk ? (p.team === 0 ? KITS.gkB.cap : KITS.gkY.cap) : p.team === 1 ? '#ff5fa2' : 'rgba(255,255,255,0.9)';
  rr(ctx, -16.8, hipY - 30, 6.4, 12, 3.2);
  ctx.fill();
  rr(ctx, 10.4, hipY - 30, 6.4, 12, 3.2);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = p.skin;
  ctx.beginPath();
  ctx.moveTo(-13.6, hipY - 19);
  ctx.lineTo(-15.2, hipY - 6 + armSwing);
  ctx.moveTo(13.6, hipY - 19);
  ctx.lineTo(15.2, hipY - 6 - armSwing);
  ctx.stroke();

  // number on back
  ctx.fillStyle = kit.num;
  ctx.font = '800 12px Rubik, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(p.num), 0, hipY - 12);

  // head
  const headY = hipY - 42;
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.arc(0, headY, 7.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = p.hair;
  ctx.beginPath();
  ctx.arc(0, headY - 1.6, 7.6, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();
  if (p.gk) {
    ctx.fillStyle = p.team === 0 ? KITS.gkB.cap : KITS.gkY.cap;
    ctx.beginPath();
    ctx.arc(0, headY - 2.4, 6.3, Math.PI, TAU);
    ctx.fill();
    ctx.fillRect(-6.3, headY - 2.8, 12.6, 2.3);
  }

  // celebrating arms up
  if (p.celebrateT > 0) {
    ctx.lineWidth = 5;
    ctx.strokeStyle = p.skin;
    ctx.beginPath();
    const wv = Math.sin(t * 12) * 3;
    ctx.moveTo(-12, hipY - 26);
    ctx.lineTo(-19, hipY - 46 + wv);
    ctx.moveTo(12, hipY - 26);
    ctx.lineTo(19, hipY - 46 - wv);
    ctx.stroke();
  }

  ctx.restore();

  // floating marker for the active player
  const mp = GPROJ!.P(p.x, p.y, 0);
  if (mp && p.id === g.activeId && !g.demo) {
    const by = mp.y - 66 * s - Math.sin(t * 6) * 3.4 * s;
    ctx.save();
    ctx.translate(mp.x, by);
    ctx.scale(s, s);
    ctx.fillStyle = '#5db2ff';
    ctx.strokeStyle = '#eaf6ff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-8.4, 0);
    ctx.lineTo(8.4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawBall(ctx: CanvasRenderingContext2D, P: Proj, g: GameView) {
  const b = g.ball;

  for (const t of g.trail) {
    const tp = P(t.x, t.y, t.z);
    if (!tp) continue;
    ctx.fillStyle = `rgba(255,255,255,${0.2 * t.life})`;
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, 6.5 * tp.s * t.life, 0, TAU);
    ctx.fill();
  }

  const p = P(b.x, b.y, b.z);
  if (!p) return;
  const r = 11.5 * p.s;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(b.spin);
  const bg = ctx.createRadialGradient(-r * 0.3, -r * 0.34, r * 0.12, 0, 0, r + 1);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(0.75, '#f2f4f8');
  bg.addColorStop(1, '#c3ccd8');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#1c212c';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2;
    const px2 = Math.cos(a) * r * 0.46, py3 = Math.sin(a) * r * 0.46;
    if (i === 0) ctx.moveTo(px2, py3);
    else ctx.lineTo(px2, py3);
  }
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2 + Math.PI / 5;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (r - r * 0.16), Math.sin(a) * (r - r * 0.16), r * 0.36, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(20,26,38,0.5)';
  ctx.lineWidth = Math.max(0.8, 1.4 * p.s);
  ctx.beginPath();
  ctx.arc(0, 0, r - 0.5, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

/* ---------------- ground overlays (rings & markers) ---------------- */
function drawOverlays(ctx: CanvasRenderingContext2D, m: CamMat, P: Proj, g: GameView) {
  if (!g.demo && g.chargeFrac > 0.01) {
    const a = g.players[g.activeId];
    if (a) {
      strokeArc(ctx, m, a.x, a.y, 32, 0, 0, TAU, 30, 'rgba(255,255,255,0.22)', 4);
      const frac = g.chargeFrac;
      const col = frac < 0.5 ? '#ffd23f' : frac < 0.8 ? '#ff9a3f' : '#ff5f5f';
      strokeArc(ctx, m, a.x, a.y, 32, 0, -Math.PI / 2, -Math.PI / 2 + frac * TAU, 30, col, 4.4);
    }
  }
  if (g.crossMark) {
    const mm = g.crossMark;
    const pulse = 1 + Math.sin(g.tGlobal * 14) * 0.12;
    const col = `rgba(125,220,255,${clamp(mm.t, 0, 1) * 0.9})`;
    strokeArc(ctx, m, mm.x, mm.y, 24 * pulse, 0, 0, TAU, 26, col, 3.4);
    strokeArc(ctx, m, mm.x, mm.y, 9, 0, 0, TAU, 14, col, 3);
  }
}

/* ---------------- pitch markings ---------------- */
function drawMarkings(ctx: CanvasRenderingContext2D, m: CamMat) {
  const W = 'rgba(255,255,255,0.92)';
  const lw = 4.4;

  const L = (x1: number, y1: number, x2: number, y2: number, w = lw) =>
    lineSeg(ctx, x1, y1, x2, y2, W, w);

  // boundary
  L(0, 0, PITCH_W, 0);
  L(PITCH_W, 0, PITCH_W, PITCH_H);
  L(PITCH_W, PITCH_H, 0, PITCH_H);
  L(0, PITCH_H, 0, 0);
  // halfway
  L(PITCH_W / 2, 0, PITCH_W / 2, PITCH_H);
  // center circle + spot
  strokeArc(ctx, m, PITCH_W / 2, CY, 128, 0, 0, TAU, 46, W, lw);
  centerDot(ctx, PITCH_W / 2, CY);
  for (const gx of [0, PITCH_W]) {
    const sgn = gx === 0 ? 1 : -1;
    // penalty box
    L(gx, CY - 250, gx + sgn * 210, CY - 250);
    L(gx + sgn * 210, CY - 250, gx + sgn * 210, CY + 250);
    L(gx + sgn * 210, CY + 250, gx, CY + 250);
    // goal area
    L(gx, CY - 118, gx + sgn * 82, CY - 118);
    L(gx + sgn * 82, CY - 118, gx + sgn * 82, CY + 118);
    L(gx + sgn * 82, CY + 118, gx, CY + 118);
    // penalty spot
    centerDot(ctx, gx + sgn * 148, CY);
    // corner arcs
    strokeArc(ctx, m, gx, 0, 26, 0, gx === 0 ? 0 : Math.PI / 2, gx === 0 ? Math.PI / 2 : Math.PI, 14, W, lw);
    strokeArc(ctx, m, gx, PITCH_H, 26, 0, gx === 0 ? -Math.PI / 2 : Math.PI, gx === 0 ? 0 : Math.PI * 1.5, 14, W, lw);
  }
}

function lineSeg(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, width: number
) {
  const a = groundXY(x1, y1);
  const b = groundXY(x2, y2);
  if (!a || !b) {
    // partial clip: sample the segment
    let prev: { x: number; y: number } | null = null;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const p = groundXY(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
      if (!p) { started = false; prev = null; continue; }
      if (!started) { ctx.moveTo(p.x, p.y); started = true; }
      else ctx.lineTo(p.x, p.y);
      prev = p;
    }
    void prev;
    ctx.stroke();
    return;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function groundXY(x: number, y: number) {
  if (!GPROJ) return null;
  const p = GPROJ.P(x, y, 0);
  if (!p) return null;
  return { x: p.x, y: p.y };
}

function centerDot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const p = GPROJ ? GPROJ.P(x, y, 0) : null;
  if (!p) return;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(2.4, 5 * p.s), 0, TAU);
  ctx.fill();
}

/* ---------------- goals (3D with net) ---------------- */
function drawGoal(ctx: CanvasRenderingContext2D, g: GameView, side: -1 | 1) {
  // side = -1 → left goal (x=0), +1 → right goal (x=PITCH_W)
  const gx = side === -1 ? 0 : PITCH_W;
  const depth = side === -1 ? -NET_DEPTH : NET_DEPTH;
  const y0 = CY - GOAL_HALF;
  const y1 = CY + GOAL_HALF;
  const P = GPROJ!.P;

  const ripple =
    g.netRipple.side === side ? g.netRipple.amt : 0;
  const wob = (yy: number, i: number) =>
    ripple > 0
      ? Math.sin(yy * 0.05 + i * 1.7 + g.tGlobal * 16) * 10 * ripple * (side === g.netRipple.side ? 1 : 0)
      : 0;

  // back net (vertical)
  ctx.fillStyle = 'rgba(232,240,255,0.10)';
  ctx.beginPath();
  let pts = [P(gx + depth, y0, 0), P(gx + depth, y1, 0), P(gx + depth, y1, GOAL_H), P(gx + depth, y0, GOAL_H)];
  if (pts.every(Boolean)) {
    ctx.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
    ctx.closePath();
    ctx.fill();
  }
  // side nets
  for (const yy of [y0, y1]) {
    ctx.beginPath();
    pts = [P(gx, yy, 0), P(gx + depth, yy, 0), P(gx + depth, yy, GOAL_H), P(gx, yy, GOAL_H)];
    if (pts.every(Boolean)) {
      ctx.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(232,240,255,0.09)';
      ctx.fill();
    }
  }
  // roof net
  ctx.beginPath();
  pts = [P(gx, y0, GOAL_H), P(gx, y1, GOAL_H), P(gx + depth, y1, GOAL_H), P(gx + depth, y0, GOAL_H)];
  if (pts.every(Boolean)) {
    ctx.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(232,240,255,0.08)';
    ctx.fill();
  }

  // net mesh lines
  ctx.strokeStyle = 'rgba(240,246,255,0.4)';
  ctx.lineWidth = 1.1;
  const rows = 6;
  for (let i = 0; i <= rows; i++) {
    const z = (GOAL_H / rows) * i;
    line3(ctx, gx + depth, y0, z, gx + depth, y1, z, 'rgba(240,246,255,0.35)', 1.1);
  }
  for (let i = 0; i <= 8; i++) {
    const yy = y0 + ((y1 - y0) / 8) * i;
    line3(ctx, gx + depth, yy, 0, gx + depth, yy, GOAL_H, 'rgba(240,246,255,0.3)', 1);
    line3(ctx, gx, yy, GOAL_H, gx + depth, yy, GOAL_H, 'rgba(240,246,255,0.3)', 1);
  }
  for (let i = 0; i <= 4; i++) {
    const yy = y0 + ((y1 - y0) / 4) * i;
    line3(ctx, gx, yy, 0, gx, yy, GOAL_H, 'rgba(240,246,255,0.26)', 1);
  }
  void wob;

  // posts & crossbar (white, bold)
  const post = '#f5f8ff';
  for (const yy of [y0, y1]) {
    line3(ctx, gx, yy, 0, gx, yy, GOAL_H, post, 7);
    // post base
    const b = P(gx, yy, 0);
    if (b) {
      ctx.fillStyle = '#e8eefb';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, 7 * b.s, 3.4 * b.s, 0, 0, TAU);
      ctx.fill();
    }
  }
  line3(ctx, gx, y0, GOAL_H, gx, y1, GOAL_H, post, 7);

  // goal-line emphasis
  line3(ctx, gx, y0, 0.5, gx, y1, 0.5, 'rgba(255,255,255,0.95)', 4);
}

/* ---------------- crowd & stands & lights ---------------- */
let specks: { x: number; y: number; a: number }[] | null = null;
function buildSpecks() {
  if (specks) return;
  specks = [];
  for (let i = 0; i < 240; i++) {
    specks.push({
      x: Math.random() * PITCH_W,
      y: Math.random() * PITCH_H,
      a: 0.05 + Math.random() * 0.09,
    });
  }
}

function drawStands(ctx: CanvasRenderingContext2D, P: Proj, g: GameView) {
  buildCrowd();
  buildSpecks();

  // stand base blocks
  const apron = 60;
  const blocks: [number, number, number, number, number, string][] = [
    [-MARGIN, -MARGIN + apron, PITCH_W + 2 * MARGIN, MARGIN * 0.62 - apron, 26, '#14213a'], // north
    [-MARGIN, PITCH_H + MARGIN * 0.38, PITCH_W + 2 * MARGIN, MARGIN * 0.62 - apron, 26, '#111d33'], // south
    [-MARGIN, -MARGIN * 0.3, MARGIN * 0.55, PITCH_H + MARGIN * 0.6, 26, '#131f37'], // west
    [PITCH_W + MARGIN * 0.45, -MARGIN * 0.3, MARGIN * 0.55, PITCH_H + MARGIN * 0.6, 26, '#131f37'], // east
  ];
  for (const [bx, by, bw, bh, h, col] of blocks) {
    fillQuad(ctx, null as unknown as CamMat, [
      [bx, by, h], [bx + bw, by, h], [bx + bw, by + bh, h], [bx, by + bh, h],
    ], col);
  }

  // crowd (animated)
  const t = g.tGlobal;
  for (const c of crowdSeed!) {
    const jump = Math.sin(t * 3 + c.ph) * 4 + 4;
    const p = P(c.x, c.y, 26 + jump * c.s);
    if (!p) continue;
    ctx.fillStyle = c.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1.6, 3.4 * p.s * c.s), 0, TAU);
    ctx.fill();
  }

  // advertising boards around the pitch
  const boards: [number, number, number, string][] = [];
  const bw = 150;
  for (let i = 0; i < 10; i++) {
    const cols = ['#1b5fd6', '#e02f45', '#17994c', '#e08b12'];
    boards.push([i * (PITCH_W / 10) + 20, -34, bw, cols[i % 4]]);
    boards.push([i * (PITCH_W / 10) + 20, PITCH_H + 12, bw, cols[(i + 2) % 4]]);
  }
  for (const [bx, by, w2, col] of boards) {
    fillQuad(ctx, null as unknown as CamMat, [
      [bx, by, 0], [bx + w2, by, 0], [bx + w2, by, 26], [bx, by, 26],
    ], col);
    fillQuad(ctx, null as unknown as CamMat, [
      [bx, by, 26], [bx + w2, by, 26], [bx + w2, by + (by < 0 ? -6 : 6), 26], [bx, by + (by < 0 ? -6 : 6), 26],
    ], 'rgba(255,255,255,0.25)');
  }

  // floodlight towers at the four corners
  const towers: [number, number][] = [
    [-MARGIN * 0.55, -MARGIN * 0.4],
    [PITCH_W + MARGIN * 0.55, -MARGIN * 0.4],
    [-MARGIN * 0.55, PITCH_H + MARGIN * 0.4],
    [PITCH_W + MARGIN * 0.55, PITCH_H + MARGIN * 0.4],
  ];
  for (const [tx, ty] of towers) {
    line3(ctx, tx, ty, 0, tx, ty, 300, '#243352', 9);
    const top = P(tx, ty, 300);
    if (!top) continue;
    // lamp panel
    ctx.save();
    ctx.translate(top.x, top.y);
    ctx.fillStyle = '#0e1830';
    rr(ctx, -26 * top.s, -16 * top.s, 52 * top.s, 30 * top.s, 5 * top.s);
    ctx.fill();
    ctx.fillStyle = '#fff6d8';
    for (let r = 0; r < 2; r++)
      for (let cI = 0; cI < 4; cI++) {
        ctx.beginPath();
        ctx.arc(
          (-18 + cI * 12) * top.s,
          (-8 + r * 13) * top.s,
          3.4 * top.s,
          0,
          TAU
        );
        ctx.fill();
      }
    // glow
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 120 * top.s);
    glow.addColorStop(0, 'rgba(255,244,200,0.5)');
    glow.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 120 * top.s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, P: Proj, g: GameView) {
  for (const p of g.particles) {
    const a = clamp(p.life / p.maxLife, 0, 1);
    const sp = P(p.x, p.y, p.z);
    if (!sp) continue;
    if (p.kind === 'confetti') {
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size * sp.s * 0.5, -p.size * sp.s * 0.28, p.size * sp.s, p.size * sp.s * 0.56);
      ctx.restore();
    } else if (p.kind === 'dust') {
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, p.size * sp.s * (1.6 - a * 0.6), 0, TAU);
      ctx.fill();
    } else {
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, p.size * sp.s, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/* ================= main frame ================= */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  g: GameView,
  vw: number,
  vh: number,
  dpr: number
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const { P, m } = makeProjection(g, vw, vh);
  GPROJ = { P, m };

  drawWorld(ctx, P, g, vw, vh);
  drawStands(ctx, P, g);
  drawMarkings(ctx, m);
  drawOverlays(ctx, m, P, g);
  drawShadows(ctx, P, g);

  // draw goals behind players when appropriate (left goal can be in front of far players)
  drawGoal(ctx, g, -1);
  drawGoal(ctx, g, 1);

  // depth-sort players + ball (far → near: larger world y = nearer? we use camera depth)
  const items: { d: number; draw: () => void }[] = [];
  for (const p of g.players) {
    const pr = P(p.x, p.y, 0);
    if (!pr) continue;
    items.push({ d: pr.d, draw: () => drawPlayer(ctx, p, g) });
  }
  const bp = P(g.ball.x, g.ball.y, g.ball.z);
  if (bp) items.push({ d: bp.d, draw: () => drawBall(ctx, P, g) });
  items.sort((a, b) => b.d - a.d);
  for (const it of items) it.draw();

  drawParticles(ctx, P, g);

  // distance fog toward the far end for depth
  const far = P(PITCH_W / 2, PITCH_H + MARGIN, 0);
  if (far) {
    const fog = ctx.createLinearGradient(0, far.y - 40, 0, far.y + 220);
    fog.addColorStop(0, 'rgba(8,14,28,0.5)');
    fog.addColorStop(1, 'rgba(8,14,28,0)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, Math.max(0, far.y - 40), vw, 260);
  }
}
