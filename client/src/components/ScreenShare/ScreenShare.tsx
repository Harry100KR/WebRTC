import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Button, Typography, Menu, MenuItem, Tooltip, IconButton } from '@mui/material';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import SettingsIcon from '@mui/icons-material/Settings';
import VideocamIcon from '@mui/icons-material/Videocam';

interface ScreenShareProps {
  onScreenStream: (stream: MediaStream | null) => void;
  peer?: any; // SimplePeer instance for direct adding of track
}

const ScreenShare: React.FC<ScreenShareProps> = ({ onScreenStream, peer }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [shareType, setShareType] = useState<'screen' | 'window' | 'tab'>('screen');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSettings, setVideoSettings] = useState({
    frameRate: 30,
    displaySurface: 'monitor',
    logicalSurface: true,
    cursor: 'always',
    resolution: 'default'
  });

  // Handle screen preview
  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  const updateVideoSettings = (setting: string, value: any) => {
    setVideoSettings({
      ...videoSettings,
      [setting]: value
    });
    handleSettingsClose();
  };

  const getDisplayMediaOptions = () => {
    // Build options based on current settings
    const resolutionMap: Record<string, { width: number, height: number }> = {
      'default': { width: 1920, height: 1080 },
      'hd': { width: 1280, height: 720 },
      'sd': { width: 640, height: 480 }
    };

    return {
      video: {
        frameRate: videoSettings.frameRate,
        width: resolutionMap[videoSettings.resolution].width,
        height: resolutionMap[videoSettings.resolution].height,
        cursor: videoSettings.cursor,
        displaySurface: videoSettings.displaySurface,
        logicalSurface: videoSettings.logicalSurface,
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
  };

  const startScreenShare = useCallback(async () => {
    try {
      const displayMediaOptions = getDisplayMediaOptions();
      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      
      setScreenStream(stream);
      setIsSharing(true);
      onScreenStream(stream);

      // Add to peer connection if peer exists
      if (peer && peer.connected) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          peer.addTrack(videoTrack, stream);
        }
      }

      // Handle stream stop
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  }, [onScreenStream, peer, videoSettings]);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        // If we added this track to the peer, remove it
        if (peer && peer.connected) {
          peer.removeTrack(track, screenStream);
        }
        track.stop();
      });
      setScreenStream(null);
      setIsSharing(false);
      onScreenStream(null);
    }
  }, [screenStream, onScreenStream, peer]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          color={isSharing ? 'error' : 'primary'}
          startIcon={isSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          onClick={isSharing ? stopScreenShare : startScreenShare}
        >
          {isSharing ? 'Stop Sharing' : 'Share Screen'}
        </Button>
        
        <Tooltip title="Screen sharing settings">
          <IconButton onClick={handleSettingsClick} color="primary">
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleSettingsClose}
        >
          <MenuItem disabled>Quality Settings</MenuItem>
          <MenuItem onClick={() => updateVideoSettings('resolution', 'default')}>
            {videoSettings.resolution === 'default' ? '✓ ' : ''}Full HD (1080p)
          </MenuItem>
          <MenuItem onClick={() => updateVideoSettings('resolution', 'hd')}>
            {videoSettings.resolution === 'hd' ? '✓ ' : ''}HD (720p)
          </MenuItem>
          <MenuItem onClick={() => updateVideoSettings('resolution', 'sd')}>
            {videoSettings.resolution === 'sd' ? '✓ ' : ''}SD (480p)
          </MenuItem>
          <MenuItem disabled>Frame Rate</MenuItem>
          <MenuItem onClick={() => updateVideoSettings('frameRate', 15)}>
            {videoSettings.frameRate === 15 ? '✓ ' : ''}15 fps (Low)
          </MenuItem>
          <MenuItem onClick={() => updateVideoSettings('frameRate', 30)}>
            {videoSettings.frameRate === 30 ? '✓ ' : ''}30 fps (Medium)
          </MenuItem>
          <MenuItem onClick={() => updateVideoSettings('frameRate', 60)}>
            {videoSettings.frameRate === 60 ? '✓ ' : ''}60 fps (High)
          </MenuItem>
          <MenuItem disabled>Cursor</MenuItem>
          <MenuItem onClick={() => updateVideoSettings('cursor', 'always')}>
            {videoSettings.cursor === 'always' ? '✓ ' : ''}Always show cursor
          </MenuItem>
          <MenuItem onClick={() => updateVideoSettings('cursor', 'motion')}>
            {videoSettings.cursor === 'motion' ? '✓ ' : ''}Show cursor on motion
          </MenuItem>
          <MenuItem onClick={() => updateVideoSettings('cursor', 'never')}>
            {videoSettings.cursor === 'never' ? '✓ ' : ''}Never show cursor
          </MenuItem>
        </Menu>
      </Box>
      
      {isSharing && (
        <Box sx={{ mt: 2, width: '100%', maxWidth: '400px' }}>
          <Typography variant="body2" color="success.main" gutterBottom>
            Screen sharing is active
          </Typography>
          <Box 
            sx={{ 
              border: '1px solid #ccc', 
              borderRadius: 1,
              overflow: 'hidden',
              height: '150px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#f5f5f5'
            }}
          >
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ScreenShare; 