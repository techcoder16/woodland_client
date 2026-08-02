import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL as string;
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

export function getActivitiesSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
