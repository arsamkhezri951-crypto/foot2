import {
  GOAL_H,
  GOAL_HALF,
  CY,
  MARGIN,
  NET_DEPTH,
  PITCH_H,
  PITCH_W,
  clamp,
  type GameView,
  type PlayerT,
} from './types';

const TAU = Math.PI * 2;
const NEAR = 24; // near clip plane (camera-space depth)

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
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

/* ---------------- camera space & projection ---------------- */
interface PP {
  x: number;
  y: number;
  s: number; // scale (focal/depth)
  d: number; // depth
}
interface V3 {
  xr: number; // right offset
  yu: number; // up offset
  d: number; // forward depth
}
interface CamMat {
  ex: number; ey: number; ez: number;
  fx: number; fy: number; fz: number;
  rx: number; ry: number; rz: number;
  ux: number; uy: number; uz: number;
  focal: number;
  cx: number;
  cy: number;
}

function lookAt(
  ex: number, ey: number, ez: number,
  tx: number, ty: number, tz: number,
  focal: number, cx: number, cy: number
): CamMat {
  let fx = tx - ex, fy = ty - ey, fz = tz - ez;
  const fl = Math.hypot(fx, fy, fz);
  fx /= fl; fy /= fl; fz /= fl;
  // right = normalize(cross(F, up)) with up=(0,0,1) → (fy, -fx, 0)
  const rl = Math.hypot(fx, fy) || 1;
  const rx = fy / rl, ry = -fx / rl, rz = 0;
  // camera up = cross(R, F)
  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;
  return { ex, ey, ez, fx, fy, fz, rx, ry, rz, ux, uy, uz, focal, cx, cy };
}

const toCam = (m: CamMat, x: number, y: number, z: number): V3 => {
  const vx = x - m.ex, vy = y - m.ey, vz = z - m.ez;
  return {
    xr: vx * m.rx + vy * m.ry + vz * m.rz,
    yu: vx * m.ux + vy * m.uy + vz * m.uz,
    d: vx * m.fx + vy * m.fy + vz * m.fz,
  };
};

const projV = (m: CamMat, v: V3): PP => ({
  x: m.cx + (v.xr / v.d) * m.focal,
  y: m.cy - (v.yu / v.d) * m.focal,
  s: m.focal / v.d,
  d: v.d,
});

/* clip a segment against the near plane → 0 or 1 visible segment */
function clipSeg(a: V3, b: V3): V3[] {
  const ain = a.d >= NEAR, bin = b.d >= NEAR;
  if (ain && bin) return [a, b];
  if (!ain && !bin) return [];
  const t = (NEAR - a.d) / (b.d - a.d);
  const m2: V3 = {
    xr: a.xr + (b.xr - a.xr) * t,
    yu: a.yu + (b.yu - a.yu) * t,
    d: NEAR,
  };
  return ain ? [a, m2] : [m2, b];
}

/* Sutherland–Hodgman clip of a convex loop (for fills) */
function clipPoly(pts: V3[]): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i], next = pts[(i + 1) % pts.length];
    const cin = cur.d >= NEAR, nin = next.d >= NEAR;
    if (cin) out.push(cur);
    if (cin !== nin) {
      const t = (NEAR - cur.d) / (next.d - cur.d);
      out.push({
        xr: cur.xr + (next.xr - cur.xr) * t,
        yu: cur.yu + (next.yu - cur.yu) * t,
        d: NEAR,
      });
    }
  }
  return out;
}

/* point projection (null when behind the camera) */
const makeProjector =
  (m: CamMat) =>
  (x: number, y: number, z: number): PP | null => {
    const v = toCam(m, x, y, z);
    if (v.d < NEAR) return null;
    return projV(m, v);
  };
type Proj = (x: number, y: number, z: number) => PP | null;

