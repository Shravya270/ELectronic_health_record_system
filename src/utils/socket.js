import { io } from "socket.io-client";

let socket = null;

export function getSocket(hhNumber, wallet) {
  if (!socket) {
    // Prefer explicit host; fallback to same origin
    const base =
      process.env.REACT_APP_STREAM_HOST ||
      (process.env.REACT_APP_STREAM_API_BASE_URL
        ? process.env.REACT_APP_STREAM_API_BASE_URL.replace("/api/ehr", "")
        : "");
    const url = base || "";
    socket = io(url, {
      transports: ["websocket"],
      query: { hhNumber, wallet },
    });
  } else {
    // Update query-like identity by connecting a new instance if identities change
    // For simplicity, reuse the socket
  }
  return socket;
}

export function closeSocket() {
  if (socket) {
    try {
      socket.disconnect();
    } catch {}
    socket = null;
  }
}


