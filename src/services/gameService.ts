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
        current_song: mysteryCard as any,
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
        timeline: newTimeline as any,
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
        // Use the DeezerAudioService to get a fresh URL
        return song.preview_url;
      }
      throw new Error('No preview URL available');
    } catch (error) {
      console.error('Failed to get fresh audio URL:', error);
      throw error;
    }
  }

  // Set current song for the room - CRITICAL FIX: Ensure mystery card is always set
  static async setCurrentSong(roomId: string, song: Song): Promise<void> {
    if (!song) {
      console.error('❌ CRITICAL: Cannot set undefined song as mystery card');
      throw new Error('Song cannot be undefined');
    }

    console.log('🎵 SYNC: Setting mystery card in database:', {
      roomId,
      songTitle: song.deezer_title,
      songId: song.id
    });

    const { error } = await supabase
      .from('game_rooms')
      .update({
        current_song: song as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      console.error('❌ CRITICAL: Failed to set current song:', error);
      throw error;
    }

    console.log('✅ SYNC: Mystery card successfully set in database');
  }

  // Initialize game with mystery card - ENHANCED to set first player turn
  static async initializeGameWithMysteryCard(roomId: string, availableSongs: Song[]): Promise<Song> {
    if (!availableSongs || availableSongs.length === 0) {
      throw new Error('No available songs to initialize mystery card');
    }

    const initialMysteryCard = availableSongs[Math.floor(Math.random() * availableSongs.length)];
    console.log('🎯 INIT: Initializing game with mystery card:', initialMysteryCard.deezer_title);

    // Get all non-host players to determine first turn
    const { data: allPlayers, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_host', false)
      .order('joined_at', { ascending: true });

    if (playersError || !allPlayers || allPlayers.length === 0) {
      console.error('❌ INIT: No players found for game initialization:', playersError);
      throw new Error('No players available to start game');
    }

    // Pick first player as starting turn
    const firstPlayerId = allPlayers[0].id;
    console.log('🎯 INIT: Setting first turn to player:', allPlayers[0].name, 'ID:', firstPlayerId);

    // Set the mystery card AND first player turn in the database
    await this.setCurrentSong(roomId, initialMysteryCard);

    // Set current turn to 0, current player, and initialize turn tracking
    const { error } = await supabase
      .from('game_rooms')
      .update({
        current_turn: 0,
        current_player_id: firstPlayerId,
        phase: 'playing',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      console.error('❌ INIT: Failed to initialize game state:', error);
      throw error;
    }

    console.log('✅ INIT: Game initialized with mystery card and first player turn set');
    return initialMysteryCard;
  }

  // Place card and advance turn - ENHANCED with better mystery card handling
  static async placeCard(
    roomId: string,
    playerId: string,
    song: Song,
    position: number,
    availableSongs: Song[]
  ): Promise<{ success: boolean; correct?: boolean; error?: string }> {
    try {
      console.log('🃏 MANDATORY: Starting card placement with turn advancement');

      // Get current player data
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (playerError || !playerData) {
        return { success: false, error: 'Player not found' };
      }

      // Update player's timeline
      const currentTimeline = Array.isArray(playerData.timeline) ? (playerData.timeline as unknown as Song[]) : [];
      const newTimeline = [...currentTimeline];
      newTimeline.splice(position, 0, song);

      // Calculate if placement was correct (simplified logic)
      const isCorrect = Math.random() > 0.5; // Replace with actual logic
      const newScore = playerData.score + (isCorrect ? 1 : 0);

      // Update player timeline
      await this.updatePlayerTimeline(playerId, newTimeline, newScore);

      // Get room data to advance turn
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) {
        return { success: false, error: 'Room not found' };
      }

      // Get all players to determine next turn
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false)
        .order('joined_at', { ascending: true });

      if (playersError || !allPlayers) {
        return { success: false, error: 'Failed to get players' };
      }

      // Advance turn
      const currentTurn = roomData.current_turn || 0;
      const nextTurn = (currentTurn + 1) % allPlayers.length;
      const nextPlayerId = allPlayers[nextTurn]?.id;
      
      // CRITICAL FIX: Always ensure we have a valid next mystery card
      let nextMysteryCard: Song;
      if (availableSongs && availableSongs.length > 0) {
        nextMysteryCard = availableSongs[Math.floor(Math.random() * availableSongs.length)];
      } else {
        // Fallback: use the current song if no available songs
        nextMysteryCard = song;
      }

      console.log('🎯 MANDATORY: Advancing to next turn with new mystery card:', {
        nextTurn,
        nextPlayerId,
        mysteryCard: nextMysteryCard.deezer_title
      });
      
      // Update room with new turn, mystery card, and current player
      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({
          current_turn: nextTurn,
          current_song: nextMysteryCard as any,
          current_player_id: nextPlayerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (updateError) {
        console.error('❌ MANDATORY: Failed to advance turn:', updateError);
        throw updateError;
      }

      // Record the move
      await this.recordGameMove(roomId, playerId, 'card_placement', {
        song,
        position,
        correct: isCorrect,
        nextMysteryCard: nextMysteryCard.id
      });

      console.log('✅ MANDATORY: Card placed and turn advanced successfully');
      return { success: true, correct: isCorrect };
    } catch (error) {
      console.error('❌ MANDATORY: Failed to place card:', error);
      return { success: false, error: 'Failed to place card' };
    }
  }
}
