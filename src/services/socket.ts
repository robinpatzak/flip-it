import { Card } from "@/routes/Game";
import { Player } from "@/routes/Room";
import { io, Socket } from "socket.io-client";

interface ServerToClientEvents {
  roomCreated: (data: { roomId: string }) => void;
  updatePlayers: (players: Player[]) => void;
  kicked: (data: { playerName: string }) => void;
  isHost: () => void;
  gameStarted: () => void;
  updateGameState: (data: {
    cards: Card[];
    currentTurn: string;
    flippedCards: Card[];
  }) => void;
  turnUpdate: (playerName: string) => void;
  endGame: () => void;
}

interface ClientToServerEvents {
  createRoom: (data: { playerName: string }) => void;
  joinRoom: (data: { roomId: string; playerName: string }) => void;
  requestRoomState: (data: { roomId: string }) => void;
  requestGameState: (data: { roomId: string }) => void;
  kickPlayer: (data: { roomId: string; playerName: string }) => void;
  startGame: (data: { roomId: string }) => void;
  flipCard: (data: {
    roomId: string;
    cardId: number;
    playerName: string;
  }) => void;
}

const socketUrl = "http://localhost:4000";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(socketUrl);

export default socket;
