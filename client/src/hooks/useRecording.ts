import React, { useRef, useCallback, useState } from 'react';

interface RecordingProps {
  stream: MediaStream | null;
  screenStream?: MediaStream | null;
  onRecordingComplete: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

interface RecordingState {
  isRecording: boolean;
  error: Error | null;
}

const useRecording = ({ 
  stream, 
  screenStream, 
  onRecordingComplete,
  onError 
}: RecordingProps) => {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    error: null
  });

  const startRecording = useCallback(() => {
    if (!stream) {
      const error = new Error('No media stream available');
      setState((prev: RecordingState) => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    try {
      let recordStream = stream;

      // If screen sharing is active, combine both streams
      if (screenStream) {
        const tracks = [...stream.getTracks(), ...screenStream.getTracks()];
        recordStream = new MediaStream(tracks);
      }

      // Check for supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      // Configure MediaRecorder with optimal settings for counseling sessions
      mediaRecorder.current = new MediaRecorder(recordStream, {
        mimeType,
        videoBitsPerSecond: 3000000, // 3 Mbps for good quality
        audioBitsPerSecond: 128000    // 128 kbps for clear audio
      });

      mediaRecorder.current.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const recordedBlob = new Blob(chunks.current, {
          type: mimeType
        });
        onRecordingComplete(recordedBlob);
        chunks.current = [];
        setState((prev: RecordingState) => ({ ...prev, isRecording: false }));
      };

      mediaRecorder.current.onerror = (event: Event) => {
        const error = new Error('Recording failed: ' + (event as any).error?.message || 'Unknown error');
        setState((prev: RecordingState) => ({ ...prev, error, isRecording: false }));
        onError?.(error);
      };

      // Create chunks every second for better handling of large recordings
      mediaRecorder.current.start(1000);
      setState((prev: RecordingState) => ({ ...prev, isRecording: true, error: null }));
    } catch (error) {
      const recordingError = error instanceof Error ? error : new Error('Failed to start recording');
      setState((prev: RecordingState) => ({ ...prev, error: recordingError }));
      onError?.(recordingError);
    }
  }, [stream, screenStream, onRecordingComplete, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
    }
  }, []);

  return {
    startRecording,
    stopRecording,
    isRecording: state.isRecording,
    error: state.error
  };
};

export default useRecording; 