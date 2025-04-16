import React, { useRef, useEffect } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import { VideoConsultationProps } from '../types/videoConsultation';
import { useVideoConsultation } from '../hooks/useVideoConsultation';

interface VideoStreamProps {
  stream: MediaStream;
  isLocal?: boolean;
}

const VideoStream: React.FC<VideoStreamProps> = ({ stream, isLocal = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: isLocal ? '200px' : '400px',
        backgroundColor: '#000',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {isLocal && (
        <Typography
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '2px 8px',
            borderRadius: 1,
          }}
        >
          You
        </Typography>
      )}
    </Box>
  );
};

export const VideoConsultation: React.FC<VideoConsultationProps> = ({
  roomId,
  userId,
  isHost = false,
}) => {
  const {
    localStream,
    remoteStreams,
    screenShare,
    isScreenSharing,
    isRecording,
    error,
    startScreenShare,
    stopScreenShare,
    startRecording,
    stopRecording,
  } = useVideoConsultation(roomId, userId);

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={isHost ? 8 : 12}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            >
              {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
            </Button>
            <Button
              variant="contained"
              color={isRecording ? 'error' : 'primary'}
              startIcon={isRecording ? <StopIcon /> : <FiberManualRecordIcon />}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? 'Stop Recording' : 'Record'}
            </Button>
          </Box>

          <Grid container spacing={2}>
            {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
              <Grid item xs={12} key={peerId}>
                <VideoStream stream={stream} />
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} md={isHost ? 4 : 12}>
          {localStream && <VideoStream stream={localStream} isLocal={true} />}
          {screenShare && <VideoStream stream={screenShare} />}
        </Grid>
      </Grid>
    </Box>
  );
}; 