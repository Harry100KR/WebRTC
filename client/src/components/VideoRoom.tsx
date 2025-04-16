import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import io, { Socket } from 'socket.io-client';
import { Box, Button, Grid, Typography, Paper, Divider, Alert, Snackbar } from '@mui/material';
import RecordingConsent from './RecordingConsent';
import useRecording from '../hooks/useRecording';
import ScreenShare from './ScreenShare/ScreenShare';
import Recording from './Recording/Recording';
import FinancialInteraction from './FinancialInteraction';

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
  from?: string;
}

interface RecordingData {
  type: 'video' | 'screen' | 'both';
  includeFinancialData: boolean;
}

interface AnnotationData {
  id: string;
  userId: string;
  roomId: string;
  content: string;
  position: { x: number, y: number };
  timestamp: number;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ socket, roomId, userId, role }) => {
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
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
        showSnackbar('Recording saved successfully', 'success');
      } catch (error) {
        console.error('Failed to upload recording:', error);
        showSnackbar('Failed to save recording', 'error');
      }
    }
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setStream(mediaStream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Failed to get media devices:', error);
        showSnackbar('Failed to access camera/microphone', 'error');
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
  }, []);

  useEffect(() => {
    if (!stream) return;

    // Set up peer connection with ICE server configuration
    const peerOptions: SimplePeer.Options = {
      initiator: role === 'counselor',
      stream,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    };

    const peerInstance = new SimplePeer(peerOptions);

    peerInstance.on('signal', (data: SimplePeer.SignalData) => {
      socket.emit('signal', { signal: data, roomId });
    });

    peerInstance.on('connect', () => {
      setConnectionStatus('connected');
      showSnackbar('Connected to remote peer', 'success');
    });

    peerInstance.on('stream', (remoteStream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    peerInstance.on('error', (err) => {
      console.error('Peer connection error:', err);
      setConnectionStatus('disconnected');
      showSnackbar('Connection error', 'error');
    });

    peerInstance.on('close', () => {
      setConnectionStatus('disconnected');
      showSnackbar('Connection closed', 'info');
    });

    socket.on('signal', ({ signal, from }: SignalData) => {
      if (from) {
        setRemoteUserId(from);
      }
      peerInstance.signal(signal);
    });

    socket.on('user-connected', (data: {userId: string}) => {
      showSnackbar('Remote user connected', 'info');
      setRemoteUserId(data.userId);
    });

    socket.on('user-disconnected', () => {
      showSnackbar('Remote user disconnected', 'info');
      setRemoteUserId(null);
    });

    socket.on('recording-consent-response', (response: {approved: boolean, type: string}) => {
      if (response.approved) {
        setIsRecording(true);
        startRecording();
        showSnackbar('Recording started with consent', 'success');
      } else {
        showSnackbar('Recording consent denied', 'error');
      }
    });

    socket.on('annotation-added', (data: AnnotationData) => {
      showSnackbar('New annotation added', 'info');
    });

    setPeer(peerInstance);

    return () => {
      peerInstance.destroy();
      socket.off('signal');
      socket.off('user-connected');
      socket.off('user-disconnected');
      socket.off('recording-consent-response');
      socket.off('annotation-added');
    };
  }, [stream, socket, roomId, role, startRecording]);

  const handleScreenShare = (stream: MediaStream | null) => {
    setScreenStream(stream);
    
    if (stream && screenShareRef.current) {
      screenShareRef.current.srcObject = stream;
      socket.emit('screen-share-started', roomId);
    } else if (!stream) {
      socket.emit('screen-share-stopped', roomId);
    }
  };

  const handleStartRecording = () => {
    if (role === 'counselor') {
      setShowConsentDialog(true);
    }
  };

  const handleRecordingConsent = async (type: 'video' | 'screen' | 'both', includeFinancialData: boolean = false) => {
    setShowConsentDialog(false);
    try {
      const response = await fetch('/api/recordings/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: roomId, 
          type,
          includeFinancialData
        })
      });

      if (response.ok) {
        setIsRecording(true);
        startRecording();
        showSnackbar('Recording started', 'success');
      }
    } catch (error) {
      console.error('Failed to get recording consent:', error);
      showSnackbar('Failed to start recording', 'error');
    }
  };

  const handleRecordingComplete = async (blob: Blob, type: string) => {
    const formData = new FormData();
    formData.append('recording', blob);
    formData.append('sessionId', roomId);
    formData.append('type', type);

    try {
      await fetch('/api/recordings/upload', {
        method: 'POST',
        body: formData,
      });
      showSnackbar(`${type} recording saved successfully`, 'success');
    } catch (error) {
      console.error('Failed to upload recording:', error);
      showSnackbar('Failed to save recording', 'error');
    }
  };

  const handleSaveAnnotation = (annotation: any) => {
    socket.emit('add-annotation', {
      ...annotation,
      roomId,
      userId
    });
    showSnackbar('Annotation saved', 'success');
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    
    // Notify other user about the product selection
    socket.emit('product-selected', {
      roomId,
      productId: product.id,
      productData: product
    });
    
    showSnackbar(`Product ${product.name} selected for discussion`, 'info');
  };

  const handleScreenShareRequest = () => {
    // Launch screen sharing when requested from FinancialInteraction component
    navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })
    .then(stream => {
      handleScreenShare(stream);
    })
    .catch(error => {
      console.error('Error requesting screen share:', error);
      showSnackbar('Failed to start screen sharing', 'error');
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Connection status */}
        <Grid item xs={12}>
          <Alert 
            severity={
              connectionStatus === 'connected' ? 'success' : 
              connectionStatus === 'connecting' ? 'info' : 'error'
            }
            sx={{ mb: 2 }}
          >
            {connectionStatus === 'connected' && 'Connected to remote user'}
            {connectionStatus === 'connecting' && 'Connecting to remote user...'}
            {connectionStatus === 'disconnected' && 'Disconnected from remote user'}
          </Alert>
        </Grid>
        
        {/* Video streams */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Video Conference</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ position: 'relative', height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {role === 'counselor' ? 'You (Advisor)' : 'You (Client)'}
                  </Typography>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%', // 16:9 aspect ratio
                      backgroundColor: '#f0f0f0',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <Box 
                      sx={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      {role === 'counselor' ? 'Advisor' : 'Client'}
                    </Box>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ position: 'relative', height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {role === 'counselor' ? 'Client' : 'Financial Advisor'}
                  </Typography>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%', // 16:9 aspect ratio
                      backgroundColor: '#f0f0f0',
                      borderRadius: 1,
                      overflow: 'hidden',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {!remoteUserId && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        Waiting for remote user...
                      </Typography>
                    )}
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: remoteUserId ? 'block' : 'none'
                      }}
                    />
                    <Box 
                      sx={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      {role === 'counselor' ? 'Client' : 'Advisor'}
                    </Box>
                  </Box>
                </Box>
              </Grid>
              
              {screenStream && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Screen Share</Typography>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      width: '100%',
                      paddingTop: '42.85%', // 21:9 aspect ratio for screen share
                      backgroundColor: '#f0f0f0',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <video
                      ref={screenShareRef}
                      autoPlay
                      muted
                      playsInline
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
        
        {/* Financial interaction */}
        <Grid item xs={12} md={4}>
          <FinancialInteraction 
            sessionId={roomId}
            userId={userId}
            role={role}
            product={selectedProduct}
            onScreenShareRequest={handleScreenShareRequest}
            onSaveAnnotation={handleSaveAnnotation}
          />
        </Grid>
        
        {/* Controls */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Screen Sharing</Typography>
                  <ScreenShare 
                    onScreenStream={handleScreenShare} 
                    peer={peer}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Recording</Typography>
                  <Recording 
                    stream={stream}
                    screenStream={screenStream}
                    onComplete={handleRecordingComplete}
                    sessionId={roomId}
                    includeFinancialData={!!selectedProduct}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {showConsentDialog && (
        <RecordingConsent
          onConsent={handleRecordingConsent}
          onDeny={() => setShowConsentDialog(false)}
        />
      )}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VideoRoom; 