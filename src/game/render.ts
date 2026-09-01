import {
  GOAL_HALF,
  CY,
  MARGIN,
  PITCH_H,
  PITCH_W,
  WORLD_H,
  WORLD_W,
  clamp,
  type GameView,
  type PlayerT,
} from './types';

const TAU = Math.PI * 2;

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

const CROWD_BASE = ['#39415a', '#4a5470', '#2e3550', '#5b6480', '#414b66', '#333c58'];
const CROWD_ACCENT = ['#2f7dff', '#ff5fa2', '#e8edf7', '#ffd23f'];
const BOARD_COLS = ['#d92e4b', '#1f7ae0', '#f2a007', '#0ea672', '#7a3ff2', '#c93a8e'];
const BRANDS = ['NOVA', 'ZUMO', 'KIKO', 'VOLTA', 'ORBE', 'PIXEL', 'TURBO', 'AERO'];

/* =====================================================================
   Stadium layer — baked once, drawn every frame with a FIXED transform.
   ===================================================================== */
export function makeStadiumLayer(): HTMLCanvasElement {
  const S = 2; // internal supersample for crispness
  const c = document.createElement('canvas');
  c.width = WORLD_W * S;
  c.height = WORLD_H * S;
  const ctx = c.getContext('2d')!;
  ctx.scale(S, S);
  // work in world coords; pitch TL sits at (MARGIN, MARGIN)
  ctx.translate(MARGIN, MARGIN);

  /* night sky / stadium base */
  const sky = ctx.createLinearGradient(0, -MARGIN, 0, WORLD_H - MARGIN);
  sky.addColorStop(0, '#0c1a30');
  sky.addColorStop(0.5, '#0a1426');
  sky.addColorStop(1, '#070f1d');
  ctx.fillStyle = sky;
  ctx.fillRect(-MARGIN, -MARGIN, WORLD_W, WORLD_H);

  /* stands = everything outside the pitch apron */
  const apronPad = 26;
  const ax = -apronPad, ay = -apronPad;
  const aw = PITCH_W + apronPad * 2, ah = PITCH_H + apronPad * 2;

  // crowd dots across the stands (skip apron + pitch)
  for (let y = -MARGIN + 10; y < WORLD_H - MARGIN - 6; y += 8) {
    for (let x = -MARGIN + 8; x < WORLD_W - MARGIN - 4; x += 8) {
      const inside = x > ax - 14 && x < ax + aw + 14 && y > ay - 14 && y < ay + ah + 14;
      if (inside) continue;
      const jx = x + (Math.random() - 0.5) * 3;
      const jy = y + (Math.random() - 0.5) * 3;
      const acc = Math.random() < 0.07;
      ctx.fillStyle = acc
        ? CROWD_ACCENT[(Math.random() * CROWD_ACCENT.length) | 0]
        : CROWD_BASE[(Math.random() * CROWD_BASE.length) | 0];
      ctx.globalAlpha = 0.85;
      ctx.fillRect(jx, jy, 3.1, 3.1);
    }
  }
  ctx.globalAlpha = 1;

  // tier walkways
  ctx.fillStyle = 'rgba(6,10,20,0.85)';
  const walk = (wx: number, wy: number, ww: number, wh: number) =>
    ctx.fillRect(wx, wy, ww, wh);
  walk(-MARGIN, -MARGIN + 58, WORLD_W, 5);
  walk(-MARGIN, WORLD_H - MARGIN - 63, WORLD_W, 5);
  walk(-MARGIN, -MARGIN, 5, WORLD_H);
  walk(WORLD_W - MARGIN - 5, -MARGIN, 5, WORLD_H);
  // stand shading toward the pitch
  const shadeT = ctx.createLinearGradient(0, ay - 40, 0, ay);
  shadeT.addColorStop(0, 'rgba(0,0,0,0)');
  shadeT.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = shadeT;
  ctx.fillRect(ax - 20, ay - 42, aw + 40, 42);
  const shadeB = ctx.createLinearGradient(0, ay + ah, 0, ay + ah + 40);
  shadeB.addColorStop(0, 'rgba(0,0,0,0.4)');
  shadeB.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadeB;
  ctx.fillRect(ax - 20, ay + ah, aw + 40, 42);

  /* floodlights in the four corners */
  for (const [lx, ly] of [
    [-MARGIN + 46, -MARGIN + 40],
    [WORLD_W - MARGIN - 46, -MARGIN + 40],
    [-MARGIN + 46, WORLD_H - MARGIN - 40],
    [WORLD_W - MARGIN - 46, WORLD_H - MARGIN - 40],
  ]) {
    const glow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 110);
    glow.addColorStop(0, 'rgba(210,230,255,0.32)');
    glow.addColorStop(0.4, 'rgba(150,190,255,0.10)');
    glow.addColorStop(1, 'rgba(150,190,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 110, ly - 110, 220, 220);
    ctx.fillStyle = '#1b2438';
    rr(ctx, lx - 16, ly - 8, 32, 13, 4);
    ctx.fill();
    ctx.fillStyle = '#e9f3ff';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(lx - 12 + i * 5, ly - 1.5, 1.9, 0, TAU);
      ctx.fill();
    }
  }

  /* pitch apron (runoff turf) */
  ctx.fillStyle = '#1e7a3d';
  rr(ctx, ax, ay, aw, ah, 10);
  ctx.fill();

  /* main turf with mow stripes */
  const stripes = 12;
  const sw = PITCH_W / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#2f9e51' : '#2b934b';
    ctx.fillRect(i * sw, 0, sw + 1, PITCH_H);
  }
  // subtle light sweep
  const sweep = ctx.createLinearGradient(0, 0, PITCH_W, PITCH_H);
  sweep.addColorStop(0, 'rgba(255,255,255,0.055)');
  sweep.addColorStop(0.5, 'rgba(255,255,255,0)');
  sweep.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, PITCH_W, PITCH_H);
  // grass specks
  for (let i = 0; i < 1100; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(18,80,38,0.14)' : 'rgba(190,255,200,0.07)';
    ctx.fillRect(Math.random() * PITCH_W, Math.random() * PITCH_H, 2, 2);
  }

  /* ad boards */
  const board = (x: number, y: number, w: number, h: number, ci: number, label: string) => {
    ctx.fillStyle = BOARD_COLS[ci % BOARD_COLS.length];
    rr(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '700 9px Bungee, Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2 + 0.5);
  };
  let bi = 0;
  for (let x = -36; x < PITCH_W + 20; x += 104) {
    board(x, -22, 96, 15, bi, BRANDS[bi % BRANDS.length]);
    board(x + 40, PITCH_H + 7, 96, 15, bi + 3, BRANDS[(bi + 3) % BRANDS.length]);
    bi++;
  }
  for (let y = CY - 200; y < CY + 160; y += 104) {
    board(-50, y, 15, 96, bi, '');
    board(PITCH_W + 35, y + 40, 15, 96, bi + 2, '');
    bi++;
  }

  /* pitch markings */
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, PITCH_W, PITCH_H);
  ctx.beginPath();
  ctx.moveTo(PITCH_W / 2, 0);
  ctx.lineTo(PITCH_W / 2, PITCH_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(PITCH_W / 2, CY, 78, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(PITCH_W / 2, CY, 3.4, 0, TAU);
  ctx.fill();

  const box = (gx: number, dir: 1 | -1) => {
    // penalty area
    ctx.strokeRect(
      dir === 1 ? gx : gx - 150,
      CY - 190,
      150,
      380
    );
    // goal area
    ctx.strokeRect(dir === 1 ? gx : gx - 55, CY - 95, 55, 190);
    // penalty spot
    ctx.beginPath();
    ctx.arc(gx + dir * 105, CY, 3.2, 0, TAU);
    ctx.fill();
    // penalty arc (portion outside the box)
    const a = Math.acos(45 / 78);
    ctx.beginPath();
    if (dir === 1) ctx.arc(gx + 105, CY, 78, -a, a);
    else ctx.arc(gx - 105, CY, 78, Math.PI - a, Math.PI + a);
    ctx.stroke();
    // corner arcs
    for (const cy2 of [0, PITCH_H]) {
      ctx.beginPath();
      ctx.arc(gx, cy2, 12, dir === 1 ? Math.PI / 2 : Math.PI, dir === 1 ? Math.PI : Math.PI * 1.5);
      ctx.stroke();
    }
  };
  box(0, 1);
  box(PITCH_W, -1);

  /* vignette */
  const vig = ctx.createRadialGradient(
    PITCH_W / 2, CY, 240,
    PITCH_W / 2, CY, 820
  );
  vig.addColorStop(0, 'rgba(4,8,18,0)');
  vig.addColorStop(1, 'rgba(4,8,18,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(-MARGIN, -MARGIN, WORLD_W, WORLD_H);

  return c;
}

/* =====================================================================
   Per-frame rendering — the camera transform is FIXED. It depends only
   on viewport size, never on ball / player positions.
   ===================================================================== */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  g: GameView,
  vw: number,
  vh: number,
  dpr: number,
  stadium: HTMLCanvasElement
) {
  const FIT_PAD = 26; // guaranteed empty space around the whole stadium
  const scale = Math.min(vw / (WORLD_W + FIT_PAD), vh / (WORLD_H + FIT_PAD));
  const ox = (vw - scale * WORLD_W) / 2;
  const oy = (vh - scale * WORLD_H) / 2;

  /* screen backdrop */
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, vh);
  bg.addColorStop(0, '#0b1a30');
  bg.addColorStop(1, '#040912');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, vw, vh);

  /* FIXED world transform (pitch coords; never moves) */
  ctx.setTransform(
    dpr * scale, 0, 0, dpr * scale,
    dpr * (ox + scale * MARGIN),
    dpr * (oy + scale * MARGIN)
  );

  ctx.drawImage(stadium, -MARGIN, -MARGIN, WORLD_W, WORLD_H);

  drawGoals(ctx, g);

  /* cross target marker */
  if (g.crossMark) {
    const m = g.crossMark;
    const pulse = 1 + Math.sin(g.tGlobal * 14) * 0.12;
    ctx.strokeStyle = `rgba(125,220,255,${clamp(m.t, 0, 1) * 0.9})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 13 * pulse, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(m.x, m.y, 5, 0, TAU);
    ctx.stroke();
  }

  /* ball trail */
  for (const t of g.trail) {
    ctx.fillStyle = `rgba(255,255,255,${0.22 * t.life})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y - t.z * 0.9, 4.4 * t.life, 0, TAU);
    ctx.fill();
  }

  /* entity shadows */
  const b = g.ball;
  ctx.fillStyle = 'rgba(8,26,14,0.30)';
  for (const p of g.players) {
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 3.4, 11.5, 4.6, 0, 0, TAU);
    ctx.fill();
  }
  const bs = clamp(1 - b.z / 220, 0.35, 1);
  ctx.fillStyle = `rgba(8,26,14,${0.32 * bs})`;
  ctx.beginPath();
  ctx.ellipse(b.x, b.y + 2.6, 7.4 * bs + 2, 3.1 * bs + 0.8, 0, 0, TAU);
  ctx.fill();

  /* players sorted by y */
  const sorted = [...g.players].sort((p, q) => p.y - q.y);
  for (const p of sorted) drawPlayer(ctx, p, g);

  /* shot-charge ring around the active player */
  if (!g.demo && g.chargeFrac > 0.01) {
    const a = g.players[g.activeId];
    if (a) {
      ctx.lineWidth = 3.4;
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.ellipse(a.x, a.y + 3, 19, 8, 0, 0, TAU);
      ctx.stroke();
      const frac = g.chargeFrac;
      const col =
        frac < 0.5 ? '#ffd23f' : frac < 0.8 ? '#ff9a3f' : '#ff5f5f';
      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.ellipse(
        a.x, a.y + 3, 19, 8, 0,
        -Math.PI / 2, -Math.PI / 2 + frac * TAU
      );
      ctx.stroke();
    }
  }

  drawBall(ctx, g);
  drawParticles(ctx, g);
}

