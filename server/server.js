import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const port = 3000;

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("message", ({ id, message }) => {
    console.log({ id, message });
    socket.to(id).emit("getmessage", message);
  });
  socket.on("disconnect", () => {
    console.log("user dissconnected", socket.id);
  });
  socket.on("join-room", (room) => {
    socket.join(room);
  });
});

server.listen(port, () => {
  console.log(`server is running on ${port}`);
});
