import express from "express";
import { Server, Socket } from "socket.io";
import { createServer, ServerResponse } from "http";
import { v4 as uuidv4 } from "uuid";

const DUMMY_CARDS: Card[] = [
  { id: 1, face: "🐶", isFlipped: false, isMatched: false },
  { id: 2, face: "🐱", isFlipped: false, isMatched: false },
  { id: 3, face: "🐰", isFlipped: false, isMatched: false },
  { id: 4, face: "🦊", isFlipped: false, isMatched: false },
  { id: 5, face: "🐶", isFlipped: false, isMatched: false },
  { id: 6, face: "🐱", isFlipped: false, isMatched: false },
  { id: 7, face: "🐰", isFlipped: false, isMatched: false },
  { id: 8, face: "🦊", isFlipped: false, isMatched: false },
];

interface Player {
  playerName: string;
  isHost: boolean;
  socketId: string;
}

interface Card {
  id: number;
  face: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface ServerToClientEvents {
  roomCreated: (data: { roomId: string }) => void;
  updatePlayers: (players: Player[]) => void;
  kicked: (data: { playerName: string }) => void;
  gameStarted: () => void;
  updateGameState: (data: {
    cards: Card[];
    currentTurn: string;
    flippedCards: Card[];
  }) => void;
  turnUpdate: (playerName: string) => void;
}

interface ClientToServerEvents {
  createRoom: (data: { playerName: string; isHost: boolean }) => void;
  joinRoom: (data: {
    roomId: string;
    playerName: string;
    isHost: boolean;
  }) => void;
  kickPlayer: (data: { roomId: string; playerName: string }) => void;
  startGame: (data: { roomId: string }) => void;
  flipCard: (data: {
    roomId: string;
    cardId: number;
    playerName: string;
  }) => void;
}

const gameStates = new Map<
  string,
  { cards: Card[]; currentTurn: string; flippedCards: Card[] }
>();

const PORT = 4000;

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

const rooms: Map<string, Player[]> = new Map();

io.on(
  "connection",
  (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    socket.on("createRoom", ({ playerName, isHost }) => {
      const roomId = uuidv4();
      rooms.set(roomId, [{ playerName, isHost, socketId: socket.id }]);
      socket.join(roomId);
      io.to(roomId).emit("roomCreated", { roomId });
      const players = rooms.get(roomId);
      if (players) {
        io.to(roomId).emit("updatePlayers", players);
        console.log(`${playerName} created room ${roomId}`);
      }
    });

    socket.on("joinRoom", ({ roomId, playerName, isHost }) => {
      if (rooms.has(roomId)) {
        const players = rooms.get(roomId);
        if (players) {
          players.push({ playerName, isHost, socketId: socket.id });
          rooms.set(roomId, players);
          socket.join(roomId);
          io.to(roomId).emit("updatePlayers", players);
          console.log(`${playerName} joined room ${roomId}`);
        }
      }
    });

    socket.on("kickPlayer", ({ roomId, playerName }) => {
      if (rooms.has(roomId)) {
        const players = rooms.get(roomId);
        if (players) {
          const kickedPlayerSocketId = players.find(
            (player) => player.playerName === playerName
          )?.socketId;
          const updatedPlayers = players.filter(
            (player) => player.playerName !== playerName
          );
          rooms.set(roomId, updatedPlayers);
          io.to(roomId).emit("updatePlayers", updatedPlayers);

          if (kickedPlayerSocketId) {
            io.to(kickedPlayerSocketId).emit("kicked", { playerName });
          }
        }
      }
    });

    socket.on("startGame", ({ roomId }) => {
      if (rooms.has(roomId)) {
        const players = rooms.get(roomId);
        if (players) {
          const shuffledCards = [...DUMMY_CARDS].sort(
            () => Math.random() - 0.5
          );

          gameStates.set(roomId, {
            cards: shuffledCards,
            currentTurn: players[0].playerName,
            flippedCards: [],
          });

          io.to(roomId).emit("gameStarted");
          const gameState = gameStates.get(roomId);
          if (gameState) {
            io.to(roomId).emit("updateGameState", gameState);
          }
          io.to(roomId).emit("turnUpdate", players[0].playerName);
        }
      }
    });

    socket.on("flipCard", ({ roomId, cardId, playerName }) => {
      const gameState = gameStates.get(roomId);
      if (!gameState || gameState.currentTurn !== playerName) return;

      const { cards, flippedCards } = gameState;
      const cardToFlip = cards.find((card) => card.id === cardId);
      if (!cardToFlip || cardToFlip.isFlipped || cardToFlip.isMatched) return;

      cardToFlip.isFlipped = true;
      const updateFlippedCards = [...flippedCards, cardToFlip];

      if (updateFlippedCards.length === 2) {
        const [firstCard, secondCard] = updateFlippedCards;
        if (firstCard.face === secondCard.face) {
          cards.forEach((card) => {
            if (
              updateFlippedCards.some(
                (flippedCard) => flippedCard.id === card.id
              )
            ) {
              card.isMatched = true;
            }
          });
        }

        setTimeout(() => {
          if (!firstCard.isMatched) {
            cards.forEach((card) => {
              if (
                updateFlippedCards.some(
                  (flippedCard) => flippedCard.id === card.id
                )
              ) {
                card.isFlipped = false;
              }
            });
          }

          const players = rooms.get(roomId);
          if (players) {
            const currentPlayerIndex = players.findIndex(
              (player) => player.playerName === playerName
            );
            const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
            const nextPlayer = players[nextPlayerIndex].playerName;

            gameState.currentTurn = nextPlayer;
            gameState.flippedCards = [];

            io.to(roomId).emit("updateGameState", gameState);
            io.to(roomId).emit("turnUpdate", nextPlayer);
          }
        }, 1000);
      }
      gameState.flippedCards = updateFlippedCards;
      io.to(roomId).emit("updateGameState", gameState);
    });

    socket.on("disconnect", () => {
      rooms.forEach((players, roomId) => {
        if (players.length === 0) {
          rooms.delete(roomId);
        }
      });
    });
  }
);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