/* ---------------- goals + nets ---------------- */
function drawGoals(ctx: CanvasRenderingContext2D, g: GameView) {
  for (const side of [-1, 1] as const) {
    const gx = side === -1 ? 0 : PITCH_W;
    const back = gx + side * -32; // net depth (outward)
    const ripple = g.netRipple.side === side ? g.netRipple.amt : 0;

    /* net */
    ctx.lineWidth = 1;
    const top = CY - GOAL_HALF, bot = CY + GOAL_HALF;
    for (let i = 0; i <= 8; i++) {
      const yy = top + ((bot - top) * i) / 8;
      const wob = ripple > 0
        ? Math.sin(yy * 0.16 + g.tGlobal * 26) * 5 * ripple
        : 0;
      ctx.strokeStyle = 'rgba(235,242,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(gx, yy);
      ctx.quadraticCurveTo(
        (gx + back) / 2 + side * -wob * 0.4, yy + wob * 0.3,
        back + wob * 0.6, yy
      );
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const xx = gx + ((back - gx) * i) / 6;
      ctx.strokeStyle = 'rgba(235,242,255,0.38)';
      ctx.beginPath();
      ctx.moveTo(xx, top);
      ctx.lineTo(xx, bot);
      ctx.stroke();
    }
    // net roof hint
    ctx.strokeStyle = 'rgba(235,242,255,0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(gx, top);
    ctx.lineTo(back, top);
    ctx.lineTo(back, bot);
    ctx.lineTo(gx, bot);
    ctx.stroke();

    /* posts (mini 3D: post rises from the ground) */
    const postH = 30;
    for (const py of [top, bot]) {
      const grad = ctx.createLinearGradient(gx - 3, 0, gx + 3, 0);
      grad.addColorStop(0, '#f4f7fb');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, '#c3ccd8');
      ctx.fillStyle = grad;
      rr(ctx, gx - 2.6, py - postH, 5.2, postH + 2, 2.4);
      ctx.fill();
      // base pad
      ctx.fillStyle = '#dfe6ee';
      ctx.beginPath();
      ctx.ellipse(gx, py + 2, 4.6, 2, 0, 0, TAU);
      ctx.fill();
    }
    // crossbar joining the two post tops (seen head-on in the 2.5D view)
    const bar = ctx.createLinearGradient(0, top - postH - 3, 0, top - postH + 3);
    bar.addColorStop(0, '#ffffff');
    bar.addColorStop(1, '#c3ccd8');
    ctx.fillStyle = bar;
    rr(ctx, gx - 3, top - postH - 3, 6, 6, 2.6);
    ctx.fill();
    rr(ctx, gx - 3, bot - postH - 3, 6, 6, 2.6);
    ctx.fill();
  }
}

