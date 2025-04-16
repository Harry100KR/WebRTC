import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import winston from 'winston';
import AsyncLock from '../utils/AsyncLock';
import { ConnectionStateManager } from './ConnectionStateManager';
import { MediaQualityManager } from './MediaQualityManager';
import { RoomManager, RoomParticipant, RoomSettings } from './RoomManager';
import { webRTCConfig } from '../config/webrtc.config';

export class WebRTCService {
  private io: SocketIOServer;
  private logger: winston.Logger;
  private roomManager: RoomManager;
  private connectionManager: ConnectionStateManager;
  private qualityManager: MediaQualityManager;

  constructor(server: HTTPServer, logger: winston.Logger) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    this.logger = logger;
    this.roomManager = new RoomManager(logger);
    this.connectionManager = new ConnectionStateManager(logger);
    this.qualityManager = new MediaQualityManager(logger);

    this.setupSocketHandlers();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Room events
    this.roomManager.on('roomCreated', ({ roomId }) => {
      this.logger.info(`Room ${roomId} created`);
    });

    this.roomManager.on('roomClosed', ({ roomId }) => {
      this.logger.info(`Room ${roomId} closed`);
      this.io.to(roomId).emit('room-closed');
    });

    this.roomManager.on('participantJoined', ({ roomId, participant }) => {
      this.io.to(roomId).emit('user-joined', {
        userId: participant.userId,
        role: participant.role
      });
    });

    this.roomManager.on('participantLeft', ({ roomId, participant }) => {
      this.io.to(roomId).emit('user-left', {
        userId: participant.userId
      });
    });

    // Connection state events
    this.connectionManager.on('stateChange', ({ peerId, state }) => {
      this.io.to(peerId).emit('connection-state-changed', state);
    });

    this.connectionManager.on('reconnectAttempt', ({ peerId, attempt, maxAttempts }) => {
      this.io.to(peerId).emit('reconnecting', { attempt, maxAttempts });
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', async (socket) => {
      this.logger.info(`New WebRTC connection: ${socket.id}`);

      socket.on('join-room', async ({ roomId, userId, role = 'participant' }) => {
        try {
          // Create room if it doesn't exist
          let room = await this.roomManager.getRoomInfo(roomId);
          if (!room) {
            room = await this.roomManager.createRoom(roomId, {
              maxParticipants: 2,
              timeout: 300000,
              recordingEnabled: true,
              screenShareEnabled: true
            });
          }

          // Add participant to room
          const participant: RoomParticipant = {
            socketId: socket.id,
            userId,
            joinedAt: Date.now(),
            role
          };

          await this.roomManager.addParticipant(roomId, participant);
          await socket.join(roomId);

          // Initialize connection state
          this.connectionManager.initializeState(socket.id);

          // Send room configuration
          socket.emit('room-joined', {
            roomId,
            config: webRTCConfig,
            participants: await this.roomManager.getRoomInfo(roomId)
          });

        } catch (err: any) {
          this.logger.error('Error joining room:', err);
          socket.emit('error', {
            code: 'JOIN_ROOM_ERROR',
            message: err.message || 'Failed to join room'
          });
        }
      });

      socket.on('signal', async ({ targetId, signal, from }) => {
        try {
          this.logger.debug(`Signaling from ${from} to ${targetId}`);
          this.io.to(targetId).emit('signal', { signal, from });
        } catch (error) {
          this.logger.error('Signaling error:', error);
          socket.emit('error', {
            code: 'SIGNALING_ERROR',
            message: 'Failed to relay signal'
          });
        }
      });

      socket.on('connection-state', async ({ roomId, state }) => {
        try {
          await this.roomManager.updateParticipantState(roomId, socket.id, state);
          this.connectionManager.updateState(socket.id, { status: state });
        } catch (error) {
          this.logger.error('Error updating connection state:', error);
        }
      });

      socket.on('network-quality', ({ stats }) => {
        try {
          const quality = this.qualityManager.determineNetworkQuality(stats);
          socket.emit('quality-profile', {
            quality,
            profile: this.qualityManager.getQualityProfile(quality)
          });
        } catch (error) {
          this.logger.error('Error determining network quality:', error);
        }
      });

      socket.on('disconnect', async () => {
        try {
          this.logger.info(`Client disconnected: ${socket.id}`);
          
          // Find and remove participant from all rooms
          const rooms = Array.from(socket.rooms);
          for (const roomId of rooms) {
            if (roomId !== socket.id) {
              await this.roomManager.removeParticipant(roomId, socket.id);
            }
          }

          // Clean up connection state
          this.connectionManager.removeState(socket.id);
        } catch (error) {
          this.logger.error('Error handling disconnect:', error);
        }
      });
    });
  }

  public cleanup(): void {
    this.roomManager.cleanup();
    this.io.close();
  }
}

export default WebRTCService; 