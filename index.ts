import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { v4 as uuidv4 } from "uuid";

const PORT = 4000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

const rooms = new Map();

io.on("connection", (socket) => {
  socket.on("createRoom", ({ playerName, isHost }) => {
    const roomId = uuidv4();
    rooms.set(roomId, [{ playerName, isHost }]);
    socket.join(roomId);
    io.to(roomId).emit("roomCreated", { roomId });
    io.to(roomId).emit("updatePlayers", rooms.get(roomId));
    console.log(`${playerName} created room ${roomId}`);
  });

  socket.on("joinRoom", ({ roomId, playerName, isHost }) => {
    if (rooms.has(roomId)) {
      const players = rooms.get(roomId);
      players.push({ playerName, isHost });
      rooms.set(roomId, players);
      socket.join(roomId);
      io.to(roomId).emit("updatePlayers", players);
      console.log(`${playerName} joined room ${roomId}`);
    }
  });

  socket.on("disconnect", () => {
    rooms.forEach((players, roomId) => {
      if (players.length === 0) {
        rooms.delete(roomId);
      }
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