/* ---------------- precomputed scenery ---------------- */
const CROWD_BASE = ['#39415a', '#4a5470', '#2e3550', '#5b6480', '#414b66', '#333c58'];
const CROWD_ACCENT = ['#2f7dff', '#ff5fa2', '#e8edf7', '#ffd23f'];
const BOARD_COLS = ['#d92e4b', '#1f7ae0', '#f2a007', '#0ea672', '#7a3ff2', '#c93a8e'];
const BRANDS = ['NOVA', 'ZUMO', 'KIKO', 'VOLTA', 'ORBE', 'PIXEL', 'TURBO', 'AERO'];

interface CrowdDot { x: number; y: number; z: number; c: string; w: number; }
interface Speck { x: number; y: number; a: number; }

let crowdDots: CrowdDot[] | null = null;
let specks: Speck[] | null = null;

function scenery() {
  if (crowdDots) return;
  crowdDots = [];
  specks = [];
  const OUT = 980;
  for (let i = 0; i < 460; i++) {
    const x = -OUT + Math.random() * (PITCH_W + OUT * 2);
    const y = -OUT + Math.random() * (PITCH_H + OUT * 2);
    const dx = Math.max(-x, x - PITCH_W, 0);
    const dy = Math.max(-y, y - PITCH_H, 0);
    const d = Math.hypot(dx, dy);
    if (d < MARGIN + 30) continue;
    const z = clamp((d - MARGIN - 20) * 0.62, 26, 430) + Math.random() * 22;
    const acc = Math.random() < 0.06;
    crowdDots.push({
      x, y, z,
      c: acc
        ? CROWD_ACCENT[(Math.random() * CROWD_ACCENT.length) | 0]
        : CROWD_BASE[(Math.random() * CROWD_BASE.length) | 0],
      w: 2.6 + Math.random() * 1.8,
    });
  }
  for (let i = 0; i < 170; i++)
    specks.push({
      x: Math.random() * PITCH_W,
      y: Math.random() * PITCH_H,
      a: 0.04 + Math.random() * 0.06,
    });
}

/* ---------------- drawing helpers (all near-plane clipped) ---------------- */
function line3(
  ctx: CanvasRenderingContext2D, m: CamMat,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  lw: number, style: string
) {
  const seg = clipSeg(toCam(m, x1, y1, z1), toCam(m, x2, y2, z2));
  if (seg.length < 2) return;
  const a = projV(m, seg[0]), b = projV(m, seg[1]);
  ctx.strokeStyle = style;
  ctx.lineWidth = Math.max(0.7, lw * ((a.s + b.s) / 2));
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

/* closed convex fill — clipped */
function fillPoly(
  ctx: CanvasRenderingContext2D, m: CamMat,
  pts: number[][], style: string | CanvasGradient
) {
  const clipped = clipPoly(pts.map(([x, y, z]) => toCam(m, x, y, z)));
  if (clipped.length < 3) return;
  ctx.beginPath();
  clipped.forEach((v, i) => {
    const p = projV(m, v);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fillStyle = style;
  ctx.fill();
}

/* closed outline — per-segment clipping (no near-plane chord) */
function strokeLoop(
  ctx: CanvasRenderingContext2D, m: CamMat,
  pts: number[][], style: string, lw: number
) {
  ctx.strokeStyle = style;
  ctx.beginPath();
  let sAcc = 0, n = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1, z1] = pts[i];
    const [x2, y2, z2] = pts[(i + 1) % pts.length];
    const seg = clipSeg(toCam(m, x1, y1, z1), toCam(m, x2, y2, z2));
    if (seg.length < 2) continue;
    const a = projV(m, seg[0]), b = projV(m, seg[1]);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    sAcc += (a.s + b.s) / 2;
    n++;
  }
  if (n) {
    ctx.lineWidth = Math.max(0.8, lw * (sAcc / n));
    ctx.stroke();
  }
}

/* arc / circle outline — clipped polyline */
function strokeArc(
  ctx: CanvasRenderingContext2D, m: CamMat,
  cx: number, cy: number, r: number, z: number,
  a0: number, a1: number, seg: number, style: string, lw: number
) {
  const pts: V3[] = [];
  for (let i = 0; i <= seg; i++) {
    const a = a0 + ((a1 - a0) * i) / seg;
    pts.push(toCam(m, cx + Math.cos(a) * r, cy + Math.sin(a) * r, z));
  }
  ctx.strokeStyle = style;
  ctx.beginPath();
  let sAcc = 0, n = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const s2 = clipSeg(pts[i], pts[i + 1]);
    if (s2.length < 2) continue;
    const a = projV(m, s2[0]), b = projV(m, s2[1]);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    sAcc += (a.s + b.s) / 2;
    n++;
  }
  if (n) {
    ctx.lineWidth = Math.max(0.8, lw * (sAcc / n));
    ctx.stroke();
  }
}

