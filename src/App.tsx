import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as RPE,
  type ReactNode,
} from 'react';
import { Game } from './game/engine';
import { sfx } from './game/audio';
import type { GamePhase, StatsT, Team } from './game/types';
import {
  STR,
  loadLang,
  loadMuted,
  saveLang,
  saveMuted,
  type Dict,
  type Lang,
} from './game/i18n';

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
const IconDribble = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 6h9M2 10h7" />
    <path d="m13 14 7-2-2.4 8-2.2-2.4-3 3.4-1.6-1.4 3-3.4Z" fill="currentColor" stroke="none" opacity="0.95" />
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
const IconHelp = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M9.4 9.2a2.7 2.7 0 0 1 5.3.7c0 1.8-2.6 2.2-2.6 3.9" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);
const IconInfo = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M12 11v5.4" />
    <circle cx="12" cy="7.6" r="0.7" fill="currentColor" stroke="none" />
  </svg>
);
const IconGlobe = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.6-4-9s1.3-6.4 4-9Z" />
  </svg>
);
const IconX = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
const IconPhone = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 4h4l1.8 4.4-2.2 1.7a13.6 13.6 0 0 0 5.3 5.3l1.7-2.2L20 15v4a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />
  </svg>
);
const IconRocket = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 2.5c3.5 1.8 5.5 5.2 5.5 9.2l-2.3 2.3H8.8L6.5 11.7c0-4 2-7.4 5.5-9.2Z" fill="currentColor" stroke="none" opacity="0.92" />
    <path d="M8.8 14 6 16.8M15.2 14 18 16.8M12 14v5.5" />
    <circle cx="12" cy="8.4" r="1.7" fill="#0d1b33" stroke="none" />
  </svg>
);
const IconRotate = ({ s = 44 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="7" y="3" width="10" height="18" rx="2.4" />
    <path d="M11 17.6h2" />
    <path d="M3.5 12a8.5 8.5 0 0 1 3-6.4" opacity="0.85" />
    <path d="m6.8 3.4-.4 2.4 2.4.3" opacity="0.85" />
    <path d="M20.5 12a8.5 8.5 0 0 1-3 6.4" opacity="0.85" />
    <path d="m17.2 20.6.4-2.4-2.4-.3" opacity="0.85" />
  </svg>
);

/* ================= joystick (fixed base, always works) ================= */
function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState<{ dx: number; dy: number } | null>(null);
  const MAX = 52;

  const vector = (e: RPE<HTMLDivElement>) => {
    const r = zoneRef.current!.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > MAX) {
      dx = (dx / d) * MAX;
      dy = (dy / d) * MAX;
    }
    return { dx, dy };
  };

  const down = (e: RPE<HTMLDivElement>) => {
    zoneRef.current!.setPointerCapture(e.pointerId);
    sfx.init();
    const v = vector(e);
    setKnob(v);
    onMove(v.dx / MAX, v.dy / MAX);
  };
  const move = (e: RPE<HTMLDivElement>) => {
    if (knob === null) return;
    const v = vector(e);
    setKnob(v);
    onMove(v.dx / MAX, v.dy / MAX);
  };
  const end = () => {
    setKnob(null);
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
        left: 'calc(env(safe-area-inset-left, 0px) + max(12px, 2.5vw))',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + max(12px, 2.5vh))',
        width: 'min(40vmin, 190px)',
        height: 'min(40vmin, 190px)',
        touchAction: 'none',
      }}
    >
      {/* base */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: '2px solid rgba(93,178,255,0.5)',
          background:
            'radial-gradient(circle, rgba(13,30,58,0.6) 0%, rgba(13,30,58,0.28) 72%)',
          boxShadow:
            '0 0 26px rgba(40,120,255,0.22), inset 0 0 20px rgba(0,0,0,0.35)',
        }}
      />
      {/* direction ticks */}
      {(
        [
          { left: '50%', top: 8, width: 3, height: 10, ml: -1.5, mt: 0 },
          { left: '50%', bottom: 8, width: 3, height: 10, ml: -1.5, mt: 0 },
          { top: '50%', left: 8, width: 10, height: 3, ml: 0, mt: -1.5 },
          { top: '50%', right: 8, width: 10, height: 3, ml: 0, mt: -1.5 },
        ] as {
          left?: number | string;
          top?: number | string;
          right?: number;
          bottom?: number;
          width: number;
          height: number;
          ml: number;
          mt: number;
        }[]
      ).map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: s.left,
            top: s.top,
            right: s.right,
            bottom: s.bottom,
            width: s.width,
            height: s.height,
            marginLeft: s.ml,
            marginTop: s.mt,
            background: 'rgba(140,180,255,0.4)',
            borderRadius: 2,
          }}
        />
      ))}
      {/* knob */}
      <div
        className="absolute rounded-full"
        style={{
          left: '50%',
          top: '50%',
          width: 62,
          height: 62,
          transform: `translate(calc(-50% + ${knob?.dx ?? 0}px), calc(-50% + ${knob?.dy ?? 0}px))`,
          background:
            'radial-gradient(circle at 34% 30%, #7db8ff, #2b6fe8 62%, #173f8f)',
          border: '2px solid rgba(234,246,255,0.85)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
          transition: knob === null ? 'transform 0.16s ease' : 'none',
        }}
      />
    </div>
  );
}

