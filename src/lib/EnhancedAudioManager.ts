
import { audioManager } from '@/services/AudioManager';
import { Song } from '@/types/game';
import { useState, useEffect, useCallback } from 'react';

export interface AudioSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  masterVolume: number;
  soundVolumes: {
    ui: number;
    game: number;
    success: number;
    ambient: number;
  };
}

export class EnhancedAudioManager {
  private gamepadsSupported: boolean = false;
  private gamepadConnected: boolean = false;
  private settings: AudioSettings = {
    soundEnabled: true,
    hapticEnabled: true,
    masterVolume: 0.7,
    soundVolumes: {
      ui: 0.5,
      game: 0.7,
      success: 0.8,
      ambient: 0.4,
    },
  };

  constructor() {
    this.initializeGamepadSupport();
  }

  private initializeGamepadSupport() {
    // Check if gamepad API is supported
    if (typeof window !== 'undefined' && 'getGamepads' in navigator) {
      this.gamepadsSupported = true;
      
      // Listen for gamepad connection events
      window.addEventListener('gamepadconnected', (e) => {
        console.log('🎮 Gamepad connected:', e.gamepad.id);
        this.gamepadConnected = true;
      });

      window.addEventListener('gamepaddisconnected', (e) => {
        console.log('🎮 Gamepad disconnected:', e.gamepad.id);
        this.gamepadConnected = false;
      });
    }
  }

  public playSong(song: Song) {
    audioManager.playSong(song);
  }

  public stopSong() {
    audioManager.stop();
  }

  public setVolume(volume: number) {
    this.settings.masterVolume = volume;
  }

  public toggleMute() {
    this.settings.soundEnabled = !this.settings.soundEnabled;
  }

  public isPlaying(): boolean {
    return audioManager.getIsPlaying();
  }

  public getCurrentSong(): Song | null {
    return audioManager.getCurrentSong();
  }

  public isGamepadConnected(): boolean {
    if (!this.gamepadsSupported) return false;
    
    if (typeof window !== 'undefined' && 'getGamepads' in navigator) {
      const gamepads = (navigator as any).getGamepads();
      return gamepads && Array.from(gamepads).some((gamepad: any) => gamepad !== null);
    }
    
    return false;
  }

  public getGamepadInput() {
    if (!this.gamepadsSupported || typeof window === 'undefined') return null;
    
    if ('getGamepads' in navigator) {
      const gamepads = (navigator as any).getGamepads();
      return gamepads ? gamepads[0] : null;
    }
    
    return null;
  }

  public getSettings(): AudioSettings {
    return this.settings;
  }

  public updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  public async playUISound(soundType: string) {
    if (!this.settings.soundEnabled) return;
    console.log('Playing UI sound:', soundType);
  }

  public async playGameSound(soundType: string) {
    if (!this.settings.soundEnabled) return;
    console.log('Playing game sound:', soundType);
  }

  public async playSuccessSound(soundType: string) {
    if (!this.settings.soundEnabled) return;
    console.log('Playing success sound:', soundType);
  }

  public async playNotificationSound() {
    if (!this.settings.soundEnabled) return;
    console.log('Playing notification sound');
  }

  public toggleSound() {
    this.settings.soundEnabled = !this.settings.soundEnabled;
  }

  public toggleHaptic() {
    this.settings.hapticEnabled = !this.settings.hapticEnabled;
  }

  public setMasterVolume(volume: number) {
    this.settings.masterVolume = volume;
  }
}

// Create singleton instance
const enhancedAudioManager = new EnhancedAudioManager();

// Custom hook for using enhanced audio
export const useEnhancedAudio = () => {
  const [settings, setSettings] = useState<AudioSettings>(enhancedAudioManager.getSettings());

  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    enhancedAudioManager.updateSettings(newSettings);
    setSettings(enhancedAudioManager.getSettings());
  }, []);

  const toggleSound = useCallback(() => {
    enhancedAudioManager.toggleSound();
    setSettings(enhancedAudioManager.getSettings());
  }, []);

  const toggleHaptic = useCallback(() => {
    enhancedAudioManager.toggleHaptic();
    setSettings(enhancedAudioManager.getSettings());
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    enhancedAudioManager.setMasterVolume(volume);
    setSettings(enhancedAudioManager.getSettings());
  }, []);

  const playUISound = useCallback((soundType: string) => {
    return enhancedAudioManager.playUISound(soundType);
  }, []);

  const playGameSound = useCallback((soundType: string) => {
    return enhancedAudioManager.playGameSound(soundType);
  }, []);

  const playSuccessSound = useCallback((soundType: string) => {
    return enhancedAudioManager.playSuccessSound(soundType);
  }, []);

  const playNotificationSound = useCallback(() => {
    return enhancedAudioManager.playNotificationSound();
  }, []);

  return {
    settings,
    updateSettings,
    toggleSound,
    toggleHaptic,
    setMasterVolume,
    playUISound,
    playGameSound,
    playSuccessSound,
    playNotificationSound,
  };
};

export default enhancedAudioManager;
