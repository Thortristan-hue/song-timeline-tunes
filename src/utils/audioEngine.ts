import { Howl } from 'howler';

export class AudioEngine {
  private currentAudio: Howl | null = null;
  private previewAudio: Howl | null = null;
  public volume: number = 0.5;
  public sfxVolume: number = 0.3;

  constructor() {
    console.log('[AudioEngine] Initializing AudioEngine');
  }

  // Play a preview without interfering with main game audio
  playPreview(url: string): void {
    if (!url) {
      console.error("[AudioEngine] No preview URL provided");
      return;
    }

    console.log(`[AudioEngine] Playing preview from: ${url}`);

    // Stop any existing preview
    if (this.previewAudio) {
      this.previewAudio.unload();
      this.previewAudio = null;
    }

    // Create new preview audio
    this.previewAudio = new Howl({
      src: [url],
      html5: true,
      volume: this.sfxVolume,
      preload: true,
      onload: () => {
        console.log('[AudioEngine] Preview loaded successfully');
      },
      onloaderror: (id, error) => {
        console.error('[AudioEngine] Preview load failed:', error);
      },
      onplay: () => {
        console.log('[AudioEngine] Preview playback started');
      },
      onend: () => {
        console.log('[AudioEngine] Preview playback ended');
        if (this.previewAudio) {
          this.previewAudio.unload();
          this.previewAudio = null;
        }
      }
    });

    this.previewAudio.play();
  }

  // Stop preview audio
  stopPreview(): void {
    if (this.previewAudio) {
      console.log('[AudioEngine] Stopping preview');
      this.previewAudio.stop();
      this.previewAudio.unload();
      this.previewAudio = null;
    }
  }

  // Main game audio methods
  play(url: string): void {
    if (!url) {
      console.error("[AudioEngine] No URL provided");
      return;
    }

    console.log(`[AudioEngine] Playing main audio from: ${url}`);

    // Stop current audio if playing
    if (this.currentAudio) {
      this.currentAudio.unload();
      this.currentAudio = null;
    }

    this.currentAudio = new Howl({
      src: [url],
      html5: true,
      volume: this.volume,
      preload: true,
      onload: () => {
        console.log('[AudioEngine] Main audio loaded successfully');
      },
      onloaderror: (id, error) => {
        console.error('[AudioEngine] Main audio load failed:', error);
      }
    });

    this.currentAudio.play();
  }

  pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.stop();
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume(this.volume);
    }
  }

  cleanup(): void {
    if (this.currentAudio) {
      this.currentAudio.unload();
      this.currentAudio = null;
    }
    if (this.previewAudio) {
      this.previewAudio.unload();
      this.previewAudio = null;
    }
  }
}

// Global audio engine instance
export const audioEngine = new AudioEngine();