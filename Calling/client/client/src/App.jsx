import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SIGNAL_SERVER = "http://localhost:3000";

const App = () => {
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const otherUserRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SIGNAL_SERVER);

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    //  When a peer joins your room
    socketRef.current.on("peer-joined", async (peerId) => {
      console.log("Peer joined:", peerId);
      otherUserRef.current = peerId;
      await createOffer(peerId);

      // ✅ Hide disconnect notice if they rejoin
      const disconnectBox = document.getElementById("disconnect-box");
      const remoteBox = document.getElementById("remote-box");
      disconnectBox.style.display = "none";
      remoteBox.style.display = "none";
      remoteVideoRef.current.style.display = "block";
    });

    // 🧩 WebRTC signaling
    socketRef.current.on("signal", async ({ from, data }) => {
      const pc = peerRef.current;

      if (data.type === "offer") {
        otherUserRef.current = from;
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current.emit("signal", {
          to: from,
          data: { type: "answer", sdp: pc.localDescription },
        });
      } else if (data.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } else if (data.type === "ice" && data.candidate) {
        try {
          await pc.addIceCandidate(data.candidate);
        } catch (err) {
          console.error("Error adding received ice candidate", err);
        }
      }
    });

    // 🧩 When peer toggles camera or mic
    socketRef.current.on("media-toggle", ({ type, state }) => {
      const remoteBox = document.getElementById("remote-box");
      const disconnectBox = document.getElementById("disconnect-box");

      if (type === "video") {
        if (!state) {
          remoteVideoRef.current.style.display = "none";
          remoteBox.style.display = "flex";
          disconnectBox.style.display = "none";
        } else {
          remoteVideoRef.current.style.display = "block";
          remoteBox.style.display = "none";
        }
      }
    });

    // 🧩 When peer leaves (closes tab or refreshes)
    socketRef.current.on("peer-left", () => {
      console.log("Peer disconnected");

      const remoteBox = document.getElementById("remote-box");
      const disconnectBox = document.getElementById("disconnect-box");

      remoteVideoRef.current.style.display = "none";
      remoteBox.style.display = "none";
      disconnectBox.style.display = "flex";
    });

    return () => socketRef.current.disconnect();
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoined(true);
    await setupMediaAndPeer();
    socketRef.current.emit("join", room);
  };

  const setupMediaAndPeer = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = localStream;
    localStreamRef.current = localStream;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerRef.current = pc;

    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.onicecandidate = (event) => {
      if (event.candidate && otherUserRef.current) {
        socketRef.current.emit("signal", {
          to: otherUserRef.current,
          data: { type: "ice", candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  };

  const createOffer = async (peerId) => {
    const pc = peerRef.current;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("signal", {
      to: peerId,
      data: { type: "offer", sdp: pc.localDescription },
    });
  };

  const toggleMic = () => {
    const audioTracks = localStreamRef.current?.getAudioTracks();
    if (audioTracks?.length) {
      const enabled = !audioTracks[0].enabled;
      audioTracks[0].enabled = enabled;
      setMicOn(enabled);
      socketRef.current.emit("media-toggle", {
        room,
        type: "mic",
        state: enabled,
      });
    }
  };

  const toggleVideo = () => {
    const videoTracks = localStreamRef.current?.getVideoTracks();
    if (videoTracks?.length) {
      const enabled = !videoTracks[0].enabled;
      videoTracks[0].enabled = enabled;
      setVideoOn(enabled);

      const localBox = document.getElementById("local-box");
      if (!enabled) {
        localVideoRef.current.style.display = "none";
        localBox.style.display = "flex";
      } else {
        localVideoRef.current.style.display = "block";
        localBox.style.display = "none";
      }

      socketRef.current.emit("media-toggle", {
        room,
        type: "video",
        state: enabled,
      });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {!joined ? (
        <form onSubmit={handleJoin}>
          <input
            placeholder="Room ID"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            required
          />
          <button type="submit">Join Room</button>
        </form>
      ) : (
        <h3>Joined room: {room}</h3>
      )}

      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        {/* Local */}
        <div style={{ position: "relative" }}>
          <h4>Local Video</h4>
          <div
            id="local-box"
            style={{
              width: 300,
              height: 225,
              background: "#222",
              color: "#fff",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
            }}
          >
            <span>📷 Camera Off</span>
          </div>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: 300, background: "#000", borderRadius: 10 }}
          />
        </div>

        {/* Remote */}
        <div style={{ position: "relative" }}>
          <h4>Remote Video</h4>

          <div
            id="remote-box"
            style={{
              width: 300,
              height: 225,
              background: "#222",
              color: "#fff",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
            }}
          >
            <span>📷 User Camera Off</span>
          </div>

          {/* ✅ Disconnected box */}
          <div
            id="disconnect-box"
            style={{
              width: 300,
              height: 225,
              background: "darkred",
              color: "#fff",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
            }}
          >
            <span>❌ User Disconnected</span>
          </div>

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: 300, background: "#000", borderRadius: 10 }}
          />
        </div>
      </div>

      {joined && (
        <div style={{ marginTop: 20 }}>
          <button onClick={toggleMic}>
            {micOn ? "Mute Mic 🔇" : "Unmute Mic 🎙"}
          </button>
          <button onClick={toggleVideo} style={{ marginLeft: 10 }}>
            {videoOn ? "Turn Off Camera 📷" : "Turn On Camera 🎥"}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
