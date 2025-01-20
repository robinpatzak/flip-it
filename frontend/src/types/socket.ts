import { Player, Game } from "./room";

export interface ServerToClientEvents {
  roomCreated: (data: { roomId: string }) => void;
  updatePlayers: (players: Player[]) => void;
  kicked: (data: { playerName: string }) => void;
  isHost: () => void;
  gameStarted: () => void;
  updateGame: (data: Game) => void;
  turnUpdate: (playerName: string) => void;
  endGame: () => void;
}

export interface ClientToServerEvents {
  createRoom: (data: { playerName: string }) => void;
  joinRoom: (data: { roomId: string; playerName: string }) => void;
  requestRoom: (data: { roomId: string }) => void;
  requestGame: (data: { roomId: string }) => void;
  kickPlayer: (data: { roomId: string; playerName: string }) => void;
  startGame: (data: { roomId: string }) => void;
  flipCard: (data: {
    roomId: string;
    cardId: number;
    playerName: string;
  }) => void;
}