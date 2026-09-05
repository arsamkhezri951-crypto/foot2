/* ============================================================
   Meta-game screens: main menu, career, cup, clubs, players,
   settings. All bilingual (t: Dict), RTL-safe, responsive.
   The real match engine is launched by App via callbacks.
   ============================================================ */

import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Dict, Lang, StoredVolumes } from './game/i18n';
import { sfx } from './game/audio';
import { CLUBS, POS_COLORS, clubById, type Club } from './data/clubs';
import {
  MATCHDAYS,
  goalDiff,
  matchdayFixtures,
  points,
  seasonOver,
  standings,
  userFixture,
  type CareerState,
} from './data/career';
import {
  cupFinished,
  currentOpponent,
  userOut,
  type CupState,
} from './data/tournament';

/* ================= shared bits ================= */

const CYAN = '#54e0f0';
const dim = '#8fa8d0';

const ui = (fn: () => void) => () => {
  sfx.init();
  sfx.click();
  fn();
};

const dotBg: CSSProperties = {
  backgroundImage: 'radial-gradient(rgba(120,220,240,0.06) 1px, transparent 1.4px)',
  backgroundSize: '26px 26px',
};

export function Emblem({ club, size = 56 }: { club: Club; size?: number }) {
  const initials = club.code;
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 64 70" aria-hidden style={{ flexShrink: 0 }}>
      <path
        d="M32 2 60 10v28c0 17-12 27-28 31C16 65 4 55 4 38V10Z"
        fill={club.colors.c1}
        stroke="#0b1526"
        strokeWidth="2.5"
      />
      <path d="M32 2 60 10v28c0 17-12 27-28 31V2Z" fill={club.colors.c2} opacity="0.92" />
      <path d="M4 26h56v12H4Z" fill="rgba(8,14,28,0.88)" />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        fontFamily="Bungee, sans-serif"
        fontSize="13"
        fill="#f2f8ff"
        letterSpacing="1"
      >
        {initials}
      </text>
      <path
        d="M32 8 55 14.5v22c0 13.5-9.5 22.5-23 26.5C18.5 59 9 50 9 36.5v-22Z"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function RatingBar({ value, color = CYAN }: { value: number; color?: string }) {
  const pct = Math.max(4, Math.min(100, ((value - 58) / 42) * 100));
  return (
    <div
      className="relative h-1.5 flex-1 rounded-full overflow-hidden"
      style={{ background: 'rgba(120,160,220,0.16)' }}
    >
      <div
        className="absolute inset-y-0 rounded-full"
        style={{
          width: `${pct}%`,
          insetInlineStart: 0,
          background: `linear-gradient(90deg, ${color}66, ${color})`,
        }}
      />
    </div>
  );
}

function BigButton({
  children,
  onClick,
  variant = 'primary',
  style,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: CSSProperties;
}) {
  const base: CSSProperties =
    variant === 'primary'
      ? {
          background: `linear-gradient(180deg, ${CYAN}, #1899b8 70%, #0d6e88)`,
          border: '1px solid rgba(210,250,255,0.75)',
          color: '#04222b',
          boxShadow: '0 10px 26px rgba(24,153,184,0.35), inset 0 -6px 12px rgba(4,40,52,0.35)',
        }
      : variant === 'danger'
        ? {
            background: 'rgba(70,22,32,0.5)',
            border: '1px solid rgba(255,120,140,0.4)',
            color: '#ff9fb0',
          }
        : {
            background: 'rgba(13,24,48,0.72)',
            border: '1px solid rgba(120,220,240,0.3)',
            color: '#cfe9f5',
          };
  return (
    <button
      className="menu-btn font-display tracking-wide text-sm md:text-[15px] px-6 py-3"
      style={{ ...base, ...style }}
      onClick={ui(onClick)}
    >
      {children}
    </button>
  );
}

function ConfirmReset({
  label,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);
  if (!armed)
    return (
      <button className="menu-btn font-body text-xs px-4 py-2" style={{ color: '#ff9fb0', background: 'rgba(70,22,32,0.4)', border: '1px solid rgba(255,120,140,0.3)' }} onClick={ui(() => setArmed(true))}>
        {label}
      </button>
    );
  return (
    <span className="inline-flex items-center gap-2">
      <button className="menu-btn font-body text-xs px-4 py-2" style={{ color: '#04222b', background: '#ff6b81', border: '1px solid rgba(255,255,255,0.6)' }} onClick={ui(() => { setArmed(false); onConfirm(); })}>
        {confirmLabel}
      </button>
      <button className="menu-btn font-body text-xs px-4 py-2" style={{ color: '#cfe9f5', background: 'rgba(13,24,48,0.72)', border: '1px solid rgba(120,220,240,0.3)' }} onClick={ui(() => setArmed(false))}>
        {cancelLabel}
      </button>
    </span>
  );
}

/* ================= screen shell ================= */

export function Shell({
  t,
  kicker,
  title,
  onBack,
  children,
}: {
  t: Dict;
  kicker?: string;
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 z-20 overflow-y-auto panel-scroll fade-in"
      style={{ background: 'linear-gradient(180deg, rgba(5,10,21,0.97), rgba(6,13,26,0.99))' }}
    >
      <div className="min-h-full" style={dotBg}>
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 pb-24" style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 0px))' }}>
          <div className="flex items-center justify-between gap-3">
            <button
              className="menu-btn font-body font-bold text-xs px-4 py-2.5"
              style={{ color: CYAN, background: 'rgba(13,24,48,0.8)', border: `1px solid rgba(120,220,240,0.35)` }}
              onClick={ui(onBack)}
            >
              {t.dir === 'rtl' ? '→' : '←'} {t.back}
            </button>
            {kicker && (
              <span className="font-body font-bold text-[11px] tracking-[0.3em]" style={{ color: 'rgba(140,220,235,0.6)' }}>
                {kicker}
              </span>
            )}
          </div>
          <h1
            className="font-display mt-5 leading-[0.95]"
            style={{ fontSize: 'clamp(30px, 6.4vmin, 58px)', color: '#f2f8ff', textShadow: '0 3px 0 rgba(0,0,0,0.5)' }}
          >
            {title}
          </h1>
          <div className="mt-2 mb-6 h-[3px] w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${CYAN}, transparent)` }} />
          {children}
        </div>
      </div>
    </div>
  );
}

/* ================= main menu (numbered) ================= */

export interface MenuItem {
  num: string;
  title: string;
  sub: string;
  onClick: () => void;
}

export function MainMenuList({ items, notes }: { items: MenuItem[]; notes: ReactNode }) {
  return (
    <div className="w-full">
      <div className="flex flex-col">
        {items.map((it, i) => (
          <button
            key={it.num}
            onClick={ui(it.onClick)}
            className="menu-btn group text-start flex items-center gap-4 md:gap-6 px-3 md:px-5 py-3 md:py-3.5 rise-in"
            style={{
              animationDelay: `${i * 60}ms`,
              borderBottom: '1px solid rgba(120,220,240,0.12)',
              background: 'transparent',
            }}
          >
            <span
              className="font-display text-2xl md:text-4xl w-12 md:w-16 shrink-0 transition-colors"
              style={{ color: 'rgba(84,224,240,0.45)' }}
            >
              {it.num}
            </span>
            <span className="flex flex-col min-w-0">
              <span
                className="font-display leading-none text-xl md:text-3xl"
                style={{ color: '#f2f8ff', transition: 'color .15s' }}
              >
                {it.title}
              </span>
              <span className="font-body text-[11px] md:text-xs mt-1.5 truncate" style={{ color: dim }}>
                {it.sub}
              </span>
            </span>
            <span
              className="font-display ms-auto text-lg md:text-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                color: CYAN,
                transform: typeof document !== 'undefined' && document.documentElement.dir === 'rtl' ? 'scaleX(-1)' : undefined,
              }}
            >
              →
            </span>
          </button>
        ))}
      </div>
      <div className="mt-5 font-body text-[11px] leading-relaxed max-w-[420px]" style={{ color: 'rgba(143,168,208,0.75)' }}>
        {notes}
      </div>
    </div>
  );
}

