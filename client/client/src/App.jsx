import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const App = () => {
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");

  const [number, setNumber] = useState("");
  const socket = io("http://localhost:3000");
  useEffect(() => {
    socket.on("connect", () => {
      console.log(" Connected with ID:", socket.id);
    });

    socket.on("getmessage", (data) => {
      console.log(" Data from server:", data);
    });

    // Cleanup event listeners (not disconnecting the socket)
    return () => {
      socket.off("connect");
      socket.off("getmessage");
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit("message", { id: number, message });
    setMessage("");
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    socket.emit("join-room", room);
  };

  return (
    <div>
      <input
        placeholder="Type here..."
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <button onClick={handleJoinRoom}>Send</button>

      <input
        placeholder="Type here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <input
        placeholder="Type here..."
        value={number}
        onChange={(e) => setNumber(e.target.value)}
      />
      <button onClick={handleSubmit}>Send</button>
    </div>
  );
};

export default App;
