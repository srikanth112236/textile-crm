import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import redisClient from './redis';
import { allowedOrigins } from './origins';

let io: SocketIOServer | null = null;

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  if (io) {
    return io; // Return existing instance if already initialized
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Use Redis adapter for scaling (if Redis is available)
  if (redisClient && redisClient.status === 'ready') {
    const pubClient = redisClient;
    const subClient = redisClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Socket.io Redis adapter connected');
  } else {
    console.warn('⚠️  Socket.io running without Redis adapter (single instance mode)');
  }

  // Socket.io authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token (reuse JWT utility)
    try {
      const { verifyToken } = require('../utils/jwt');
      const decoded = verifyToken(token);
      (socket as any).userId = decoded.userId;
      (socket as any).userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    const userRole = (socket as any).userRole;

    console.log(`🔌 Socket connected: User ${userId} (${userRole})`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Join role-specific rooms
    if (userRole === 'superadmin' || userRole === 'admin') {
      socket.join('admin');
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: User ${userId}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('✅ Socket.io server initialized');
  return io;
};

export const getSocketIO = (): SocketIOServer | null => {
  return io;
};

// Helper function to emit events
export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToAdmins = (event: string, data: any): void => {
  if (io) {
    io.to('admin').emit(event, data);
  }
};

export const emitToAll = (event: string, data: any): void => {
  if (io) {
    io.emit(event, data);
  }
};

