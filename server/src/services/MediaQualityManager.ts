import winston from 'winston';
import { webRTCConfig } from '../config/webrtc.config';

// WebRTC type definitions
interface RTCStatsReport {
  forEach(callbackfn: (value: RTCStats) => void): void;
}

interface RTCStats {
  type: string;
  roundTripTime?: number;
  packetsLost?: number;
  jitter?: number;
}

interface MediaStream {
  getVideoTracks(): MediaStreamTrack[];
}

interface MediaStreamTrack {
  applyConstraints(constraints: MediaTrackConstraints): Promise<void>;
}

interface MediaTrackConstraints {
  width: { min: number; ideal: number; max: number };
  height: { min: number; ideal: number; max: number };
  frameRate: { min: number; ideal: number; max: number };
  facingMode: string;
}

export type NetworkQuality = 'high' | 'medium' | 'low';
export type MediaQualityProfile = {
  video: {
    width: { min: number; ideal: number; max: number };
    height: { min: number; ideal: number; max: number };
    frameRate: { min: number; ideal: number; max: number };
    facingMode: string;
  };
  audio: {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    sampleRate: number;
    channelCount: number;
  };
};

export class MediaQualityManager {
  private logger: winston.Logger;
  private qualityProfiles: Map<NetworkQuality, MediaQualityProfile>;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.qualityProfiles = new Map();
    this.initializeQualityProfiles();
  }

  private initializeQualityProfiles(): void {
    // High quality profile (from config)
    this.qualityProfiles.set('high', webRTCConfig.mediaConstraints);

    // Medium quality profile
    this.qualityProfiles.set('medium', {
      video: {
        width: { min: 480, ideal: 640, max: 1280 },
        height: { min: 360, ideal: 480, max: 720 },
        frameRate: { min: 15, ideal: 24, max: 30 },
        facingMode: 'user'
      },
      audio: {
        ...webRTCConfig.mediaConstraints.audio,
        sampleRate: 44100
      }
    });

    // Low quality profile
    this.qualityProfiles.set('low', {
      video: {
        width: { min: 320, ideal: 480, max: 640 },
        height: { min: 240, ideal: 360, max: 480 },
        frameRate: { min: 10, ideal: 15, max: 24 },
        facingMode: 'user'
      },
      audio: {
        ...webRTCConfig.mediaConstraints.audio,
        sampleRate: 22050,
        channelCount: 1
      }
    });
  }

  public getQualityProfile(quality: NetworkQuality): MediaQualityProfile {
    return this.qualityProfiles.get(quality) || this.qualityProfiles.get('medium')!;
  }

  public determineNetworkQuality(stats: RTCStatsReport): NetworkQuality {
    try {
      // Extract relevant metrics from stats
      const { roundTripTime, packetsLost, jitter } = this.extractNetworkMetrics(stats);

      // Determine quality based on metrics
      if (roundTripTime < 100 && packetsLost < 0.1 && jitter < 30) {
        return 'high';
      } else if (roundTripTime < 300 && packetsLost < 0.5 && jitter < 50) {
        return 'medium';
      } else {
        return 'low';
      }
    } catch (error) {
      this.logger.error('Error determining network quality:', error);
      return 'medium'; // Default to medium quality on error
    }
  }

  private extractNetworkMetrics(stats: RTCStatsReport): { 
    roundTripTime: number; 
    packetsLost: number; 
    jitter: number 
  } {
    // Default values
    const metrics = {
      roundTripTime: 0,
      packetsLost: 0,
      jitter: 0
    };

    // Extract metrics from stats report
    stats.forEach(stat => {
      if (stat.type === 'remote-inbound-rtp') {
        metrics.roundTripTime = stat.roundTripTime || 0;
        metrics.packetsLost = stat.packetsLost || 0;
        metrics.jitter = stat.jitter || 0;
      }
    });

    return metrics;
  }

  public async applyQualityProfile(stream: MediaStream, quality: NetworkQuality): Promise<void> {
    const profile = this.getQualityProfile(quality);
    const videoTrack = stream.getVideoTracks()[0];
    
    if (videoTrack) {
      try {
        await videoTrack.applyConstraints(profile.video);
        this.logger.info(`Applied ${quality} quality profile to video track`);
      } catch (error) {
        this.logger.error('Failed to apply video constraints:', error);
      }
    }
  }
} 