/* =====================================================================
   Frame renderer — broadcast-style 3D camera gliding after the ball.
   ===================================================================== */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  g: GameView,
  vw: number,
  vh: number,
  dpr: number
) {
  scenery();

  /* ---- camera (eye behind & above the focus, tilted broadcast view) ---- */
  const BACK = PITCH_H * 0.56;
  const EYE_H = PITCH_H * 0.5;
  const focal = Math.min(vw, vh * 1.35) * 0.98 * g.cam.zoom;
  const mat = lookAt(
    g.cam.x, g.cam.y - BACK, EYE_H,
    g.cam.x, g.cam.y + 40, 0,
    focal, vw / 2, vh / 2
  );
  const P = makeProjector(mat);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  /* ---- night sky ---- */
  const sky = ctx.createLinearGradient(0, 0, 0, vh);
  sky.addColorStop(0, '#0d1d38');
  sky.addColorStop(0.55, '#091327');
  sky.addColorStop(1, '#040912');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, vw, vh);

  drawStands(ctx, mat, P, g, vw, vh);
  drawPitch(ctx, mat, P);
  drawBoards(ctx, mat);
  drawFloodBeams(ctx, mat);

  /* goals (far one first) */
  const dL = P(0, CY, 0)?.d ?? 0;
  const dR = P(PITCH_W, CY, 0)?.d ?? 0;
  if (dL > dR) { drawGoal(ctx, mat, g, 0); drawGoal(ctx, mat, g, PITCH_W); }
  else { drawGoal(ctx, mat, g, PITCH_W); drawGoal(ctx, mat, g, 0); }

  drawShadows(ctx, P, g);
  drawEntities(ctx, P, g);
  drawOverlays(ctx, mat, P, g);
  drawParticles(ctx, P, g);

  /* ---- vignette ---- */
  const vig = ctx.createRadialGradient(
    vw / 2, vh / 2, Math.min(vw, vh) * 0.36,
    vw / 2, vh / 2, Math.max(vw, vh) * 0.72
  );
  vig.addColorStop(0, 'rgba(3,7,16,0)');
  vig.addColorStop(1, 'rgba(3,7,16,0.46)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, vw, vh);
}