/* ---------------- players ---------------- */
const KITS = {
  blue: { shirt1: '#4d97ff', shirt2: '#1b5fd6', trim: '#eaf2ff', shorts: '#123e8c', socks: '#1b5fd6', num: '#eaf2ff', sleeve: '#2b6fe8' },
  white: { shirt1: '#ffffff', shirt2: '#dde3ee', trim: '#ff5fa2', shorts: '#ff5fa2', socks: '#f2f5fb', num: '#2a3049', sleeve: '#ff5fa2' },
  gk: { shirt1: '#ffe14d', shirt2: '#e8a80c', trim: '#20242f', shorts: '#232936', socks: '#e8a80c', num: '#20242f', sleeve: '#f5c518' },
};

function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerT, g: GameView) {
  const t = g.tGlobal;
  const speed = Math.hypot(p.vx, p.vy);
  const moving = speed > 25;
  const kit = p.gk ? KITS.gk : p.team === 0 ? KITS.blue : KITS.white;
  const x = p.x;

  const bounce = p.celebrateT > 0 ? Math.abs(Math.sin(t * 11 + p.id)) * 6 : 0;
  const bob = moving ? Math.abs(Math.sin(p.runPhase)) * 1.5 : Math.sin(t * 2 + p.id) * 0.5;
  const hipY = p.y - 15 - bob - bounce;
  const face = Math.cos(p.dir) >= 0 ? 1 : -1;
  const lean = p.lungeT > 0 ? p.lungeT * 0.9 : 0;

  ctx.save();
  ctx.translate(0, -bounce * 0.2);

  /* ball-holder / active glow */
  if (p.hasBallGlow > 0.02 || p.id === g.activeId) {
    const a = p.id === g.activeId ? 0.5 + Math.sin(t * 6) * 0.15 : 0;
    if (p.id === g.activeId) {
      ctx.strokeStyle = `rgba(93,178,255,${a})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(x, p.y + 3, 15 + Math.sin(t * 6) * 1.6, 6.4, 0, 0, TAU);
      ctx.stroke();
    }
    if (p.hasBallGlow > 0.02) {
      ctx.fillStyle = `rgba(140,255,190,${0.16 * p.hasBallGlow})`;
      ctx.beginPath();
      ctx.ellipse(x, p.y + 3, 13, 5.6, 0, 0, TAU);
      ctx.fill();
    }
  }

  /* legs — feet stay planted on the grass */
  const legSwing = moving ? Math.sin(p.runPhase) : 0;
  const px = Math.cos(p.dir), py2 = Math.sin(p.dir);
  const nx = -py2, ny = px; // perpendicular
  const kick = p.kickT > 0 ? Math.sin((1 - p.kickT / 0.32) * Math.PI) : 0;

  const foot = (i: number) => {
    let fx = x + nx * (i === 0 ? -3.6 : 3.6) + px * legSwing * (i === 0 ? 5.5 : -5.5);
    let fy = p.y + py2 * legSwing * (i === 0 ? 4 : -4) * 0.6;
    if (kick > 0 && i === 0) {
      fx = x + px * (6 + kick * 13);
      fy = p.y + py2 * (4 + kick * 9) - kick * 4;
    }
    if (lean > 0 && i === 1) {
      fx = x + px * (5 + lean * 14);
      fy = p.y + py2 * 4;
    }
    return [fx, fy] as const;
  };

  ctx.lineCap = 'round';
  for (const i of [0, 1]) {
    const [fx, fy] = foot(i);
    // leg
    ctx.strokeStyle = kit.shorts === '#232936' ? '#1c2230' : kit.shorts;
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(x + nx * (i === 0 ? -3 : 3), hipY + 6);
    ctx.lineTo(fx, fy - 3.4);
    ctx.stroke();
    // sock
    ctx.strokeStyle = kit.socks;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(fx - px * 1.2, fy - 4.6);
    ctx.lineTo(fx, fy - 2.2);
    ctx.stroke();
    // boot
    ctx.fillStyle = '#171c28';
    ctx.beginPath();
    ctx.ellipse(fx + px * 1.4, fy - 1, 3.6, 2.1, Math.atan2(py2, px), 0, TAU);
    ctx.fill();
  }

  /* shorts */
  ctx.fillStyle = kit.shorts;
  rr(ctx, x - 8.6, hipY - 2, 17.2, 9.6, 4);
  ctx.fill();

  /* torso */
  const tg = ctx.createLinearGradient(0, hipY - 25, 0, hipY - 3);
  tg.addColorStop(0, kit.shirt1);
  tg.addColorStop(1, kit.shirt2);
  ctx.fillStyle = tg;
  rr(ctx, x - 9, hipY - 25, 18, 20, 6);
  ctx.fill();
  // trim stripe
  ctx.fillStyle = kit.trim;
  ctx.fillRect(x - 9, hipY - 9.5, 18, 2.2);
  // collar
  ctx.fillStyle = p.gk ? '#20242f' : p.team === 1 ? '#ff5fa2' : 'rgba(255,255,255,0.9)';
  rr(ctx, x - 3.6, hipY - 25, 7.2, 3.2, 1.6);
  ctx.fill();

  /* arms */
  const armSwing = moving ? Math.sin(p.runPhase + Math.PI) * 0.9 : 0;
  const celebrate = p.celebrateT > 0;
  for (const i of [0, 1]) {
    const sx = x + (i === 0 ? -9.4 : 9.4);
    const sy = hipY - 21;
    let hx = sx + (i === 0 ? -3 : 3) + px * armSwing * (i === 0 ? 3 : -3);
    let hy = sy + 9;
    if (celebrate) {
      hx = sx + (i === 0 ? -4.5 : 4.5);
      hy = sy - 8 - Math.sin(t * 11 + i * 2) * 2;
    }
    // sleeve
    ctx.strokeStyle = kit.sleeve;
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 1);
    ctx.lineTo(sx + (hx - sx) * 0.45, sy + (hy - sy) * 0.45);
    ctx.stroke();
    // forearm
    ctx.strokeStyle = p.skin;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(sx + (hx - sx) * 0.45, sy + (hy - sy) * 0.45);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    // hand / glove
    ctx.fillStyle = p.gk ? '#eef3ff' : p.skin;
    ctx.beginPath();
    ctx.arc(hx, hy, p.gk ? 2.8 : 2.2, 0, TAU);
    ctx.fill();
  }

  /* number */
  ctx.fillStyle = kit.num;
  ctx.font = '7.5px Bungee, Rubik, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(p.num), x, hipY - 15);

  /* head */
  const headY = hipY - 31 - bounce * 0.3;
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.arc(x, headY, 6.7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = p.hair;
  ctx.beginPath();
  ctx.arc(x - face * 1.1, headY - 1.5, 6.3, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();
  if (p.gk) {
    ctx.fillStyle = '#20242f';
    ctx.beginPath();
    ctx.arc(x, headY - 2.4, 6.3, Math.PI, TAU);
    ctx.fill();
    ctx.fillRect(x - 6.3, headY - 2.8, 12.6, 2.3);
  }

  /* active indicator */
  if (p.id === g.activeId && !g.demo) {
    const by = headY - 15 - Math.sin(t * 6) * 2.6;
    ctx.fillStyle = '#5db2ff';
    ctx.strokeStyle = '#eaf6ff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, by + 7);
    ctx.lineTo(x - 6, by);
    ctx.lineTo(x + 6, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/* ---------------- ball ---------------- */
function drawBall(ctx: CanvasRenderingContext2D, g: GameView) {
  const b = g.ball;
  const y = b.y - b.z * 0.92;
  const r = 7.3;

  ctx.save();
  ctx.translate(b.x, y);
  ctx.rotate(b.spin);
  const bg = ctx.createRadialGradient(-2.4, -2.6, 1, 0, 0, r + 1);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(0.75, '#f2f4f8');
  bg.addColorStop(1, '#c9d1dc');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();

  /* black patches */
  ctx.fillStyle = '#1c212c';
  ctx.beginPath(); // centre pentagon
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2;
    const px = Math.cos(a) * 3.1, pyv = Math.sin(a) * 3.1;
    i === 0 ? ctx.moveTo(px, pyv) : ctx.lineTo(px, pyv);
  }
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2 + Math.PI / 5;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (r - 1.1), Math.sin(a) * (r - 1.1), 2.6, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(20,26,38,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r - 0.4, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

/* ---------------- particles ---------------- */
function drawParticles(ctx: CanvasRenderingContext2D, g: GameView) {
  for (const p of g.particles) {
    const a = clamp(p.life / p.maxLife, 0, 1);
    if (p.kind === 'confetti') {
      ctx.save();
      ctx.translate(p.x, p.y - p.z);
      ctx.rotate(p.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      ctx.restore();
      ctx.globalAlpha = 1;
    } else if (p.kind === 'dust') {
      ctx.fillStyle = `rgba(205,190,150,${0.4 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y - p.z, p.size * (1.6 - a * 0.6), 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(255,233,168,${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y - p.z, p.size, 0, TAU);
      ctx.fill();
    }
  }
}
