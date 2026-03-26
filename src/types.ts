export interface Player {
  name: string;
  score: number;
  setsWon: number;
}

export interface GameState {
  player1: Player;
  player2: Player;
  currentServer: 1 | 2;
  history: HistoryEntry[];
  isGameOver: boolean;
  winner: 1 | 2 | null;
  pointsPerSet: number;
  setsToWin: number;
  isSwapped: boolean;
}

export interface HistoryEntry {
  player1Score: number;
  player2Score: number;
  currentServer: 1 | 2;
}
