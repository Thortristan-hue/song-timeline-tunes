
import { Howl, Howler } from 'howler';
import { suppressUnused } from './suppressUnused';

interface Sound {
  howl: Howl;
  options: {
    loop?: boolean;
    volume?: number;
    fadeIn?: number;
  };
}

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

type StateChangeCallback = (state: AudioState) => void;

class UnifiedAudioEngine {
  private sounds: Map<string, Sound> = new Map();
  private nextId: number = 0;
  private currentPreviewId: string | null = null;
  private stateChangeCallbacks: Set<StateChangeCallback> = new Set();
  private currentState: AudioState = {
    isPlaying: false,
    isLoading: false,
    error: null
  };

  constructor() {
    Howler.autoUnlock = true;
  }

  private generateId(): string {
    return `sound-${this.nextId++}`;
  }

  private notifyStateChange(newState: Partial<AudioState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.stateChangeCallbacks.forEach(callback => callback(this.currentState));
  }

  onStateChange(callback: StateChangeCallback): () => void {
    this.stateChangeCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      this.stateChangeCallbacks.delete(callback);
    };
  }

  async playPreview(src: string): Promise<void> {
    this.notifyStateChange({ isLoading: true, error: null });
    
    try {
      // Stop current preview if playing
      if (this.currentPreviewId) {
        this.stopPreview();
      }

      const id = this.generateId();
      this.currentPreviewId = id;

      return new Promise((resolve, reject) => {
        const howl = new Howl({
          src: [src],
          html5: true,
          volume: 1,
          onload: () => {
            this.sounds.set(id, { howl, options: {} });
            howl.play();
            this.notifyStateChange({ isPlaying: true, isLoading: false });
            resolve();
          },
          onend: () => {
            this.notifyStateChange({ isPlaying: false });
            this.sounds.delete(id);
            if (this.currentPreviewId === id) {
              this.currentPreviewId = null;
            }
          },
          onloaderror: (soundId, error) => {
            suppressUnused(soundId);
            const errorMsg = `Failed to load preview: ${src}`;
            console.error(errorMsg, error);
            this.notifyStateChange({ isLoading: false, error: errorMsg });
            reject(new Error(errorMsg));
          }
        });
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to play preview';
      this.notifyStateChange({ isLoading: false, error: errorMsg });
      throw error;
    }
  }

  stopPreview(): void {
    if (this.currentPreviewId) {
      const sound = this.sounds.get(this.currentPreviewId);
      if (sound) {
        sound.howl.stop();
        this.sounds.delete(this.currentPreviewId);
      }
      this.currentPreviewId = null;
      this.notifyStateChange({ isPlaying: false });
    }
  }

  async preloadAudio(id: string, src: string): Promise<void> {
    suppressUnused(id);
    return new Promise((resolve, reject) => {
      const howl = new Howl({
        src: [src],
        preload: true,
        onload: () => {
          resolve();
        },
        onloaderror: (soundId, error) => {
          suppressUnused(soundId);
          console.error(`Failed to load audio: ${src}`, error);
          reject(error);
        }
      });
      suppressUnused(howl);
    });
  }

  async playAudio(src: string, options: { loop?: boolean; volume?: number; fadeIn?: number; duration?: number } = {}): Promise<void> {
    const { duration, ...restOptions } = options;
    suppressUnused(duration);
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const howl = new Howl({
        src: [src],
        html5: true,
        loop: restOptions.loop || false,
        volume: restOptions.volume || 1,
        onload: () => {
          this.sounds.set(id, {
            howl,
            options: restOptions
          });
          howl.play();

          if (restOptions.fadeIn) {
            howl.volume(0);
            howl.fade(0, restOptions.volume || 1, restOptions.fadeIn);
          }

          howl.on('end', () => {
            resolve();
            this.stopAudio(id);
          });

          howl.on('stop', () => {
            this.sounds.delete(id);
          });
        },
        onloaderror: (soundId, error) => {
          suppressUnused(soundId);
          console.error(`Failed to load audio: ${src}`, error);
          reject(error);
        }
      });
    });
  }

  pauseAudio(id: string): void {
    suppressUnused(id);
    const sound = this.sounds.get(id);
    if (sound) {
      sound.howl.pause();
    }
  }

  stopAudio(id: string): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.howl.stop();
      this.sounds.delete(id);
    }
  }

  setVolume(id: string, volume: number): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.howl.volume(volume);
    }
  }

  fadeOut(id: string, duration: number): void {
    const sound = this.sounds.get(id);
    if (sound) {
      const currentVolume = sound.howl.volume();
      sound.howl.fade(currentVolume, 0, duration);
      setTimeout(() => {
        this.stopAudio(id);
      }, duration);
    }
  }

  stopAll(): void {
    Howler.stop();
    this.sounds.clear();
    this.currentPreviewId = null;
    this.notifyStateChange({ isPlaying: false });
  }
}

// Game sound effects utility
export class GameSounds {
  static async correct(): Promise<void> {
    return unifiedAudioEngine.playAudio('/sounds/correct.mp3');
  }

  static async incorrect(): Promise<void> {
    return unifiedAudioEngine.playAudio('/sounds/incorrect.mp3');
  }

  static async turnTransition(): Promise<void> {
    return unifiedAudioEngine.playAudio('/sounds/turn-transition.mp3');
  }

  static async gameStart(): Promise<void> {
    return unifiedAudioEngine.playAudio('/sounds/game-start.mp3');
  }

  static async playerJoin(): Promise<void> {
    return unifiedAudioEngine.playAudio('/sounds/player-join.mp3');
  }

  static async buttonClick(): Promise<void> {
    return unifiedAudioEngine.playAudio('/sounds/button-click.mp3');
  }

  static async cardPlace(): Promise<void> {
    return unifiedAudioEngine.playAudio('/sounds/card-place.mp3');
  }
}

export const unifiedAudioEngine = new UnifiedAudioEngine();
