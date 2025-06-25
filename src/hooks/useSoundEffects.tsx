
import { useCallback } from 'react';

export function useSoundEffects() {
  // Web Audio API for generating softer, more natural sound effects
  const createAudioContext = useCallback(() => {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) => {
    try {
      const audioContext = createAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      // Softer volume and smoother fade out
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Sound effect failed:', error);
    }
  }, [createAudioContext]);

  const playCardSuccess = useCallback(() => {
    // Gentle ascending chime - like wind chimes
    playTone(523, 0.15, 'triangle', 0.08); // C5
    setTimeout(() => playTone(659, 0.15, 'triangle', 0.06), 80); // E5
    setTimeout(() => playTone(784, 0.2, 'triangle', 0.04), 160); // G5
  }, [playTone]);

  const playCardError = useCallback(() => {
    // Soft descending tone - not harsh
    playTone(330, 0.2, 'sine', 0.06); // E4
    setTimeout(() => playTone(293, 0.25, 'sine', 0.04), 120); // D4
  }, [playTone]);

  const playTurnTransition = useCallback(() => {
    // Gentle transition whoosh
    playTone(440, 0.08, 'triangle', 0.05);
    setTimeout(() => playTone(523, 0.1, 'triangle', 0.03), 40);
  }, [playTone]);

  const playGameStart = useCallback(() => {
    // Celebratory but gentle fanfare
    playTone(392, 0.15, 'triangle', 0.06); // G4
    setTimeout(() => playTone(523, 0.15, 'triangle', 0.05), 150); // C5
    setTimeout(() => playTone(659, 0.15, 'triangle', 0.04), 300); // E5
    setTimeout(() => playTone(784, 0.25, 'triangle', 0.03), 450); // G5
  }, [playTone]);

  const playPlayerJoin = useCallback(() => {
    // Friendly notification - like a soft bell
    playTone(880, 0.12, 'triangle', 0.04);
    setTimeout(() => playTone(1046, 0.15, 'triangle', 0.03), 80);
  }, [playTone]);

  const playButtonClick = useCallback(() => {
    // Very subtle click - like a soft tap
    playTone(1000, 0.04, 'triangle', 0.03);
  }, [playTone]);

  const playCardPlace = useCallback(() => {
    // Soft placement sound - like placing a card on felt
    playTone(220, 0.08, 'triangle', 0.04);
    setTimeout(() => playTone(196, 0.1, 'sine', 0.02), 30);
  }, [playTone]);

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
