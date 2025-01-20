import { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";
import { io, Socket } from "socket.io-client";

const socketUrl = "http://localhost:4000";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(socketUrl);

export default socket;
