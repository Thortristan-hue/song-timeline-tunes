
import { useCallback } from 'react';

export function useSoundEffects() {
  // Web Audio API for generating sound effects
  const createAudioContext = useCallback(() => {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  }, []);

  const playBeep = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const audioContext = createAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Sound effect failed:', error);
    }
  }, [createAudioContext]);

  const playCardSuccess = useCallback(() => {
    // Happy ascending notes
    playBeep(523, 0.1); // C5
    setTimeout(() => playBeep(659, 0.1), 100); // E5
    setTimeout(() => playBeep(784, 0.2), 200); // G5
  }, [playBeep]);

  const playCardError = useCallback(() => {
    // Descending error sound
    playBeep(220, 0.15, 'square'); // A3
    setTimeout(() => playBeep(196, 0.15, 'square'), 150); // G3
    setTimeout(() => playBeep(174, 0.3, 'square'), 300); // F3
  }, [playBeep]);

  const playTurnTransition = useCallback(() => {
    // Quick whoosh sound
    playBeep(800, 0.05);
    setTimeout(() => playBeep(600, 0.05), 50);
    setTimeout(() => playBeep(400, 0.1), 100);
  }, [playBeep]);

  const playGameStart = useCallback(() => {
    // Fanfare-like sound
    playBeep(392, 0.2); // G4
    setTimeout(() => playBeep(523, 0.2), 200); // C5
    setTimeout(() => playBeep(659, 0.2), 400); // E5
    setTimeout(() => playBeep(784, 0.4), 600); // G5
  }, [playBeep]);

  const playPlayerJoin = useCallback(() => {
    // Two-tone notification
    playBeep(440, 0.1);
    setTimeout(() => playBeep(554, 0.2), 100);
  }, [playBeep]);

  const playButtonClick = useCallback(() => {
    // Quick click sound
    playBeep(800, 0.05, 'square');
  }, [playBeep]);

  const playCardPlace = useCallback(() => {
    // Soft placement sound
    playBeep(300, 0.1, 'triangle');
    setTimeout(() => playBeep(200, 0.1, 'triangle'), 50);
  }, [playBeep]);

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
