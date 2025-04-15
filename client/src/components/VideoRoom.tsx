import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import io, { Socket } from 'socket.io-client';
import { Box, Button, Grid, Typography } from '@mui/material';
import RecordingConsent from './RecordingConsent';
import useRecording from '../hooks/useRecording';

interface VideoRoomProps {
  socket: ReturnType<typeof io>;
  roomId: string;
  userId: string;
  role: 'counselor' | 'client';
}

// Add interface for signal data
interface SignalData {
  signal: SimplePeer.SignalData;
  roomId: string;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ socket, roomId, userId, role }) => {
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);

  const { startRecording, stopRecording } = useRecording({
    stream,
    screenStream,
    onRecordingComplete: async (blob) => {
      const formData = new FormData();
      formData.append('recording', blob);
      formData.append('sessionId', roomId);
      formData.append('type', screenStream ? 'both' : 'video');

      try {
        await fetch('/api/recordings/upload', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.error('Failed to upload recording:', error);
      }
    }
  });

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(mediaStream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Failed to get media devices:', error);
      }
    };

    initializeMedia();
    
    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream, screenStream]);

  useEffect(() => {
    if (!stream) return;

    const peer = new SimplePeer({
      initiator: role === 'counselor',
      stream,
      trickle: false
    });

    peer.on('signal', (data: SimplePeer.SignalData) => {
      socket.emit('signal', { signal: data, roomId });
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    socket.on('signal', ({ signal }: SignalData) => {
      peer.signal(signal);
    });

    setPeer(peer);

    return () => {
      peer.destroy();
      socket.off('signal');
    };
  }, [stream, socket, roomId, role]);

  const handleScreenShare = async () => {
    try {
      const screenMediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      setScreenStream(screenMediaStream);
      
      if (screenShareRef.current) {
        screenShareRef.current.srcObject = screenMediaStream;
      }

      // Send screen share stream to peer
      if (peer) {
        peer.addStream(screenMediaStream);
      }

      screenMediaStream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        if (peer) {
          peer.removeStream(screenMediaStream);
        }
      };
    } catch (error) {
      console.error('Failed to share screen:', error);
    }
  };

  const handleStartRecording = () => {
    if (role === 'counselor') {
      setShowConsentDialog(true);
    }
  };

  const handleRecordingConsent = async (type: 'video' | 'screen' | 'both') => {
    setShowConsentDialog(false);
    try {
      const response = await fetch('/api/recordings/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: roomId, type })
      });

      if (response.ok) {
        setIsRecording(true);
        startRecording();
      }
    } catch (error) {
      console.error('Failed to get recording consent:', error);
    }
  };

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6">Local Video</Typography>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', maxWidth: '400px' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6">Remote Video</Typography>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', maxWidth: '400px' }}
          />
        </Grid>
        {screenStream && (
          <Grid item xs={12}>
            <Typography variant="h6">Screen Share</Typography>
            <video
              ref={screenShareRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', maxWidth: '800px' }}
            />
          </Grid>
        )}
      </Grid>

      <Box mt={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleScreenShare}
          disabled={!!screenStream}
        >
          {screenStream ? 'Sharing Screen' : 'Share Screen'}
        </Button>
        {role === 'counselor' && (
          <Button
            variant="contained"
            color={isRecording ? 'secondary' : 'primary'}
            onClick={isRecording ? stopRecording : handleStartRecording}
            style={{ marginLeft: '1rem' }}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        )}
      </Box>

      {showConsentDialog && (
        <RecordingConsent
          onConsent={handleRecordingConsent}
          onDeny={() => setShowConsentDialog(false)}
        />
      )}
    </Box>
  );
};

export default VideoRoom; 