/* ---------------- stands / crowd / lights ---------------- */
function drawStands(
  ctx: CanvasRenderingContext2D, m: CamMat, P: Proj, g: GameView,
  vw: number, vh: number
) {
  const OUT = 980;
  // bowl base
  fillPoly(
    ctx, m,
    [[-OUT, -OUT, 0], [PITCH_W + OUT, -OUT, 0],
     [PITCH_W + OUT, PITCH_H + OUT, 0], [-OUT, PITCH_H + OUT, 0]],
    '#0d1526'
  );

  // tier edge rings
  for (const mm of [MARGIN + 90, MARGIN + 280, MARGIN + 520, MARGIN + 800]) {
    const z = clamp((mm - MARGIN - 20) * 0.62, 26, 430);
    strokeLoop(
      ctx, m,
      [[-mm, -mm, z], [PITCH_W + mm, -mm, z],
       [PITCH_W + mm, PITCH_H + mm, z], [-mm, PITCH_H + mm, z]],
      'rgba(120,150,210,0.10)', 2
    );
  }

  // living crowd
  const t = g.tGlobal;
  for (const c of crowdDots!) {
    const wave = Math.sin(t * 2.1 + c.x * 0.013 + c.y * 0.011) * 2.2;
    const p = P(c.x, c.y, c.z + wave);
    if (!p || p.x < -20 || p.x > vw + 20 || p.y < -20 || p.y > vh + 20) continue;
    ctx.globalAlpha = clamp(0.9 - p.d / 2600, 0.25, 0.9);
    ctx.fillStyle = c.c;
    const w = clamp(c.w * p.s * 0.9, 1.4, 7);
    ctx.fillRect(p.x - w / 2, p.y - w / 2, w, w * 1.15);
  }
  ctx.globalAlpha = 1;

  // floodlight towers
  for (const [lx, ly] of [
    [-180, -180], [PITCH_W + 180, -180],
    [-180, PITCH_H + 180], [PITCH_W + 180, PITCH_H + 180],
  ]) {
    const top = P(lx, ly, 800);
    const foot = P(lx, ly, 0);
    if (!top || !foot) continue;
    ctx.strokeStyle = '#1c2740';
    ctx.lineWidth = Math.max(2, 7 * top.s);
    ctx.beginPath();
    ctx.moveTo(foot.x, foot.y);
    ctx.lineTo(top.x, top.y);
    ctx.stroke();
    const hw = 34 * top.s, hh = 13 * top.s;
    ctx.fillStyle = '#222e4c';
    rr(ctx, top.x - hw / 2, top.y - hh / 2, hw, hh, 3 * top.s);
    ctx.fill();
    ctx.fillStyle = '#eaf3ff';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(top.x - hw / 2 + hw * (0.12 + 0.19 * i), top.y, Math.max(1, 2.4 * top.s), 0, TAU);
      ctx.fill();
    }
    const gl = ctx.createRadialGradient(top.x, top.y, 1, top.x, top.y, 90 * top.s + 30);
    gl.addColorStop(0, 'rgba(200,225,255,0.5)');
    gl.addColorStop(1, 'rgba(200,225,255,0)');
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(top.x, top.y, 90 * top.s + 30, 0, TAU);
    ctx.fill();
  }
}

