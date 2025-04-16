export interface VideoConsultationProps {
  roomId: string;
  userId: string;
  isHost?: boolean;
}

export interface PeerConnection {
  peerId: string;
  stream: MediaStream;
}

export interface VideoConsultationState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  screenShare: MediaStream | null;
  isScreenSharing: boolean;
  isRecording: boolean;
  error: string | null;
} 