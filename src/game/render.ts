import {
  PITCH_W,
  PITCH_H,
  MARGIN,
  WORLD_W,
  WORLD_H,
  GOAL_HALF,
  GOAL_DEPTH,
  CY,
  type GameView,
  type PlayerT,
} from './types';

const OX = MARGIN; // pitch origin in world space
const OY = MARGIN;

/* ================= STADIUM PRE-RENDER ================= */

const CROWD_COLORS = [
  '#41506e', '#5a4566', '#66504a', '#466355', '#665c48', '#48606b',
  '#71576d', '#586473', '#7d6359', '#547058', '#6e4f5e', '#4f5e77',
  '#8a6f62', '#61758a', '#935f74', '#5f8a77',
];

const ADS: [string, string][] = [
  ['MAGIC AIR', '#3fc3ff'],
  ['TURBO+', '#ffd23f'],
  ['GOOAAL!', '#ff5fa2'],
  ['VOLT COLA', '#7dffb0'],
  ['SKY JET', '#ff8a5c'],
  ['KICKERZ', '#8fb7ff'],
  ['PULSE FM', '#f3ff7d'],
  ['ORBIT', '#6ef3d6'],
];

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeStadiumLayer(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = WORLD_W;
  c.height = WORLD_H;
  const ctx = c.getContext('2d')!;
  const rnd = mulberry(20260214);

  // --- outer bowl ---
  const bg = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  bg.addColorStop(0, '#0a1222');
  bg.addColorStop(0.5, '#101b31');
  bg.addColorStop(1, '#0a1222');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // stand tiers (concentric rounded rects)
  const tiers = [
    { d: 8, col: '#1b2740' },
    { d: 46, col: '#223052' },
    { d: 92, col: '#1a2540' },
    { d: 140, col: '#243356' },
    { d: 186, col: '#182340' },
  ];
  for (const t of tiers) {
    ctx.fillStyle = t.col;
    rr(ctx, t.d, t.d, WORLD_W - t.d * 2, WORLD_H - t.d * 2, 90);
    ctx.fill();
  }

  // --- crowd dots ---
  const innerL = OX - 78,
    innerT = OY - 78,
    innerR = OX + PITCH_W + 78,
    innerB = OY + PITCH_H + 78;
  for (let y = 26; y < WORLD_H - 20; y += 11) {
    for (let x = 26; x < WORLD_W - 20; x += 11) {
      if (x > innerL && x < innerR && y > innerT && y < innerB) continue;
      const col = CROWD_COLORS[(rnd() * CROWD_COLORS.length) | 0];
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.5 + rnd() * 0.5;
      const s = 3.2 + rnd() * 2.6;
      ctx.beginPath();
      ctx.arc(x + rnd() * 5, y + rnd() * 5, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // walkway ring between crowd and ad boards
  ctx.strokeStyle = '#0d1626';
  ctx.lineWidth = 26;
  rr(ctx, OX - 66, OY - 66, PITCH_W + 132, PITCH_H + 132, 26);
  ctx.stroke();

  // --- pitch apron ---
  ctx.fillStyle = '#1d6b3a';
  rr(ctx, OX - 42, OY - 42, PITCH_W + 84, PITCH_H + 84, 18);
  ctx.fill();

  // --- ad boards ---
  const drawAdBoard = (
    x: number,
    y: number,
    w: number,
    h: number,
    vertical: boolean
  ) => {
    ctx.fillStyle = '#0c1424';
    rr(ctx, x, y, w, h, 7);
    ctx.fill();
    ctx.strokeStyle = '#24344f';
    ctx.lineWidth = 2;
    rr(ctx, x + 1.5, y + 1.5, w - 3, h - 3, 6);
    ctx.stroke();
    ctx.save();
    ctx.font = '700 21px Rubik, sans-serif';
    ctx.textBaseline = 'middle';
    let i = 0;
    if (!vertical) {
      let tx = x + 26;
      while (tx < x + w - 90) {
        const [txt, col] = ADS[i++ % ADS.length];
        ctx.fillStyle = col;
        ctx.fillText(txt, tx, y + h / 2 + 1);
        tx += ctx.measureText(txt).width + 56;
      }
    } else {
      let ty = y + 30;
      while (ty < y + h - 60) {
        const [txt, col] = ADS[i++ % ADS.length];
        ctx.save();
        ctx.translate(x + w / 2, ty);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = col;
        ctx.textAlign = 'left';
        ctx.fillText(txt, 0, 1);
        ctx.restore();
        ty += 26 * 4.4;
      }
    }
    ctx.restore();
  };
  const bh = 30;
  drawAdBoard(OX - 20, OY - 58, PITCH_W + 40, bh, false);
  drawAdBoard(OX - 20, OY + PITCH_H + 28, PITCH_W + 40, bh, false);
  drawAdBoard(OX - 58, OY - 10, bh, PITCH_H + 20, true);
  drawAdBoard(OX + PITCH_W + 28, OY - 10, bh, PITCH_H + 20, true);

  // --- pitch base + stripes ---
  const px = OX,
    py = OY;
  const stripes = 10;
  const sw = PITCH_W / stripes;
  for (let i = 0; i < stripes; i++) {
    const g = ctx.createLinearGradient(px + i * sw, 0, px + (i + 1) * sw, 0);
    const baseA = i % 2 === 0 ? '#2f9e51' : '#2a9149';
    const baseB = i % 2 === 0 ? '#2c964c' : '#278a45';
    g.addColorStop(0, baseA);
    g.addColorStop(0.5, baseB);
    g.addColorStop(1, baseA);
    ctx.fillStyle = g;
    ctx.fillRect(px + i * sw, py, sw + 1, PITCH_H);
  }

  // grass speckle texture
  for (let i = 0; i < 5200; i++) {
    const gx = px + rnd() * PITCH_W;
    const gy = py + rnd() * PITCH_H;
    ctx.fillStyle =
      rnd() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,40,10,0.06)';
    ctx.fillRect(gx, gy, 1.6 + rnd() * 2.2, 1.2 + rnd() * 1.6);
  }

  // soft center light pool
  const pool = ctx.createRadialGradient(
    px + PITCH_W / 2,
    py + PITCH_H / 2,
    60,
    px + PITCH_W / 2,
    py + PITCH_H / 2,
    720
  );
  pool.addColorStop(0, 'rgba(255,255,240,0.10)');
  pool.addColorStop(1, 'rgba(0,0,20,0.16)');
  ctx.fillStyle = pool;
  ctx.fillRect(px - 42, py - 42, PITCH_W + 84, PITCH_H + 84);

  // --- pitch markings ---
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const L = px,
    R = px + PITCH_W,
    T = py,
    B = py + PITCH_H;
  ctx.strokeRect(L, T, PITCH_W, PITCH_H);
  // halfway
  ctx.beginPath();
  ctx.moveTo(px + PITCH_W / 2, T);
  ctx.lineTo(px + PITCH_W / 2, B);
  ctx.stroke();
  // center circle + spot
  ctx.beginPath();
  ctx.arc(px + PITCH_W / 2, py + CY, 91, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(px + PITCH_W / 2, py + CY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // boxes + arcs on both sides
  const box = (side: number) => {
    const gx = side < 0 ? L : R;
    const d = side < 0 ? 1 : -1;
    // penalty area
    ctx.strokeRect(
      Math.min(gx, gx + d * 165),
      py + CY - 201,
      165,
      402
    );
    // goal area
    ctx.strokeRect(Math.min(gx, gx + d * 55), py + CY - 91, 55, 182);
    // penalty spot
    ctx.beginPath();
    ctx.arc(gx + d * 110, py + CY, 4, 0, Math.PI * 2);
    ctx.fill();
    // penalty arc
    ctx.beginPath();
    const a0 = side < 0 ? -1.12 : Math.PI - 1.12;
    ctx.arc(gx + d * 110, py + CY, 91, a0, a0 + 2.24);
    ctx.stroke();
    // corner arcs
    ctx.beginPath();
    ctx.arc(
      gx,
      T,
      12,
      side < 0 ? 0 : Math.PI / 2,
      side < 0 ? Math.PI / 2 : Math.PI
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      gx,
      B,
      12,
      side < 0 ? -Math.PI / 2 : Math.PI,
      side < 0 ? 0 : Math.PI * 1.5
    );
    ctx.stroke();
  };
  box(-1);
  box(1);

  // subtle pitch vignette
  const pv = ctx.createRadialGradient(
    px + PITCH_W / 2,
    py + PITCH_H / 2,
    300,
    px + PITCH_W / 2,
    py + PITCH_H / 2,
    900
  );
  pv.addColorStop(0, 'rgba(0,0,0,0)');
  pv.addColorStop(1, 'rgba(0,10,4,0.22)');
  ctx.fillStyle = pv;
  ctx.fillRect(px - 42, py - 42, PITCH_W + 84, PITCH_H + 84);

  // --- floodlight towers + glow ---
  const towers: [number, number][] = [
    [60, 60],
    [WORLD_W - 60, 60],
    [60, WORLD_H - 60],
    [WORLD_W - 60, WORLD_H - 60],
  ];
  for (const [tx, ty] of towers) {
    const glow = ctx.createRadialGradient(tx, ty, 10, tx, ty, 360);
    glow.addColorStop(0, 'rgba(210,235,255,0.20)');
    glow.addColorStop(1, 'rgba(210,235,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(tx - 360, ty - 360, 720, 720);
    ctx.fillStyle = '#2c3a55';
    ctx.fillRect(tx - 4, ty - 4, 8, 8);
    ctx.fillStyle = '#3d4f73';
    rr(ctx, tx - 26, ty - 18, 52, 36, 8);
    ctx.fill();
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#eaf6ff';
        ctx.beginPath();
        ctx.arc(tx - 18 + i * 12, ty - 8 + r * 16, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
  }

  // roof edge highlight
  ctx.strokeStyle = 'rgba(120,160,220,0.16)';
  ctx.lineWidth = 6;
  rr(ctx, 5, 5, WORLD_W - 10, WORLD_H - 10, 96);
  ctx.stroke();

  return c;
}

/* ================= DYNAMIC DRAWING ================= */

const px = (x: number) => OX + x; // world pitch coords -> layer coords
const py = (y: number) => OY + y;

function netOffset(
  view: GameView,
  side: number,
  wx: number,
  wy: number
): number {
  const rip = view.netRipple;
  if (rip.amt <= 0.01 || rip.side !== side) return 0;
  const gx = side < 0 ? 0 : PITCH_W;
  const d = Math.hypot(wx - gx, wy - rip.y);
  return (
    Math.sin(d * 0.12 - view.tGlobal * 26) *
    7 *
    rip.amt *
    Math.exp(-d * 0.02)
  );
}

export function drawGoalNet(ctx: CanvasRenderingContext2D, view: GameView, side: number) {
  const gx = px(side < 0 ? 0 : PITCH_W);
  const back = gx + side * GOAL_DEPTH;
  const y1 = py(CY - GOAL_HALF);
  const y2 = py(CY + GOAL_HALF);
  const h = 30; // visual height of the frame
  const shrink = 0.8;
  const by1 = py(CY - GOAL_HALF * shrink) - h * 0.4;
  const by2 = py(CY + GOAL_HALF * shrink) - h * 0.4;

  ctx.save();
  ctx.strokeStyle = 'rgba(235,242,255,0.5)';
  ctx.lineWidth = 1;

  const N = 6;
  // depth lines (floor -> roof)
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const my = y1 + (y2 - y1) * t;
    const byy = by1 + (by2 - by1) * t;
    const off = netOffset(view, side, side < 0 ? -GOAL_DEPTH * t : GOAL_DEPTH * t, CY - GOAL_HALF + GOAL_HALF * 2 * t);
    ctx.beginPath();
    ctx.moveTo(gx, my);
    ctx.quadraticCurveTo(
      gx + side * GOAL_DEPTH * 0.5,
      (my + byy) / 2 + off,
      back,
      byy + off * 0.5
    );
    ctx.stroke();
  }
  // cross rings
  const M = 5;
  for (let j = 1; j <= M; j++) {
    const t = j / M;
    const cx = gx + side * GOAL_DEPTH * t;
    const cy1 = y1 + (by1 - y1) * t;
    const cy2 = y2 + (by2 - y2) * t;
    const off = netOffset(view, side, side * GOAL_DEPTH * t, CY);
    ctx.beginPath();
    ctx.moveTo(cx, cy1 + off);
    ctx.quadraticCurveTo(cx + side * 4, (cy1 + cy2) / 2 + off * 1.4, cx, cy2 + off);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGoalFrame(ctx: CanvasRenderingContext2D, side: number) {
  const gx = px(side < 0 ? 0 : PITCH_W);
  const y1 = py(CY - GOAL_HALF);
  const y2 = py(CY + GOAL_HALF);
  const h = 30;
  ctx.save();
  ctx.lineCap = 'round';
  // supports to back
  ctx.strokeStyle = 'rgba(220,230,245,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(gx, y1 - h);
  ctx.lineTo(gx + side * GOAL_DEPTH, y1 + (py(CY - GOAL_HALF * 0.8) - h * 0.4 - y1));
  ctx.moveTo(gx, y2 - h);
  ctx.lineTo(gx + side * GOAL_DEPTH, y2 + (py(CY + GOAL_HALF * 0.8) - h * 0.4 - y2));
  ctx.stroke();
  // posts + crossbar
  const grad = ctx.createLinearGradient(gx - 3, 0, gx + 3, 0);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#c9d6ea');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(gx, y1);
  ctx.lineTo(gx, y1 - h);
  ctx.moveTo(gx, y2);
  ctx.lineTo(gx, y2 - h);
  ctx.stroke();
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(gx, y1 - h);
  ctx.lineTo(gx, y2 - h);
  ctx.stroke();
  ctx.restore();
}

/* ---------- players ---------- */

interface Kit {
  shirt1: string;
  shirt2: string;
  sleeve: string;
  shorts: string;
  socks: string;
}
const KITS: Kit[] = [
  { shirt1: '#3f86ff', shirt2: '#1250c8', sleeve: '#1250c8', shorts: '#0d3f9e', socks: '#2f6fe0' },
  { shirt1: '#ffffff', shirt2: '#dde3ef', sleeve: '#ff5fa2', shorts: '#333a4d', socks: '#f2f4f9' },
];
// distinct keeper kits so each goalmouth reads instantly:
// blue team keeper = orange, white team keeper = yellow
const GK_KITS: [Kit, Kit] = [
  { shirt1: '#ff9838', shirt2: '#dd6410', sleeve: '#d95f0e', shorts: '#23262f', socks: '#ffb057' },
  { shirt1: '#ffd84d', shirt2: '#eda912', sleeve: '#e09a08', shorts: '#20242f', socks: '#f2b705' },
];

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: PlayerT,
  view: GameView
) {
  const x = px(p.x);
  const t = view.tGlobal;
  const speed = Math.hypot(p.vx, p.vy);
  const amp = Math.min(1, speed / 230);
  const s = Math.sin(p.runPhase);
  const faceR = Math.cos(p.dir) >= 0 ? 1 : -1;
  const kit = p.gk ? GK_KITS[p.team] : KITS[p.team];
  const celebrating = p.celebrateT > 0;
  const jump = celebrating
    ? Math.abs(Math.sin(t * 11 + p.id)) * 13 * Math.min(1, p.celebrateT)
    : 0;
  const bob = Math.abs(Math.cos(p.runPhase)) * 1.4 * amp;
  const y = py(p.y) - jump;
  const isActive = !view.demo && p.id === view.activeId;

  // ---- glow + shadow ----
  if (isActive) {
    const pulse = 0.5 + Math.sin(t * 5) * 0.2;
    ctx.fillStyle = `rgba(72,164,255,${0.22 * pulse + 0.1})`;
    ctx.beginPath();
    ctx.ellipse(x, y + 3, 21, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (p.hasBallGlow > 0.02) {
    ctx.fillStyle = `rgba(255,255,255,${0.12 * p.hasBallGlow})`;
    ctx.beginPath();
    ctx.ellipse(x, y + 3, 18, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(6,20,10,${0.3 - jump * 0.012})`;
  ctx.beginPath();
  ctx.ellipse(x + 4, py(p.y) + 4, 15 + jump * 0.25, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const hipY = y - 18 + bob;
  const kick = p.kickT > 0 ? Math.sin(Math.min(1, 1 - p.kickT / 0.32) * Math.PI) : 0;
  const kickDirX = Math.cos(p.dir);
  const lunge = p.lungeT > 0 ? Math.sin(Math.min(1, 1 - p.lungeT / 0.3) * Math.PI) : 0;

  const footPos = (legSign: number): [number, number] => {
    if (kick > 0 && legSign > 0) {
      return [
        x + kickDirX * (9 + 16 * kick) * Math.abs(Math.cos(p.dir)) + kickDirX * 4,
        y - 2 - 9 * kick,
      ];
    }
    const sw = s * legSign * 9.5 * amp + lunge * legSign * 6;
    const lift = Math.max(0, s * legSign) * 7 * amp;
    return [x + sw, y - lift];
  };

  // ---- legs (behind body) ----
  ctx.lineCap = 'round';
  for (const legSign of [1, -1]) {
    const [fx, fy] = footPos(legSign);
    const hx = x + legSign * 3.4;
    ctx.strokeStyle = kit.socks;
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(hx, hipY);
    ctx.quadraticCurveTo(hx + (fx - hx) * 0.3, (hipY + fy) / 2 + 2, fx, fy - 2.5);
    ctx.stroke();
    // boot
    ctx.fillStyle = '#161b26';
    ctx.beginPath();
    ctx.ellipse(fx + faceR * 1.6, fy - 1.2, 4.2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- shorts ----
  ctx.fillStyle = kit.shorts;
  rr(ctx, x - 8, hipY - 8, 16, 10.5, 4);
  ctx.fill();

  // ---- arms ----
  const armSwing = celebrating ? -14 : s * 7 * amp;
  for (const armSign of [1, -1]) {
    const shX = x + armSign * 8.4;
    const shY = hipY - 15;
    const hx2 = shX + armSign * 3 - armSwing * armSign * 0.5 + faceR * 2;
    const hy2 = celebrating ? shY - 13 : shY + 11 - Math.abs(armSwing) * 0.2;
    ctx.strokeStyle = kit.sleeve;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(shX, shY);
    ctx.lineTo(hx2, hy2);
    ctx.stroke();
    ctx.fillStyle = p.gk ? '#f5f7fa' : '#e8b98d';
    ctx.beginPath();
    ctx.arc(hx2, hy2 + (celebrating ? -2 : 1.5), 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- torso ----
  const tg = ctx.createLinearGradient(x - 9, 0, x + 9, 0);
  tg.addColorStop(0, kit.shirt1);
  tg.addColorStop(1, kit.shirt2);
  ctx.fillStyle = tg;
  rr(ctx, x - 9, hipY - 24, 18, 18, 6);
  ctx.fill();
  // collar
  ctx.fillStyle = p.team === 1 && !p.gk ? '#ff5fa2' : 'rgba(255,255,255,0.85)';
  rr(ctx, x - 3.4, hipY - 24, 6.8, 3, 1.5);
  ctx.fill();
  // number
  ctx.fillStyle = p.team === 0 ? '#eaf2ff' : '#3a4157';
  ctx.font = '8px Bungee, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(p.num), x, hipY - 14);

  // ---- head ----
  const headY = hipY - 30.5 - bob * 0.4;
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.arc(x, headY, 6.6, 0, Math.PI * 2);
  ctx.fill();
  // hair
  ctx.fillStyle = p.hair;
  ctx.beginPath();
  ctx.arc(x - faceR * 0.6, headY - 1.4, 6.4, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();
  if (p.gk) {
    // keeper cap
    ctx.fillStyle = '#20242f';
    ctx.beginPath();
    ctx.arc(x, headY - 2.2, 6.2, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 6.2, headY - 2.6, 12.4, 2.2);
  }

  // ---- active indicator ----
  if (isActive) {
    const bounce = Math.sin(t * 6) * 3;
    ctx.fillStyle = '#5db2ff';
    ctx.beginPath();
    ctx.moveTo(x, headY - 13 + bounce);
    ctx.lineTo(x - 7, headY - 23 + bounce);
    ctx.lineTo(x + 7, headY - 23 + bounce);
    ctx.closePath();
    ctx.fill();
    ctx.font = '8px Bungee, sans-serif';
    ctx.fillStyle = 'rgba(230,242,255,0.95)';
    ctx.fillText('YOU', x, headY - 29 + bounce);
  }
}

/* ---------- ball ---------- */

export function drawBall(ctx: CanvasRenderingContext2D, view: GameView) {
  const b = view.ball;
  const x = px(b.x);
  const gy = py(b.y);
  const zr = Math.max(0, b.z);
  const r = 8.6 * (1 + zr / 900);

  // shadow
  ctx.fillStyle = `rgba(6,20,10,${0.32 * Math.max(0.25, 1 - zr / 260)})`;
  ctx.beginPath();
  ctx.ellipse(x + 3, gy + 3.5, 8 * (1 - zr / 700), 3.6, 0, 0, Math.PI * 2);
  ctx.fill();

  const y = gy - 4 - zr * 0.55;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(b.spin);
  ctx.fillStyle = '#fdfdfd';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // panel shading
  const sh = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.2, 0, 0, r);
  sh.addColorStop(0, 'rgba(255,255,255,0.9)');
  sh.addColorStop(1, 'rgba(120,132,150,0.45)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // black patches
  ctx.fillStyle = '#14171f';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.moveTo(Math.cos(a) * r * 0.52 + r * 0.2, Math.sin(a) * r * 0.52);
    ctx.arc(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52, r * 0.24, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
    ctx.moveTo(Math.cos(a) * r * 1.02 + r * 0.16, Math.sin(a) * r * 1.02);
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, r * 0.16, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,24,32,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r - 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/* ---------- particles ---------- */

export function drawParticles(ctx: CanvasRenderingContext2D, view: GameView) {
  for (const p of view.particles) {
    const a = Math.max(0, p.life / p.maxLife);
    const x = px(p.x);
    const y = py(p.y) - p.z;
    if (p.kind === 'confetti') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else {
      ctx.globalAlpha = a * (p.kind === 'spark' ? 0.95 : 0.5);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, p.size * (p.kind === 'dust' ? 1 + (1 - a) * 1.6 : a), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/* ---------- main frame ---------- */

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  view: GameView,
  cw: number,
  ch: number,
  dpr: number,
  stadium: HTMLCanvasElement
) {
  // ---- FIXED camera: one static fit-transform, identical every frame ----
  const v = view.view;

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // deep night backdrop + ambient stadium glow bleeding into the letterbox
  ctx.fillStyle = '#04070d';
  ctx.fillRect(0, 0, cw * dpr, ch * dpr);
  const glowL = ctx.createRadialGradient(0, ch * dpr * 0.5, 10, 0, ch * dpr * 0.5, cw * dpr * 0.45);
  glowL.addColorStop(0, 'rgba(31,110,242,0.16)');
  glowL.addColorStop(1, 'rgba(31,110,242,0)');
  ctx.fillStyle = glowL;
  ctx.fillRect(0, 0, cw * dpr, ch * dpr);
  const glowR = ctx.createRadialGradient(cw * dpr, ch * dpr * 0.5, 10, cw * dpr, ch * dpr * 0.5, cw * dpr * 0.45);
  glowR.addColorStop(0, 'rgba(255,95,162,0.14)');
  glowR.addColorStop(1, 'rgba(255,95,162,0)');
  ctx.fillStyle = glowR;
  ctx.fillRect(0, 0, cw * dpr, ch * dpr);

  ctx.setTransform(dpr * v.scale, 0, 0, dpr * v.scale, dpr * v.ox, dpr * v.oy);

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(stadium, 0, 0);

  drawGoalNet(ctx, view, -1);
  drawGoalNet(ctx, view, 1);

  // cross target marker
  if (view.crossMark && view.crossMark.t > 0) {
    const m = view.crossMark;
    const a = Math.min(1, m.t * 2);
    ctx.strokeStyle = `rgba(125,255,176,${0.7 * a})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.arc(px(m.x), py(m.y), 16 + (1 - a) * 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // charge ring around active player
  if (view.chargeFrac > 0.02) {
    const act = view.players.find((p) => p.id === view.activeId);
    if (act) {
      const frac = view.chargeFrac;
      ctx.strokeStyle = frac < 0.5 ? '#7dffb0' : frac < 0.8 ? '#ffd23f' : '#ff6b6b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px(act.x), py(act.y) - 2, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();
    }
  }

  // entities sorted by depth
  const ball = view.ball;
  const ents: { y: number; kind: 'p' | 'b'; p?: PlayerT }[] = view.players.map(
    (p) => ({ y: p.y, kind: 'p' as const, p })
  );
  ents.push({ y: ball.y, kind: 'b' as const });
  ents.sort((a, b2) => a.y - b2.y);
  for (const e of ents) {
    if (e.kind === 'p') drawPlayer(ctx, e.p!, view);
    else drawBall(ctx, view);
  }

  // ball trail (over entities, subtle)
  for (const tr of view.trail) {
    const a = tr.life * 0.35;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(px(tr.x), py(tr.y) - 4 - tr.z * 0.55, 6 * tr.life + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGoalFrame(ctx, -1);
  drawGoalFrame(ctx, 1);

  drawParticles(ctx, view);

  // ---- screen space atmosphere ----
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const vg = ctx.createRadialGradient(
    cw / 2,
    ch / 2,
    Math.min(cw, ch) * 0.42,
    cw / 2,
    ch / 2,
    Math.max(cw, ch) * 0.75
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(2,6,16,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, cw, ch);
}
