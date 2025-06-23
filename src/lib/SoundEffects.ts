/**
 * Timeliner - Centralized Sound Effects System
 * Manages all audio effects, background music, and sound interactions
 */

export type SoundEffect = 
  | 'button-click'
  | 'card-place'
  | 'card-woosh'
  | 'correct'
  | 'incorrect'
  | 'victory'
  | 'card-throw'
  | 'player-join'
  | 'game-start'
  | 'turn-transition'
  | 'timeline-complete';

export interface SoundConfig {
  volume: number;
  playbackRate: number;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

export const SOUND_PRESETS = {
  // Volume presets
  SILENT: 0 as number,
  QUIET: 0.2 as number,
  NORMAL: 0.5 as number,
  LOUD: 0.8 as number,
  MAX: 1.0 as number,

  // Playback rate presets
  SLOW: 0.75 as number,
  NORMAL_RATE: 1.0 as number,
  FAST: 1.25 as number,
  VERY_FAST: 1.5 as number,
} as const;

export const SOUND_EFFECTS: Record<SoundEffect, Partial<SoundConfig>> = {
  'button-click': { volume: SOUND_PRESETS.NORMAL, playbackRate: SOUND_PRESETS.NORMAL_RATE },
  'card-place': { volume: SOUND_PRESETS.NORMAL, playbackRate: SOUND_PRESETS.NORMAL_RATE },
  'card-woosh': { volume: SOUND_PRESETS.QUIET, playbackRate: SOUND_PRESETS.NORMAL_RATE },
  'correct': { volume: SOUND_PRESETS.LOUD, playbackRate: SOUND_PRESETS.NORMAL_RATE },
  'incorrect': { volume: SOUND_PRESETS.LOUD, playbackRate: SOUND_PRESETS.NORMAL_RATE },
  'victory': { volume: SOUND_PRESETS.MAX, playbackRate: SOUND_PRESETS.NORMAL_RATE },
  'card-throw': { volume: SOUND_PRESETS.NORMAL, playbackRate: SOUND_PRESETS.FAST },
  'player-join': { volume: SOUND_PRESETS.QUIET, playbackRate: SOUND_PRESETS.NORMAL_RATE },
  'game-start': { volume: SOUND_PRESETS.LOUD, playbackRate: SOUND_PRESETS.NORMAL_RATE },
  'turn-transition': { volume: SOUND_PRESETS.QUIET, playbackRate: SOUND_PRESETS.NORMAL_RATE },
  'timeline-complete': { volume: SOUND_PRESETS.LOUD, playbackRate: SOUND_PRESETS.NORMAL_RATE },
};

export class SoundEffectsManager {
  private static instance: SoundEffectsManager;
  private audioContext: AudioContext | null = null;
  private sounds = new Map<SoundEffect, HTMLAudioElement>();
  private masterVolume = SOUND_PRESETS.NORMAL;
  private isMuted = false;
  private isEnabled = true;

  static getInstance(): SoundEffectsManager {
    if (!SoundEffectsManager.instance) {
      SoundEffectsManager.instance = new SoundEffectsManager();
    }
    return SoundEffectsManager.instance;
  }

  constructor() {
    this.initializeAudioContext();
    this.preloadSounds();
  }

