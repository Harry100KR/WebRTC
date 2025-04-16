import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Button, Typography, CircularProgress, 
         FormControl, Select, MenuItem, InputLabel, 
         Chip, Stack, Dialog, DialogTitle, 
         DialogContent, DialogActions } from '@mui/material';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import StopIcon from '@mui/icons-material/Stop';
import InfoIcon from '@mui/icons-material/Info';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import RecordRTC, { RecordRTCPromisesHandler } from 'recordrtc';

interface RecordingProps {
  stream: MediaStream | null;
  screenStream?: MediaStream | null;
  onComplete?: (blob: Blob, type: string) => void;
  sessionId?: string;
  includeFinancialData?: boolean;
}

type RecordingMode = 'video' | 'audio' | 'screen' | 'composite';

interface RecordingOptions {
  mimeType: string;
  bitsPerSecond: number;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  frameRate?: number;
}

const Recording: React.FC<RecordingProps> = ({ 
  stream, 
  screenStream,
  onComplete,
  sessionId,
  includeFinancialData = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('composite');
  const [isUploading, setIsUploading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [recordings, setRecordings] = useState<{id: string, name: string, url: string, type: string}[]>([]);
  
  const recorderRef = useRef<RecordRTCPromisesHandler | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingCountRef = useRef(1);

  const getRecordingOptions = useCallback((): RecordingOptions => {
    const baseOptions = {
      audioBitsPerSecond: 128000
    };

    switch(recordingMode) {
      case 'audio':
        return {
          ...baseOptions,
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 128000
        };
      case 'screen':
        return {
          ...baseOptions,
          mimeType: 'video/webm;codecs=vp9',
          bitsPerSecond: 6000000,
          videoBitsPerSecond: 5000000,
          frameRate: 30
        };
      case 'composite':
        return {
          ...baseOptions,
          mimeType: 'video/webm;codecs=vp9',
          bitsPerSecond: 8000000,
          videoBitsPerSecond: 7000000,
          frameRate: 30
        };
      case 'video':
      default:
        return {
          ...baseOptions,
          mimeType: 'video/webm;codecs=vp9',
          bitsPerSecond: 4000000,
          videoBitsPerSecond: 3000000,
          frameRate: 30
        };
    }
  }, [recordingMode]);

  // Update available recording modes based on streams
  useEffect(() => {
    if (!stream && recordingMode !== 'screen') {
      setRecordingMode('screen');
    } else if (!screenStream && recordingMode === 'screen') {
      setRecordingMode('video');
    }
  }, [stream, screenStream, recordingMode]);

  const startRecording = useCallback(async () => {
    if ((!stream && recordingMode !== 'screen') || (!screenStream && recordingMode === 'screen')) {
      console.error('Required streams not available for the selected recording mode');
      return;
    }

    try {
      let recordingStream: MediaStream;
      
      // Determine which stream to record based on mode
      if (recordingMode === 'audio') {
        recordingStream = new MediaStream(stream!.getAudioTracks());
      } else if (recordingMode === 'screen') {
        recordingStream = screenStream!;
      } else if (recordingMode === 'composite' && stream && screenStream) {
        // Combine video/audio from webcam with screen share
        const tracks = [
          ...screenStream.getVideoTracks(),
          ...stream.getAudioTracks()
        ];
        
        if (includeFinancialData) {
          // If financial data should be included, also add webcam video 
          // (picture-in-picture will be handled by RecordRTC)
          tracks.push(...stream.getVideoTracks());
        }
        
        recordingStream = new MediaStream(tracks);
      } else {
        // Default to webcam
        recordingStream = stream!;
      }

      const options = getRecordingOptions();
      const recorder = new RecordRTCPromisesHandler(recordingStream, options);

      await recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [stream, screenStream, recordingMode, includeFinancialData, getRecordingOptions]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    try {
      await recorderRef.current.stopRecording();
      const blob = await recorderRef.current.getBlob();
      
      // Store recording
      const recordingName = `counseling-session-${recordingMode}-${recordingCountRef.current}`;
      const url = URL.createObjectURL(blob);
      
      setRecordings(prev => [
        ...prev, 
        {
          id: `rec-${Date.now()}`, 
          name: recordingName, 
          url, 
          type: recordingMode
        }
      ]);
      
      recordingCountRef.current += 1;
      
      // Process completed recording
      if (onComplete) {
        onComplete(blob, recordingMode);
      }
      
      // If session ID is provided, upload recording
      if (sessionId) {
        await uploadRecording(blob, recordingMode);
      }
      
      // Cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsRecording(false);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }, [onComplete, recordingMode, sessionId]);

  const uploadRecording = async (blob: Blob, type: string) => {
    if (!sessionId) return;
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('recording', blob, `${type}-recording.webm`);
      formData.append('sessionId', sessionId);
      formData.append('type', type);
      formData.append('includeFinancialData', String(includeFinancialData));
      
      const response = await fetch('/api/recordings/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      setIsUploading(false);
    } catch (error) {
      console.error('Failed to upload recording:', error);
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadRecording = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.webm`;
    a.click();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {!isRecording && (
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel id="recording-mode-label">Recording Mode</InputLabel>
            <Select
              labelId="recording-mode-label"
              id="recording-mode"
              value={recordingMode}
              label="Recording Mode"
              onChange={(e) => setRecordingMode(e.target.value as RecordingMode)}
              disabled={isRecording}
            >
              {stream && <MenuItem value="video">Video + Audio</MenuItem>}
              {stream && <MenuItem value="audio">Audio Only</MenuItem>}
              {screenStream && <MenuItem value="screen">Screen Only</MenuItem>}
              {stream && screenStream && <MenuItem value="composite">Screen + Audio</MenuItem>}
            </Select>
          </FormControl>
        )}
        
        <Button
          variant="contained"
          color={isRecording ? 'error' : 'primary'}
          startIcon={isRecording ? 
            <StopIcon /> : 
            recordingMode === 'audio' ? <RecordVoiceOverIcon /> : <FiberManualRecordIcon />
          }
          onClick={isRecording ? stopRecording : startRecording}
          disabled={
            (recordingMode !== 'screen' && !stream) || 
            (recordingMode === 'screen' && !screenStream) ||
            isUploading
          }
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        
        {isRecording && (
          <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center' }}>
            <FiberManualRecordIcon sx={{ mr: 0.5, animation: 'pulse 1.5s infinite' }} fontSize="small" />
            Recording: {formatTime(recordingTime)}
          </Typography>
        )}
        
        {isUploading && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Uploading...</Typography>
          </Box>
        )}
        
        {recordings.length > 0 && (
          <Button 
            variant="outlined"
            color="info"
            startIcon={<InfoIcon />}
            onClick={() => setShowDialog(true)}
            size="small"
          >
            Recordings ({recordings.length})
          </Button>
        )}
      </Box>

      {/* Recordings list dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Session Recordings</DialogTitle>
        <DialogContent>
          {recordings.length === 0 ? (
            <Typography>No recordings available</Typography>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {recordings.map((recording) => (
                <Box 
                  key={recording.id} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      {recording.name}
                    </Typography>
                    <Chip 
                      label={recording.type} 
                      size="small" 
                      color={
                        recording.type === 'video' ? 'primary' : 
                        recording.type === 'audio' ? 'secondary' :
                        recording.type === 'screen' ? 'success' : 'info'
                      }
                    />
                  </Box>
                  <Button 
                    size="small" 
                    onClick={() => downloadRecording(recording.url, recording.name)}
                  >
                    Download
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
          }
        `
      }} />
    </Box>
  );
};

export default Recording; 