import { Server } from 'socket.io'

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "https://client-kelolasaji.vercel.app"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      transports: ['websocket']
    },
  });

  io.on('connection', (socket) => {
    console.log('🟢 Socket connected');
    socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
