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

type GameState = "waiting" | "playing" | "ending";

interface Game {
  gameState: GameState;
  cards?: Card[];
  currentTurn?: string;
  flippedCards?: Card[];
}

interface ServerToClientEvents {
  roomCreated: (data: { roomId: string }) => void;
  updatePlayers: (players: Player[]) => void;
  kicked: (data: { playerName: string }) => void;
  isHost: () => void;
  gameStarted: () => void;
  updateGame: (data: Game) => void;
  turnUpdate: (playerName: string) => void;
  endGame: () => void;
}

interface ClientToServerEvents {
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

const PORT = 4000;

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

const rooms: Map<string, { players: Player[]; game: Game }> = new Map();

io.on(
  "connection",
  (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    socket.on("createRoom", async ({ playerName }) => {
      const roomId = uuidv4();
      rooms.set(roomId, {
        players: [{ playerName, isHost: true, socketId: socket.id }],
        game: { gameState: "waiting" },
      });
      await socket.join(roomId);
      io.to(roomId).emit("roomCreated", { roomId });
      const players = rooms.get(roomId)?.players;
      if (players) {
        io.to(roomId).emit("updatePlayers", players);
        console.info(`${playerName} created room ${roomId}`);
      }
    });

    socket.on("joinRoom", async ({ roomId, playerName }) => {
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        if (room) {
          room.players.push({ playerName, isHost: false, socketId: socket.id });
          rooms.set(roomId, { ...room, players: room.players });
          await socket.join(roomId);
          io.to(roomId).emit("updatePlayers", room.players);
          if (room.game.gameState === "playing") {
            const joiningPlayerSocketId = room.players.find(
              (player) => player.playerName === playerName
            )?.socketId;
            if (joiningPlayerSocketId) {
              io.to(roomId).emit("gameStarted");
              io.to(joiningPlayerSocketId).emit("updateGame", room.game);
            }
          } else {
            console.info(`${playerName} joined room ${roomId}`);
          }
        }
      }
    });

    socket.on("requestRoom", ({ roomId }) => {
      const players = rooms.get(roomId)?.players;
      if (players) {
        io.to(roomId).emit("updatePlayers", players);
      }
    });

    socket.on("requestGame", ({ roomId }) => {
      const game = rooms.get(roomId)?.game;
      if (game) {
        io.to(roomId).emit("updateGame", game);
      }
    });

    socket.on("kickPlayer", ({ roomId, playerName }) => {
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        if (room) {
          const kickedPlayerSocketId = room.players.find(
            (player) => player.playerName === playerName
          )?.socketId;
          const updatedPlayers = room.players.filter(
            (player) => player.playerName !== playerName
          );
          rooms.set(roomId, { ...room, players: updatedPlayers });
          io.to(roomId).emit("updatePlayers", updatedPlayers);

          const game = room.game;

          if (game?.currentTurn === playerName) {
            const currentPlayerIndex = room.players.findIndex(
              (player) => player.playerName === playerName
            );
            const nextPlayerIndex =
              (currentPlayerIndex + 1) % room.players.length;
            const nextPlayer = room.players[nextPlayerIndex].playerName;

            game.currentTurn = nextPlayer;
            game.flippedCards = [];

            io.to(roomId).emit("updateGame", game);
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
        const room = rooms.get(roomId);
        if (room) {
          const newCards: Card[] = DUMMY_CARDS.map((card) => ({
            id: card.id,
            face: card.face,
            isFlipped: false,
            isMatched: false,
          }));

          const shuffledCards = [...newCards].sort(() => Math.random() - 0.5);

          room.game = {
            cards: shuffledCards,
            currentTurn: room.players[0].playerName,
            flippedCards: [],
            gameState: "playing",
          };

          if (room.game) {
            io.to(roomId).emit("updateGame", room.game);
          }
          io.to(roomId).emit("gameStarted");
          io.to(roomId).emit("turnUpdate", room.players[0].playerName);
        }
      }
    });

    socket.on("flipCard", ({ roomId, cardId, playerName }) => {
      const game = rooms.get(roomId)?.game;
      if (
        !game ||
        game.currentTurn !== playerName ||
        !game.cards ||
        !game.flippedCards
      )
        return;

      const { cards, flippedCards } = game;

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
          io.to(roomId).emit("endGame");
          game.gameState = "ending";
          io.to(roomId).emit("updateGame", game);
          setTimeout(() => {
            game.gameState = "waiting";
            io.to(roomId).emit("updateGame", game);
          }, 1000);
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

          const players = rooms.get(roomId)?.players;
          if (players) {
            const currentPlayerIndex = players.findIndex(
              (player) => player.playerName === playerName
            );
            const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
            const nextPlayer = players[nextPlayerIndex].playerName;

            game.currentTurn = nextPlayer;
            game.flippedCards = [];

            io.to(roomId).emit("updateGame", game);
            io.to(roomId).emit("turnUpdate", nextPlayer);
          }
        }, 1000);
      }
      game.flippedCards = updateFlippedCards;
      io.to(roomId).emit("updateGame", game);
    });

    socket.on("disconnect", () => {
      rooms.forEach((room, roomId) => {
        const disconnectedPlayerIndex = room.players.findIndex(
          (player) => player.socketId === socket.id
        );

        if (disconnectedPlayerIndex !== -1) {
          const disconnectedPlayer = room.players[disconnectedPlayerIndex];
          console.info(
            `${disconnectedPlayer.playerName} disconnected from room ${roomId}`
          );

          room.players.splice(disconnectedPlayerIndex, 1);

          if (disconnectedPlayer.isHost && room.players.length > 0) {
            room.players[0].isHost = true;
            console.info(`New host is ${room.players[0].playerName}`);
          }

          if (room.players.length === 0) {
            console.info(`${roomId} is now empty. Deleting.`);
            rooms.delete(roomId);
          } else {
            rooms.set(roomId, room);
            io.to(roomId).emit("updatePlayers", room.players);
          }

          if (
            room.game &&
            room.game.currentTurn === disconnectedPlayer.playerName
          ) {
            const nextPlayerIndex = 0;
            const nextPlayer = room.players[nextPlayerIndex].playerName;

            room.game.currentTurn = nextPlayer;
            room.game.flippedCards = [];

            io.to(roomId).emit("updateGame", room.game);
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
