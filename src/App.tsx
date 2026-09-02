import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as RPE,
} from 'react';
import { Game } from './game/engine';
import { sfx } from './game/audio';
import type { GamePhase, StatsT, Team } from './game/types';

interface ResultT {
  score: [number, number];
  stats: StatsT;
  win: 'win' | 'draw' | 'loss';
}

/* ================= inline SVG icons ================= */
const IconBall = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="#fff" stroke="#1c212c" strokeWidth="1.4" />
    <path d="M12 8.2 15.6 10.8 14.2 15H9.8L8.4 10.8Z" fill="#1c212c" />
    <path d="M12 2v3M3.4 8.8l2.9 1.2M20.6 8.8l-2.9 1.2M6 20l1.8-2.6M18 20l-1.8-2.6" stroke="#1c212c" strokeWidth="1.4" />
  </svg>
);
const IconBoot = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 17h8.5l1.8-2.6 4.6-1.2c1.7-.4 2-2.2.4-2.9L12.6 8 9.8 4.6 7.6 6l2.8 4.2L3 14.4Z" fill="currentColor" stroke="none" opacity="0.95" />
    <path d="M3 20h17" />
  </svg>
);
const IconPass = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 12h13" />
    <path d="m12 6 6 6-6 6" />
    <circle cx="4" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);
const IconCross = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 19C4 10.7 10.7 4 19 4" />
    <path d="m15 3 4 1-1 4" />
  </svg>
);
const IconPause = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="6" y="4" width="4.4" height="16" rx="1.4" />
    <rect x="13.6" y="4" width="4.4" height="16" rx="1.4" />
  </svg>
);
const IconPlay = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M7 4.5v15l13-7.5Z" />
  </svg>
);
const IconSound = ({ s = 18, off = false }: { s?: number; off?: boolean }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 5 6.5 9H3v6h3.5L11 19Z" fill="currentColor" stroke="none" />
    {off ? (
      <path d="m15 9 6 6m0-6-6 6" />
    ) : (
      <>
        <path d="M15.5 9.5a4 4 0 0 1 0 5" />
        <path d="M18.5 7a8 8 0 0 1 0 10" />
      </>
    )}
  </svg>
);

