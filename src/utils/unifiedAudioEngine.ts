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

class UnifiedAudioEngine {
  private sounds: Map<string, Sound> = new Map();
  private nextId: number = 0;

  constructor() {
    Howler.autoUnlock = true;
  }

  private generateId(): string {
    return `sound-${this.nextId++}`;
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
          console.error(`Failed to load audio: ${src}`, error);
          reject(error);
        }
      });
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
    suppressUnused(id);
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
      sound.howl.fade(sound.howl.volume(), 0, duration, () => {
        this.stopAudio(id);
      });
    }
  }

  stopAll(): void {
    Howler.stop();
    this.sounds.clear();
  }
}

export const unifiedAudioEngine = new UnifiedAudioEngine();