function drawFloodBeams(ctx: CanvasRenderingContext2D, m: CamMat) {
  ctx.fillStyle = 'rgba(190,215,255,0.045)';
  for (const [lx, ly, tx2, ty2] of [
    [-180, -180, PITCH_W * 0.55, PITCH_H * 0.6],
    [PITCH_W + 180, -180, PITCH_W * 0.45, PITCH_H * 0.6],
    [-180, PITCH_H + 180, PITCH_W * 0.55, PITCH_H * 0.4],
    [PITCH_W + 180, PITCH_H + 180, PITCH_W * 0.45, PITCH_H * 0.4],
  ] as const) {
    const seg1 = clipSeg(toCam(m, lx, ly, 780), toCam(m, tx2 - 130, ty2, 0));
    const seg2 = clipSeg(toCam(m, lx, ly, 780), toCam(m, tx2 + 130, ty2, 0));
    if (seg1.length < 2 || seg2.length < 2) continue;
    const a = projV(m, seg1[0]); // the light head end
    const b = projV(m, seg1[seg1.length - 1]);
    const c = projV(m, seg2[seg2.length - 1]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fill();
  }
}

/* ---------------- pitch ---------------- */
function drawPitch(ctx: CanvasRenderingContext2D, m: CamMat, P: Proj) {
  // apron (run-off turf)
  fillPoly(
    ctx, m,
    [[-MARGIN, -MARGIN, 0], [PITCH_W + MARGIN, -MARGIN, 0],
     [PITCH_W + MARGIN, PITCH_H + MARGIN, 0], [-MARGIN, PITCH_H + MARGIN, 0]],
    '#1b6e39'
  );
  strokeLoop(
    ctx, m,
    [[-MARGIN, -MARGIN, 0], [PITCH_W + MARGIN, -MARGIN, 0],
     [PITCH_W + MARGIN, PITCH_H + MARGIN, 0], [-MARGIN, PITCH_H + MARGIN, 0]],
    'rgba(6,26,14,0.5)', 3
  );

  // mow stripes
  const stripes = 16;
  const sw = PITCH_W / stripes;
  for (let i = 0; i < stripes; i++) {
    fillPoly(
      ctx, m,
      [[i * sw, 0, 0], [(i + 1) * sw, 0, 0], [(i + 1) * sw, PITCH_H, 0], [i * sw, PITCH_H, 0]],
      i % 2 === 0 ? '#2f9e51' : '#2a914b'
    );
  }

  // depth haze toward the far end
  const ha = P(0, 0, 0), hb = P(0, PITCH_H * 0.55, 0);
  if (ha && hb) {
    const hz = ctx.createLinearGradient(ha.x, ha.y, hb.x, hb.y);
    hz.addColorStop(0, 'rgba(9,20,40,0.30)');
    hz.addColorStop(1, 'rgba(9,20,40,0)');
    fillPoly(
      ctx, m,
      [[0, 0, 0], [PITCH_W, 0, 0], [PITCH_W, PITCH_H * 0.55, 0], [0, PITCH_H * 0.55, 0]],
      hz
    );
  }

  // stadium light pool at the center
  const cp = P(PITCH_W / 2, CY, 0);
  if (cp) {
    const pool = ctx.createRadialGradient(cp.x, cp.y, 10, cp.x, cp.y, 340 * cp.s);
    pool.addColorStop(0, 'rgba(220,255,225,0.10)');
    pool.addColorStop(1, 'rgba(220,255,225,0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(cp.x, cp.y, 340 * cp.s, 200 * cp.s, 0, 0, TAU);
    ctx.fill();
  }

  // grass specks
  for (const s of specks!) {
    const p = P(s.x, s.y, 0);
    if (!p) continue;
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#0d3a1e';
    const w = Math.max(1.2, 2.4 * p.s);
    ctx.fillRect(p.x, p.y, w, w);
  }
  ctx.globalAlpha = 1;

  /* ---- markings ---- */
  const WHITE = 'rgba(255,255,255,0.92)';
  ctx.lineJoin = 'round';

  strokeLoop(
    ctx, m,
    [[0, 0, 0], [PITCH_W, 0, 0], [PITCH_W, PITCH_H, 0], [0, PITCH_H, 0]],
    WHITE, 3.2
  );
  line3(ctx, m, PITCH_W / 2, 0, 0, PITCH_W / 2, PITCH_H, 0, 3.2, WHITE);
  strokeArc(ctx, m, PITCH_W / 2, CY, 200, 0, 0, TAU, 48, WHITE, 3.2);
  const sp = P(PITCH_W / 2, CY, 0);
  if (sp) {
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, Math.max(2, 7 * sp.s), 0, TAU);
    ctx.fill();
  }

  for (const dir of [1, -1] as const) {
    const gx = dir === 1 ? 0 : PITCH_W;
    const bx = dir === 1 ? 240 : PITCH_W - 240;
    const gxA = dir === 1 ? 90 : PITCH_W - 90;
    strokeLoop(
      ctx, m,
      [[gx, CY - 310, 0], [bx, CY - 310, 0], [bx, CY + 310, 0], [gx, CY + 310, 0]],
      WHITE, 3.2
    );
    strokeLoop(
      ctx, m,
      [[gx, CY - 155, 0], [gxA, CY - 155, 0], [gxA, CY + 155, 0], [gx, CY + 155, 0]],
      WHITE, 3.2
    );
    const ps = P(gx + dir * 170, CY, 0);
    if (ps) {
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(ps.x, ps.y, Math.max(1.8, 6 * ps.s), 0, TAU);
      ctx.fill();
    }
    const a = 0.97;
    strokeArc(
      ctx, m, gx + dir * 170, CY, 125, 0,
      dir === 1 ? -a : Math.PI - a, dir === 1 ? a : Math.PI + a,
      26, WHITE, 3.2
    );
    for (const cy2 of [0, PITCH_H]) {
      const a0 = dir === 1 ? (cy2 === 0 ? Math.PI / 2 : 0) : (cy2 === 0 ? Math.PI : Math.PI * 1.5);
      strokeArc(ctx, m, gx, cy2, 30, 0, a0, a0 + Math.PI / 2, 12, WHITE, 3.2);
    }
  }
}

/* ---------------- ad boards ---------------- */
function drawBoards(ctx: CanvasRenderingContext2D, m: CamMat) {
  let bi = 0;
  const H2 = 20;
  const seg = (pts: number[][], label: string) => {
    fillPoly(ctx, m, pts, BOARD_COLS[bi % BOARD_COLS.length]);
    const midPts = clipPoly(pts.map(([x, y, z]) => toCam(m, x, y, z)));
    if (midPts.length >= 3 && label) {
      const mid = projV(
        m,
        toCam(m, (pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2, 10)
      );
      if (mid.d >= NEAR && mid.s > 0.32) {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.font = `800 ${Math.max(6, 11 * mid.s)}px Rubik, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, mid.x, mid.y);
      }
    }
    bi++;
  };
  for (let x = -30; x < PITCH_W + 20; x += 132) {
    seg([[x, -26, 0], [x + 124, -26, 0], [x + 124, -26, H2], [x, -26, H2]], BRANDS[bi % BRANDS.length]);
    seg([[x + 60, PITCH_H + 26, 0], [x + 184, PITCH_H + 26, 0], [x + 184, PITCH_H + 26, H2], [x + 60, PITCH_H + 26, H2]], BRANDS[(bi + 3) % BRANDS.length]);
  }
  for (let y = CY - 280; y < CY + 240; y += 132) {
    seg([[-26, y, 0], [-26, y + 124, 0], [-26, y + 124, H2], [-26, y, H2]], '');
    seg([[PITCH_W + 26, y + 56, 0], [PITCH_W + 26, y + 180, 0], [PITCH_W + 26, y + 180, H2], [PITCH_W + 26, y + 56, H2]], '');
  }
}

/* ---------------- goals (3D with nets) ---------------- */
function drawGoal(ctx: CanvasRenderingContext2D, m: CamMat, g: GameView, gx: number) {
  const dir = gx === 0 ? -1 : 1;
  const backX = gx + dir * NET_DEPTH;
  const top = CY - GOAL_HALF, bot = CY + GOAL_HALF;
  const backTop = GOAL_H * 0.8;
  const ripple = g.netRipple.side === dir ? g.netRipple.amt : 0;
  const wob = (yy: number, zz: number) =>
    ripple > 0
      ? Math.sin(yy * 0.03 + zz * 0.05 + g.tGlobal * 24) * 10 * ripple
      : 0;

  ctx.lineCap = 'round';

  /* net — back face grid */
  const NET = 'rgba(228,238,255,0.34)';
  for (let y = top; y <= bot; y += 35) {
    const w1 = wob(y, 0);
    line3(ctx, m, backX + w1, y, 0, backX + w1 * 0.4, y, backTop, 1.1, NET);
  }
  for (let z = 0; z <= backTop; z += 26) {
    line3(ctx, m, backX + wob(top, z), top, z, backX + wob(bot, z), bot, z, 1.1, NET);
  }
  /* side nets */
  for (const py2 of [top, bot])
    for (let i = 1; i <= 3; i++)
      line3(ctx, m, gx, py2, 0, backX + wob(py2, backTop * (i / 4)), py2, backTop * (i / 4), 1.1, NET);
  /* roof net */
  for (let y = top; y <= bot; y += 45)
    line3(ctx, m, gx, y, GOAL_H, backX + wob(y, backTop), y, backTop, 1.1, NET);

  /* stanchions */
  line3(ctx, m, gx, top, GOAL_H, backX, top, backTop, 3, 'rgba(240,246,255,0.8)');
  line3(ctx, m, gx, bot, GOAL_H, backX, bot, backTop, 3, 'rgba(240,246,255,0.8)');
  /* crossbar + posts */
  line3(ctx, m, gx, top, GOAL_H, gx, bot, GOAL_H, 7.5, '#f4f8ff');
  line3(ctx, m, gx, top, 0, gx, top, GOAL_H, 7.5, '#f4f8ff');
  line3(ctx, m, gx, bot, 0, gx, bot, GOAL_H, 7.5, '#f4f8ff');

  const P = makeProjector(m);
  for (const py2 of [top, bot]) {
    const p = P(gx, py2, 0);
    if (p) {
      ctx.fillStyle = '#dfe6ee';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, Math.max(2, 5.4 * p.s), Math.max(1, 2.3 * p.s), 0, 0, TAU);
      ctx.fill();
    }
  }
}

/* ---------------- shadows ---------------- */
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

/* ---------------- players & ball ---------------- */
const KITS = {
  blue: { shirt1: '#4d97ff', shirt2: '#1b5fd6', trim: '#eaf2ff', shorts: '#123e8c', socks: '#1b5fd6', num: '#eaf2ff', sleeve: '#2b6fe8', cap: '#123e8c' },
  white: { shirt1: '#ffffff', shirt2: '#dde3ee', trim: '#ff5fa2', shorts: '#ff5fa2', socks: '#f2f5fb', num: '#2a3049', sleeve: '#ff5fa2', cap: '#ff5fa2' },
  gkB: { shirt1: '#3ddc84', shirt2: '#17a558', trim: '#0d3a22', shorts: '#12462c', socks: '#17a558', num: '#0d3a22', sleeve: '#25c46f', cap: '#0d3a22' },
  gkY: { shirt1: '#ffe14d', shirt2: '#e8a80c', trim: '#20242f', shorts: '#232936', socks: '#e8a80c', num: '#20242f', sleeve: '#f5c518', cap: '#20242f' },
};

function drawEntities(ctx: CanvasRenderingContext2D, P: Proj, g: GameView) {
  interface E { d: number; kind: 'p' | 'b'; p?: PlayerT; }
  const list: E[] = [];
  for (const p of g.players) {
    const pr = P(p.x, p.y, 0);
    if (pr) list.push({ d: pr.d, kind: 'p', p });
  }
  const bp = P(g.ball.x, g.ball.y, g.ball.z);
  if (bp) list.push({ d: bp.d, kind: 'b' });
  list.sort((a, b) => b.d - a.d); // far first

  for (const e of list) {
    if (e.kind === 'p' && e.p) {
      const pr = P(e.p.x, e.p.y, 0)!;
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.scale(pr.s, pr.s);
      drawPlayer(ctx, e.p, g);
      ctx.restore();
    } else {
      drawBall(ctx, P, g);
    }
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerT, g: GameView) {
  const t = g.tGlobal;
  const speed = Math.hypot(p.vx, p.vy);
  const moving = speed > 30;
  const kit = p.gk
    ? p.team === 0 ? KITS.gkB : KITS.gkY
    : p.team === 0 ? KITS.blue : KITS.white;

  const bounce = p.celebrateT > 0 ? Math.abs(Math.sin(t * 11 + p.id)) * 7 : 0;
  const bob = moving ? Math.abs(Math.sin(p.runPhase)) * 1.8 : Math.sin(t * 2 + p.id) * 0.6;
  const hipY = -18 - bob - bounce; // feet at y=0
  const face = Math.cos(p.dir) >= 0 ? 1 : -1;
  const lean = p.lungeT > 0 ? p.lungeT * 0.9 : 0;
  const dash = p.dashT > 0;

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

  const foot = (i: number) => {
    let fx = nx * (i === 0 ? -5 : 5) + px * legSwing * (i === 0 ? 8 : -8);
    let fy = py2 * legSwing * (i === 0 ? 5.5 : -5.5) * 0.6;
    if (kick > 0 && i === 0) {
      fx = px * (9 + kick * 19);
      fy = py2 * (5 + kick * 13) - kick * 5;
    }
    if (lean > 0 && i === 1) {
      fx = px * (7 + lean * 20);
      fy = py2 * 5;
    }
    return [fx, fy] as const;
  };

  ctx.lineCap = 'round';
  for (const i of [0, 1]) {
    const [fx, fy] = foot(i);
    ctx.strokeStyle = kit.shorts;
    ctx.lineWidth = 6.4;
    ctx.beginPath();
    ctx.moveTo(nx * (i === 0 ? -4.4 : 4.4), hipY + 8);
    ctx.lineTo(fx, fy - 4.6);
    ctx.stroke();
    ctx.strokeStyle = kit.socks;
    ctx.lineWidth = 5.8;
    ctx.beginPath();
    ctx.moveTo(fx - px * 1.6, fy - 6);
    ctx.lineTo(fx, fy - 2.8);
    ctx.stroke();
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
  rr(ctx, -12.5, hipY - 34, 25, 27, 8);
  ctx.fill();
  ctx.fillStyle = kit.trim;
  ctx.fillRect(-12.5, hipY - 12.6, 25, 3);
  ctx.fillStyle = p.gk ? kit.cap : p.team === 1 ? '#ff5fa2' : 'rgba(255,255,255,0.9)';
  rr(ctx, -5, hipY - 34, 10, 4.4, 2.2);
  ctx.fill();

  const armSwing = moving ? Math.sin(p.runPhase + Math.PI) * 0.9 : 0;
  const celebrate = p.celebrateT > 0;
  for (const i of [0, 1]) {
    const sx = i === 0 ? -13 : 13;
    const sy = hipY - 29;
    let hx = sx + (i === 0 ? -4 : 4) + px * armSwing * (i === 0 ? 4 : -4);
    let hy = sy + 12;
    if (celebrate) {
      hx = sx + (i === 0 ? -6 : 6);
      hy = sy - 11 - Math.sin(t * 11 + i * 2) * 3;
    }
    ctx.strokeStyle = kit.sleeve;
    ctx.lineWidth = 6.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 1);
    ctx.lineTo(sx + (hx - sx) * 0.45, sy + (hy - sy) * 0.45);
    ctx.stroke();
    ctx.strokeStyle = p.skin;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(sx + (hx - sx) * 0.45, sy + (hy - sy) * 0.45);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.fillStyle = p.gk ? '#eef3ff' : p.skin;
    ctx.beginPath();
    ctx.arc(hx, hy, p.gk ? 3.8 : 3, 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = kit.num;
  ctx.font = '10.5px Bungee, Rubik, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(p.num), 0, hipY - 20);

  const headY = hipY - 42 - bounce * 0.3;
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.arc(0, headY, 9.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = p.hair;
  ctx.beginPath();
  ctx.arc(-face * 1.5, headY - 2, 8.7, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();
  if (p.gk) {
    ctx.fillStyle = kit.cap;
    ctx.beginPath();
    ctx.arc(0, headY - 3.2, 8.7, Math.PI, TAU);
    ctx.fill();
    ctx.fillRect(-8.7, headY - 3.8, 17.4, 3.1);
  }

  if (p.id === g.activeId && !g.demo) {
    const by = headY - 21 - Math.sin(t * 6) * 3.4;
    ctx.fillStyle = '#5db2ff';
    ctx.strokeStyle = '#eaf6ff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, by + 10);
    ctx.lineTo(-8.4, by);
    ctx.lineTo(8.4, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
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
    const c = P(mm.x, mm.y, 0);
    if (c) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(1.5, 3.4 * c.s), 0, TAU);
      ctx.fill();
    }
  }
}

/* ---------------- particles ---------------- */
function drawParticles(ctx: CanvasRenderingContext2D, P: Proj, g: GameView) {
  for (const pt of g.particles) {
    const a = clamp(pt.life / pt.maxLife, 0, 1);
    const p = P(pt.x, pt.y, pt.z);
    if (!p) continue;
    if (pt.kind === 'confetti') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(pt.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      const s = pt.size * p.s;
      ctx.fillRect(-s / 2, -s / 3, s, s * 0.66);
      ctx.restore();
      ctx.globalAlpha = 1;
    } else if (pt.kind === 'dust') {
      ctx.fillStyle = `rgba(205,190,150,${0.4 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, pt.size * p.s * (1.6 - a * 0.6)), 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(255,233,168,${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.8, pt.size * p.s), 0, TAU);
      ctx.fill();
    }
  }
}
