/**
 * Enhanced Audio & Haptic Feedback System
 * Manages sound effects, haptic feedback, and user preferences
 */

export interface AudioSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  masterVolume: number;
  soundVolumes: {
    ui: number;      // Button clicks, UI interactions
    game: number;    // Card placement, game events  
    success: number; // Success sounds, achievements
    ambient: number; // Background audio, music
  };
}

export interface HapticPattern {
  pattern: number[];
  intensity?: 'light' | 'medium' | 'heavy';
}

const DEFAULT_SETTINGS: AudioSettings = {
  soundEnabled: true,
  hapticEnabled: true,
  masterVolume: 0.7,
  soundVolumes: {
    ui: 0.6,
    game: 0.8,
    success: 0.9,
    ambient: 0.5
  }
};

const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
  buttonClick: { pattern: [50], intensity: 'light' },
  cardPlace: { pattern: [100], intensity: 'medium' },
  cardSuccess: { pattern: [50, 100, 150], intensity: 'medium' },
  cardError: { pattern: [200, 100, 200], intensity: 'heavy' },
  gameStart: { pattern: [100, 50, 100, 50, 200], intensity: 'medium' },
  victory: { pattern: [200, 100, 200, 100, 300], intensity: 'heavy' },
  notification: { pattern: [80], intensity: 'light' },
  streak: { pattern: [50, 50, 50, 50, 100], intensity: 'medium' }
};

export class EnhancedAudioManager {
  private static instance: EnhancedAudioManager;
  private audioContext: AudioContext | null = null;
  private settings: AudioSettings;
  private soundBuffers: Map<string, AudioBuffer> = new Map();
  private initialized = false;

  private constructor() {
    this.settings = this.loadSettings();
    this.init();
  }

  static getInstance(): EnhancedAudioManager {
    if (!EnhancedAudioManager.instance) {
      EnhancedAudioManager.instance = new EnhancedAudioManager();
    }
    return EnhancedAudioManager.instance;
  }

  private async init(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') return;

    try {
      const AudioContextConstructor = window.AudioContext || 
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      
      this.audioContext = AudioContextConstructor ? new AudioContextConstructor() : null;
      this.initialized = true;
      
      // Preload sound effects
      await this.preloadSounds();
      
      console.log('🎵 Enhanced audio system initialized');
    } catch (error) {
      console.warn('Enhanced audio system initialization failed:', error);
    }
  }

  private async preloadSounds(): Promise<void> {
    const soundFiles = [
      'button-click.mp3',
      'card-place.mp3', 
      'card-woosh.mp3',
      'correct.mp3',
      'incorrect.mp3',
      'victory.mp3'
    ];

    const loadPromises = soundFiles.map(async (filename) => {
      try {
        await this.loadSoundBuffer(filename);
      } catch (error) {
        console.warn(`Failed to load sound: ${filename}`, error);
      }
    });

    await Promise.allSettled(loadPromises);
  }

