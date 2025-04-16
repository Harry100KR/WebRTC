import { EventEmitter } from 'events';
import winston from 'winston';
import AsyncLock from '../utils/AsyncLock';

export interface Room {
  id: string;
  participants: Set<RoomParticipant>;
  createdAt: number;
  lastActivity: number;
  settings: RoomSettings;
  metadata: Record<string, any>;
}

export interface RoomParticipant {
  socketId: string;
  userId: string;
  joinedAt: number;
  role: 'host' | 'participant';
  connectionState?: string;
}

export interface RoomSettings {
  maxParticipants: number;
  timeout: number; // milliseconds
  recordingEnabled: boolean;
  screenShareEnabled: boolean;
}

export class RoomManager extends EventEmitter {
  private rooms: Map<string, Room>;
  private logger: winston.Logger;
  private lock: AsyncLock;
  private cleanupInterval: NodeJS.Timeout;

  private readonly DEFAULT_SETTINGS: RoomSettings = {
    maxParticipants: 2,
    timeout: 300000, // 5 minutes
    recordingEnabled: true,
    screenShareEnabled: true
  };

  constructor(logger: winston.Logger) {
    super();
    this.rooms = new Map();
    this.logger = logger;
    this.lock = new AsyncLock();

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupInactiveRooms(), 60000);
  }

  public async createRoom(
    roomId: string,
    settings?: Partial<RoomSettings>
  ): Promise<Room> {
    const release = await this.lock.acquire(`room:${roomId}`);
    try {
      if (this.rooms.has(roomId)) {
        throw new Error(`Room ${roomId} already exists`);
      }

      const room: Room = {
        id: roomId,
        participants: new Set(),
        createdAt: Date.now(),
        lastActivity: Date.now(),
        settings: { ...this.DEFAULT_SETTINGS, ...settings },
        metadata: {}
      };

      this.rooms.set(roomId, room);
      this.emit('roomCreated', { roomId });
      this.logger.info(`Room ${roomId} created`);

      return room;
    } finally {
      release();
    }
  }

  public async addParticipant(
    roomId: string,
    participant: RoomParticipant
  ): Promise<void> {
    const release = await this.lock.acquire(`room:${roomId}`);
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        throw new Error(`Room ${roomId} not found`);
      }

      if (room.participants.size >= room.settings.maxParticipants) {
        throw new Error(`Room ${roomId} is full`);
      }

      room.participants.add(participant);
      room.lastActivity = Date.now();

      this.emit('participantJoined', { roomId, participant });
      this.logger.info(`Participant ${participant.userId} joined room ${roomId}`);
    } finally {
      release();
    }
  }

  public async removeParticipant(
    roomId: string,
    socketId: string
  ): Promise<void> {
    const release = await this.lock.acquire(`room:${roomId}`);
    try {
      const room = this.rooms.get(roomId);
      if (!room) return;

      const participant = Array.from(room.participants)
        .find(p => p.socketId === socketId);

      if (participant) {
        room.participants.delete(participant);
        room.lastActivity = Date.now();

        this.emit('participantLeft', { roomId, participant });
        this.logger.info(`Participant ${participant.userId} left room ${roomId}`);

        // Check if room should be closed
        if (room.participants.size === 0) {
          await this.closeRoom(roomId);
        }
      }
    } finally {
      release();
    }
  }

  public async updateParticipantState(
    roomId: string,
    socketId: string,
    connectionState: string
  ): Promise<void> {
    const release = await this.lock.acquire(`room:${roomId}`);
    try {
      const room = this.rooms.get(roomId);
      if (!room) return;

      const participant = Array.from(room.participants)
        .find(p => p.socketId === socketId);

      if (participant) {
        participant.connectionState = connectionState;
        this.emit('participantStateChanged', { roomId, participant });
      }
    } finally {
      release();
    }
  }

  private async cleanupInactiveRooms(): Promise<void> {
    const now = Date.now();
    const roomsToCheck = Array.from(this.rooms.entries());

    for (const [roomId, room] of roomsToCheck) {
      const release = await this.lock.acquire(`room:${roomId}`);
      try {
        if (now - room.lastActivity > room.settings.timeout) {
          await this.closeRoom(roomId);
        }
      } finally {
        release();
      }
    }
  }

  private async closeRoom(roomId: string): Promise<void> {
    const release = await this.lock.acquire(`room:${roomId}`);
    try {
      const room = this.rooms.get(roomId);
      if (!room) return;

      // Notify all participants
      room.participants.forEach(participant => {
        this.emit('participantRemoved', { roomId, participant });
      });

      this.rooms.delete(roomId);
      this.emit('roomClosed', { roomId });
      this.logger.info(`Room ${roomId} closed`);
    } finally {
      release();
    }
  }

  public async getRoomInfo(roomId: string): Promise<Room | undefined> {
    const release = await this.lock.acquire(`room:${roomId}`);
    try {
      return this.rooms.get(roomId);
    } finally {
      release();
    }
  }

  public async updateRoomMetadata(
    roomId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const release = await this.lock.acquire(`room:${roomId}`);
    try {
      const room = this.rooms.get(roomId);
      if (!room) return;

      room.metadata = { ...room.metadata, ...metadata };
      room.lastActivity = Date.now();

      this.emit('roomMetadataUpdated', { roomId, metadata: room.metadata });
    } finally {
      release();
    }
  }

  public cleanup(): void {
    clearInterval(this.cleanupInterval);
    this.rooms.clear();
    this.emit('cleanup');
  }
} 