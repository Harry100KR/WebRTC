import { EventEmitter } from 'events';
import winston from 'winston';

// WebRTC type definitions
type RTCIceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed';
type RTCSignalingState = 'stable' | 'have-local-offer' | 'have-remote-offer' | 'have-local-pranswer' | 'have-remote-pranswer' | 'closed';

export type ConnectionState = {
  status: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
  iceConnectionState?: RTCIceConnectionState;
  signalingState?: RTCSignalingState;
  lastError?: Error;
  reconnectAttempts: number;
  lastUpdated: number;
};

export class ConnectionStateManager extends EventEmitter {
  private states: Map<string, ConnectionState>;
  private logger: winston.Logger;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly RECONNECT_TIMEOUT = 5000; // 5 seconds

  constructor(logger: winston.Logger) {
    super();
    this.states = new Map();
    this.logger = logger;
  }

  public initializeState(peerId: string): void {
    this.states.set(peerId, {
      status: 'new',
      reconnectAttempts: 0,
      lastUpdated: Date.now()
    });
  }

  public updateState(peerId: string, updates: Partial<ConnectionState>): void {
    const currentState = this.states.get(peerId) || {
      status: 'new',
      reconnectAttempts: 0,
      lastUpdated: Date.now()
    };

    const newState = {
      ...currentState,
      ...updates,
      lastUpdated: Date.now()
    };

    this.states.set(peerId, newState);
    this.emit('stateChange', { peerId, state: newState });
    
    // Log state change
    this.logger.debug(`Connection state updated for peer ${peerId}:`, newState);

    // Handle failed state
    if (newState.status === 'failed' && newState.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.handleFailedState(peerId, newState);
    }
  }

  private async handleFailedState(peerId: string, state: ConnectionState): Promise<void> {
    this.logger.warn(`Connection failed for peer ${peerId}, attempt ${state.reconnectAttempts + 1} of ${this.MAX_RECONNECT_ATTEMPTS}`);

    // Update reconnect attempts
    this.updateState(peerId, {
      reconnectAttempts: state.reconnectAttempts + 1
    });

    // Emit reconnect event
    this.emit('reconnectAttempt', {
      peerId,
      attempt: state.reconnectAttempts + 1,
      maxAttempts: this.MAX_RECONNECT_ATTEMPTS
    });

    // Wait before reconnecting
    await new Promise(resolve => setTimeout(resolve, this.RECONNECT_TIMEOUT));
    
    // Emit reconnect ready event
    this.emit('reconnectReady', { peerId });
  }

  public getState(peerId: string): ConnectionState | undefined {
    return this.states.get(peerId);
  }

  public removeState(peerId: string): void {
    this.states.delete(peerId);
    this.emit('stateRemoved', { peerId });
  }

  public isStable(peerId: string): boolean {
    const state = this.states.get(peerId);
    return state?.status === 'connected' && 
           state?.iceConnectionState === 'connected' &&
           state?.signalingState === 'stable';
  }

  public shouldAttemptReconnect(peerId: string): boolean {
    const state = this.states.get(peerId);
    return state?.status === 'failed' && 
           state?.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS;
  }
} 