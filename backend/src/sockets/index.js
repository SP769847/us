import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/prisma.js';
import cookie from '../utils/cookieParse.js';

let ioInstance = null;
const onlineUsers = new Map(); // userId -> Set of socket ids

export function getIO() {
  return ioInstance;
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

export function initSockets(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie || '';
      const parsed = cookie(rawCookie);
      const token = parsed.token || socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = verifyToken(token);
      socket.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    await prisma.user.update({ where: { id: userId }, data: { isOnline: true, lastSeenAt: new Date() } }).catch(() => {});

    const connections = await prisma.connection.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    });
    const peerIds = connections.map((c) => (c.userAId === userId ? c.userBId : c.userAId));
    for (const peerId of peerIds) {
      io.to(`user:${peerId}`).emit('user-online', { userId });
    }

    socket.join(`user:${userId}`);

    const memberships = await prisma.conversationMember.findMany({ where: { userId } });
    for (const m of memberships) {
      socket.join(`conversation:${m.conversationId}`);
    }

    socket.on('typing-start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing-start', { conversationId, userId });
    });

    socket.on('typing-stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing-stop', { conversationId, userId });
    });

    socket.on('join-conversation', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('disconnect', async () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          await prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeenAt: new Date() } }).catch(() => {});
          for (const peerId of peerIds) {
            io.to(`user:${peerId}`).emit('user-offline', { userId, lastSeenAt: new Date() });
          }
        }
      }
    });
  });

  ioInstance = io;
  return io;
}
