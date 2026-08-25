import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Game } from './game/engine';
import { sfx } from './game/audio';
import type { GamePhase, Team } from './game/types';

interface Hud {
  score: [number, number];
  time: string;
}
interface FullTime {
  score: [number, number];
  shots: number;
  passes: number;
  goals: number;
  win: 'win' | 'draw' | 'loss';
}

/* ---------------- inline SVG icons (original) ---------------- */

const BallIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#fff" />
    <path
      d="M12 7.2l4.2 3-1.6 4.9H9.4L7.8 10.2l4.2-3z"
      fill="#171a22"
    />
    <path
      d="M12 2v3.4M21.5 9l-4.4 1.4M19 20l-3.6-2.8M8.6 17.2L5 20M2.5 9l4.4 1.4"
      stroke="#171a22"
      strokeWidth="1.6"
    />
    <circle cx="12" cy="12" r="10" stroke="#171a22" strokeWidth="1.4" />
  </svg>
);

const ShootIcon = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
    <circle cx="20" cy="16" r="8" fill="#fff" />
    <path d="M20 12.6l3 2.2-1.2 3.6h-3.6L17 14.8l3-2.2z" fill="#171a22" />
    <path d="M2 10h7M0 16h8M2 22h7" stroke="#ffe9a8" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
const PassIcon = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
    <circle cx="8" cy="22" r="5.4" fill="#fff" />
    <path d="M8 19.8l2 1.5-.8 2.4H6.8L6 21.3l2-1.5z" fill="#171a22" />
    <path d="M14 22c6 0 9-4 10-10" stroke="#cfe6ff" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 5" />
    <path d="M21 8l4 3-5 3" stroke="#cfe6ff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CrossIcon = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
    <circle cx="6" cy="25" r="4.6" fill="#fff" />
    <path d="M6 23.2l1.7 1.2-.7 2.1H5L4.3 24.4 6 23.2z" fill="#171a22" />
    <path d="M10 24C18 24 22 18 24 8" stroke="#baffd9" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 5" />
    <path d="M19.5 9.5L24 6l1.4 5.4" stroke="#baffd9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const DribbleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
    <path d="M3 9c5 0 6 3 11 3M1 16h13M3 23c5 0 6-3 11-3" stroke="#ffd9a8" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="23" cy="16" r="6.4" fill="#fff" />
    <path d="M23 13.4l2.4 1.8-1 2.9h-2.9l-1-2.9 2.5-1.8z" fill="#171a22" />
  </svg>
);
const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="3" y="2" width="4" height="12" rx="1.4" />
    <rect x="9" y="2" width="4" height="12" rx="1.4" />
  </svg>
);
const SoundIcon = ({ muted }: { muted: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
    <path d="M2 6.5h3l4-3.5v12l-4-3.5H2z" fill="currentColor" />
    {muted ? (
      <path d="M12 6.5l4 5M16 6.5l-4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    ) : (
      <path d="M12 6a4 4 0 010 6M14 4a7 7 0 010 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    )}
  </svg>
);

/* ---------------- Joystick ---------------- */

function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activeId = useRef<number | null>(null);

  const update = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const max = r.width * 0.33;
    const l = Math.hypot(dx, dy);
    if (l > max) {
      dx = (dx / l) * max;
      dy = (dy / l) * max;
    }
    setKnob({ x: dx, y: dy });
    onMove(dx / max, dy / max);
  };

  return (
    <div
      ref={baseRef}
      className="pointer-events-auto relative rounded-full select-none"
      style={{
        width: 'clamp(132px, 25vmin, 184px)',
        height: 'clamp(132px, 25vmin, 184px)',
        background: 'radial-gradient(circle at 50% 42%, rgba(30,52,92,0.55), rgba(10,18,36,0.5))',
        border: '2px solid rgba(120,168,255,0.35)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.35), inset 0 0 24px rgba(70,130,255,0.12)',
        touchAction: 'none',
      }}
      onPointerDown={(e) => {
        activeId.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activeId.current === e.pointerId) update(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (activeId.current === e.pointerId) {
          activeId.current = null;
          setKnob({ x: 0, y: 0 });
          onMove(0, 0);
        }
      }}
      onPointerCancel={() => {
        activeId.current = null;
        setKnob({ x: 0, y: 0 });
        onMove(0, 0);
      }}
    >
      {/* direction ticks */}
      {(
        [
          { left: '50%', top: 7, width: 3, height: 9, transform: 'translateX(-50%)' },
          { left: '50%', bottom: 7, width: 3, height: 9, transform: 'translateX(-50%)' },
          { top: '50%', left: 7, width: 9, height: 3, transform: 'translateY(-50%)' },
          { top: '50%', right: 7, width: 9, height: 3, transform: 'translateY(-50%)' },
        ] as CSSProperties[]
      ).map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{ ...s, background: 'rgba(140,180,255,0.4)', borderRadius: 2 }}
        />
      ))}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: '46%',
          height: '46%',
          transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
          background: 'radial-gradient(circle at 38% 30%, #6fa9ff, #1c4fd0 70%)',
          border: '2px solid rgba(190,215,255,0.8)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.45), inset 0 -6px 12px rgba(0,20,80,0.4)',
          transition: activeId.current === null ? 'transform 0.15s ease' : 'none',
        }}
      />
    </div>
  );
}

