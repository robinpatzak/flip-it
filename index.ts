import express from "express";
import { Server, Socket } from "socket.io";
import { createServer, ServerResponse } from "http";
import { v4 as uuidv4 } from "uuid";

interface Player {
  playerName: string;
  isHost: boolean;
  socketId: string;
}

interface ServerToClientEvents {
  roomCreated: (data: { roomId: string }) => void;
  updatePlayers: (players: Player[]) => void;
  kicked: (data: { playerName: string }) => void;
  gameStarted: () => void;
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
}

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
        io.to(roomId).emit("gameStarted");
      }
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