/* ================= action buttons ================= */
function ActionButtons({ game, t }: { game: () => Game | null; t: Dict }) {
  const press = (fn: () => void) => (e: RPE<HTMLButtonElement>) => {
    e.preventDefault();
    sfx.init();
    fn();
  };
  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        right: 'calc(env(safe-area-inset-right, 0px) + max(12px, 2.5vw))',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + max(12px, 2.5vh))',
        width: 250,
        height: 174,
        transform: 'scale(var(--ctrl-scale, 1))',
        transformOrigin: '100% 100%',
      }}
    >
      {/* DRIBBLE */}
      <button
        className="hud-btn absolute"
        style={{
          right: 182, bottom: 6, width: 62, height: 62,
          color: '#fff3d6',
          background: 'radial-gradient(circle at 32% 28%, #ffc14d, #e08b12 62%, #8f5606)',
          border: '2px solid rgba(255,240,210,0.8)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.45), inset 0 -6px 10px rgba(60,35,0,0.35)',
        }}
        onPointerDown={press(() => game()?.dribble())}
        aria-label={t.ariaDribble}
      >
        <IconDribble />
        <span className="text-[8.5px] leading-none mt-0.5">{t.dribble}</span>
      </button>
      {/* CROSS */}
      <button
        className="hud-btn absolute"
        style={{
          right: 106, bottom: 6, width: 62, height: 62,
          color: '#d7f2ff',
          background: 'radial-gradient(circle at 32% 28%, #39c2ff, #0e7dc4 62%, #084a78)',
          border: '2px solid rgba(214,242,255,0.8)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.45), inset 0 -6px 10px rgba(0,20,40,0.35)',
        }}
        onPointerDown={press(() => game()?.cross())}
        aria-label={t.ariaCross}
      >
        <IconCross />
        <span className="text-[8.5px] leading-none mt-0.5">{t.cross}</span>
      </button>
      {/* PASS */}
      <button
        className="hud-btn absolute"
        style={{
          right: 18, bottom: 106, width: 62, height: 62,
          color: '#e2ffe9',
          background: 'radial-gradient(circle at 32% 28%, #54e08b, #17994c 62%, #0a5c2c)',
          border: '2px solid rgba(220,255,230,0.8)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.45), inset 0 -6px 10px rgba(0,30,10,0.35)',
        }}
        onPointerDown={press(() => game()?.pass())}
        aria-label={t.ariaPass}
      >
        <IconPass />
        <span className="text-[8.5px] leading-none mt-0.5">{t.pass}</span>
      </button>
      {/* SHOOT */}
      <button
        className="hud-btn absolute"
        style={{
          right: 0, bottom: 0, width: 98, height: 98,
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
        aria-label={t.ariaShoot}
      >
        <IconBoot s={30} />
        <span className="text-[11px] leading-none mt-0.5">{t.shoot}</span>
      </button>
    </div>
  );
}