/* ================= standings table ================= */

function StandingsTable({
  t,
  state,
}: {
  t: Dict;
  state: CareerState;
}) {
  const rows = standings(state.table);
  const th: CSSProperties = { color: 'rgba(140,220,235,0.7)', fontWeight: 800 };
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(120,220,240,0.16)', background: 'rgba(9,17,34,0.75)' }}>
      <table className="w-full min-w-[560px] font-body text-[13px]">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(120,220,240,0.18)' }}>
            <th className="px-3 py-2.5 text-start" style={th}>#</th>
            <th className="px-3 py-2.5 text-start" style={th}>{t.clubCol}</th>
            <th className="px-2 py-2.5 text-center" style={th}>{t.colP}</th>
            <th className="px-2 py-2.5 text-center" style={th}>{t.colW}</th>
            <th className="px-2 py-2.5 text-center" style={th}>{t.colD}</th>
            <th className="px-2 py-2.5 text-center" style={th}>{t.colL}</th>
            <th className="px-2 py-2.5 text-center" style={th}>{t.colGD}</th>
            <th className="px-3 py-2.5 text-center" style={th}>{t.colPTS}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const club = clubById(r.clubId);
            const mine = r.clubId === state.clubId;
            return (
              <tr
                key={r.clubId}
                style={{
                  borderBottom: '1px dashed rgba(120,220,240,0.1)',
                  background: mine ? 'rgba(84,224,240,0.1)' : i === 0 ? 'rgba(255,210,63,0.05)' : 'transparent',
                  boxShadow: mine ? `inset 3px 0 0 ${CYAN}` : undefined,
                }}
              >
                <td className="px-3 py-2 font-display text-[12px]" style={{ color: i === 0 ? '#ffd23f' : dim }}>{i + 1}</td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: club.colors.c1, border: '1px solid rgba(255,255,255,0.35)' }} />
                    <span className="font-bold text-white">{club.name}</span>
                    {mine && <span className="font-display text-[9px] px-1.5 py-0.5 rounded" style={{ background: CYAN, color: '#04222b' }}>{t.yourClub}</span>}
                  </span>
                </td>
                <td className="px-2 py-2 text-center score-num text-white">{r.p}</td>
                <td className="px-2 py-2 text-center score-num" style={{ color: '#7dffb0' }}>{r.w}</td>
                <td className="px-2 py-2 text-center score-num" style={{ color: '#c9d4e8' }}>{r.d}</td>
                <td className="px-2 py-2 text-center score-num" style={{ color: '#ff8f8f' }}>{r.l}</td>
                <td className="px-2 py-2 text-center score-num text-white">{goalDiff(r) > 0 ? `+${goalDiff(r)}` : goalDiff(r)}</td>
                <td className="px-3 py-2 text-center font-display text-[15px]" style={{ color: CYAN }}>{points(r)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatChips({ t, state }: { t: Dict; state: CareerState }) {
  const me = state.table.find((r) => r.clubId === state.clubId)!;
  const items: [string, string][] = [
    [t.sPlayed, String(me.p)],
    [t.sPoints, String(points(me))],
    [t.sWins, String(me.w)],
    [t.sDraws, String(me.d)],
    [t.sLosses, String(me.l)],
    [t.sGF, String(me.gf)],
    [t.sGA, String(me.ga)],
    [t.sGD, `${goalDiff(me) > 0 ? '+' : ''}${goalDiff(me)}`],
  ];
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-lg px-2 py-2 text-center" style={{ background: 'rgba(13,24,48,0.7)', border: '1px solid rgba(120,220,240,0.14)' }}>
          <div className="score-num text-lg text-white">{v}</div>
          <div className="font-body text-[10px] font-bold" style={{ color: dim }}>{k}</div>
        </div>
      ))}
    </div>
  );
}

