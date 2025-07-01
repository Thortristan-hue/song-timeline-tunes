
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Player, Song, GameRoom } from '@/types/game';
import { DeezerAudioService } from '@/services/DeezerAudioService';

export type DatabasePlayer = Database['public']['Tables']['players']['Row'];
export type DatabaseRoom = Database['public']['Tables']['game_rooms']['Row'];

// Game service functions for managing multiplayer game state
export class GameService {
  // Get current turn player from the game state
  static getCurrentPlayer(players: Player[], currentPlayerIndex: number): Player {
    if (!players || players.length === 0) {
      throw new Error('No players available');
    }
    return players[currentPlayerIndex % players.length];
  }

  // Advance to next player's turn
  static getNextPlayerIndex(currentIndex: number, totalPlayers: number): number {
    return (currentIndex + 1) % totalPlayers;
  }

  // Update game room with new turn and mystery card
  static async updateGameTurn(
    roomId: string, 
    newPlayerIndex: number, 
    mysteryCard: Song,
    songIndex: number
  ): Promise<void> {
    const { error } = await supabase
      .from('game_rooms')
      .update({
        current_turn: newPlayerIndex,
        current_song_index: songIndex,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      console.error('Failed to update game turn:', error);
      throw error;
    }
  }

  // Update player timeline after card placement
  static async updatePlayerTimeline(
    playerId: string,
    newTimeline: Song[],
    newScore: number
  ): Promise<void> {
    const { error } = await supabase
      .from('players')
      .update({
        timeline: newTimeline,
        score: newScore,
        last_active: new Date().toISOString()
      })
      .eq('id', playerId);

    if (error) {
      console.error('Failed to update player timeline:', error);
      throw error;
    }
  }

  // Record game move for audit trail
  static async recordGameMove(
    roomId: string,
    playerId: string,
    moveType: 'card_placement' | 'turn_advance' | 'game_end',
    moveData: any
  ): Promise<void> {
    const { error } = await supabase
      .from('game_moves')
      .insert({
        room_id: roomId,
        player_id: playerId,
        move_type: moveType,
        move_data: moveData
      });

    if (error) {
      console.error('Failed to record game move:', error);
      throw error;
    }
  }

  // Check if game should end (all players have full timelines)
  static shouldGameEnd(players: Player[], maxTimelineLength: number = 10): boolean {
    return players.every(player => player.timeline.length >= maxTimelineLength);
  }

  // End the game and update room phase
  static async endGame(roomId: string): Promise<void> {
    const { error } = await supabase
      .from('game_rooms')
      .update({
        phase: 'finished',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      console.error('Failed to end game:', error);
      throw error;
    }
  }

  // Get fresh audio URL for mystery card
  static async getFreshAudioUrl(song: Song): Promise<string> {
    try {
      if (song.preview_url) {
        // Use the DeezerAudioService to get a proxied URL
        const audioService = new DeezerAudioService();
        return audioService.getProxiedUrl(song.preview_url);
      }
      throw new Error('No preview URL available');
    } catch (error) {
      console.error('Failed to get fresh audio URL:', error);
      throw error;
    }
  }
}
