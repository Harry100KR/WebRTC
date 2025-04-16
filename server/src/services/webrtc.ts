import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { pool } from '../config/database';
import jwt from 'jsonwebtoken';

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user?: User;
  currentRoom?: string;
}

export class WebRTCService {
  private io: Server;
  private rooms: Map<string, Set<string>>;

  constructor(io: Server) {
    this.io = io;
    this.rooms = new Map();
    this.setupSocketHandlers();
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }

  private setupSocketHandlers() {
    this.io.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as User;
        (socket as AuthenticatedSocket).user = decoded;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log('User connected:', socket.user?.email);

      socket.on('join-room', async (roomId: string) => {
        try {
          if (!socket.user) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          // Verify user has access to this room
          const query = `
            SELECT * FROM sessions 
            WHERE id = $1 
            AND (counselor_id = $2 OR client_id = $2)
            AND status = 'in-progress'
          `;
          const result = await pool.query(query, [roomId, socket.user.id]);

          if (result.rows.length === 0) {
            socket.emit('error', { message: 'Access denied to this room' });
            return;
          }

          // Leave previous rooms
          for (const room of socket.rooms) {
            if (room !== socket.id) {
              socket.leave(room);
            }
          }

          socket.join(roomId);
          socket.currentRoom = roomId;
          socket.to(roomId).emit('user-connected', socket.user.id);

          // Update room participants
          if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
          }
          this.rooms.get(roomId)?.add(socket.id);

          socket.on('screen-share-start', () => {
            if (socket.currentRoom && socket.user) {
              socket.to(socket.currentRoom).emit('screen-share-started', socket.user.id);
            }
          });

          socket.on('screen-share-stop', () => {
            if (socket.currentRoom && socket.user) {
              socket.to(socket.currentRoom).emit('screen-share-stopped', socket.user.id);
            }
          });

          socket.on('disconnect', () => {
            if (socket.currentRoom && socket.user) {
              this.rooms.get(socket.currentRoom)?.delete(socket.id);
              if (this.rooms.get(socket.currentRoom)?.size === 0) {
                this.rooms.delete(socket.currentRoom);
              }
              socket.to(socket.currentRoom).emit('user-disconnected', socket.user.id);
            }
          });
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });
    });
  }
} 