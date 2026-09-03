export interface Team {
  id: string;
  name: string;
  short: string;
  primary: string;
  secondary: string;
  gk: string;
  rating: number;
  attack: number;
  midfield: number;
  defense: number;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  clubId: string;
  pace: number;
  shooting: number;
  passing: number;
  defense: number;
  overall: number;
}

export const TEAMS: Team[] = [
  { id: 'blue', name: 'Blue City', short: 'BLU', primary: '#1769FF', secondary: '#0047AB', gk: '#FEBE10', rating: 85, attack: 86, midfield: 84, defense: 85 },
  { id: 'red', name: 'Red United', short: 'RED', primary: '#DC143C', secondary: '#8B0000', gk: '#00FF85', rating: 83, attack: 82, midfield: 84, defense: 83 },
  { id: 'white', name: 'White FC', short: 'WHT', primary: '#FFFFFF', secondary: '#C0C0C0', gk: '#FF6600', rating: 84, attack: 85, midfield: 83, defense: 84 },
  { id: 'black', name: 'Black Rovers', short: 'BLK', primary: '#1a1a1a', secondary: '#404040', gk: '#FFFF00', rating: 82, attack: 81, midfield: 82, defense: 83 },
  { id: 'green', name: 'Green Athletic', short: 'GRN', primary: '#00A650', secondary: '#006400', gk: '#FF00FF', rating: 81, attack: 80, midfield: 82, defense: 81 },
  { id: 'purple', name: 'Purple Dynasty', short: 'PRP', primary: '#6C3BFF', secondary: '#4B0082', gk: '#00FFFF', rating: 83, attack: 84, midfield: 82, defense: 83 },
  { id: 'orange', name: 'Orange Storm', short: 'ORG', primary: '#FF8C00', secondary: '#FF4500', gk: '#0000FF', rating: 80, attack: 81, midfield: 79, defense: 80 },
  { id: 'cyan', name: 'Cyan Eagles', short: 'CYN', primary: '#00E5FF', secondary: '#008B8B', gk: '#FF1493', rating: 82, attack: 83, midfield: 81, defense: 82 }
];

export const PLAYERS: Player[] = [
  { id: 'p1', name: 'Silva', number: 10, position: 'FW', clubId: 'blue', pace: 88, shooting: 90, passing: 85, defense: 40, overall: 89 },
  { id: 'p2', name: 'Santos', number: 9, position: 'FW', clubId: 'red', pace: 86, shooting: 88, passing: 78, defense: 35, overall: 86 },
  { id: 'p3', name: 'Mueller', number: 7, position: 'MF', clubId: 'white', pace: 82, shooting: 79, passing: 91, defense: 70, overall: 85 },
  { id: 'p4', name: 'Johnson', number: 4, position: 'DF', clubId: 'black', pace: 78, shooting: 45, passing: 72, defense: 89, overall: 84 },
  { id: 'p5', name: 'Oliveira', number: 1, position: 'GK', clubId: 'green', pace: 60, shooting: 30, passing: 65, defense: 88, overall: 83 },
  { id: 'p6', name: 'Petrov', number: 11, position: 'FW', clubId: 'purple', pace: 90, shooting: 85, passing: 80, defense: 38, overall: 86 },
  { id: 'p7', name: 'Ahmed', number: 8, position: 'MF', clubId: 'orange', pace: 80, shooting: 76, passing: 87, defense: 68, overall: 82 },
  { id: 'p8', name: 'Chen', number: 3, position: 'DF', clubId: 'cyan', pace: 83, shooting: 50, passing: 75, defense: 86, overall: 83 },
  { id: 'p9', name: 'Rodriguez', number: 6, position: 'MF', clubId: 'blue', pace: 79, shooting: 74, passing: 89, defense: 75, overall: 84 },
  { id: 'p10', name: 'Williams', number: 5, position: 'DF', clubId: 'red', pace: 77, shooting: 48, passing: 70, defense: 87, overall: 82 },
];

export function getTeam(id: string): Team | undefined {
  return TEAMS.find(t => t.id === id);
}

export function getPlayersByClub(clubId: string): Player[] {
  return PLAYERS.filter(p => p.clubId === clubId).sort((a, b) => b.overall - a.overall);
}

export function getRandomTeams(count: number): Team[] {
  const shuffled = [...TEAMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
