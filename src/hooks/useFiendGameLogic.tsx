import { useState } from 'react';
import { GameRoom, Player, Song } from '@/types/game';
import { GameService } from '@/services/gameService';

interface UseFiendGameLogicResult {
  currentRound: number;
  isPlacing: boolean;
  placeCard: (song: Song, position: number) => Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; }>;
  endGame: () => Promise<void>;
}

export function useFiendGameLogic(
  room: GameRoom | null,
  players: Player[],
  currentPlayer: Player | null,
  isHost: boolean,
  customSongs: Song[]
): UseFiendGameLogicResult {
  const [currentRound, setCurrentRound] = useState(1);
  const [isPlacing, setIsPlacing] = useState(false);

  const placeCard = async (song: Song, position: number): Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; }> => {
    if (!room || !currentPlayer) {
      return { success: false };
    }

    setIsPlacing(true);

    try {
      // Use the correct method signature with only 4 parameters
      const result = await GameService.placeCard(
        room.id,
        currentPlayer.id,
        song,
        position
      );

      if (result.success) {
        setCurrentRound(prev => prev + 1);
        
        // Check if we've reached the target rounds
        const targetRounds = room.gamemode_settings?.rounds || 10;
        if (currentRound >= targetRounds) {
          // End the game
          await GameService.endGame(room.id);
          
          // Find the winner (highest score)
          const winner = players.reduce((prev, current) => 
            (current.score > prev.score) ? current : prev
          );
          
          return { success: true, gameEnded: true, winner, correct: result.correct };
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
    currentRound,
    isPlacing,
    placeCard,
    endGame
  };
}
