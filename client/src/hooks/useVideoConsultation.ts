import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { connect, Socket } from 'socket.io-client';
import RecordRTC from 'recordrtc';
import { VideoConsultationState } from '../types/videoConsultation';

const SOCKET_SERVER = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

interface SignalData {
  userId: string;
  signal: SimplePeer.SignalData;
  from: string;
}

interface RecordRTCInstance {
  startRecording: () => void;
  stopRecording: (callback: () => void) => void;
  getBlob: () => Blob;
}

export const useVideoConsultation = (roomId: string, userId: string) => {
  const [state, setState] = useState<VideoConsultationState>({
    localStream: null,
    remoteStreams: new Map(),
    screenShare: null,
    isScreenSharing: false,
    isRecording: false,
    error: null,
  });

  const socketRef = useRef<ReturnType<typeof connect> | null>(null);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const recorderRef = useRef<RecordRTCInstance | null>(null);

  const createPeer = useCallback((targetId: string, stream: MediaStream, initiator: boolean) => {
    const peer = new SimplePeer({
      initiator,
      stream,
      trickle: false,
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('signal', { targetId, signal, from: userId });
    });

    peer.on('stream', (remoteStream) => {
      setState((prev) => ({
        ...prev,
        remoteStreams: new Map(prev.remoteStreams).set(targetId, remoteStream),
      }));
    });

    return peer;
  }, [userId]);

  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setState((prev) => ({ ...prev, localStream: stream }));
      return stream;
    } catch (error) {
      setState((prev) => ({ ...prev, error: 'Failed to access media devices' }));
      throw error;
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      setState((prev) => ({ ...prev, screenShare: screenStream, isScreenSharing: true }));
      
      // Send screen share stream to all peers
      peersRef.current.forEach((peer) => {
        peer.addStream(screenStream);
      });

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      setState((prev) => ({ ...prev, error: 'Failed to start screen sharing' }));
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (state.screenShare) {
      state.screenShare.getTracks().forEach((track) => track.stop());
      
      // Remove screen share stream from all peers
      peersRef.current.forEach((peer) => {
        peer.removeStream(state.screenShare!);
      });

      setState((prev) => ({ ...prev, screenShare: null, isScreenSharing: false }));
    }
  }, [state.screenShare]);

  const startRecording = useCallback(() => {
    if (!state.localStream) return;

    try {
      const recorder = new (RecordRTC as any)(state.localStream, {
        type: 'video',
        mimeType: 'video/webm',
        bitsPerSecond: 128000,
      }) as RecordRTCInstance;

      recorder.startRecording();
      recorderRef.current = recorder;
      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState((prev) => ({ ...prev, error: 'Failed to start recording' }));
    }
  }, [state.localStream]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    try {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `consultation-${new Date().toISOString()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      });

      setState((prev) => ({ ...prev, isRecording: false }));
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setState((prev) => ({ ...prev, error: 'Failed to stop recording' }));
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await initializeMedia();
        const socket = connect(SOCKET_SERVER);
        socketRef.current = socket;
        
        socket.emit('join-room', { roomId, userId });

        socket.on('user-joined', ({ userId: newUserId }: { userId: string }) => {
          const peer = createPeer(newUserId, stream, true);
          peersRef.current.set(newUserId, peer);
        });

        socket.on('user-left', ({ userId: leftUserId }: { userId: string }) => {
          if (peersRef.current.has(leftUserId)) {
            peersRef.current.get(leftUserId)!.destroy();
            peersRef.current.delete(leftUserId);
            setState((prev) => {
              const newRemoteStreams = new Map(prev.remoteStreams);
              newRemoteStreams.delete(leftUserId);
              return { ...prev, remoteStreams: newRemoteStreams };
            });
          }
        });

        socket.on('receive-signal', ({ from, signal }: SignalData) => {
          let peer = peersRef.current.get(from);
          
          if (peer) {
            peer.signal(signal);
          } else {
            peer = createPeer(from, stream, false);
            peersRef.current.set(from, peer);
            peer.signal(signal);
          }
        });
      } catch (error) {
        console.error('Failed to initialize video consultation:', error);
        setState((prev) => ({ ...prev, error: 'Failed to initialize video chat' }));
      }
    };

    init();

    return () => {
      const currentPeers = peersRef.current;
      const currentSocket = socketRef.current;
      const { localStream, screenShare } = state;

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (screenShare) {
        screenShare.getTracks().forEach((track) => track.stop());
      }
      currentPeers.forEach((peer) => peer.destroy());
      currentSocket?.disconnect();
    };
  }, [roomId, userId, createPeer, initializeMedia]);

  return {
    ...state,
    startScreenShare,
    stopScreenShare,
    startRecording,
    stopRecording,
  };
}; 