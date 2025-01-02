import { io } from "socket.io-client";

const socketUrl = "http://localhost:4000";

const socket = io(socketUrl);

export default socket;
