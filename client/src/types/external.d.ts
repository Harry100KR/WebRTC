declare module 'recordrtc' {
  export interface RecordRTCOptions {
    type?: string;
    mimeType?: string;
    bitsPerSecond?: number;
    [key: string]: any;
  }

  export class RecordRTCPromisesHandler {
    constructor(stream: MediaStream, options?: RecordRTCOptions);
    startRecording(): Promise<void>;
    stopRecording(): Promise<void>;
    getBlob(): Promise<Blob>;
  }

  const RecordRTC: {
    RecordRTCPromisesHandler: typeof RecordRTCPromisesHandler;
  };

  export default RecordRTC;
}

// Add other module declarations as needed 