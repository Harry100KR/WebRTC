interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

// Optimized video constraints for different network conditions
export const videoConstraints = {
  low: {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { max: 15 }
    },
    audio: true
  },
  medium: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { max: 30 }
    },
    audio: true
  },
  high: {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { max: 30 }
    },
    audio: true
  }
};

// WebRTC configuration with TURN servers
export const peerConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: process.env.REACT_APP_TURN_URL,
      username: process.env.REACT_APP_TURN_USERNAME,
      credential: process.env.REACT_APP_TURN_CREDENTIAL
    }
  ],
  iceCandidatePoolSize: 10,
};

// Media stream quality adjustment based on network conditions
export class MediaQualityManager {
  private static instance: MediaQualityManager;
  private currentQuality: keyof typeof videoConstraints = 'medium';
  private stream: MediaStream | null = null;

  private constructor() {}

  static getInstance(): MediaQualityManager {
    if (!MediaQualityManager.instance) {
      MediaQualityManager.instance = new MediaQualityManager();
    }
    return MediaQualityManager.instance;
  }

  async getMediaStream(quality: keyof typeof videoConstraints = 'medium'): Promise<MediaStream> {
    try {
      this.currentQuality = quality;
      const constraints = videoConstraints[quality];
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async adjustQualityForBandwidth(bandwidth: number): Promise<void> {
    let newQuality: keyof typeof videoConstraints;
    
    if (bandwidth < 500000) { // 500 Kbps
      newQuality = 'low';
    } else if (bandwidth < 1500000) { // 1.5 Mbps
      newQuality = 'medium';
    } else {
      newQuality = 'high';
    }

    if (newQuality !== this.currentQuality && this.stream) {
      const newStream = await this.getMediaStream(newQuality);
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = newStream;
    }
  }

  // Enable hardware acceleration when available
  async enableHardwareAcceleration(): Promise<void> {
    if (this.stream) {
      const videoTrack = this.stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ hardwareAcceleration: true }]
          });
        } catch (error) {
          console.warn('Hardware acceleration not supported:', error);
        }
      }
    }
  }

  // Implement echo cancellation and noise suppression
  async enableAudioOptimization(): Promise<void> {
    if (this.stream) {
      const audioTrack = this.stream.getAudioTracks()[0];
      if (audioTrack) {
        try {
          await audioTrack.applyConstraints({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          });
        } catch (error) {
          console.warn('Audio optimization not fully supported:', error);
        }
      }
    }
  }
}

// Image optimization utilities
export const imageOptimization = {
  async compressImage(file: File, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920;
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Blob creation failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Image loading failed'));
      };
      reader.onerror = () => reject(new Error('File reading failed'));
    });
  },

  // Create optimized thumbnails for preview
  async createThumbnail(file: File, maxDimension: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => reject(new Error('Image loading failed'));
      };
      reader.onerror = () => reject(new Error('File reading failed'));
    });
  }
}; 