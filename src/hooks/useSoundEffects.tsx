
import { useCallback } from 'react';
import { soundEffects } from '@/lib/SoundEffects';

export function useSoundEffects() {
  const playSound = useCallback((soundName: string) => {
    soundEffects.playSound(soundName as any);
  }, []);

  const playPlayerAction = useCallback(() => {
    soundEffects.playSound('button-click');
  }, []);

  const playCardSuccess = useCallback(() => {
    soundEffects.playSound('card-success');
  }, []);

  const playCardError = useCallback(() => {
    soundEffects.playSound('card-error');
  }, []);

  const playGameVictory = useCallback(() => {
    soundEffects.playSound('game-victory');
  }, []);

  const stopAllSounds = useCallback(() => {
    soundEffects.stopAllSounds();
  }, []);

  return {
    playSound,
    playPlayerAction,
    playCardSuccess,
    playCardError,
    playGameVictory,
    stopAllSounds
  };
}
