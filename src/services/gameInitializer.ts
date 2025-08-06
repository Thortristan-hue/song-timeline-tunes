
import { supabase } from '@/integrations/supabase/client';
import { GameService } from '@/services/gameService';
import { Song } from '@/types/game';

export class GameInitializer {
  /**
   * Initializes the game state authoritatively on the server
   * This prevents race conditions between local and remote state
   */
  static async startGame(roomId: string, songs: Song[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚀 GameInitializer: Starting game for room:', roomId);

      // Validate inputs
      if (!roomId || !songs || songs.length === 0) {
        throw new Error('Invalid room ID or songs provided');
      }

      // First, ensure we have enough songs for the game
      if (songs.length < 2) {
        throw new Error('Need at least 2 songs to start the game');
      }

      // Initialize game with starting cards - this will set phase to 'playing'
      await GameService.initializeGameWithStartingCards(roomId, songs);

      console.log('✅ GameInitializer: Game started successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ GameInitializer: Failed to start game:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Resets the game back to lobby state
   */
  static async resetGameToLobby(roomId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 GameInitializer: Resetting game to lobby for room:', roomId);

      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          phase: 'lobby',
          current_song: null,
          current_player_id: null,
          current_turn: 0
        })
        .eq('id', roomId);

      if (error) throw error;

      // Reset all players' timelines and scores
      const { error: playersError } = await supabase
        .from('players')
        .update({
          timeline: [],
          score: 0
        })
        .eq('room_id', roomId)
        .eq('is_host', false);

      if (playersError) throw playersError;

      console.log('✅ GameInitializer: Game reset to lobby successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ GameInitializer: Failed to reset game:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}