  private async loadSoundBuffer(filename: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      const response = await fetch(`/sounds/${filename}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.soundBuffers.set(filename, audioBuffer);
    } catch (error) {
      console.warn(`Could not load sound: ${filename}`, error);
    }
  }

  // Audio playback methods
  async playUISound(soundType: 'buttonClick' | 'navigation' | 'toggle'): Promise<void> {
    if (!this.settings.soundEnabled) return;

    const soundFile = soundType === 'buttonClick' ? 'button-click.mp3' : 'button-click.mp3';
    const volume = this.settings.masterVolume * this.settings.soundVolumes.ui;
    
    await this.playSound(soundFile, volume);
    await this.triggerHaptic(soundType);
  }

  async playGameSound(soundType: 'cardPlace' | 'cardWoosh' | 'turnTransition'): Promise<void> {
    if (!this.settings.soundEnabled) return;

    const soundFiles = {
      cardPlace: 'card-place.mp3',
      cardWoosh: 'card-woosh.mp3', 
      turnTransition: 'button-click.mp3' // fallback
    };

    const volume = this.settings.masterVolume * this.settings.soundVolumes.game;
    await this.playSound(soundFiles[soundType], volume);
    await this.triggerHaptic(soundType);
  }

  async playSuccessSound(soundType: 'correct' | 'incorrect' | 'victory' | 'streak'): Promise<void> {
    if (!this.settings.soundEnabled) return;

    const soundFiles = {
      correct: 'correct.mp3',
      incorrect: 'incorrect.mp3',
      victory: 'victory.mp3',
      streak: 'correct.mp3'
    };

    const volume = this.settings.masterVolume * this.settings.soundVolumes.success;
    await this.playSound(soundFiles[soundType], volume);
    await this.triggerHaptic(soundType === 'correct' ? 'cardSuccess' : 
                            soundType === 'incorrect' ? 'cardError' : soundType);
  }

  async playNotificationSound(): Promise<void> {
    if (!this.settings.soundEnabled) return;

    const volume = this.settings.masterVolume * this.settings.soundVolumes.ui;
    await this.playSound('button-click.mp3', volume);
    await this.triggerHaptic('notification');
  }

  private async playSound(filename: string, volume: number): Promise<void> {
    if (!this.audioContext || !this.initialized) {
      return this.playFallbackTone();
    }

    // Resume context if suspended (mobile requirement)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
        return this.playFallbackTone();
      }
    }

    const buffer = this.soundBuffers.get(filename);
    if (!buffer) {
      return this.playFallbackTone();
    }

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      gainNode.gain.value = Math.min(1, Math.max(0, volume));

      source.start(0);

      // Cleanup after playback
      source.addEventListener('ended', () => {
        try {
          source.disconnect();
          gainNode.disconnect();
        } catch (error) {
          // Already disconnected
        }
      });
    } catch (error) {
      console.warn('Failed to play sound:', error);
      return this.playFallbackTone();
    }
  }

  private async playFallbackTone(): Promise<void> {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Fallback tone generation failed:', error);
    }
  }

  // Haptic feedback methods
  private async triggerHaptic(patternName: string): Promise<void> {
    if (!this.settings.hapticEnabled || typeof window === 'undefined') return;

    const pattern = HAPTIC_PATTERNS[patternName];
    if (!pattern) return;

    try {
      // Modern Vibration API
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern.pattern);
        return;
      }

      // Gamepad haptic feedback (if available)
      if ('getGamepads' in navigator && typeof navigator.getGamepads === 'function') {
        const gamepads = navigator.getGamepads();
        for (const gamepad of gamepads) {
          if (gamepad?.vibrationActuator) {
            await gamepad.vibrationActuator.playEffect('dual-rumble', {
              duration: pattern.pattern[0] || 100,
              strongMagnitude: pattern.intensity === 'heavy' ? 0.8 : 
                             pattern.intensity === 'medium' ? 0.5 : 0.3,
              weakMagnitude: pattern.intensity === 'heavy' ? 0.6 : 
                           pattern.intensity === 'medium' ? 0.3 : 0.1
            });
          }
        }
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Settings management
  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  toggleSound(): void {
    this.settings.soundEnabled = !this.settings.soundEnabled;
    this.saveSettings();
  }

  toggleHaptic(): void {
    this.settings.hapticEnabled = !this.settings.hapticEnabled;
    this.saveSettings();
  }

  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.min(1, Math.max(0, volume));
    this.saveSettings();
  }

  private saveSettings(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rythmy-audio-settings', JSON.stringify(this.settings));
      } catch (error) {
        console.warn('Failed to save audio settings:', error);
      }
    }
  }

  private loadSettings(): AudioSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    try {
      const saved = localStorage.getItem('rythmy-audio-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }

    return DEFAULT_SETTINGS;
  }

  // Cleanup
  destroy(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.soundBuffers.clear();
    this.initialized = false;
  }
}

// Singleton instance
export const enhancedAudioManager = EnhancedAudioManager.getInstance();

// React hook for enhanced audio
export const useEnhancedAudio = () => {
  const playUISound = (soundType: 'buttonClick' | 'navigation' | 'toggle') => 
    enhancedAudioManager.playUISound(soundType);
  
  const playGameSound = (soundType: 'cardPlace' | 'cardWoosh' | 'turnTransition') => 
    enhancedAudioManager.playGameSound(soundType);
  
  const playSuccessSound = (soundType: 'correct' | 'incorrect' | 'victory' | 'streak') => 
    enhancedAudioManager.playSuccessSound(soundType);

  const playNotificationSound = () => 
    enhancedAudioManager.playNotificationSound();

  return {
    playUISound,
    playGameSound, 
    playSuccessSound,
    playNotificationSound,
    settings: enhancedAudioManager.getSettings(),
    updateSettings: enhancedAudioManager.updateSettings.bind(enhancedAudioManager),
    toggleSound: enhancedAudioManager.toggleSound.bind(enhancedAudioManager),
    toggleHaptic: enhancedAudioManager.toggleHaptic.bind(enhancedAudioManager),
    setMasterVolume: enhancedAudioManager.setMasterVolume.bind(enhancedAudioManager)
  };
};
