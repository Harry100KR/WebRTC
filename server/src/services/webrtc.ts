import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user?: User;
}

export const setupWebRTC = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as User;
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('User connected:', socket.user?.email);

    // Join room
    socket.on('join-room', async (roomId: string) => {
      try {
        // Verify room access
        const query = `
          SELECT id FROM sessions
          WHERE id = $1 AND (counselor_id = $2 OR client_id = $2)
          AND status = 'in-progress'
        `;
        const result = await db.query(query, [roomId, socket.user?.id]);

        if (result.rows.length === 0) {
          socket.emit('error', 'Access to room denied');
          return;
        }

        // Leave previous rooms
        socket.rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });

        // Join new room
        socket.join(roomId);
        socket.emit('room-joined', roomId);

        // Notify others in room
        socket.to(roomId).emit('user-connected', {
          userId: socket.user?.id,
          email: socket.user?.email
        });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', 'Failed to join room');
      }
    });

    // Handle WebRTC signaling
    socket.on('signal', async (data: { signal: any; roomId: string }) => {
      try {
        // Verify user is in the room
        if (!socket.rooms.has(data.roomId)) {
          socket.emit('error', 'Not in room');
          return;
        }

        // Broadcast signal to others in room
        socket.to(data.roomId).emit('signal', {
          signal: data.signal,
          from: socket.user?.id
        });
      } catch (error) {
        console.error('Signaling error:', error);
        socket.emit('error', 'Signaling failed');
      }
    });

    // Handle screen sharing
    socket.on('screen-share-started', (roomId: string) => {
      socket.to(roomId).emit('screen-share-started', socket.user?.id);
    });

    socket.on('screen-share-stopped', (roomId: string) => {
      socket.to(roomId).emit('screen-share-stopped', socket.user?.id);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user?.email);
      // Notify all rooms the user was in
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('user-disconnected', socket.user?.id);
        }
      });
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      socket.emit('error', 'An error occurred');
    });
  });
}; 