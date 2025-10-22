import { io } from "socket.io-client";

// Create one socket connection that persists
export const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  autoConnect: true,
});
