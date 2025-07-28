
// src/lib/SoundEffects.ts
type SoundName = 
  | 'button-click' 
  | 'success' 
  | 'error' 
  | 'game-start' 
  | 'card-place' 
  | 'card-success' 
  | 'card-error' 
  | 'game-victory';

export class SoundEffects {
  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundName, AudioBuffer> = new Map();
  private initialized = false;
  private static instance: SoundEffects;

  private constructor() {
    // Private constructor for singleton pattern
    this.init();
  }

  public static getInstance(): SoundEffects {
    if (!SoundEffects.instance) {
      SoundEffects.instance = new SoundEffects();
    }
    return SoundEffects.instance;
  }

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;

    try {
      const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      this.audioContext = AudioContextConstructor ? new AudioContextConstructor() : null;
      this.initialized = true;
      console.log('🎵 Audio system initialized');
      
      // Preload essential sounds with better error handling
      this.preloadSounds();
    } catch (error) {
      console.warn('Audio system initialization failed, using fallback sounds:', error);
    }
  }

  private async preloadSounds(): Promise<void> {
    const soundManifest: Record<SoundName, string> = {
      'button-click': '/sounds/button-click.mp3',
      'success': '/sounds/correct.mp3',
      'error': '/sounds/incorrect.mp3',
      'game-start': '/sounds/game-start.mp3',
      'card-place': '/sounds/card-place.mp3',
      'card-success': '/sounds/correct.mp3',
      'card-error': '/sounds/incorrect.mp3',
      'game-victory': '/sounds/victory.mp3'
    };

    const loadPromises = Object.entries(soundManifest).map(async ([name, url]) => {
      try {
        await this.loadSound(name as SoundName, url);
        console.log(`✅ Loaded sound: ${name}`);
      } catch (error) {
        console.warn(`⚠️ Failed to load sound "${name}":`, error);
      }
    });

    try {
      await Promise.allSettled(loadPromises);
      console.log('🎵 Audio preloading completed');
    } catch (error) {
      console.warn('Some audio files could not be loaded, fallback sounds will be used:', error);
    }
  }

  public async loadSound(name: SoundName, url: string): Promise<void> {
    if (!this.audioContext) {
      console.warn('AudioContext not initialized - cannot load sound');
      return;
    }

    try {
      // Use fetch with proper headers and error handling
      const response = await fetch(url, { 
        method: 'GET',
        headers: {
          'Accept': 'audio/mpeg, audio/wav, audio/*',
        },
        credentials: 'omit',
        cache: 'force-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.startsWith('audio/')) {
        console.warn(`Unexpected content type for ${name}: ${contentType}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      // Validate buffer is not empty
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty audio buffer received');
      }

      // Resume audio context if suspended (required for mobile browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
      
    } catch (error) {
      console.warn(`Could not load audio file "${name}":`, error);
      // Don't throw - allow fallback sounds to be used
    }
  }

  public async playSound(name: SoundName): Promise<void> {
    if (!this.initialized || !this.audioContext) {
      console.warn(`🎵 Audio system not ready, using fallback sound for ${name}`);
      return this.playFallback(name);
    }

    // Resume context if suspended (required for mobile browsers)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Audio context resume failed, using fallback sound:', error);
        return this.playFallback(name);
      }
    }

    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`🎵 Audio file "${name}" not available, using fallback sound`);
      return this.playFallback(name);
    }

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = sound;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Set volume based on sound type
      gainNode.gain.value = this.getVolumeForSound(name);
      
      source.start(0);
      
      // Clean up after playback
      source.addEventListener('ended', () => {
        source.disconnect();
        gainNode.disconnect();
      });
    } catch (error) {
      console.warn(`Failed to play audio "${name}", using fallback sound:`, error);
      this.playFallback(name);
    }
  }

  public stopAllSounds(): void {
    if (!this.audioContext) return;
    
    // This will stop all ongoing sounds by suspending the context
    this.audioContext.suspend().catch(error => {
      console.warn('Could not stop audio playback:', error);
    });
  }

  private getVolumeForSound(name: SoundName): number {
    const volumes: Record<SoundName, number> = {
      'button-click': 0.3,
      'success': 0.4,
      'error': 0.4,
      'game-start': 0.5,
      'card-place': 0.3,
      'card-success': 0.5,
      'card-error': 0.5,
      'game-victory': 0.6
    };
    return volumes[name] || 0.5;
  }

  private async playFallback(name: SoundName): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Resume context if needed
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      // Different fallback tones for different sound types
      switch (name) {
        case 'error':
        case 'card-error':
          oscillator.type = 'sawtooth';
          oscillator.frequency.value = 300;
          break;
        case 'success':
        case 'card-success':
          oscillator.type = 'triangle';
          oscillator.frequency.value = 800;
          break;
        case 'game-victory':
          this.playFallbackSequence();
          return;
        default:
          oscillator.type = 'sine';
          oscillator.frequency.value = 500;
      }
      
      gain.gain.value = 0.1;
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Fallback sound generation failed:', error);
    }
  }

  private playFallbackSequence(): void {
    if (!this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      oscillator.type = 'sine';
      gain.gain.value = 0.1;
      
      // Create a simple victory melody
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.2); // E5
      oscillator.frequency.setValueAtTime(783.99, now + 0.4); // G5
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      
      oscillator.start();
      oscillator.stop(now + 0.5);
    } catch (error) {
      console.warn('Fallback sequence generation failed:', error);
    }
  }
}

// Singleton instance
export const soundEffects = SoundEffects.getInstance();

// Initialize on module load if in browser
if (typeof window !== 'undefined') {
  soundEffects.init();
}
