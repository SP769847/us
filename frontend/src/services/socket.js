import { io } from 'socket.io-client';

// Same rule as services/api.js: relative in dev (Vite proxies /socket.io),
// full backend URL in production via VITE_API_URL.
const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
