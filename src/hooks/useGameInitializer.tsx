
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { GameInitializer } from '@/services/gameInitializer';
import { Song } from '@/types/game';

export function useGameInitializer() {
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  const startGame = async (roomId: string, songs: Song[]): Promise<boolean> => {
    if (isInitializing) {
      console.warn('Game initialization already in progress');
      return false;
    }

    setIsInitializing(true);
    
    try {
      console.log('🎮 useGameInitializer: Starting game initialization...');
      
      const result = await GameInitializer.startGame(roomId, songs);
      
      if (result.success) {
        console.log('✅ useGameInitializer: Game started successfully');
        toast({
          title: "Game Started!",
          description: "The game has begun. Good luck!",
        });
        return true;
      } else {
        console.error('❌ useGameInitializer: Game start failed:', result.error);
        toast({
          title: "Failed to Start Game",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('❌ useGameInitializer: Unexpected error:', error);
      toast({
        title: "Game Start Error",
        description: "An unexpected error occurred while starting the game",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  const resetToLobby = async (roomId: string): Promise<boolean> => {
    if (isInitializing) {
      console.warn('Game operation already in progress');
      return false;
    }

    setIsInitializing(true);
    
    try {
      console.log('🔄 useGameInitializer: Resetting to lobby...');
      
      const result = await GameInitializer.resetGameToLobby(roomId);
      
      if (result.success) {
        console.log('✅ useGameInitializer: Reset to lobby successfully');
        toast({
          title: "Game Reset",
          description: "The game has been reset to the lobby",
        });
        return true;
      } else {
        console.error('❌ useGameInitializer: Reset failed:', result.error);
        toast({
          title: "Failed to Reset Game",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('❌ useGameInitializer: Unexpected error:', error);
      toast({
        title: "Reset Error",
        description: "An unexpected error occurred while resetting the game",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    startGame,
    resetToLobby,
    isInitializing
  };
}
