import React, { useRef, useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  Grid, 
  Typography, 
  useTheme, 
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  AppBar,
  Toolbar
} from '@mui/material';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import SettingsIcon from '@mui/icons-material/Settings';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { VideoConsultationProps } from '../types/videoConsultation';
import { useVideoConsultation } from '../hooks/useVideoConsultation';

interface VideoStreamProps {
  stream: MediaStream;
  isLocal?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

const videoQualitySettings = {
  low: { width: 640, height: 480, frameRate: 15 },
  medium: { width: 1280, height: 720, frameRate: 30 },
  high: { width: 1920, height: 1080, frameRate: 30 }
};

const VideoStream: React.FC<VideoStreamProps> = ({ stream, isLocal = false, quality = 'medium' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      if (stream.getVideoTracks().length > 0) {
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoQualitySettings[quality];
        videoTrack.applyConstraints({
          width: { ideal: settings.width },
          height: { ideal: settings.height },
          frameRate: { ideal: settings.frameRate }
        });
      }
    }
  }, [stream, quality]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: isLocal ? (isMobile ? '150px' : '200px') : (isMobile ? '300px' : '500px'),
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
          objectFit: 'contain',
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

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

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
    setVideoQuality(quality);
    handleSettingsClose();
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <AppBar position="fixed" color="transparent" sx={{ top: 'auto', bottom: 0, bgcolor: 'background.paper' }}>
        <Toolbar sx={{ justifyContent: 'center', gap: 2 }}>
          <IconButton onClick={toggleVideo} color={isVideoEnabled ? 'primary' : 'error'}>
            {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
          <IconButton onClick={toggleAudio} color={isAudioEnabled ? 'primary' : 'error'}>
            {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
          <Button
            variant="contained"
            startIcon={isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            size={isMobile ? 'small' : 'medium'}
          >
            {isScreenSharing ? 'Stop' : 'Share'}
          </Button>
          <Button
            variant="contained"
            color={isRecording ? 'error' : 'primary'}
            startIcon={isRecording ? <StopIcon /> : <FiberManualRecordIcon />}
            onClick={isRecording ? stopRecording : startRecording}
            size={isMobile ? 'small' : 'medium'}
          >
            {isRecording ? 'Stop' : 'Rec'}
          </Button>
          <IconButton onClick={handleSettingsClick}>
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleSettingsClose}
      >
        <MenuItem onClick={() => handleQualityChange('low')}>Low Quality</MenuItem>
        <MenuItem onClick={() => handleQualityChange('medium')}>Medium Quality</MenuItem>
        <MenuItem onClick={() => handleQualityChange('high')}>High Quality</MenuItem>
      </Menu>

      <Grid container spacing={2} sx={{ mb: 8 }}>
        <Grid item xs={12} md={isHost ? 8 : 12}>
          <Grid container spacing={2}>
            {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
              <Grid item xs={12} key={peerId}>
                <VideoStream stream={stream} quality={videoQuality} />
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} md={isHost ? 4 : 12}>
          {localStream && <VideoStream stream={localStream} isLocal={true} quality={videoQuality} />}
          {screenShare && (
            <Box sx={{ mt: 2 }}>
              <VideoStream stream={screenShare} quality={videoQuality} />
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}; 