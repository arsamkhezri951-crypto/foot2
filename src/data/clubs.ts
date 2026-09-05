/* ============================================================
   Club & player database — single source of truth.
   Emblems are stylized/fictional shields generated in code
   (no copyrighted logos are used anywhere).
   ============================================================ */

export type Position = 'GK' | 'DF' | 'MF' | 'FW';

export interface ClubPlayer {
  pos: Position;
  name: string;
  ovr: number;
}

export interface Club {
  id: number;
  code: string; // 3-letter short code
  name: string;
  ovr: number;
  atk: number;
  mid: number;
  def: number;
  colors: {
    c1: string; // primary
    c2: string; // secondary
    away: string;
    gk: string; // goalkeeper kit
  };
  players: ClubPlayer[];
}

export const CLUBS: Club[] = [
  {
    id: 0,
    code: 'BAR',
    name: 'Barcelona',
    ovr: 90,
    atk: 93,
    mid: 90,
    def: 85,
    colors: { c1: '#a50044', c2: '#004d98', away: '#e8c15a', gk: '#39c06e' },
    players: [
      { pos: 'GK', name: 'ter Stegen', ovr: 88 },
      { pos: 'DF', name: 'Koundé', ovr: 86 },
      { pos: 'MF', name: 'Pedri', ovr: 89 },
      { pos: 'MF', name: 'de Jong', ovr: 87 },
      { pos: 'FW', name: 'Lamine Yamal', ovr: 92 },
      { pos: 'FW', name: 'Lewandowski', ovr: 90 },
    ],
  },
  {
    id: 1,
    code: 'RMA',
    name: 'Real Madrid',
    ovr: 91,
    atk: 94,
    mid: 91,
    def: 87,
    colors: { c1: '#f2f5fb', c2: '#c9a227', away: '#1f2a44', gk: '#2ea8ff' },
    players: [
      { pos: 'GK', name: 'Courtois', ovr: 89 },
      { pos: 'DF', name: 'Rüdiger', ovr: 87 },
      { pos: 'MF', name: 'Bellingham', ovr: 90 },
      { pos: 'MF', name: 'Valverde', ovr: 88 },
      { pos: 'FW', name: 'Mbappé', ovr: 93 },
      { pos: 'FW', name: 'Vinícius Jr', ovr: 92 },
    ],
  },
  {
    id: 2,
    code: 'ATM',
    name: 'Atlético Madrid',
    ovr: 87,
    atk: 87,
    mid: 86,
    def: 88,
    colors: { c1: '#cb3524', c2: '#f2f5fb', away: '#173a6b', gk: '#ffd23f' },
    players: [
      { pos: 'GK', name: 'Oblak', ovr: 88 },
      { pos: 'DF', name: 'Giménez', ovr: 84 },
      { pos: 'MF', name: 'Koke', ovr: 84 },
      { pos: 'MF', name: 'De Paul', ovr: 85 },
      { pos: 'FW', name: 'Griezmann', ovr: 88 },
      { pos: 'FW', name: 'Álvarez', ovr: 86 },
    ],
  },
  {
    id: 3,
    code: 'SEV',
    name: 'Sevilla',
    ovr: 84,
    atk: 84,
    mid: 83,
    def: 84,
    colors: { c1: '#e03a4b', c2: '#f5f8ff', away: '#c9d4e8', gk: '#8e6bd6' },
    players: [
      { pos: 'GK', name: 'Nyland', ovr: 80 },
      { pos: 'DF', name: 'Ramos', ovr: 82 },
      { pos: 'MF', name: 'Sow', ovr: 81 },
      { pos: 'MF', name: 'Ejuke', ovr: 82 },
      { pos: 'FW', name: 'Lukébakio', ovr: 84 },
      { pos: 'FW', name: 'Romero', ovr: 83 },
    ],
  },
  {
    id: 4,
    code: 'VIL',
    name: 'Villarreal',
    ovr: 83,
    atk: 85,
    mid: 83,
    def: 81,
    colors: { c1: '#f5d218', c2: '#1752a3', away: '#10233f', gk: '#ff8a3c' },
    players: [
      { pos: 'GK', name: 'Junior', ovr: 82 },
      { pos: 'DF', name: 'Foyth', ovr: 83 },
      { pos: 'MF', name: 'Parejo', ovr: 85 },
      { pos: 'MF', name: 'Baena', ovr: 85 },
      { pos: 'FW', name: 'Gerard Moreno', ovr: 86 },
      { pos: 'FW', name: 'Ayoze', ovr: 84 },
    ],
  },
  {
    id: 5,
    code: 'ATH',
    name: 'Athletic Club',
    ovr: 84,
    atk: 85,
    mid: 84,
    def: 84,
    colors: { c1: '#d63a2f', c2: '#f2f5fb', away: '#123e8c', gk: '#25b8a5' },
    players: [
      { pos: 'GK', name: 'Unai Simón', ovr: 86 },
      { pos: 'DF', name: 'De Marcos', ovr: 82 },
      { pos: 'MF', name: 'Jauregizar', ovr: 83 },
      { pos: 'MF', name: 'Sancet', ovr: 85 },
      { pos: 'FW', name: 'Nico Williams', ovr: 88 },
      { pos: 'FW', name: 'Iñaki Williams', ovr: 85 },
    ],
  },
  {
    id: 6,
    code: 'VAL',
    name: 'Valencia',
    ovr: 82,
    atk: 82,
    mid: 82,
    def: 82,
    colors: { c1: '#f5f8ff', c2: '#f08a1c', away: '#0e0e12', gk: '#58c450' },
    players: [
      { pos: 'GK', name: 'Mamardashvili', ovr: 85 },
      { pos: 'DF', name: 'Mosquera', ovr: 82 },
      { pos: 'MF', name: 'Pepelu', ovr: 83 },
      { pos: 'MF', name: 'Almeida', ovr: 84 },
      { pos: 'FW', name: 'Hugo Duro', ovr: 83 },
      { pos: 'FW', name: 'Diego López', ovr: 82 },
    ],
  },
  {
    id: 7,
    code: 'BET',
    name: 'Real Betis',
    ovr: 82,
    atk: 83,
    mid: 83,
    def: 80,
    colors: { c1: '#17a05c', c2: '#f2f5fb', away: '#0b3d23', gk: '#e86aa0' },
    players: [
      { pos: 'GK', name: 'Rui Silva', ovr: 83 },
      { pos: 'DF', name: 'Bartra', ovr: 81 },
      { pos: 'MF', name: 'Isco', ovr: 86 },
      { pos: 'MF', name: 'Lo Celso', ovr: 85 },
      { pos: 'FW', name: 'Bakambu', ovr: 82 },
      { pos: 'FW', name: 'Abde', ovr: 83 },
    ],
  },
];

export const clubById = (id: number): Club => CLUBS[id] ?? CLUBS[0];
export const clubByCode = (code: string): Club =>
  CLUBS.find((c) => c.code === code) ?? CLUBS[0];

/* ---------------- position colors (shared UI) ---------------- */
export const POS_COLORS: Record<Position, string> = {
  GK: '#e8b13c',
  DF: '#4da3ff',
  MF: '#39c06e',
  FW: '#e05a6e',
};
