// src/utils/audio.ts
import { Howl } from 'howler';
import { supabase } from '@/integrations/supabase/client';

export async function playSoundEffect(soundPath: string, volume: number = 0.3): Promise<void> {
  try {
    console.log(`[AudioEngine] Attempting to play sound effect: ${soundPath}`);
    
    // Get the correct, full public URL from Supabase Storage
    const { data } = supabase.storage
      .from('assets')
      .getPublicUrl(soundPath);

    if (!data.publicUrl) {
      throw new Error('Failed to get public URL for sound file');
    }

    console.log(`[AudioEngine] Retrieved public URL: ${data.publicUrl}`);

    // Play the sound using the full URL
    const sound = new Howl({
      src: [data.publicUrl],
      html5: true, // Important for cross-origin playback
      volume: volume,
      preload: true,
      onloaderror: (id, error) => {
        console.warn(`[AudioEngine] Failed to load sound: ${soundPath}`, error);
      },
      onplayerror: (id, error) => {
        console.warn(`[AudioEngine] Failed to play sound: ${soundPath}`, error);
      }
    });

    sound.play();
    console.log(`[AudioEngine] Successfully initiated playback of: ${soundPath}`);

  } catch (error) {
    // CRITICAL: If anything fails, log a warning and DO NOT crash the app
    console.warn(`[AudioEngine] Failed to play sound effect: ${soundPath}`, error);
    
    // Fallback: Create a subtle synthesized tone
    try {
      createFallbackTone(getSoundFrequency(soundPath));
    } catch (fallbackError) {
      console.warn(`[AudioEngine] Fallback tone generation also failed for: ${soundPath}`, fallbackError);
      // Even if fallback fails, we don't crash the app
    }
  }
}

// Helper function to create fallback tones
function createFallbackTone(frequency: number = 440, duration: number = 0.2): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Gentle envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    // Even fallback tone generation can fail - that's okay, we don't crash
    console.warn('[AudioEngine] Fallback tone generation failed', error);
  }
}

// Map sound files to appropriate fallback frequencies
function getSoundFrequency(soundPath: string): number {
  const soundMap: Record<string, number> = {
    'sounds/game-start.mp3': 523.25, // C5 - celebratory
    'sounds/player-join.mp3': 880, // A5 - notification
    'sounds/card-place.mp3': 220, // A3 - low thud
    'sounds/button-click.mp3': 1000, // B5 - click
    'sounds/correct.mp3': 659.25, // E5 - success
    'sounds/incorrect.mp3': 293.66, // D4 - error
    'sounds/victory.mp3': 783.99, // G5 - victory
    'sounds/card-woosh.mp3': 440, // A4 - movement
    'sounds/turn-transition.mp3': 349.23, // F4 - transition
    'sounds/timeline-complete.mp3': 523.25 // C5 - completion
  };
  
  return soundMap[soundPath] || 440; // Default to A4
}

// Convenience functions for common game sounds
export const GameSounds = {
  async gameStart() {
    await playSoundEffect('sounds/game-start.mp3', 0.5);
  },
  
  async playerJoin() {
    await playSoundEffect('sounds/player-join.mp3', 0.3);
  },
  
  async cardPlace() {
    await playSoundEffect('sounds/card-place.mp3', 0.3);
  },
  
  async buttonClick() {
    await playSoundEffect('sounds/button-click.mp3', 0.2);
  },
  
  async correct() {
    await playSoundEffect('sounds/correct.mp3', 0.4);
  },
  
  async incorrect() {
    await playSoundEffect('sounds/incorrect.mp3', 0.4);
  },
  
  async victory() {
    await playSoundEffect('sounds/victory.mp3', 0.6);
  },
  
  async cardWoosh() {
    await playSoundEffect('sounds/card-woosh.mp3', 0.3);
  },
  
  async turnTransition() {
    await playSoundEffect('sounds/turn-transition.mp3', 0.3);
  },
  
  async timelineComplete() {
    await playSoundEffect('sounds/timeline-complete.mp3', 0.4);
  }
};