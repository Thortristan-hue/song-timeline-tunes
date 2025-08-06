
import { useState } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { GameService } from '@/services/gameService';

interface UseSprintGameLogicResult {
  correctPlacements: number;
  isPlacing: boolean;
  placeCard: (song: Song, position: number) => Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; }>;
  endGame: () => Promise<void>;
}

export function useSprintGameLogic(
  room: GameRoom | null,
  players: Player[],
  currentPlayer: Player | null,
  isHost: boolean,
  customSongs: Song[]
): UseSprintGameLogicResult {
  const [correctPlacements, setCorrectPlacements] = useState<number>(0);
  const [isPlacing, setIsPlacing] = useState<boolean>(false);

  const placeCard = async (song: Song, position: number): Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; }> => {
    if (!room || !currentPlayer) {
      return { success: false };
    }

    setIsPlacing(true);

    try {
      const result = await GameService.placeCard(
        room.id,
        currentPlayer.id,
        song,
        position
      );

      if (result.success && result.correct) {
        setCorrectPlacements(prev => prev + 1);
        
        // Check if we've reached the target cards
        const targetCards = room.gamemode_settings?.targetCards || 20;
        if (correctPlacements + 1 >= targetCards) {
          // Player wins by reaching target
          await GameService.endGame(room.id);
          return { success: true, gameEnded: true, winner: currentPlayer, correct: true };
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to place card:', error);
      return { success: false };
    } finally {
      setIsPlacing(false);
    }
  };

  const endGame = async (): Promise<void> => {
    if (!room) return;
    
    try {
      await GameService.endGame(room.id);
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  };

  return {
    correctPlacements,
    isPlacing,
    placeCard,
    endGame
  };
}
