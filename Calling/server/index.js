import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const port = 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (room) => {
    socket.join(room);
    socket.room = room;

    // Notify others in the room
    socket.to(room).emit("peer-joined", socket.id);
  });

  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", { from: socket.id, data });
  });

  socket.on("media-toggle", ({ room, type, state }) => {
    socket.to(room).emit("media-toggle", { type, state });
  });

  socket.on("disconnect", () => {
    if (socket.room) {
      socket.to(socket.room).emit("peer-left", socket.id);
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
