import { useState } from 'react';
import { Song, Player, GameRoom } from '@/types/game';

interface UseClassicGameLogicResult {
  isPlacing: boolean;
  placeCard: (song: Song, position: number) => Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; }>;
}

export function useClassicGameLogic(
  room: GameRoom | null,
  players: Player[],
  currentPlayer: Player | null,
  isHost: boolean,
  customSongs: Song[]
): UseClassicGameLogicResult {
  const [isPlacing, setIsPlacing] = useState(false);

  const placeCard = async (song: Song, position: number): Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; }> => {
    if (!room || !currentPlayer) {
      return { success: false };
    }

    setIsPlacing(true);

    try {
      const { GameService } = await import('@/services/gameService');
      const result = await GameService.placeCardAndAdvanceTurn(
        room.id,
        currentPlayer.id,
        song,
        position,
        customSongs
      );

      return result;
    } catch (error) {
      console.error('Failed to place card:', error);
      return { success: false };
    } finally {
      setIsPlacing(false);
    }
  };

  return {
    isPlacing,
    placeCard,
  };
}