  private initializeAudioContext(): void {
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        this.audioContext = new AudioContext();
      }
    } catch (error) {
      console.warn('AudioContext not available:', error);
      this.isEnabled = false;
    }
  }

  private preloadSounds(): void {
    if (!this.isEnabled) return;

    Object.keys(SOUND_EFFECTS).forEach((soundName) => {
      try {
        const audio = new Audio(`/sounds/${soundName}.mp3`);
        audio.preload = 'auto';
        
        // Set default configuration
        const config = SOUND_EFFECTS[soundName as SoundEffect];
        audio.volume = (config.volume || SOUND_PRESETS.NORMAL) * this.masterVolume;
        audio.playbackRate = config.playbackRate || SOUND_PRESETS.NORMAL_RATE;
        audio.loop = config.loop || false;

        this.sounds.set(soundName as SoundEffect, audio);
      } catch (error) {
        console.warn(`Could not preload sound: ${soundName}`, error);
      }
    });
  }

  async playSound(
    soundName: SoundEffect, 
    customConfig?: Partial<SoundConfig>
  ): Promise<void> {
    if (!this.isEnabled || this.isMuted) return;

    try {
      const audio = this.sounds.get(soundName);
      if (!audio) {
        console.warn(`Sound not found: ${soundName}`);
        return;
      }

      // Apply custom configuration
      const baseConfig = SOUND_EFFECTS[soundName];
      const finalConfig = { ...baseConfig, ...customConfig };

      audio.currentTime = 0;
      audio.volume = (finalConfig.volume || SOUND_PRESETS.NORMAL) * this.masterVolume;
      audio.playbackRate = finalConfig.playbackRate || SOUND_PRESETS.NORMAL_RATE;
      audio.loop = finalConfig.loop || false;

      // Handle fade in
      if (finalConfig.fadeIn) {
        audio.volume = 0;
        await audio.play();
        this.fadeIn(audio, (finalConfig.volume || SOUND_PRESETS.NORMAL) * this.masterVolume, finalConfig.fadeIn);
      } else {
        await audio.play();
      }

      // Handle fade out
      if (finalConfig.fadeOut && !finalConfig.loop) {
        setTimeout(() => {
          this.fadeOut(audio, finalConfig.fadeOut!);
        }, Math.max(0, (audio.duration * 1000) - finalConfig.fadeOut));
      }

    } catch (error) {
      console.warn(`Could not play sound: ${soundName}`, error);
    }
  }

  private fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number): void {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeStep * currentStep, targetVolume);
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
      }
    }, stepDuration);
  }

  private fadeOut(audio: HTMLAudioElement, duration: number): void {
    const initialVolume = audio.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = initialVolume / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(initialVolume - (volumeStep * currentStep), 0);
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        audio.pause();
        audio.currentTime = 0;
      }
    }, stepDuration);
  }

  stopSound(soundName: SoundEffect): void {
    const audio = this.sounds.get(soundName);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  stopAllSounds(): void {
    this.sounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((audio, soundName) => {
      const config = SOUND_EFFECTS[soundName];
      audio.volume = (config.volume || SOUND_PRESETS.NORMAL) * this.masterVolume;
    });
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopAllSounds();
    }
  }

  isSoundMuted(): boolean {
    return this.isMuted;
  }

  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  // Game-specific sound combinations
  async playCardSuccess(): Promise<void> {
    await this.playSound('correct');
    setTimeout(() => this.playSound('card-place'), 200);
  }

  async playCardError(): Promise<void> {
    await this.playSound('incorrect');
  }

  async playTurnTransition(): Promise<void> {
    await this.playSound('turn-transition', { fadeIn: 300, fadeOut: 300 });
  }

  async playGameVictory(): Promise<void> {
    await this.playSound('victory');
    setTimeout(() => this.playSound('timeline-complete'), 1000);
  }

  async playPlayerAction(): Promise<void> {
    await this.playSound('button-click');
  }

  async playCardThrow(): Promise<void> {
    await this.playSound('card-woosh');
    setTimeout(() => this.playSound('card-throw'), 100);
  }
}

// React hook for sound effects
export const useSoundEffects = () => {
  const soundManager = SoundEffectsManager.getInstance();

  return {
    playSound: (soundName: SoundEffect, config?: Partial<SoundConfig>) => 
      soundManager.playSound(soundName, config),
    stopSound: (soundName: SoundEffect) => soundManager.stopSound(soundName),
    stopAllSounds: () => soundManager.stopAllSounds(),
    setMasterVolume: (volume: number) => soundManager.setMasterVolume(volume),
    getMasterVolume: () => soundManager.getMasterVolume(),
    setMuted: (muted: boolean) => soundManager.setMuted(muted),
    isMuted: () => soundManager.isSoundMuted(),
    isEnabled: () => soundManager.isAudioEnabled(),
    // Game-specific methods
    playCardSuccess: () => soundManager.playCardSuccess(),
    playCardError: () => soundManager.playCardError(),
    playTurnTransition: () => soundManager.playTurnTransition(),
    playGameVictory: () => soundManager.playGameVictory(),
    playPlayerAction: () => soundManager.playPlayerAction(),
    playCardThrow: () => soundManager.playCardThrow(),
  };
};

export default SoundEffectsManager;
