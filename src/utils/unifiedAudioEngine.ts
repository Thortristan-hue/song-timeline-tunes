import { Howl } from 'howler';

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

type AudioStateListener = (state: AudioState) => void;

/**
 * Unified Audio Engine that handles both sound effects and song previews
 * with proper feedback states and error handling
 */
export class UnifiedAudioEngine {
  private currentPreview: Howl | null = null;
  private soundEffects: Map<string, Howl> = new Map();
  private previewState: AudioState = { isPlaying: false, isLoading: false, error: null };
  private listeners: Set<AudioStateListener> = new Set();
  
  public volume: number = 0.5;
  public sfxVolume: number = 0.3;

  constructor() {
    console.log('[UnifiedAudioEngine] Initializing unified audio engine');
    this.preloadSoundEffects();
  }

  // State management for UI feedback
  public onStateChange(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private updateState(newState: Partial<AudioState>): void {
    this.previewState = { ...this.previewState, ...newState };
    this.listeners.forEach(listener => listener(this.previewState));
  }

  public getState(): AudioState {
    return { ...this.previewState };
  }

  // Preload common sound effects for instant playback
  private async preloadSoundEffects(): Promise<void> {
    const sounds = {
      'button-click': '/sounds/button-click.mp3',
      'correct': '/sounds/correct.mp3',
      'incorrect': '/sounds/incorrect.mp3',
      'victory': '/sounds/victory.mp3',
      'card-place': '/sounds/card-place.mp3',
      'card-woosh': '/sounds/card-woosh.mp3'
    };

    for (const [name, url] of Object.entries(sounds)) {
      try {
        const sound = new Howl({
          src: [url],
          volume: this.sfxVolume,
          html5: false, // Use Web Audio API for better performance
          preload: true,
          onloaderror: (id, error) => {
            console.warn(`[UnifiedAudioEngine] Failed to preload ${name}:`, error);
            // Create fallback synthesized sound
            this.createSynthesizedSound(name);
          }
        });
        this.soundEffects.set(name, sound);
      } catch (error) {
        console.warn(`[UnifiedAudioEngine] Error creating sound ${name}:`, error);
        this.createSynthesizedSound(name);
      }
    }
  }

  // Create synthesized fallback sounds
  private createSynthesizedSound(name: string): void {
    const frequencies: Record<string, number> = {
      'button-click': 800,
      'correct': 660,
      'incorrect': 300,
      'victory': 523,
      'card-place': 440,
      'card-woosh': 350
    };

    const freq = frequencies[name] || 440;
    const duration = name === 'victory' ? 0.5 : 0.2;

    // Create a simple synthesized sound using Howler
    const synthSound = new Howl({
      src: [`data:audio/wav;base64,${this.generateToneDataURL(freq, duration)}`],
      volume: this.sfxVolume * 0.5,
      html5: false
    });

    this.soundEffects.set(name, synthSound);
  }

  // Generate a simple tone for fallback
  private generateToneDataURL(frequency: number, duration: number): string {
    // Simple sine wave generation for fallback
    // This is a minimal implementation - in production you'd want a proper tone generator
    return btoa(String.fromCharCode(...Array.from({ length: 44 }, (_, i) => 
      Math.floor(128 + 127 * Math.sin(2 * Math.PI * frequency * i / 44100))
    )));
  }

  // Play sound effects instantly with feedback
  public async playSoundEffect(name: string): Promise<void> {
    try {
      const sound = this.soundEffects.get(name);
      if (sound) {
        sound.volume(this.sfxVolume);
        sound.play();
        console.log(`[UnifiedAudioEngine] Playing sound effect: ${name}`);
      } else {
        console.warn(`[UnifiedAudioEngine] Sound effect not found: ${name}`);
        this.playFallbackBeep();
      }
    } catch (error) {
      console.warn(`[UnifiedAudioEngine] Error playing sound effect ${name}:`, error);
      this.playFallbackBeep();
    }
  }

  // Play song previews with loading states and feedback
  public async playPreview(url: string): Promise<void> {
    if (!url) {
      this.updateState({ error: 'No preview URL provided' });
      return;
    }

    // Stop any current preview
    this.stopPreview();
    
    this.updateState({ isLoading: true, error: null });
    console.log(`[UnifiedAudioEngine] Loading preview: ${url}`);

    try {
      this.currentPreview = new Howl({
        src: [url],
        html5: true, // Required for cross-origin playback
        volume: this.volume,
        preload: true,
        onload: () => {
          console.log('[UnifiedAudioEngine] Preview loaded successfully');
          this.updateState({ isLoading: false });
        },
        onloaderror: (id, error) => {
          console.error('[UnifiedAudioEngine] Preview load failed:', error);
          this.updateState({ 
            isLoading: false, 
            error: 'Failed to load audio preview' 
          });
        },
        onplay: () => {
          console.log('[UnifiedAudioEngine] Preview playback started');
          this.updateState({ isPlaying: true, error: null });
        },
        onpause: () => {
          console.log('[UnifiedAudioEngine] Preview playback paused');
          this.updateState({ isPlaying: false });
        },
        onend: () => {
          console.log('[UnifiedAudioEngine] Preview playback ended');
          this.updateState({ isPlaying: false });
          this.cleanup();
        },
        onstop: () => {
          console.log('[UnifiedAudioEngine] Preview playback stopped');
          this.updateState({ isPlaying: false });
        },
        onplayerror: (id, error) => {
          console.error('[UnifiedAudioEngine] Preview play failed:', error);
          this.updateState({ 
            isPlaying: false, 
            error: 'Failed to play audio preview' 
          });
        }
      });

      // Start playback
      this.currentPreview.play();

      // Auto-stop after 30 seconds to prevent long previews
      setTimeout(() => {
        if (this.currentPreview && this.previewState.isPlaying) {
          this.stopPreview();
        }
      }, 30000);

    } catch (error) {
      console.error('[UnifiedAudioEngine] Error creating preview player:', error);
      this.updateState({ 
        isLoading: false, 
        error: 'Failed to create audio player' 
      });
    }
  }

  // Stop current preview
  public stopPreview(): void {
    if (this.currentPreview) {
      try {
        this.currentPreview.stop();
        this.currentPreview.unload();
      } catch (error) {
        console.warn('[UnifiedAudioEngine] Error stopping preview:', error);
      }
      this.currentPreview = null;
      this.updateState({ isPlaying: false, isLoading: false });
    }
  }

  // Pause/resume preview
  public pausePreview(): void {
    if (this.currentPreview && this.previewState.isPlaying) {
      this.currentPreview.pause();
    }
  }

  public resumePreview(): void {
    if (this.currentPreview && !this.previewState.isPlaying) {
      this.currentPreview.play();
    }
  }

  // Toggle preview playback
  public togglePreview(): void {
    if (this.previewState.isPlaying) {
      this.pausePreview();
    } else if (this.currentPreview) {
      this.resumePreview();
    }
  }

  // Volume controls
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentPreview) {
      this.currentPreview.volume(this.volume);
    }
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.soundEffects.forEach(sound => {
      sound.volume(this.sfxVolume);
    });
  }

  // Simple fallback beep
  private playFallbackBeep(): void {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }
    } catch (error) {
      console.warn('[UnifiedAudioEngine] Fallback beep failed:', error);
    }
  }

  // Cleanup
  private cleanup(): void {
    if (this.currentPreview) {
      this.currentPreview.unload();
      this.currentPreview = null;
    }
  }

  public dispose(): void {
    this.stopPreview();
    this.soundEffects.forEach(sound => sound.unload());
    this.soundEffects.clear();
    this.listeners.clear();
  }
}

// Global instance
export const unifiedAudioEngine = new UnifiedAudioEngine();

// Convenience functions for common sounds
export const GameSounds = {
  async buttonClick() { await unifiedAudioEngine.playSoundEffect('button-click'); },
  async correct() { await unifiedAudioEngine.playSoundEffect('correct'); },
  async incorrect() { await unifiedAudioEngine.playSoundEffect('incorrect'); },
  async victory() { await unifiedAudioEngine.playSoundEffect('victory'); },
  async cardPlace() { await unifiedAudioEngine.playSoundEffect('card-place'); },
  async cardWoosh() { await unifiedAudioEngine.playSoundEffect('card-woosh'); },
  async gameStart() { await unifiedAudioEngine.playSoundEffect('victory'); }, // Reuse victory sound
  async playerJoin() { await unifiedAudioEngine.playSoundEffect('correct'); }, // Reuse correct sound
  async turnTransition() { await unifiedAudioEngine.playSoundEffect('card-woosh'); } // Reuse woosh sound
};