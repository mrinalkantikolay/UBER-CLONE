import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
    socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: false, // Connect manually when user is authenticated
    });
  }
  return socket;
};

export const connectSocket = (userId: string) => {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { userId };
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
