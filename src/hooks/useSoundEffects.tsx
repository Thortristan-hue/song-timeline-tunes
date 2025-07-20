
import { useCallback } from 'react';

export function useSoundEffects() {
  // Enhanced sound effect system with better error handling and fallbacks
  const playAudioFile = useCallback(async (filename: string, volume: number = 0.3) => {
    try {
      // Try multiple potential paths for audio files
      const possiblePaths = [
        `/sounds/${filename}`,
        `./sounds/${filename}`,
        `../sounds/${filename}`
      ];
      
      for (const path of possiblePaths) {
        try {
          const audio = new Audio(path);
          audio.volume = volume;
          audio.crossOrigin = 'anonymous';
          
          // Enhanced loading with shorter timeout to prevent blocking
          const loadPromise = new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', reject, { once: true });
            audio.load();
            
            // Timeout after 2 seconds to prevent blocking
            setTimeout(() => reject(new Error('Audio load timeout')), 2000);
          });
          
          await loadPromise;
          await audio.play();
          console.log('🔊 Audio file played successfully:', filename);
          return true;
        } catch (pathError) {
          // Silently try next path or give up
          console.warn('🔊 Audio path failed:', path, pathError);
          continue;
        }
      }
      
      console.warn('🔊 All audio paths failed for:', filename);
      return false;
    } catch (error) {
      // Audio file not available, fallback will be used
      console.warn('🔊 Audio playback failed, using fallback:', filename, error);
      return false;
    }
  }, []);

  // Web Audio API for generating softer, more polished fallback sounds
  const createAudioContext = useCallback(() => {
    try {
      const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      return AudioContextConstructor ? new AudioContextConstructor() : null;
    } catch (error) {
      // AudioContext not supported, fallback sounds will be used
      return null;
    }
  }, []);

  const playPolishedTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) => {
    try {
      const audioContext = createAudioContext();
      if (!audioContext) return;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filterNode = audioContext.createBiquadFilter();

      // Add filtering for smoother sound
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(2000, audioContext.currentTime);

      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      // Smooth envelope for professional sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      // Tone generation failed, silent fallback
    }
  }, [createAudioContext]);

  const playCardSuccess = useCallback(async () => {
    const played = await playAudioFile('card-success.mp3', 0.4);
    if (!played) {
      // Gentle ascending chime - more professional
      playPolishedTone(523, 0.15, 'sine', 0.06); // C5
      setTimeout(() => playPolishedTone(659, 0.15, 'sine', 0.05), 80); // E5
      setTimeout(() => playPolishedTone(784, 0.2, 'sine', 0.04), 160); // G5
    }
  }, [playAudioFile, playPolishedTone]);

  const playCardError = useCallback(async () => {
    const played = await playAudioFile('card-error.mp3', 0.3);
    if (!played) {
      // Soft descending tone - professional "oops"
      playPolishedTone(330, 0.2, 'sine', 0.05);
      setTimeout(() => playPolishedTone(293, 0.25, 'sine', 0.03), 120);
    }
  }, [playAudioFile, playPolishedTone]);

  const playTurnTransition = useCallback(async () => {
    const played = await playAudioFile('turn-transition.mp3', 0.3);
    if (!played) {
      // Gentle transition sound
      playPolishedTone(440, 0.08, 'triangle', 0.04);
      setTimeout(() => playPolishedTone(523, 0.1, 'triangle', 0.03), 40);
    }
  }, [playAudioFile, playPolishedTone]);

  const playGameStart = useCallback(async () => {
    // Enhanced fallback: Never block the game if audio fails
    try {
      const played = await playAudioFile('game-start.mp3', 0.5);
      if (!played) {
        // Professional fanfare fallback
        playPolishedTone(392, 0.15, 'triangle', 0.05);
        setTimeout(() => playPolishedTone(523, 0.15, 'triangle', 0.04), 150);
        setTimeout(() => playPolishedTone(659, 0.15, 'triangle', 0.04), 300);
        setTimeout(() => playPolishedTone(784, 0.25, 'triangle', 0.03), 450);
      }
      console.log('🔊 Game start sound played successfully');
    } catch (error) {
      // Completely silent fallback - never block the game
      console.warn('🔊 Game start sound failed, continuing silently:', error);
    }
  }, [playAudioFile, playPolishedTone]);

  const playPlayerJoin = useCallback(async () => {
    const played = await playAudioFile('player-join.mp3', 0.3);
    if (!played) {
      // Friendly notification bell
      playPolishedTone(880, 0.12, 'triangle', 0.03);
      setTimeout(() => playPolishedTone(1046, 0.15, 'triangle', 0.02), 80);
    }
  }, [playAudioFile, playPolishedTone]);

  const playButtonClick = useCallback(async () => {
    const played = await playAudioFile('button-click.mp3', 0.2);
    if (!played) {
      // Very subtle click
      playPolishedTone(1000, 0.04, 'triangle', 0.02);
    }
  }, [playAudioFile, playPolishedTone]);

  const playCardPlace = useCallback(async () => {
    const played = await playAudioFile('card-place.mp3', 0.3);
    if (!played) {
      // Soft placement sound
      playPolishedTone(220, 0.08, 'triangle', 0.03);
      setTimeout(() => playPolishedTone(196, 0.1, 'sine', 0.02), 30);
    }
  }, [playAudioFile, playPolishedTone]);

  return {
    playCardSuccess,
    playCardError,
    playTurnTransition,
    playGameStart,
    playPlayerJoin,
    playButtonClick,
    playCardPlace
  };
}
