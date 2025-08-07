import { useCallback } from 'react';
import { GameSounds } from '@/utils/unifiedAudioEngine';

export function useSoundEffects() {
  // All sound effects now use the robust audio utility
  
  const playCardSuccess = useCallback(async () => {
    await GameSounds.correct();
  }, []);

  const playCardError = useCallback(async () => {
    await GameSounds.incorrect();
  }, []);

  const playTurnTransition = useCallback(async () => {
    await GameSounds.turnTransition();
  }, []);

  const playGameStart = useCallback(async () => {
    await GameSounds.gameStart();
  }, []);

  const playPlayerJoin = useCallback(async () => {
    await GameSounds.playerJoin();
  }, []);

  const playButtonClick = useCallback(async () => {
    await GameSounds.buttonClick();
  }, []);

  const playCardPlace = useCallback(async () => {
    await GameSounds.cardPlace();
  }, []);

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