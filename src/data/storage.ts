export interface GameSettings {
  matchDuration: number; // seconds
  difficulty: 'easy' | 'normal' | 'hard';
  controlMode: 'mobile' | 'keyboard' | 'auto';
  soundEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  screenShake: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  matchDuration: 180,
  difficulty: 'normal',
  controlMode: 'auto',
  soundEnabled: true,
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  graphicsQuality: 'high',
  screenShake: true
};

export function loadSettings(): GameSettings {
  try {
    const saved = localStorage.getItem('elite_football_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<GameSettings>): void {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('elite_football_settings', JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

export interface CareerProgress {
  userTeamId: string;
  managerName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  points: number;
  season: number;
  lastUpdated: number;
}

export function loadCareer(): CareerProgress | null {
  try {
    const saved = localStorage.getItem('elite_football_career');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load career:', e);
  }
  return null;
}

export function saveCareer(career: CareerProgress): void {
  try {
    localStorage.setItem('elite_football_career', JSON.stringify(career));
  } catch (e) {
    console.warn('Failed to save career:', e);
  }
}

export interface TournamentProgress {
  userTeamId: string;
  stage: number; // 0: quarter, 1: semi, 2: final
  stages: TournamentStage[];
  champion: string | null;
}

export interface TournamentMatch {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  played: boolean;
}

export type TournamentStage = TournamentMatch[];

export function loadTournament(): TournamentProgress | null {
  try {
    const saved = localStorage.getItem('elite_football_tournament');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load tournament:', e);
  }
  return null;
}

export function saveTournament(tournament: TournamentProgress): void {
  try {
    localStorage.setItem('elite_football_tournament', JSON.stringify(tournament));
  } catch (e) {
    console.warn('Failed to save tournament:', e);
  }
}