/* ================= modal shell ================= */
function Modal({
  title,
  icon,
  onClose,
  closeLabel,
  children,
}: {
  title: string;
  icon: ReactNode;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-3 fade-in"
      style={{ background: 'rgba(4,9,18,0.8)' }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rise-in flex flex-col"
        style={{
          width: 'min(94vw, 620px)',
          maxHeight: '88vh',
          background: 'linear-gradient(180deg,#101f3a,#0a1526)',
          border: '1px solid rgba(90,140,220,0.45)',
          borderRadius: 18,
          boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: '1px solid rgba(90,140,220,0.28)' }}
        >
          <div className="flex items-center gap-2.5 font-display text-lg" style={{ color: '#eaf2ff' }}>
            <span style={{ color: '#ffd23f' }}>{icon}</span>
            {title}
          </div>
          <button
            className="hud-btn"
            style={{
              width: 44, height: 44,
              color: '#bcd2f5',
              background: 'rgba(19,35,63,0.8)',
              border: '1px solid rgba(90,140,220,0.45)',
            }}
            onClick={onClose}
            aria-label={closeLabel}
          >
            <IconX />
          </button>
        </div>
        <div className="panel-scroll overflow-y-auto px-5 py-4" style={{ minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ================= help content ================= */
function HelpRow({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-3 py-2.5" style={{ borderBottom: '1px dashed rgba(90,140,220,0.18)' }}>
      <span
        className="shrink-0 font-display text-[11px] mt-0.5 flex items-center justify-center"
        style={{
          width: 26, height: 26, borderRadius: 8, color: '#ffd23f',
          background: '#13233f', border: '1px solid rgba(255,210,63,0.35)',
        }}
      >
        {n}
      </span>
      <div className="min-w-0">
        <div className="font-bold text-[14px]" style={{ color: '#eaf2ff' }}>{title}</div>
        <div className="text-[12.5px] leading-6 mt-0.5" style={{ color: '#9db4dc' }}>{body}</div>
      </div>
    </div>
  );
}

function HelpSection({ chip, title, items }: { chip: string; title: string; items: { title: string; body: string }[] }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2.5 mb-1 mt-2">
        <span
          className="font-display text-[12px] px-2.5 py-1 rounded-md shrink-0"
          style={{
            background: 'linear-gradient(180deg,#24406e,#16294a)',
            color: '#7db8ff',
            border: '1px solid rgba(125,184,255,0.45)',
          }}
        >
          {chip}
        </span>
        <span className="font-display text-[16px]" style={{ color: '#ffffff' }}>{title}</span>
      </div>
      {items.map((it, i) => (
        <HelpRow key={it.title} n={i + 1} title={it.title} body={it.body} />
      ))}
    </div>
  );
}

function HelpModal({ t, onClose }: { t: Dict; onClose: () => void }) {
  return (
    <Modal title={t.helpTitle} icon={<IconHelp s={20} />} onClose={onClose} closeLabel={t.close}>
      <HelpSection chip="1" title={t.howto} items={t.helpHowto} />
      <HelpSection chip="2" title={t.menus} items={t.helpMenus} />
      <div className="py-1.5 text-center text-[11px]" style={{ color: '#5b7396' }}>
        MAGIC FOOTBALL · {t.subtitleB}
      </div>
    </Modal>
  );
}

/* ================= about content ================= */
function AboutModal({ t, onClose }: { t: Dict; onClose: () => void }) {
  return (
    <Modal title={t.aboutTitle} icon={<IconInfo s={20} />} onClose={onClose} closeLabel={t.close}>
      <div className="flex flex-col items-center text-center py-2">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 76, height: 76,
            background: 'radial-gradient(circle at 32% 28%, #4da3ff, #1b5fd6 65%, #123e8c)',
            border: '2px solid rgba(190,225,255,0.8)',
            boxShadow: '0 10px 30px rgba(27,95,214,0.45)',
          }}
        >
          <IconBall s={44} />
        </div>
        <div className="font-display text-xl mt-3" style={{ color: '#ffffff' }}>{t.aboutTitle}</div>
        <div className="font-body font-bold text-[15px] mt-2" style={{ color: '#cfe0fa' }}>{t.aboutName}</div>
        <div className="font-body text-[13.5px] mt-1" style={{ color: '#9db4dc' }}>{t.aboutClass}</div>

        <div className="w-full my-4" style={{ borderBottom: '1px dashed rgba(90,140,220,0.3)' }} />

        <div className="font-body text-[13px] font-bold" style={{ color: '#8fa8d0' }}>{t.aboutContact}</div>
        <a
          href="tel:+971551544988"
          className="mt-2 inline-flex items-center gap-2.5 font-body font-bold text-[16px] px-5 py-2.5 rounded-full"
          style={{
            direction: 'ltr',
            color: '#ffd23f',
            background: 'rgba(60,45,10,0.5)',
            border: '1px solid rgba(255,210,63,0.45)',
            letterSpacing: '0.06em',
            textDecoration: 'none',
          }}
        >
          <IconPhone s={17} />
          <bdi dir="ltr">00971551544988</bdi>
        </a>
      </div>
    </Modal>
  );
}

/* ================= publish guide ================= */
function CmdBlock({
  cmd,
  copyLabel,
  copiedLabel,
}: {
  cmd: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = cmd;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
      } catch {
        /* clipboard unavailable */
      }
    }
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2 mt-2"
      style={{ background: '#0a1322', border: '1px solid rgba(90,140,220,0.35)' }}
    >
      <code
        className="flex-1 min-w-0 overflow-x-auto text-[13px] font-bold py-1"
        style={{
          direction: 'ltr',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          color: '#7dffb0',
        }}
      >
        {cmd}
      </code>
      <button
        className="shrink-0 font-body font-bold text-[12px] px-3 py-2 rounded-full"
        style={{
          minWidth: 76,
          cursor: 'pointer',
          color: copied ? '#7dffb0' : '#cfe0fa',
          background: copied
            ? 'rgba(18,58,34,0.85)'
            : 'linear-gradient(180deg,#24406e,#16294a)',
          border: copied
            ? '1px solid rgba(125,255,176,0.55)'
            : '1px solid rgba(125,184,255,0.45)',
          transition: 'all 0.15s ease',
        }}
        onClick={() => {
          sfx.init();
          sfx.click();
          void copy();
        }}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

function PublishModal({ t, onClose }: { t: Dict; onClose: () => void }) {
  return (
    <Modal
      title={t.publishTitle}
      icon={<IconRocket s={20} />}
      onClose={onClose}
      closeLabel={t.close}
    >
      <div className="text-[13.5px] leading-7 mb-2" style={{ color: '#9db4dc' }}>
        {t.publishIntro}
      </div>
      {t.publishSteps.map((s, i) => (
        <HelpRow key={s.title} n={i + 1} title={s.title} body={s.body} />
      ))}
      <div className="mt-4 mb-0.5 font-display text-[16px]" style={{ color: '#ffffff' }}>
        {t.publishCmdsTitle}
      </div>
      <CmdBlock cmd="npm run build" copyLabel={t.publishCopy} copiedLabel={t.publishCopied} />
      <CmdBlock cmd="npx gh-pages -d dist" copyLabel={t.publishCopy} copiedLabel={t.publishCopied} />
      <div className="pt-3 pb-1 text-center text-[11.5px]" style={{ color: '#5b7396', direction: 'ltr' }}>
        https://USERNAME.github.io/magic-football/
      </div>
    </Modal>
  );
}

/* ================= language toggle ================= */
function LangToggle({ lang, setLang, t }: { lang: Lang; setLang: (l: Lang) => void; t: Dict }) {
  return (
    <div
      className="menu-btn p-1"
      role="group"
      aria-label={t.ariaLanguage}
      style={{ background: '#0d1b33', border: '1px solid rgba(90,140,220,0.45)' }}
    >
      <span className="ps-1.5" style={{ color: '#8fa8d0' }}>
        <IconGlobe />
      </span>
      {(['en', 'fa'] as const).map((l) => {
        const active = l === lang;
        return (
          <button
            key={l}
            className="font-bold text-[12px] rounded-full px-3.5 py-1.5"
            style={
              active
                ? {
                    background: 'linear-gradient(180deg,#3d8bff,#1b5fd6)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(27,95,214,0.5)',
                    border: '1px solid rgba(160,210,255,0.6)',
                    cursor: 'default',
                  }
                : { color: '#8fa8d0', background: 'transparent', border: '1px solid transparent', cursor: 'pointer' }
            }
            onClick={() => {
              if (l === lang) return;
              sfx.init();
              sfx.click();
              setLang(l);
            }}
            aria-pressed={active}
          >
            {l === 'en' ? 'English' : 'فارسی'}
          </button>
        );
      })}
    </div>
  );
}

/* ================= orientation ================= */
function usePortrait() {
  const [portrait, setPortrait] = useState(
    () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  );
  useEffect(() => {
    const onR = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', onR);
    window.addEventListener('orientationchange', onR);
    return () => {
      window.removeEventListener('resize', onR);
      window.removeEventListener('orientationchange', onR);
    };
  }, []);
  return portrait;
}

function RotateOverlay({ t, onDismiss }: { t: Dict; onDismiss: () => void }) {
  return (
    <div
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center text-center fade-in px-8"
      style={{ background: 'rgba(4,9,18,0.94)' }}
    >
      <div className="phone-tilt" style={{ color: '#5db2ff' }}>
        <IconRotate s={72} />
      </div>
      <div className="font-display text-2xl mt-6" style={{ color: '#eaf2ff' }}>
        {t.rotateTitle}
      </div>
      <div className="font-body text-[14px] mt-3 max-w-[340px] leading-7" style={{ color: '#9db4dc' }}>
        {t.rotateText}
      </div>
      <button
        className="hud-btn mt-8 px-8 py-3 text-sm"
        style={{
          color: '#bcd2f5',
          background: 'rgba(19,35,63,0.7)',
          border: '1px solid rgba(90,140,220,0.45)',
        }}
        onClick={onDismiss}
      >
        {t.rotateContinue}
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
  const [lang, setLang] = useState<Lang>(() => loadLang());
  const [muted, setMuted] = useState<boolean>(() => loadMuted());
  const [modal, setModal] = useState<null | 'help' | 'about' | 'publish'>(null);
  const portrait = usePortrait();
  const [rotateDismissed, setRotateDismissed] = useState(false);

  const t = STR[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    saveLang(lang);
  }, [lang]);

  useEffect(() => {
    saveMuted(muted);
    sfx.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    setRotateDismissed(false);
  }, [portrait]);

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
    const tm = setTimeout(() => setGoalFx(null), 2400);
    return () => clearTimeout(tm);
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
    setModal(null);
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
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* ==================== HUD ==================== */}
      {inMatch && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* scoreboard */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rise-in"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + max(8px, 1.6vh))' }}
          >
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
                {t.blue}
              </span>
              <span className="score-num text-xl text-white min-w-[30px] text-center">{hud.score[0]}</span>
              <span
                className="score-num text-[13px] px-2 py-0.5 rounded-md"
                style={{ background: '#13233f', color: '#ffd23f', border: '1px solid rgba(255,210,63,0.35)' }}
              >
                {hud.time}
              </span>
              <span className="score-num text-xl text-white min-w-[30px] text-center">{hud.score[1]}</span>
              <span className="flex items-center gap-1.5 font-display text-[13px] tracking-wide" style={{ color: '#ffb3d1' }}>
                {t.white}
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#ff5fa2', boxShadow: '0 0 8px #ff5fa2' }} />
              </span>
            </div>
          </div>

          {/* pause / sound */}
          <div
            className="absolute flex gap-2 pointer-events-auto"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + max(8px, 1.6vh))',
              right: 'calc(env(safe-area-inset-right, 0px) + max(10px, 1.8vw))',
            }}
          >
            <button
              className="hud-btn"
              style={{
                width: 44, height: 44, color: '#bcd2f5',
                background: 'linear-gradient(180deg, #16294a, #0c1a30)',
                border: '1px solid rgba(90,140,220,0.4)',
              }}
              onClick={ui(() => game()?.pauseToggle())}
              aria-label={t.ariaPause}
            >
              {phase === 'paused' ? <IconPlay /> : <IconPause />}
            </button>
            <button
              className="hud-btn"
              style={{
                width: 44, height: 44, color: '#bcd2f5',
                background: 'linear-gradient(180deg, #16294a, #0c1a30)',
                border: '1px solid rgba(90,140,220,0.4)',
              }}
              onClick={ui(() => setMuted(!muted))}
              aria-label={t.ariaSound}
            >
              <IconSound off={muted} />
            </button>
          </div>

          {/* kickoff chip */}
          {phase === 'kickoff' && (
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + max(62px, 9vh))' }}
            >
              <div
                className="font-display text-sm tracking-widest px-4 py-1.5 rounded-full rise-in"
                style={{ background: 'rgba(10,22,42,0.85)', color: '#ffd23f', border: '1px solid rgba(255,210,63,0.4)' }}
              >
                {t.kickoff}
              </div>
            </div>
          )}

          {/* controls */}
          {controlsLive && (
            <>
              <Joystick onMove={(x, y) => game()?.setMove(x, y)} />
              <ActionButtons game={game} t={t} />
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
                  {t.goal}
                </div>
                <div className="font-display text-lg md:text-2xl text-white mt-1" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.5)' }}>
                  {goalFx.team === 0 ? t.blueScores : t.whiteScores}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== PAUSE ==================== */}
      {inMatch && phase === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-3" style={{ background: 'rgba(4,9,18,0.72)' }}>
          <div
            className="rise-in rounded-2xl px-8 py-7 flex flex-col items-center gap-4 w-[min(92vw,360px)]"
            style={{ background: 'linear-gradient(180deg,#101f3a,#0a1526)', border: '1px solid rgba(90,140,220,0.45)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
          >
            <div className="font-display text-3xl text-white">{t.paused}</div>
            <div className="font-body text-sm" style={{ color: '#8fa8d0' }}>
              {t.blue} {hud.score[0]} — {hud.score[1]} {t.white} · {hud.time}
            </div>
            <div className="flex flex-col gap-2.5 w-full max-w-[240px] mt-1">
              <button className="hud-btn py-3 text-sm text-white" style={{ background: 'linear-gradient(180deg,#2f8f4f,#176b35)', border: '1px solid rgba(160,255,190,0.5)' }} onClick={ui(() => game()?.pauseToggle())}>
                {t.resume}
              </button>
              <button className="hud-btn py-3 text-sm text-white" style={{ background: 'linear-gradient(180deg,#1d3a6b,#122547)', border: '1px solid rgba(90,140,220,0.5)' }} onClick={play}>
                {t.restart}
              </button>
              <button className="hud-btn py-3 text-sm" style={{ color: '#bcd2f5', background: 'rgba(19,35,63,0.6)', border: '1px solid rgba(90,140,220,0.35)' }} onClick={toMenu}>
                {t.mainMenu}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FULL TIME ==================== */}
      {inMatch && result && phase === 'fulltime' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-3" style={{ background: 'rgba(4,9,18,0.7)' }}>
          <div
            className="rise-in-slow rounded-2xl px-8 py-7 flex flex-col items-center panel-scroll overflow-y-auto"
            style={{ width: 'min(92vw, 380px)', maxHeight: '92vh', background: 'linear-gradient(180deg,#101f3a,#0a1526)', border: '1px solid rgba(90,140,220,0.45)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
          >
            <div className="font-display text-[15px] tracking-widest" style={{ color: '#ffd23f' }}>
              {t.fullTime}
            </div>
            <div
              className="font-display mt-1"
              style={{
                fontSize: 40,
                color: result.win === 'win' ? '#6fe09a' : result.win === 'loss' ? '#ff8f8f' : '#bcd2f5',
                textShadow: '0 3px 0 rgba(0,0,0,0.45)',
              }}
            >
              {result.win === 'win' ? t.win : result.win === 'loss' ? t.lose : t.draw}
            </div>

            <div className="flex items-center gap-4 mt-4">
              <span className="font-display text-sm" style={{ color: '#5db2ff' }}>{t.blue}</span>
              <span className="score-num text-4xl text-white">{result.score[0]}</span>
              <span className="font-display text-xl" style={{ color: '#5b7396' }}>—</span>
              <span className="score-num text-4xl text-white">{result.score[1]}</span>
              <span className="font-display text-sm" style={{ color: '#ffb3d1' }}>{t.white}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-5 font-body text-sm" style={{ color: '#bcd2f5' }}>
              <div className="flex justify-between gap-6"><span>{t.stGoals}</span><b className="text-white">{result.stats.goalsBlue}</b></div>
              <div className="flex justify-between gap-6"><span>{t.stShots}</span><b className="text-white">{result.stats.shots}</b></div>
              <div className="flex justify-between gap-6"><span>{t.stPasses}</span><b className="text-white">{result.stats.passes}</b></div>
              <div className="flex justify-between gap-6"><span>{t.stSaves}</span><b className="text-white">{result.stats.saves}</b></div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="hud-btn px-7 py-3 text-sm text-white pulse-ring" style={{ background: 'linear-gradient(180deg,#3d8bff,#1b5fd6)', border: '1px solid rgba(160,210,255,0.6)' }} onClick={play}>
                {t.playAgain}
              </button>
              <button className="hud-btn px-6 py-3 text-sm" style={{ color: '#bcd2f5', background: 'rgba(19,35,63,0.6)', border: '1px solid rgba(90,140,220,0.35)' }} onClick={toMenu}>
                {t.menuBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MENU ==================== */}
      {screen === 'menu' && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background:
                lang === 'fa'
                  ? 'linear-gradient(255deg, rgba(4,9,18,0.9) 0%, rgba(4,9,18,0.55) 40%, rgba(4,9,18,0.05) 70%)'
                  : 'linear-gradient(105deg, rgba(4,9,18,0.88) 0%, rgba(4,9,18,0.55) 38%, rgba(4,9,18,0.05) 68%)',
            }}
          />

          <div
            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-start pointer-events-auto max-w-[560px] w-[min(94vw,560px)]"
            style={{ insetInlineStart: 'max(20px,4vw)' }}
          >
            <div className="flex items-center gap-2 mb-2 rise-in">
              <span className="inline-flex items-center gap-1.5 font-body text-[11px] font-bold tracking-[0.22em] px-3 py-1 rounded-full" style={{ color: '#ff8f8f', background: 'rgba(60,12,20,0.7)', border: '1px solid rgba(255,110,110,0.4)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff5f5f', boxShadow: '0 0 8px #ff5f5f' }} />
                {t.demoBadge}
              </span>
            </div>

            <div className="font-body font-black text-[13px] tracking-[0.3em] mb-1" style={{ color: '#ffd23f' }}>
              {t.kicker}
            </div>

            <h1 className="title-bob font-logo leading-[0.95]" style={{ fontSize: 'clamp(40px, 8.5vmin, 84px)' }}>
              <span style={{ color: '#5db2ff', textShadow: '0 5px 0 #0d2c55, 0 10px 30px rgba(40,120,255,0.45)' }}>MAGIC</span>
              <br />
              <span className="inline-flex items-center gap-3" style={{ color: '#ffffff', textShadow: '0 5px 0 #123a24, 0 10px 30px rgba(80,255,150,0.35)' }}>
                FOOTBALL
                <span className="ball-spin inline-block"><IconBall s={48} /></span>
              </span>
            </h1>

            <p className="font-body font-semibold mt-3 text-sm md:text-base rise-in" style={{ color: '#a8c0e8', animationDelay: '0.08s' }}>
              {t.subtitleA}
              <span style={{ color: '#ffd23f' }}> {t.subtitleB}</span>
            </p>

            <div className="rise-in mt-6" style={{ animationDelay: '0.15s' }}>
              <div className="pulse-ring rounded-full w-fit">
                <button
                  className="hud-btn play-btn px-12 py-4 text-xl text-white"
                  style={{
                    background: 'radial-gradient(circle at 30% 25%, #4da3ff, #1b5fd6 65%, #123e8c)',
                    border: '2px solid rgba(190,225,255,0.85)',
                    boxShadow: '0 10px 30px rgba(27,95,214,0.5), inset 0 -8px 14px rgba(10,30,80,0.5)',
                  }}
                  onClick={play}
                >
                  {t.play}
                </button>
              </div>
            </div>

            {/* secondary menu row */}
            <div className="rise-in mt-4 flex flex-wrap items-center gap-2.5" style={{ animationDelay: '0.2s' }}>
              <button
                className="menu-btn font-body font-bold text-[13px] px-4 py-2.5"
                style={{ color: '#cfe0fa', background: 'rgba(13,27,51,0.85)', border: '1px solid rgba(90,140,220,0.45)' }}
                onClick={ui(() => setModal('help'))}
              >
                <span style={{ color: '#7db8ff' }}><IconHelp /></span>
                {t.help}
              </button>
              <button
                className="menu-btn font-body font-bold text-[13px] px-4 py-2.5"
                style={{ color: '#cfe0fa', background: 'rgba(13,27,51,0.85)', border: '1px solid rgba(90,140,220,0.45)' }}
                onClick={ui(() => setModal('about'))}
              >
                <span style={{ color: '#ffd23f' }}><IconInfo /></span>
                {t.about}
              </button>
              <button
                className="menu-btn font-body font-bold text-[13px] px-4 py-2.5"
                style={{ color: '#cfe0fa', background: 'rgba(13,27,51,0.85)', border: '1px solid rgba(90,140,220,0.45)' }}
                onClick={ui(() => setModal('publish'))}
                aria-label={t.ariaPublish}
              >
                <span style={{ color: '#7dffb0' }}><IconRocket /></span>
                {t.publish}
              </button>
              <LangToggle lang={lang} setLang={setLang} t={t} />
              <button
                className="menu-btn"
                style={{
                  width: 44, height: 44, color: muted ? '#7c8db0' : '#cfe0fa',
                  background: 'rgba(13,27,51,0.85)',
                  border: '1px solid rgba(90,140,220,0.45)',
                }}
                onClick={ui(() => setMuted(!muted))}
                aria-label={t.ariaSound}
                title={muted ? t.soundOff : t.soundOn}
              >
                <IconSound off={muted} />
              </button>
            </div>

            <div
              className="rise-in mt-5 rounded-xl px-4 py-3 font-body text-[12px] leading-6"
              style={{
                animationDelay: '0.25s',
                color: '#8fa8d0',
                background: 'rgba(10,22,42,0.72)',
                border: '1px solid rgba(90,140,220,0.3)',
              }}
            >
              <div>{t.guide1}</div>
              <div>{t.guide2}</div>
            </div>
          </div>

          <div
            className="absolute font-body text-[11px] pointer-events-none"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + max(14px,3vh))',
              insetInlineEnd: 'max(16px,3vw)',
              color: '#5b7396',
            }}
          >
            {t.camNote}
          </div>
        </div>
      )}

      {/* ==================== rotate prompt ==================== */}
      {portrait && !rotateDismissed && (
        <RotateOverlay t={t} onDismiss={ui(() => setRotateDismissed(true))} />
      )}

      {/* ==================== MODALS ==================== */}
      {modal === 'help' && <HelpModal t={t} onClose={ui(() => setModal(null))} />}
      {modal === 'about' && <AboutModal t={t} onClose={ui(() => setModal(null))} />}
      {modal === 'publish' && <PublishModal t={t} onClose={ui(() => setModal(null))} />}
    </div>
  );
}