/* ================= joystick ================= */
function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [st, setSt] = useState<{ ox: number; oy: number; dx: number; dy: number } | null>(null);
  const MAX = 54;

  const down = (e: RPE<HTMLDivElement>) => {
    const zone = zoneRef.current!;
    zone.setPointerCapture(e.pointerId);
    const r = zone.getBoundingClientRect();
    setSt({ ox: e.clientX - r.left, oy: e.clientY - r.top, dx: 0, dy: 0 });
    sfx.init();
  };
  const move = (e: RPE<HTMLDivElement>) => {
    if (!st) return;
    const r = zoneRef.current!.getBoundingClientRect();
    let dx = e.clientX - r.left - st.ox;
    let dy = e.clientY - r.top - st.oy;
    const d = Math.hypot(dx, dy);
    if (d > MAX) {
      dx = (dx / d) * MAX;
      dy = (dy / d) * MAX;
    }
    setSt({ ...st, dx, dy });
    onMove(dx / MAX, dy / MAX);
  };
  const end = () => {
    setSt(null);
    onMove(0, 0);
  };

  return (
    <div
      ref={zoneRef}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className="absolute z-20"
      style={{
        left: 'max(10px, 2vh)',
        bottom: 'max(10px, 2vh)',
        width: 'min(36vmin, 210px)',
        height: 'min(36vmin, 210px)',
        touchAction: 'none',
      }}
    >
      {st ? (
        <>
          <div
            className="absolute rounded-full border-2"
            style={{
              left: st.ox - 58,
              top: st.oy - 58,
              width: 116,
              height: 116,
              borderColor: 'rgba(93,178,255,0.55)',
              background: 'radial-gradient(circle, rgba(13,30,58,0.55) 0%, rgba(13,30,58,0.25) 70%)',
              boxShadow: '0 0 24px rgba(40,120,255,0.25), inset 0 0 18px rgba(0,0,0,0.35)',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              left: st.ox + st.dx - 26,
              top: st.oy + st.dy - 26,
              width: 52,
              height: 52,
              background: 'radial-gradient(circle at 34% 30%, #7db8ff, #2b6fe8 62%, #173f8f)',
              border: '2px solid rgba(234,246,255,0.85)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.45)',
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full border-2 border-dashed flex items-center justify-center"
            style={{
              width: '62%',
              height: '62%',
              borderColor: 'rgba(140,180,255,0.4)',
              background: 'radial-gradient(circle, rgba(13,30,58,0.45) 0%, rgba(13,30,58,0.15) 75%)',
            }}
          >
            <div
              className="rounded-full opacity-70"
              style={{
                width: '42%',
                height: '42%',
                background: 'radial-gradient(circle at 34% 30%, #7db8ff, #2b6fe8 62%, #173f8f)',
                border: '2px solid rgba(234,246,255,0.7)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= action buttons ================= */
function ActionButtons({ game }: { game: () => Game | null }) {
  const hold = (fn: () => void) => (e: RPE<HTMLButtonElement>) => {
    e.preventDefault();
    sfx.init();
    fn();
  };
  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        right: 'max(12px, 2.5vw)',
        bottom: 'max(12px, 2.5vh)',
        width: 200,
        height: 158,
      }}
    >
      {/* CROSS */}
      <button
        className="hud-btn absolute"
        style={{
          right: 108,
          bottom: 10,
          width: 66,
          height: 66,
          color: '#d7f2ff',
          background: 'radial-gradient(circle at 32% 28%, #39c2ff, #0e7dc4 62%, #084a78)',
          border: '2px solid rgba(214,242,255,0.8)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.45), inset 0 -6px 10px rgba(0,20,40,0.35)',
        }}
        onPointerDown={hold(() => game()?.cross())}
        aria-label="Cross"
      >
        <IconCross />
        <span className="text-[9px] leading-none mt-0.5">CROSS</span>
      </button>
      {/* PASS */}
      <button
        className="hud-btn absolute"
        style={{
          right: 14,
          bottom: 96,
          width: 66,
          height: 66,
          color: '#e2ffe9',
          background: 'radial-gradient(circle at 32% 28%, #54e08b, #17994c 62%, #0a5c2c)',
          border: '2px solid rgba(220,255,230,0.8)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.45), inset 0 -6px 10px rgba(0,30,10,0.35)',
        }}
        onPointerDown={hold(() => game()?.pass())}
        aria-label="Pass"
      >
        <IconPass />
        <span className="text-[9px] leading-none mt-0.5">PASS</span>
      </button>
      {/* SHOOT */}
      <button
        className="hud-btn absolute"
        style={{
          right: 0,
          bottom: 0,
          width: 94,
          height: 94,
          color: '#ffecec',
          background: 'radial-gradient(circle at 32% 28%, #ff7a6b, #e02f45 60%, #8f1030)',
          border: '3px solid rgba(255,226,226,0.85)',
          boxShadow: '0 8px 22px rgba(0,0,0,0.5), inset 0 -8px 12px rgba(60,0,10,0.4)',
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          sfx.init();
          game()?.pressShoot();
        }}
        onPointerUp={() => game()?.releaseShoot()}
        onPointerLeave={() => game()?.releaseShoot()}
        onPointerCancel={() => game()?.releaseShoot()}
        aria-label="Shoot — hold for power"
      >
        <IconBoot s={30} />
        <span className="text-[11px] leading-none mt-0.5">SHOOT</span>
      </button>
    </div>
  );
}

/* ================= app ================= */
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [phase, setPhase] = useState<GamePhase>('demo');
  const [hud, setHud] = useState<{ score: [number, number]; time: string }>({
    score: [0, 0],
    time: '03:00',
  });
  const [goalFx, setGoalFx] = useState<{ team: Team; key: number } | null>(null);
  const [result, setResult] = useState<ResultT | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const g = new Game(canvas, {
      onHud: (score, time) => setHud({ score, time }),
      onGoal: (team) => setGoalFx({ team, key: Date.now() }),
      onFullTime: (r) => setResult(r),
      onPhase: (p) => setPhase(p),
    });
    gameRef.current = g;
    return () => g.destroy();
  }, []);

  useEffect(() => {
    if (!goalFx) return;
    const t = setTimeout(() => setGoalFx(null), 2400);
    return () => clearTimeout(t);
  }, [goalFx]);

  const game = () => gameRef.current;
  const ui = (fn: () => void) => () => {
    sfx.init();
    sfx.click();
    fn();
  };
  const play = ui(() => {
    setResult(null);
    setGoalFx(null);
    game()?.startMatch();
    setScreen('playing');
  });
  const toMenu = ui(() => {
    setResult(null);
    game()?.backToMenu();
    setScreen('menu');
  });

  const inMatch = screen === 'playing';
  const controlsLive = phase === 'play' || phase === 'kickoff';

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: '#050b16', touchAction: 'none' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* ==================== HUD ==================== */}
      {inMatch && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* scoreboard */}
          <div className="absolute top-[max(8px,1.6vh)] left-1/2 -translate-x-1/2 rise-in">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-1.5"
              style={{
                background: 'linear-gradient(180deg, rgba(14,28,54,0.92), rgba(8,17,34,0.92))',
                border: '1px solid rgba(90,140,220,0.4)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <span className="flex items-center gap-1.5 font-display text-[13px] tracking-wide" style={{ color: '#5db2ff' }}>
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#2b6fe8', boxShadow: '0 0 8px #2b6fe8' }} />
                BLUE
              </span>
              <span className="font-display text-xl text-white min-w-[30px] text-center">{hud.score[0]}</span>
              <span
                className="font-display text-[13px] px-2 py-0.5 rounded-md"
                style={{ background: '#13233f', color: '#ffd23f', border: '1px solid rgba(255,210,63,0.35)' }}
              >
                {hud.time}
              </span>
              <span className="font-display text-xl text-white min-w-[30px] text-center">{hud.score[1]}</span>
              <span className="flex items-center gap-1.5 font-display text-[13px] tracking-wide" style={{ color: '#ffb3d1' }}>
                WHITE
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#ff5fa2', boxShadow: '0 0 8px #ff5fa2' }} />
              </span>
            </div>
          </div>

          {/* pause / sound */}
          <div className="absolute top-[max(8px,1.6vh)] right-[max(10px,1.8vw)] flex gap-2 pointer-events-auto">
            <button
              className="hud-btn"
              style={{
                width: 42, height: 42, color: '#bcd2f5',
                background: 'linear-gradient(180deg, #16294a, #0c1a30)',
                border: '1px solid rgba(90,140,220,0.4)',
              }}
              onClick={ui(() => game()?.pauseToggle())}
              aria-label="Pause"
            >
              {phase === 'paused' ? <IconPlay /> : <IconPause />}
            </button>
            <button
              className="hud-btn"
              style={{
                width: 42, height: 42, color: '#bcd2f5',
                background: 'linear-gradient(180deg, #16294a, #0c1a30)',
                border: '1px solid rgba(90,140,220,0.4)',
              }}
              onClick={ui(() => {
                const m = !muted;
                setMuted(m);
                sfx.setMuted(m);
              })}
              aria-label="Toggle sound"
            >
              <IconSound off={muted} />
            </button>
          </div>

          {/* kickoff chip */}
          {phase === 'kickoff' && (
            <div className="absolute top-[max(58px,9vh)] left-1/2 -translate-x-1/2">
              <div
                className="font-display text-sm tracking-widest px-4 py-1.5 rounded-full rise-in"
                style={{ background: 'rgba(10,22,42,0.85)', color: '#ffd23f', border: '1px solid rgba(255,210,63,0.4)' }}
              >
                KICK OFF
              </div>
            </div>
          )}

          {/* controls */}
          {controlsLive && (
            <>
              <Joystick onMove={(x, y) => game()?.setMove(x, y)} />
              <ActionButtons game={game} />
            </>
          )}

          {/* goal flash + banner */}
          {goalFx && (
            <>
              <div key={`f${goalFx.key}`} className="goal-flash absolute inset-0" style={{ background: '#ffffff' }} />
              <div
                key={`b${goalFx.key}`}
                className="goal-banner absolute inset-0 flex flex-col items-center justify-center"
              >
                <div
                  className="font-display"
                  style={{
                    fontSize: 'clamp(56px, 14vmin, 128px)',
                    color: goalFx.team === 0 ? '#5db2ff' : '#ff8fbf',
                    textShadow: '0 4px 0 rgba(0,0,0,0.45), 0 0 42px rgba(120,190,255,0.55)',
                    letterSpacing: '0.02em',
                  }}
                >
                  GOAL!
                </div>
                <div className="font-display text-lg md:text-2xl text-white mt-1" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.5)' }}>
                  {goalFx.team === 0 ? 'BLUE TEAM SCORES' : 'WHITE TEAM SCORES'}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== PAUSE ==================== */}
      {inMatch && phase === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(4,9,18,0.72)' }}>
          <div
            className="rise-in rounded-2xl px-10 py-8 flex flex-col items-center gap-4"
            style={{ background: 'linear-gradient(180deg,#101f3a,#0a1526)', border: '1px solid rgba(90,140,220,0.45)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
          >
            <div className="font-display text-3xl text-white">PAUSED</div>
            <div className="font-body text-sm" style={{ color: '#8fa8d0' }}>
              BLUE {hud.score[0]} — {hud.score[1]} WHITE · {hud.time}
            </div>
            <div className="flex flex-col gap-2.5 w-56 mt-1">
              <button className="hud-btn py-3 text-sm text-white" style={{ background: 'linear-gradient(180deg,#2f8f4f,#176b35)', border: '1px solid rgba(160,255,190,0.5)' }} onClick={ui(() => game()?.pauseToggle())}>
                RESUME
              </button>
              <button className="hud-btn py-3 text-sm text-white" style={{ background: 'linear-gradient(180deg,#1d3a6b,#122547)', border: '1px solid rgba(90,140,220,0.5)' }} onClick={play}>
                RESTART MATCH
              </button>
              <button className="hud-btn py-3 text-sm" style={{ color: '#bcd2f5', background: 'rgba(19,35,63,0.6)', border: '1px solid rgba(90,140,220,0.35)' }} onClick={toMenu}>
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FULL TIME ==================== */}
      {inMatch && result && phase === 'fulltime' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(4,9,18,0.7)' }}>
          <div
            className="rise-in-slow rounded-2xl px-10 py-8 flex flex-col items-center"
            style={{ minWidth: 330, background: 'linear-gradient(180deg,#101f3a,#0a1526)', border: '1px solid rgba(90,140,220,0.45)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
          >
            <div className="font-display text-[15px] tracking-widest" style={{ color: '#ffd23f' }}>
              FULL TIME
            </div>
            <div
              className="font-display mt-1"
              style={{
                fontSize: 40,
                color: result.win === 'win' ? '#6fe09a' : result.win === 'loss' ? '#ff8f8f' : '#bcd2f5',
                textShadow: '0 3px 0 rgba(0,0,0,0.45)',
              }}
            >
              {result.win === 'win' ? 'YOU WIN!' : result.win === 'loss' ? 'DEFEAT' : 'DRAW'}
            </div>

            <div className="flex items-center gap-4 mt-4">
              <span className="font-display text-sm" style={{ color: '#5db2ff' }}>BLUE</span>
              <span className="font-display text-4xl text-white">{result.score[0]}</span>
              <span className="font-display text-xl" style={{ color: '#5b7396' }}>—</span>
              <span className="font-display text-4xl text-white">{result.score[1]}</span>
              <span className="font-display text-sm" style={{ color: '#ffb3d1' }}>WHITE</span>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-5 font-body text-sm" style={{ color: '#bcd2f5' }}>
              <div className="flex justify-between gap-6"><span>Goals</span><b className="text-white">{result.stats.goalsBlue}</b></div>
              <div className="flex justify-between gap-6"><span>Shots</span><b className="text-white">{result.stats.shots}</b></div>
              <div className="flex justify-between gap-6"><span>Passes</span><b className="text-white">{result.stats.passes}</b></div>
              <div className="flex justify-between gap-6"><span>Saves faced</span><b className="text-white">{result.stats.saves}</b></div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="hud-btn px-7 py-3 text-sm text-white pulse-ring" style={{ background: 'linear-gradient(180deg,#3d8bff,#1b5fd6)', border: '1px solid rgba(160,210,255,0.6)' }} onClick={play}>
                PLAY AGAIN
              </button>
              <button className="hud-btn px-6 py-3 text-sm" style={{ color: '#bcd2f5', background: 'rgba(19,35,63,0.6)', border: '1px solid rgba(90,140,220,0.35)' }} onClick={toMenu}>
                MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MENU ==================== */}
      {screen === 'menu' && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(4,9,18,0.88) 0%, rgba(4,9,18,0.55) 38%, rgba(4,9,18,0.05) 68%)' }} />

          <div className="absolute left-[max(20px,4vw)] top-1/2 -translate-y-1/2 flex flex-col items-start pointer-events-auto max-w-[560px]">
            <div className="flex items-center gap-2 mb-2 rise-in">
              <span className="inline-flex items-center gap-1.5 font-body text-[11px] font-bold tracking-[0.22em] px-3 py-1 rounded-full" style={{ color: '#ff8f8f', background: 'rgba(60,12,20,0.7)', border: '1px solid rgba(255,110,110,0.4)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff5f5f', boxShadow: '0 0 8px #ff5f5f' }} />
                LIVE DEMO ON THE PITCH
              </span>
            </div>

            <h1 className="title-bob font-display leading-[0.95]" style={{ fontSize: 'clamp(44px, 9vmin, 88px)' }}>
              <span style={{ color: '#5db2ff', textShadow: '0 5px 0 #0d2c55, 0 10px 30px rgba(40,120,255,0.45)' }}>MAGIC</span>
              <br />
              <span className="inline-flex items-center gap-3" style={{ color: '#ffffff', textShadow: '0 5px 0 #123a24, 0 10px 30px rgba(80,255,150,0.35)' }}>
                FOOTBALL
                <span className="ball-spin inline-block"><IconBall s={Math.round(52)} /></span>
              </span>
            </h1>

            <p className="font-body font-semibold mt-3 text-sm md:text-base rise-in" style={{ color: '#a8c0e8', animationDelay: '0.08s' }}>
              Full-pitch arcade football — the whole stadium stays on screen.
              <span style={{ color: '#ffd23f' }}> 3 minutes. Two keepers. Easy to score.</span>
            </p>

            <div className="rise-in mt-6" style={{ animationDelay: '0.15s' }}>
              <div className="pulse-ring rounded-full w-fit">
                <button
                  className="hud-btn px-12 py-4 text-xl text-white"
                  style={{
                    background: 'radial-gradient(circle at 30% 25%, #4da3ff, #1b5fd6 65%, #123e8c)',
                    border: '2px solid rgba(190,225,255,0.85)',
                    boxShadow: '0 10px 30px rgba(27,95,214,0.5), inset 0 -8px 14px rgba(10,30,80,0.5)',
                  }}
                  onClick={play}
                >
                  PLAY
                </button>
              </div>
            </div>

            <div
              className="rise-in mt-6 rounded-xl px-4 py-3 font-body text-[12px] leading-6"
              style={{
                animationDelay: '0.22s',
                color: '#8fa8d0',
                background: 'rgba(10,22,42,0.72)',
                border: '1px solid rgba(90,140,220,0.3)',
              }}
            >
              <div><span className="kbd">W A S D</span> / joystick — move &nbsp; <span className="kbd">SPACE</span> shoot <i>(hold = power)</i></div>
              <div><span className="kbd">X</span> pass &nbsp; <span className="kbd">C</span> cross &nbsp; <span className="kbd">P</span> pause &nbsp;·&nbsp; nearest blue player is auto-selected</div>
            </div>
          </div>

          <div className="absolute right-[max(16px,3vw)] bottom-[max(14px,3vh)] font-body text-[11px] pointer-events-none" style={{ color: '#5b7396' }}>
            Fixed broadcast camera · BLUE attacks right · WHITE attacks left
          </div>
        </div>
      )}
    </div>
  );
}