/* ---------------- App ---------------- */

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [screen, setScreen] = useState<'menu' | 'match' | 'fulltime'>('menu');
  const [phase, setPhase] = useState<GamePhase>('demo');
  const [hud, setHud] = useState<Hud>({ score: [0, 0], time: '03:00' });
  const [goalFx, setGoalFx] = useState<{ team: Team; n: number } | null>(null);
  const [ft, setFt] = useState<FullTime | null>(null);
  const [muted, setMuted] = useState(false);
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const check = () =>
      setPortrait(window.innerHeight > window.innerWidth * 1.15);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new Game(canvas, {
      onHud: (score, time) => setHud({ score, time }),
      onGoal: (team) => setGoalFx((g) => ({ team, n: (g?.n ?? 0) + 1 })),
      onFullTime: (r) => {
        setFt({
          score: r.score,
          shots: r.stats.shots,
          passes: r.stats.passes,
          goals: r.stats.goalsBlue,
          win: r.win,
        });
        setScreen('fulltime');
      },
      onPhase: (p) => setPhase(p),
    });
    gameRef.current = game;
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const g = () => gameRef.current;

  const play = () => {
    sfx.ensure();
    sfx.click();
    setFt(null);
    setGoalFx(null);
    setScreen('match');
    g()?.startMatch();
  };
  const toMenu = () => {
    sfx.click();
    setScreen('menu');
    g()?.backToMenu();
  };

  const inMatch = screen === 'match';

  return (
    <div
      className="fixed inset-0 overflow-hidden font-body text-white"
      style={{ background: '#07101f' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* ============ MATCH HUD ============ */}
      {inMatch && (
        <div className="absolute inset-0 pointer-events-none">
          {/* scoreboard */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 sm:top-3">
            <div
              className="flex items-stretch text-white"
              style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.5))' }}
            >
              <div
                className="flex items-center gap-2 pl-4 pr-3"
                style={{
                  background: 'linear-gradient(135deg,#1d5fe0,#0e3a94)',
                  transform: 'skewX(-10deg)',
                  borderRadius: '10px 0 0 10px',
                  border: '1px solid rgba(160,200,255,0.4)',
                }}
              >
                <span className="font-display text-[13px] sm:text-[15px] tracking-wide" style={{ transform: 'skewX(10deg)' }}>
                  BLUE
                </span>
                <span className="font-display text-2xl sm:text-3xl leading-none" style={{ transform: 'skewX(10deg)' }}>
                  {hud.score[0]}
                </span>
              </div>
              <div
                className="flex flex-col items-center justify-center px-3 sm:px-4"
                style={{ background: '#0b1526', border: '1px solid #2c4570', borderTop: '2px solid #3fc3ff' }}
              >
                <span className="font-display text-sm sm:text-lg leading-none text-[#ffe9a8]">{hud.time}</span>
                <span className="text-[8px] sm:text-[9px] tracking-[0.25em] text-[#7d95c4] font-bold">MATCH</span>
              </div>
              <div
                className="flex items-center gap-2 pl-3 pr-4"
                style={{
                  background: 'linear-gradient(135deg,#f4f6fb,#c9d2e4)',
                  transform: 'skewX(-10deg)',
                  borderRadius: '0 10px 10px 0',
                  border: '1px solid rgba(255,255,255,0.5)',
                }}
              >
                <span className="font-display text-2xl sm:text-3xl leading-none text-[#2a3042]" style={{ transform: 'skewX(10deg)' }}>
                  {hud.score[1]}
                </span>
                <span className="font-display text-[13px] sm:text-[15px] tracking-wide text-[#2a3042]" style={{ transform: 'skewX(10deg)' }}>
                  WHITE
                </span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5fa2', transform: 'skewX(10deg)', boxShadow: '0 0 8px #ff5fa2' }} />
              </div>
            </div>
          </div>

          {/* pause / sound */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-2">
            <button
              className="hud-btn w-9 h-9 sm:w-10 sm:h-10 text-[#bcd2f5]"
              style={{ background: 'rgba(12,22,42,0.82)', border: '1px solid #2c4570' }}
              onPointerDown={(e) => {
                if (e.button > 0) return;
                sfx.click();
                g()?.pauseToggle();
              }}
              aria-label="Pause"
            >
              <PauseIcon />
            </button>
            <button
              className="hud-btn w-9 h-9 sm:w-10 sm:h-10 text-[#bcd2f5]"
              style={{ background: 'rgba(12,22,42,0.82)', border: '1px solid #2c4570' }}
              onPointerDown={(e) => {
                if (e.button > 0) return;
                sfx.ensure();
                const m = !muted;
                setMuted(m);
                sfx.setMuted(m);
                if (!m) sfx.click();
              }}
              aria-label="Sound"
            >
              <SoundIcon muted={muted} />
            </button>
          </div>

          {/* kickoff pill */}
          {(phase === 'kickoff' || phase === 'goal') && (
            <div className="absolute top-[18%] left-1/2 -translate-x-1/2">
              <div
                className="rise-in font-display text-sm sm:text-lg px-5 py-2 rounded-full"
                style={{
                  background: 'rgba(8,16,32,0.85)',
                  border: '1px solid #3fc3ff',
                  color: '#bfe6ff',
                  letterSpacing: '0.2em',
                }}
              >
                {phase === 'goal' ? 'KICK OFF SOON…' : 'KICK OFF'}
              </div>
            </div>
          )}

          {/* joystick */}
          <div className="absolute" style={{ left: 'max(14px, env(safe-area-inset-left))', bottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <Joystick onMove={(x, y) => g()?.setMove(x, y)} />
          </div>

          {/* action buttons */}
          <div
            className="absolute"
            style={{
              right: 'max(14px, env(safe-area-inset-right))',
              bottom: 'max(16px, env(safe-area-inset-bottom))',
              width: 'clamp(190px, 34vmin, 262px)',
              height: 'clamp(160px, 30vmin, 232px)',
            }}
          >
            {/* CROSS — top */}
            <button
              className="hud-btn absolute"
              style={{
                right: '20%',
                top: 0,
                width: 'clamp(56px, 10.5vmin, 76px)',
                height: 'clamp(56px, 10.5vmin, 76px)',
                background: 'radial-gradient(circle at 35% 28%, #37d492, #0e8f5b 75%)',
                border: '2px solid rgba(200,255,225,0.65)',
                boxShadow: '0 8px 20px rgba(0,60,30,0.5), inset 0 -8px 14px rgba(0,50,25,0.45)',
              }}
              onPointerDown={(e) => {
                if (e.button > 0) return;
                sfx.click();
                g()?.cross();
              }}
            >
              <CrossIcon />
              <span className="text-[9px] sm:text-[10px] text-white/95">CROSS</span>
            </button>
            {/* PASS — left */}
            <button
              className="hud-btn absolute"
              style={{
                left: 0,
                bottom: '26%',
                width: 'clamp(56px, 10.5vmin, 76px)',
                height: 'clamp(56px, 10.5vmin, 76px)',
                background: 'radial-gradient(circle at 35% 28%, #5fa8ff, #1a55cc 75%)',
                border: '2px solid rgba(200,225,255,0.65)',
                boxShadow: '0 8px 20px rgba(0,30,80,0.5), inset 0 -8px 14px rgba(0,20,70,0.45)',
              }}
              onPointerDown={(e) => {
                if (e.button > 0) return;
                sfx.click();
                g()?.pass();
              }}
            >
              <PassIcon />
              <span className="text-[9px] sm:text-[10px] text-white/95">PASS</span>
            </button>
            {/* DRIBBLE — middle diagonal */}
            <button
              className="hud-btn absolute"
              style={{
                right: '38%',
                bottom: '6%',
                width: 'clamp(52px, 9.5vmin, 70px)',
                height: 'clamp(52px, 9.5vmin, 70px)',
                background: 'radial-gradient(circle at 35% 28%, #ffc257, #e08810 78%)',
                border: '2px solid rgba(255,230,180,0.7)',
                boxShadow: '0 8px 20px rgba(90,45,0,0.5), inset 0 -8px 14px rgba(120,55,0,0.4)',
              }}
              onPointerDown={(e) => {
                if (e.button > 0) return;
                sfx.click();
                g()?.dribble();
              }}
            >
              <DribbleIcon />
              <span className="text-[8px] sm:text-[9px] text-white/95">DRIBBLE</span>
            </button>
            {/* SHOOT — big, bottom right */}
            <button
              className="hud-btn pulse-ring absolute"
              style={{
                right: 0,
                bottom: 0,
                width: 'clamp(86px, 16vmin, 118px)',
                height: 'clamp(86px, 16vmin, 118px)',
                background: 'radial-gradient(circle at 35% 28%, #ff6b81, #d61f4d 72%)',
                border: '3px solid rgba(255,210,220,0.75)',
                boxShadow: '0 10px 26px rgba(120,0,30,0.55), inset 0 -10px 18px rgba(140,0,35,0.5)',
              }}
              onPointerDown={(e) => {
                if (e.button > 0) return;
                g()?.pressShoot();
              }}
              onPointerUp={() => g()?.releaseShoot()}
              onPointerLeave={() => g()?.releaseShoot()}
              onPointerCancel={() => g()?.releaseShoot()}
            >
              <ShootIcon />
              <span className="text-[11px] sm:text-[13px] text-white">SHOOT</span>
            </button>
          </div>

          {/* control hints (desktop, fades out) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 hidden md:flex gap-3 items-center"
            style={{ bottom: 10, opacity: 0.75 }}
          >
            <span className="kbd">WASD</span>
            <span className="text-[10px] text-[#9db4dd]">move</span>
            <span className="kbd">SPACE hold</span>
            <span className="text-[10px] text-[#9db4dd]">shoot</span>
            <span className="kbd">X</span>
            <span className="text-[10px] text-[#9db4dd]">pass</span>
            <span className="kbd">C</span>
            <span className="text-[10px] text-[#9db4dd]">cross</span>
            <span className="kbd">V</span>
            <span className="text-[10px] text-[#9db4dd]">dribble</span>
          </div>
        </div>
      )}

      {/* goal banner */}
      {goalFx && inMatch && (
        <div key={goalFx.n} className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="goal-flash absolute inset-0" style={{ background: goalFx.team === 0 ? 'rgba(64,140,255,0.5)' : 'rgba(255,95,162,0.45)' }} />
          <div className="goal-banner text-center" style={{ transform: 'rotate(-4deg)' }}>
            <div
              className="font-display leading-none"
              style={{
                fontSize: 'clamp(64px, 17vmin, 150px)',
                color: '#ffffff',
                textShadow:
                  goalFx.team === 0
                    ? '0 0 30px rgba(64,150,255,0.9), 5px 5px 0 #1250c8, -3px -3px 0 #7db9ff'
                    : '0 0 30px rgba(255,95,162,0.9), 5px 5px 0 #c22767, -3px -3px 0 #ffc2da',
              }}
            >
              GOAL!
            </div>
            <div
              className="font-display mt-2 text-sm sm:text-xl tracking-[0.3em]"
              style={{ color: goalFx.team === 0 ? '#9ecbff' : '#ffb3d1' }}
            >
              {goalFx.team === 0 ? 'BLUE TEAM SCORES' : 'WHITE TEAM SCORES'}
            </div>
          </div>
        </div>
      )}

      {/* pause overlay */}
      {inMatch && phase === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(4,9,20,0.78)' }}>
          <div className="rise-in text-center px-6">
            <div className="font-display text-4xl sm:text-5xl text-white mb-1" style={{ textShadow: '4px 4px 0 #1250c8' }}>
              PAUSED
            </div>
            <div className="text-[#8fa8d4] text-sm mb-7 tracking-widest">MATCH ON HOLD</div>
            <div className="flex flex-col gap-3 items-center">
              <button
                className="hud-btn w-56 h-13 py-3.5 text-lg text-white"
                style={{ background: 'linear-gradient(135deg,#2f7bff,#1250c8)', border: '2px solid rgba(180,210,255,0.6)', boxShadow: '0 10px 24px rgba(0,40,120,0.5)' }}
                onPointerDown={(e) => { if (e.button > 0) return; sfx.click(); g()?.pauseToggle(); }}
              >
                RESUME
              </button>
              <button
                className="hud-btn w-56 py-3 text-sm text-[#bcd2f5]"
                style={{ background: '#13233f', border: '1px solid #2c4570' }}
                onPointerDown={(e) => { if (e.button > 0) return; sfx.click(); g()?.pauseToggle(); g()?.startMatch(); }}
              >
                RESTART MATCH
              </button>
              <button
                className="hud-btn w-56 py-3 text-sm text-[#bcd2f5]"
                style={{ background: '#13233f', border: '1px solid #2c4570' }}
                onPointerDown={(e) => { if (e.button > 0) return; toMenu(); }}
              >
                QUIT TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MENU ============ */}
      {screen === 'menu' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6"
          style={{
            background:
              'radial-gradient(ellipse at 50% 38%, rgba(8,16,34,0.62) 0%, rgba(4,9,20,0.9) 78%)',
          }}
        >
          <div className="title-bob flex items-center gap-4 mb-1">
            <span className="ball-spin inline-block" style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.6))' }}>
              <BallIcon size={54} />
            </span>
            <h1
              className="font-display leading-[0.95] text-white"
              style={{
                fontSize: 'clamp(38px, 9vmin, 84px)',
                textShadow: '0 0 34px rgba(63,140,255,0.55), 5px 5px 0 #1250c8, 8px 8px 0 rgba(0,0,0,0.35)',
              }}
            >
              MAGIC
              <br />
              FOOTBALL
            </h1>
          </div>
          <div
            className="font-display text-[#ff8fbc] mb-8"
            style={{ fontSize: 'clamp(13px, 2.6vmin, 20px)', letterSpacing: '0.5em', textShadow: '0 0 18px rgba(255,95,162,0.6)' }}
          >
            FAST • EASY • FUN
          </div>

          <button
            className="hud-btn pulse-ring px-16 py-4 text-white"
            style={{
              fontSize: 'clamp(20px, 4vmin, 30px)',
              background: 'linear-gradient(135deg,#2f7bff 0%,#19b8ff 100%)',
              border: '3px solid rgba(210,235,255,0.8)',
              borderRadius: 18,
              transform: 'skewX(-6deg)',
              boxShadow: '0 14px 34px rgba(20,90,220,0.55), inset 0 -8px 16px rgba(0,40,120,0.4)',
            }}
            onPointerDown={(e) => { if (e.button > 0) return; play(); }}
          >
            <span style={{ transform: 'skewX(6deg)' }}>▶ PLAY</span>
          </button>

          <div className="mt-9 hidden sm:flex items-center gap-4 text-[#8fa8d4] text-xs">
            <span className="flex items-center gap-1.5"><span className="kbd">WASD</span> move</span>
            <span className="flex items-center gap-1.5"><span className="kbd">SPACE</span> shoot (hold = power)</span>
            <span className="flex items-center gap-1.5"><span className="kbd">X</span> pass</span>
            <span className="flex items-center gap-1.5"><span className="kbd">C</span> cross</span>
            <span className="flex items-center gap-1.5"><span className="kbd">V</span> dribble</span>
          </div>
          <div className="sm:hidden mt-8 text-[#8fa8d4] text-[11px] tracking-wider">
            LEFT STICK TO MOVE — BUTTONS TO PLAY
          </div>
          <div className="mt-6 text-[10px] text-[#5c7099] tracking-[0.3em]">
            3 MIN MATCH • BLUE 2 — 2 WHITE + KEEPER • ORIGINAL ARCADE GAME
          </div>
        </div>
      )}

      {/* ============ FULL TIME ============ */}
      {screen === 'fulltime' && ft && (
        <div
          className="absolute inset-0 flex items-center justify-center px-4"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(8,16,34,0.7), rgba(4,9,20,0.93) 80%)' }}
        >
          <div className="rise-in-slow text-center w-full max-w-md">
            <div
              className="font-display leading-none mb-2"
              style={{
                fontSize: 'clamp(34px, 8vmin, 64px)',
                color: ft.win === 'win' ? '#7dffb0' : ft.win === 'loss' ? '#ff8fa8' : '#ffe9a8',
                textShadow: '0 0 28px rgba(120,220,255,0.4), 4px 4px 0 rgba(0,0,0,0.4)',
              }}
            >
              {ft.win === 'win' ? 'VICTORY!' : ft.win === 'loss' ? 'DEFEAT' : 'DRAW'}
            </div>
            <div className="text-[#8fa8d4] tracking-[0.35em] text-xs mb-6 font-bold">MATCH COMPLETE!</div>

            <div className="flex items-center justify-center gap-4 mb-7">
              <div className="text-right">
                <div className="font-display text-sm text-[#7db4ff]">BLUE</div>
              </div>
              <div
                className="font-display px-5 py-2 rounded-xl"
                style={{
                  fontSize: 'clamp(30px, 6.5vmin, 50px)',
                  background: 'rgba(12,24,46,0.9)',
                  border: '1px solid #2c4570',
                  color: '#fff',
                  lineHeight: 1,
                }}
              >
                {ft.score[0]}<span className="text-[#3f5a8c] mx-2">—</span>{ft.score[1]}
              </div>
              <div className="text-left">
                <div className="font-display text-sm text-[#e8edf7]">
                  WHITE <span className="inline-block w-2 h-2 rounded-full ml-1" style={{ background: '#ff5fa2' }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-8">
              {[
                ['GOALS', ft.goals, '#7dffb0'],
                ['PASSES', ft.passes, '#7db4ff'],
                ['SHOTS', ft.shots, '#ffb35f'],
              ].map(([label, val, col]) => (
                <div
                  key={label as string}
                  className="rounded-xl py-3"
                  style={{ background: 'rgba(12,24,46,0.9)', border: '1px solid #23385e' }}
                >
                  <div className="font-display text-2xl sm:text-3xl" style={{ color: col as string, lineHeight: 1 }}>
                    {val}
                  </div>
                  <div className="text-[9px] tracking-[0.25em] text-[#7d95c4] font-bold mt-1.5">{label}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                className="hud-btn px-9 py-3.5 text-white text-lg"
                style={{
                  background: 'linear-gradient(135deg,#2f7bff,#19b8ff)',
                  border: '2px solid rgba(210,235,255,0.75)',
                  borderRadius: 14,
                  transform: 'skewX(-6deg)',
                  boxShadow: '0 12px 28px rgba(20,90,220,0.5)',
                }}
                onPointerDown={(e) => { if (e.button > 0) return; play(); }}
              >
                <span style={{ transform: 'skewX(6deg)' }}>PLAY AGAIN</span>
              </button>
              <button
                className="hud-btn px-7 py-3.5 text-[#bcd2f5] text-sm"
                style={{ background: '#13233f', border: '1px solid #2c4570', borderRadius: 14, transform: 'skewX(-6deg)' }}
                onPointerDown={(e) => { if (e.button > 0) return; toMenu(); }}
              >
                <span style={{ transform: 'skewX(6deg)' }}>MENU</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* portrait hint */}
      {portrait && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: '#07101f', zIndex: 50 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="animate-pulse">
            <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="#7db4ff" strokeWidth="1.8" />
            <path d="M20 8l2.5 4L20 16M4 8l-2.5 4L4 16" stroke="#ff8fbc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="font-display text-white text-xl">ROTATE YOUR DEVICE</div>
          <div className="text-[#8fa8d4] text-sm">Magic Football plays best in landscape</div>
        </div>
      )}
    </div>
  );
}
