import express from "express";
import { Server, Socket } from "socket.io";
import { createServer, ServerResponse } from "http";
import { v4 as uuidv4 } from "uuid";

const DUMMY_CARDS = [
  { id: 1, face: "🐶" },
  { id: 2, face: "🐱" },
  { id: 3, face: "🐰" },
  { id: 4, face: "🦊" },
  { id: 5, face: "🐶" },
  { id: 6, face: "🐱" },
  { id: 7, face: "🐰" },
  { id: 8, face: "🦊" },
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

const gameStates = new Map<
  string,
  {
    cards: Card[];
    currentTurn: string;
    flippedCards: Card[];
    gameStarted: boolean;
  }
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
    socket.on("createRoom", async ({ playerName }) => {
      const roomId = uuidv4();
      rooms.set(roomId, [{ playerName, isHost: true, socketId: socket.id }]);
      await socket.join(roomId);
      io.to(roomId).emit("roomCreated", { roomId });
      const players = rooms.get(roomId);
      if (players) {
        io.to(roomId).emit("updatePlayers", players);
        console.info(`${playerName} created room ${roomId}`);
      }
    });

    socket.on("joinRoom", async ({ roomId, playerName }) => {
      if (rooms.has(roomId)) {
        const players = rooms.get(roomId);
        if (players) {
          players.push({ playerName, isHost: false, socketId: socket.id });
          rooms.set(roomId, players);
          await socket.join(roomId);
          io.to(roomId).emit("updatePlayers", players);
          const gameState = gameStates.get(roomId);
          if (gameState?.gameStarted) {
            const joiningPlayerSocketId = players.find(
              (player) => player.playerName === playerName
            )?.socketId;
            if (joiningPlayerSocketId) {
              io.to(roomId).emit("gameStarted");
              io.to(joiningPlayerSocketId).emit("updateGameState", gameState);
            }
          } else {
            console.info(`${playerName} joined room ${roomId}`);
          }
        }
      }
    });

    socket.on("requestRoomState", ({ roomId }) => {
      const players = rooms.get(roomId);
      if (players) {
        io.to(roomId).emit("updatePlayers", players);
      }
    });

    socket.on("requestGameState", ({ roomId }) => {
      const gameState = gameStates.get(roomId);
      if (gameState) {
        io.to(roomId).emit("updateGameState", gameState);
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

          const gameState = gameStates.get(roomId);

          if (gameState?.currentTurn === playerName) {
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
          const newCards: Card[] = DUMMY_CARDS.map((card) => ({
            id: card.id,
            face: card.face,
            isFlipped: false,
            isMatched: false,
          }));

          const shuffledCards = [...newCards].sort(() => Math.random() - 0.5);

          gameStates.set(roomId, {
            cards: shuffledCards,
            currentTurn: players[0].playerName,
            flippedCards: [],
            gameStarted: true,
          });

          const gameState = gameStates.get(roomId);
          if (gameState) {
            io.to(roomId).emit("updateGameState", gameState);
          }
          io.to(roomId).emit("gameStarted");
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

        const allMatched = cards.every((card) => card.isMatched);
        if (allMatched) {
          io.to(roomId).emit("updateGameState", gameState);
          io.to(roomId).emit("endGame");
          gameStates.delete(roomId);
          return;
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
        const disconnectedPlayerIndex = players.findIndex(
          (player) => player.socketId === socket.id
        );

        if (disconnectedPlayerIndex !== -1) {
          const disconnectedPlayer = players[disconnectedPlayerIndex];
          console.info(
            `${disconnectedPlayer.playerName} disconnected from room ${roomId}`
          );

          players.splice(disconnectedPlayerIndex, 1);

          if (disconnectedPlayer.isHost && players.length > 0) {
            players[0].isHost = true;
            console.info(`New host is ${players[0].playerName}`);
          }

          if (players.length === 0) {
            console.info(`${roomId} is now empty. Deleting.`);
            rooms.delete(roomId);
            gameStates.delete(roomId);
          } else {
            rooms.set(roomId, players);
            io.to(roomId).emit("updatePlayers", players);
          }

          const gameState = gameStates.get(roomId);
          if (
            gameState &&
            gameState.currentTurn === disconnectedPlayer.playerName
          ) {
            const nextPlayerIndex = 0;
            const nextPlayer = players[nextPlayerIndex].playerName;

            gameState.currentTurn = nextPlayer;
            gameState.flippedCards = [];

            io.to(roomId).emit("updateGameState", gameState);
            io.to(roomId).emit("turnUpdate", nextPlayer);
          }
        }
      });
    });
  }
);

httpServer.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
});
