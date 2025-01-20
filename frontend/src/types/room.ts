export type GameState = "waiting" | "playing" | "ending";

export interface Game {
  gameState: GameState;
  cards?: MemoryCard[];
  currentTurn?: string;
  flippedCards?: MemoryCard[];
}

export interface Player {
  playerName: string;
  isHost: boolean;
  socketId: string;
}

export interface MemoryCard {
  id: number;
  face: string;
  isFlipped: boolean;
  isMatched: boolean;
}