/* ================= CAREER ================= */

export function ChooseClubGrid({
  t,
  title,
  onPick,
}: {
  t: Dict;
  title: string;
  onPick: (id: number) => void;
}) {
  return (
    <div>
      <div className="font-display text-lg md:text-2xl mb-4" style={{ color: '#f2f8ff' }}>{title}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CLUBS.map((c, i) => (
          <button
            key={c.id}
            className="menu-btn rise-in flex flex-col items-center gap-2 p-4 rounded-xl"
            style={{
              animationDelay: `${i * 40}ms`,
              background: 'linear-gradient(180deg, rgba(16,29,56,0.9), rgba(10,19,38,0.9))',
              border: '1px solid rgba(120,220,240,0.18)',
            }}
            onClick={ui(() => onPick(c.id))}
          >
            <Emblem club={c} size={54} />
            <span className="font-display text-[13px] text-white text-center leading-tight">{c.name}</span>
            <span className="font-display text-[12px] px-2.5 py-0.5 rounded-md" style={{ background: 'rgba(84,224,240,0.12)', color: CYAN, border: `1px solid rgba(84,224,240,0.35)` }}>
              {t.ovrLbl} {c.ovr}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CareerScreen({
  t,
  state,
  onPlayMatch,
  onReset,
  onBack,
}: {
  t: Dict;
  state: CareerState | null;
  onPlayMatch: () => void;
  onReset: () => void;
  onBack: () => void;
}) {
  if (!state)
    return (
      <Shell t={t} kicker="MAGIC FOOTBALL" title={t.career} onBack={onBack}>
        <ChooseClubGrid t={t} title={t.chooseClub} onPick={onPlayMatch as unknown as (id: number) => void} />
      </Shell>
    );

  const club = clubById(state.clubId);
  const over = seasonOver(state);
  const fx = over ? null : userFixture(state);
  const opp = fx ? clubById(fx.opponent) : null;

  return (
    <Shell t={t} kicker={`${t.seasonLbl}`} title={t.career} onBack={onBack}>
      <div className="flex flex-col gap-5">
        {/* season header strip */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(13,24,48,0.75)', border: '1px solid rgba(120,220,240,0.18)' }}>
            <Emblem club={club} size={30} />
            <span className="font-display text-sm text-white">{club.name}</span>
          </span>
          <span className="font-body font-bold text-xs px-3 py-2 rounded-lg" style={{ color: CYAN, background: 'rgba(84,224,240,0.1)', border: '1px solid rgba(84,224,240,0.3)' }}>
            {over ? t.seasonLbl : `${t.matchday} ${Math.min(state.matchday, MATCHDAYS)} / ${MATCHDAYS}`}
          </span>
          <div className="ms-auto">
            <ConfirmReset label={t.resetCareer} confirmLabel={t.confirmYes} cancelLabel={t.confirmNo} onConfirm={onReset} />
          </div>
        </div>

        {/* next match card */}
        {fx && opp && (
          <div className="rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-center gap-4" style={{ background: 'linear-gradient(120deg, rgba(16,32,60,0.9), rgba(10,20,40,0.9))', border: '1px solid rgba(120,220,240,0.22)' }}>
            <div className="flex items-center gap-3 md:gap-5 flex-1 justify-center md:justify-start">
              <span className="flex flex-col items-center gap-1">
                <Emblem club={club} size={52} />
                <span className="font-body font-bold text-xs text-white">{club.name}</span>
              </span>
              <span className="font-display text-2xl" style={{ color: 'rgba(140,220,235,0.55)' }}>{t.vsLbl}</span>
              <span className="flex flex-col items-center gap-1">
                <Emblem club={opp} size={52} />
                <span className="font-body font-bold text-xs text-white">{opp.name}</span>
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <BigButton onClick={onPlayMatch}>{t.playMatchBtn}</BigButton>
              <span className="font-body text-[11px]" style={{ color: dim }}>{t.nextMatch}</span>
            </div>
          </div>
        )}

        {/* matchday progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: MATCHDAYS }, (_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full flex-1"
              style={{
                background:
                  i + 1 < state.matchday ? CYAN : i + 1 === state.matchday && !over ? 'rgba(84,224,240,0.45)' : 'rgba(120,160,220,0.15)',
              }}
            />
          ))}
        </div>

        <StatChips t={t} state={state} />

        <div>
          <div className="font-display text-lg md:text-xl mb-3" style={{ color: '#f2f8ff' }}>{t.standings}</div>
          <StandingsTable t={t} state={state} />
        </div>
      </div>
    </Shell>
  );
}

export function SeasonEndScreen({
  t,
  state,
  onNewSeason,
  onBack,
}: {
  t: Dict;
  state: CareerState;
  onNewSeason: () => void;
  onBack: () => void;
}) {
  const rows = standings(state.table);
  const champ = clubById(rows[0].clubId);
  const myPos = rows.findIndex((r) => r.clubId === state.clubId) + 1;
  const iWon = rows[0].clubId === state.clubId;
  return (
    <Shell t={t} kicker={t.seasonLbl} title={t.finalTable} onBack={onBack}>
      <div className="flex flex-col gap-5">
        <div className="rounded-xl p-5 text-center" style={{ background: iWon ? 'linear-gradient(120deg, rgba(46,80,40,0.5), rgba(12,26,18,0.6))' : 'linear-gradient(120deg, rgba(24,40,70,0.6), rgba(10,20,40,0.7))', border: `1px solid ${iWon ? 'rgba(160,255,190,0.4)' : 'rgba(120,220,240,0.2)'}` }}>
          <div className="font-display text-[11px] tracking-[0.35em]" style={{ color: '#ffd23f' }}>★ {t.champion} ★</div>
          <div className="mt-2 flex items-center justify-center gap-3">
            <Emblem club={champ} size={56} />
            <span className="font-display text-2xl md:text-4xl text-white">{champ.name}</span>
          </div>
          <div className="mt-3 font-body text-sm font-bold" style={{ color: iWon ? '#7dffb0' : dim }}>
            {t.yourPosition}: <span className="score-num text-white text-lg">{myPos}</span> / {CLUBS.length}
          </div>
        </div>
        <StatChips t={t} state={state} />
        <StandingsTable t={t} state={state} />
        <div className="flex flex-wrap gap-3">
          <BigButton onClick={onNewSeason}>{t.newSeason}</BigButton>
          <BigButton variant="ghost" onClick={onBack}>{t.menuBtn}</BigButton>
        </div>
      </div>
    </Shell>
  );
}

/* ================= CUP ================= */

function TieCard({
  t,
  tie,
  stageIdx,
  stage,
  userClub,
  onPlay,
}: {
  t: Dict;
  tie: { a: number; b: number; sa?: number; sb?: number; winner?: number; pens?: string; userTie?: boolean };
  stageIdx: number;
  stage: number;
  userClub: number;
  onPlay?: () => void;
}) {
  const a = clubById(tie.a);
  const b = clubById(tie.b);
  const playable = tie.userTie && stageIdx === stage && tie.winner === undefined && onPlay;
  const row = (c: Club, score?: number, win?: boolean) => (
    <span className="flex items-center gap-2 flex-1 min-w-0">
      <span className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: c.colors.c1, border: '1px solid rgba(255,255,255,0.3)' }} />
      <span className={`font-body font-bold text-xs truncate ${c.id === userClub ? 'text-white' : ''}`} style={c.id === userClub ? { color: CYAN } : { color: win ? '#f2f8ff' : '#aebfdd' }}>
        {c.name}
      </span>
      {score !== undefined && (
        <span className="score-num ms-auto text-sm" style={{ color: win ? CYAN : '#aebfdd' }}>{score}</span>
      )}
    </span>
  );
  return (
    <div
      className="rounded-lg px-3 py-2.5 flex flex-col gap-1.5"
      style={{
        background: tie.userTie ? 'rgba(84,224,240,0.07)' : 'rgba(13,24,48,0.7)',
        border: `1px solid ${tie.userTie ? 'rgba(84,224,240,0.4)' : 'rgba(120,220,240,0.14)'}`,
      }}
    >
      {row(a, tie.sa, tie.winner === tie.a)}
      {row(b, tie.sb, tie.winner === tie.b)}
      {tie.pens && (
        <span className="font-body text-[10px] font-bold" style={{ color: '#ffd23f' }}>
          {t.wonOnPens} {tie.pens}
        </span>
      )}
      {playable && (
        <button className="menu-btn font-display text-[11px] py-2 mt-1" style={{ background: `linear-gradient(180deg, ${CYAN}, #1899b8)`, color: '#04222b', border: '1px solid rgba(210,250,255,0.7)' }} onClick={ui(onPlay)}>
          {t.playMatchBtn}
        </button>
      )}
    </div>
  );
}

export function CupScreen({
  t,
  state,
  onPick,
  onPlayMatch,
  onNewCup,
  onBack,
}: {
  t: Dict;
  state: CupState | null;
  onPick: (id: number) => void;
  onPlayMatch: () => void;
  onNewCup: () => void;
  onBack: () => void;
}) {
  if (!state)
    return (
      <Shell t={t} kicker="MAGIC FOOTBALL" title={t.newCupRun} onBack={onBack}>
        <ChooseClubGrid t={t} title={t.chooseClub} onPick={onPick} />
      </Shell>
    );

  const stageNames = [t.quarterFinal, t.semiFinal, t.cupFinal];
  const opp = currentOpponent(state);
  const finished = cupFinished(state);
  const champ = finished ? clubById(state.champion!) : null;

  return (
    <Shell t={t} kicker="MAGIC FOOTBALL" title={t.newCupRun} onBack={onBack}>
      <div className="flex flex-col gap-5">
        {finished && champ ? (
          <div className="rounded-xl p-5 text-center" style={{ background: 'linear-gradient(120deg, rgba(50,44,16,0.55), rgba(20,18,8,0.6))', border: '1px solid rgba(255,210,63,0.4)' }}>
            <div className="font-display text-[11px] tracking-[0.35em]" style={{ color: '#ffd23f' }}>★ {t.cupChampion} ★</div>
            <div className="mt-2 flex items-center justify-center gap-3">
              <Emblem club={champ} size={56} />
              <span className="font-display text-2xl md:text-4xl text-white">{champ.name}</span>
            </div>
            {userOut(state) && (
              <div className="mt-2 font-body text-sm font-bold" style={{ color: '#ff9fb0' }}>{t.eliminated}</div>
            )}
          </div>
        ) : (
          <div className="rounded-xl p-4 flex flex-wrap items-center gap-3" style={{ background: 'rgba(13,24,48,0.75)', border: '1px solid rgba(120,220,240,0.2)' }}>
            <span className="font-display text-sm" style={{ color: CYAN }}>{stageNames[state.stage]}</span>
            {opp !== null ? (
              <span className="font-body text-sm font-bold text-white">
                {clubById(state.clubId).name} <span style={{ color: dim }}>{t.vsLbl}</span> {clubById(opp).name}
              </span>
            ) : (
              <span className="font-body text-sm font-bold" style={{ color: '#ff9fb0' }}>{t.eliminated}</span>
            )}
            {opp !== null && (
              <div className="ms-auto">
                <BigButton onClick={onPlayMatch}>{t.playMatchBtn}</BigButton>
              </div>
            )}
          </div>
        )}

        {/* bracket */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {state.rounds.map((round, ri) => (
            <div key={ri}>
              <div className="font-display text-[12px] tracking-widest mb-2" style={{ color: ri === state.stage && !finished ? CYAN : 'rgba(140,220,235,0.55)' }}>
                {stageNames[ri]}
              </div>
              <div className="flex flex-col gap-2.5">
                {round.length === 0 && (
                  <div className="rounded-lg px-3 py-4 text-center font-body text-xs" style={{ color: dim, border: '1px dashed rgba(120,220,240,0.2)' }}>
                    —
                  </div>
                )}
                {round.map((tie, ti) => (
                  <TieCard key={ti} t={t} tie={tie} stageIdx={ri} stage={state.stage} userClub={state.clubId} onPlay={onPlayMatch} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <BigButton variant="ghost" onClick={onNewCup}>{t.newCup}</BigButton>
          <BigButton variant="ghost" onClick={onBack}>{t.menuBtn}</BigButton>
        </div>
      </div>
    </Shell>
  );
}

/* ================= CLUBS ================= */

export function ClubsScreen({
  t,
  onOpen,
  onBack,
}: {
  t: Dict;
  onOpen: (id: number) => void;
  onBack: () => void;
}) {
  return (
    <Shell t={t} kicker="MAGIC FOOTBALL" title={t.theEightClubs} onBack={onBack}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CLUBS.map((c, i) => {
          const top = [...c.players].sort((a, b) => b.ovr - a.ovr).slice(0, 3);
          return (
            <button
              key={c.id}
              className="menu-btn rise-in text-start rounded-xl p-4 flex flex-col gap-3"
              style={{
                animationDelay: `${i * 40}ms`,
                background: 'linear-gradient(180deg, rgba(16,29,56,0.92), rgba(10,19,38,0.92))',
                border: '1px solid rgba(120,220,240,0.18)',
              }}
              onClick={ui(() => onOpen(c.id))}
            >
              <span className="flex items-center gap-3">
                <Emblem club={c} size={46} />
                <span className="flex flex-col min-w-0">
                  <span className="font-display text-[14px] text-white leading-tight truncate">{c.name}</span>
                  <span className="font-body text-[10px] font-bold tracking-widest" style={{ color: dim }}>{c.code} · {t.ovrLbl} {c.ovr}</span>
                </span>
              </span>
              <span className="flex flex-col gap-1">
                {top.map((p) => (
                  <span key={p.name} className="flex items-center gap-2 font-body text-[11px]">
                    <span className="font-display text-[9px] w-7 text-center rounded py-0.5" style={{ background: `${POS_COLORS[p.pos]}22`, color: POS_COLORS[p.pos], border: `1px solid ${POS_COLORS[p.pos]}55` }}>{p.pos}</span>
                    <span className="truncate font-bold" style={{ color: '#cfe0f5' }}>{p.name}</span>
                    <span className="score-num ms-auto" style={{ color: CYAN }}>{p.ovr}</span>
                  </span>
                ))}
              </span>
              <span className="flex items-center gap-2 font-body text-[10px] font-bold" style={{ color: dim }}>
                {t.gkKitLbl}
                <span className="w-4 h-4 rounded" style={{ background: c.colors.gk, border: '1px solid rgba(255,255,255,0.4)' }} />
                <span className="ms-auto flex gap-1">
                  <span className="w-4 h-4 rounded" style={{ background: c.colors.c1, border: '1px solid rgba(255,255,255,0.3)' }} />
                  <span className="w-4 h-4 rounded" style={{ background: c.colors.c2, border: '1px solid rgba(255,255,255,0.3)' }} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

export function ClubDetailScreen({
  t,
  clubId,
  onBack,
}: {
  t: Dict;
  clubId: number;
  onBack: () => void;
}) {
  const c = clubById(clubId);
  const bars: [string, number, string][] = [
    [t.attack, c.atk, '#e05a6e'],
    [t.midfield, c.mid, '#39c06e'],
    [t.defense, c.def, '#4da3ff'],
  ];
  return (
    <Shell t={t} kicker={c.code} title={c.name} onBack={onBack}>
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
        <div className="rounded-xl p-5 flex flex-col items-center gap-3" style={{ background: 'linear-gradient(180deg, rgba(16,29,56,0.92), rgba(10,19,38,0.92))', border: '1px solid rgba(120,220,240,0.18)' }}>
          <Emblem club={c} size={96} />
          <span className="font-display text-3xl" style={{ color: CYAN }}>{c.ovr}</span>
          <span className="font-body text-[11px] font-bold tracking-widest" style={{ color: dim }}>{t.ovrLbl}</span>
          <div className="w-full flex flex-col gap-2.5 mt-2">
            {bars.map(([label, v, col]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="font-body text-[11px] font-bold w-16" style={{ color: dim }}>{label}</span>
                <RatingBar value={v} color={col} />
                <span className="score-num text-sm text-white w-7 text-end">{v}</span>
              </div>
            ))}
          </div>
          <div className="w-full mt-2 flex items-center justify-between font-body text-[11px] font-bold" style={{ color: dim }}>
            <span>{t.homeKit}
              <span className="inline-flex ms-2 align-middle gap-1">
                <span className="w-4 h-4 rounded" style={{ background: c.colors.c1, border: '1px solid rgba(255,255,255,0.3)' }} />
                <span className="w-4 h-4 rounded" style={{ background: c.colors.c2, border: '1px solid rgba(255,255,255,0.3)' }} />
              </span>
            </span>
            <span>{t.awayKit}
              <span className="inline-block w-4 h-4 rounded ms-2 align-middle" style={{ background: c.colors.away, border: '1px solid rgba(255,255,255,0.3)' }} />
            </span>
            <span>{t.gkKitLbl}
              <span className="inline-block w-4 h-4 rounded ms-2 align-middle" style={{ background: c.colors.gk, border: '1px solid rgba(255,255,255,0.3)' }} />
            </span>
          </div>
        </div>
        <div className="rounded-xl p-4 md:p-5" style={{ background: 'rgba(9,17,34,0.75)', border: '1px solid rgba(120,220,240,0.16)' }}>
          <div className="font-display text-lg mb-3" style={{ color: '#f2f8ff' }}>{t.topPlayers}</div>
          <div className="flex flex-col gap-2">
            {[...c.players].sort((a, b) => b.ovr - a.ovr).map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(13,24,48,0.6)', border: '1px solid rgba(120,220,240,0.1)' }}>
                <span className="font-display text-[12px] w-6" style={{ color: dim }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="font-display text-[10px] w-9 text-center rounded py-1" style={{ background: `${POS_COLORS[p.pos]}22`, color: POS_COLORS[p.pos], border: `1px solid ${POS_COLORS[p.pos]}55` }}>{p.pos}</span>
                <span className="font-body font-bold text-sm text-white truncate flex-1">{p.name}</span>
                <RatingBar value={p.ovr} color={POS_COLORS[p.pos]} />
                <span className="score-num text-lg text-white w-8 text-end">{p.ovr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ================= PLAYERS ================= */

export function PlayersScreen({ t, onBack }: { t: Dict; onBack: () => void }) {
  const [tab, setTab] = useState(0);
  const club = CLUBS[tab];
  const sorted = [...club.players].sort((a, b) => b.ovr - a.ovr);
  return (
    <Shell t={t} kicker="MAGIC FOOTBALL" title={t.starPlayers} onBack={onBack}>
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'thin' }}>
        {CLUBS.map((c, i) => (
          <button
            key={c.code}
            className="menu-btn font-display text-[12px] px-3.5 py-2 rounded-lg shrink-0"
            style={
              i === tab
                ? { background: CYAN, color: '#04222b', border: '1px solid rgba(210,250,255,0.8)' }
                : { background: 'rgba(13,24,48,0.75)', color: '#aebfdd', border: '1px solid rgba(120,220,240,0.18)' }
            }
            onClick={ui(() => setTab(i))}
          >
            {c.code}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <Emblem club={club} size={40} />
        <span className="font-display text-lg text-white">{club.name}</span>
        <span className="font-display text-[12px] px-2.5 py-0.5 rounded-md ms-auto" style={{ background: 'rgba(84,224,240,0.12)', color: CYAN, border: '1px solid rgba(84,224,240,0.35)' }}>{t.ovrLbl} {club.ovr}</span>
      </div>
      <div className="flex flex-col gap-2">
        {sorted.map((p, i) => (
          <div key={p.name} className="rise-in flex items-center gap-3 rounded-lg px-3 py-3" style={{ animationDelay: `${i * 35}ms`, background: 'rgba(13,24,48,0.7)', border: '1px solid rgba(120,220,240,0.12)' }}>
            <span className="font-display text-[13px] w-7" style={{ color: 'rgba(84,224,240,0.5)' }}>{String(i + 1).padStart(2, '0')}</span>
            <span className="font-display text-[11px] w-10 text-center rounded py-1" style={{ background: `${POS_COLORS[p.pos]}22`, color: POS_COLORS[p.pos], border: `1px solid ${POS_COLORS[p.pos]}55` }}>{p.pos}</span>
            <span className="font-body font-bold text-sm text-white truncate flex-1">{p.name}</span>
            <span className="hidden sm:flex flex-1 max-w-[180px]"><RatingBar value={p.ovr} color={POS_COLORS[p.pos]} /></span>
            <span className="score-num text-xl text-white w-9 text-end">{p.ovr}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

/* ================= SETTINGS ================= */

const DURATIONS = [60, 120, 180, 300];
const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function VolSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-body text-[12px] font-bold text-white">{label}</span>
        <span className="score-num text-[13px]" style={{ color: CYAN }}>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="vol w-full"
        aria-label={label}
      />
    </div>
  );
}

export function SettingsScreen({
  t,
  vols,
  setVols,
  muted,
  setMuted,
  lang,
  setLang,
  duration,
  setDuration,
  onBack,
}: {
  t: Dict;
  vols: StoredVolumes;
  setVols: (v: StoredVolumes) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  duration: number;
  setDuration: (d: number) => void;
  onBack: () => void;
}) {
  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="rounded-xl p-4 md:p-5" style={{ background: 'rgba(9,17,34,0.78)', border: '1px solid rgba(120,220,240,0.16)' }}>
      <div className="font-display text-[13px] tracking-widest mb-4" style={{ color: CYAN }}>{title}</div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
  const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
    <button className="menu-btn flex items-center justify-between w-full py-1" onClick={ui(onClick)}>
      <span className="font-body text-[12px] font-bold text-white">{label}</span>
      <span className="w-12 h-6 rounded-full relative transition-colors" style={{ background: on ? CYAN : 'rgba(120,160,220,0.2)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
          style={{ insetInlineStart: on ? 26 : 2, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
        />
      </span>
    </button>
  );
  return (
    <Shell t={t} kicker="MAGIC FOOTBALL" title={t.settings} onBack={onBack}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title={t.audioSec}>
          <Toggle on={!muted} onClick={() => setMuted(!muted)} label={muted ? t.soundOff : t.soundOn} />
          <VolSlider label={t.masterVol} value={vols.master} onChange={(v) => setVols({ ...vols, master: v })} />
          <VolSlider label={t.musicVol} value={vols.music} onChange={(v) => setVols({ ...vols, music: v })} />
          <VolSlider label={t.sfxVol} value={vols.sfx} onChange={(v) => setVols({ ...vols, sfx: v })} />
        </Section>
        <div className="flex flex-col gap-4">
          <Section title={t.gameSec}>
            <div>
              <div className="font-body text-[12px] font-bold text-white mb-2">{t.matchDuration}</div>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    className="menu-btn font-display text-[13px] px-4 py-2.5 rounded-lg score-num"
                    style={
                      d === duration
                        ? { background: CYAN, color: '#04222b', border: '1px solid rgba(210,250,255,0.8)' }
                        : { background: 'rgba(13,24,48,0.75)', color: '#aebfdd', border: '1px solid rgba(120,220,240,0.2)' }
                    }
                    onClick={ui(() => setDuration(d))}
                  >
                    {fmtDur(d)}
                  </button>
                ))}
              </div>
            </div>
          </Section>
          <Section title={t.languageSec}>
            <div className="flex gap-2">
              {(['en', 'fa'] as Lang[]).map((l) => (
                <button
                  key={l}
                  className="menu-btn font-display text-[13px] px-5 py-2.5 rounded-lg flex-1"
                  style={
                    l === lang
                      ? { background: CYAN, color: '#04222b', border: '1px solid rgba(210,250,255,0.8)' }
                      : { background: 'rgba(13,24,48,0.75)', color: '#aebfdd', border: '1px solid rgba(120,220,240,0.2)' }
                  }
                  onClick={ui(() => setLang(l))}
                >
                  {l === 'en' ? 'ENGLISH' : 'فارسی'}
                </button>
              ))}
            </div>
          </Section>
          <Section title={t.controlsSec}>
            <p className="font-body text-[12px] leading-relaxed" style={{ color: '#cfe0f5' }}>{t.kbControls}</p>
            <p className="font-body text-[12px] leading-relaxed" style={{ color: '#cfe0f5' }}>{t.touchControls}</p>
          </Section>
        </div>
      </div>
    </Shell>
  );
}

/* convenience re-export used by App for matchday fixtures display */
export { matchdayFixtures };
