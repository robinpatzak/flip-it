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