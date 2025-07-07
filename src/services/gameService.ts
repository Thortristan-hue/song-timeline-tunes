
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

  // ENHANCED: Check if game should end - strict 10 card rule
  static shouldGameEnd(players: Player[], maxTimelineLength: number = 10): { shouldEnd: boolean; winner: Player | null } {
    const winner = players.find(player => player.timeline.length >= maxTimelineLength);
    return {
      shouldEnd: !!winner,
      winner: winner || null
    };
  }

  // ENHANCED: End the game and update room phase with winner
  static async endGame(roomId: string, winnerId?: string): Promise<void> {
    const updateData: any = {
      phase: 'finished',
      updated_at: new Date().toISOString()
    };

    if (winnerId) {
      updateData.winner_id = winnerId;
    }

    const { error } = await supabase
      .from('game_rooms')
      .update(updateData)
      .eq('id', roomId);

    if (error) {
      console.error('Failed to end game:', error);
      throw error;
    }

    console.log('✅ Game ended successfully in database');
  }

  // Get fresh audio URL for mystery card
  static async getFreshAudioUrl(song: Song): Promise<string> {
    try {
      if (song.preview_url) {
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

  // ENHANCED: Initialize game with mystery card and starting cards
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

    // ENHANCED: Pick random first player instead of first joined
    const randomPlayerIndex = Math.floor(Math.random() * allPlayers.length);
    const firstPlayerId = allPlayers[randomPlayerIndex].id;
    console.log(`🎯 INIT: Setting random first turn to player: ${allPlayers[randomPlayerIndex].name} (ID: ${firstPlayerId})`);

    // Set the mystery card AND first player turn in the database
    await this.setCurrentSong(roomId, initialMysteryCard);

    // Set current turn to random player and initialize turn tracking
    const { error } = await supabase
      .from('game_rooms')
      .update({
        current_turn: randomPlayerIndex,
        current_player_id: firstPlayerId,
        phase: 'playing',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      console.error('❌ INIT: Failed to initialize game state:', error);
      throw error;
    }

    console.log('✅ INIT: Game initialized with mystery card and random first player turn set');
    return initialMysteryCard;
  }

  // ENHANCED: Place card and advance turn with better validation and game end checking
  static async placeCard(
    roomId: string,
    playerId: string,
    song: Song,
    position: number,
    availableSongs: Song[]
  ): Promise<{ success: boolean; correct?: boolean; error?: string; gameEnded?: boolean; winner?: Player }> {
    try {
      console.log('🃏 CARD PLACEMENT: Starting with enhanced turn advancement and game end checking');

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

      // ENHANCED: Calculate if placement was correct (chronological order by release year)
      let isCorrect = true;
      if (newTimeline.length > 1) {
        for (let i = 1; i < newTimeline.length; i++) {
          const prevYear = parseInt(newTimeline[i-1].release_year);
          const currYear = parseInt(newTimeline[i].release_year);
          if (prevYear > currYear) {
            isCorrect = false;
            break;
          }
        }
      }

      const newScore = playerData.score + (isCorrect ? 1 : 0);

      // Update player timeline
      await this.updatePlayerTimeline(playerId, newTimeline, newScore);

      // ENHANCED: Check for game end condition before advancing turn
      const gameEndCheck = this.shouldGameEnd([{ ...playerData, timeline: newTimeline, score: newScore } as Player]);
      if (gameEndCheck.shouldEnd && gameEndCheck.winner) {
        console.log('🎯 GAME END: Player reached 10 cards:', gameEndCheck.winner.name);
        await this.endGame(roomId, playerId);
        return { 
          success: true, 
          correct: isCorrect, 
          gameEnded: true,
          winner: gameEndCheck.winner
        };
      }

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

      // ENHANCED: Advance turn properly
      const currentTurn = roomData.current_turn || 0;
      const nextTurn = (currentTurn + 1) % allPlayers.length;
      const nextPlayerId = allPlayers[nextTurn]?.id;
      
      // ENHANCED: Select next mystery card avoiding repeats
      let nextMysteryCard: Song;
      if (availableSongs && availableSongs.length > 0) {
        // Filter out songs that are already used
        const unusedSongs = availableSongs.filter(availableSong => 
          !allPlayers.some(player => 
            Array.isArray(player.timeline) && 
            (player.timeline as unknown as Song[]).some(timelineSong => timelineSong.id === availableSong.id)
          )
        );
        
        if (unusedSongs.length > 0) {
          nextMysteryCard = unusedSongs[Math.floor(Math.random() * unusedSongs.length)];
        } else {
          // If all songs are used, pick randomly from available
          nextMysteryCard = availableSongs[Math.floor(Math.random() * availableSongs.length)];
        }
      } else {
        // Fallback: use the current song if no available songs
        nextMysteryCard = song;
      }

      console.log('🎯 TURN ADVANCEMENT: Moving to next turn with new mystery card:', {
        nextTurn,
        nextPlayerId,
        nextPlayerName: allPlayers[nextTurn]?.name,
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
        console.error('❌ TURN ADVANCEMENT: Failed to advance turn:', updateError);
        throw updateError;
      }

      // Record the move
      await this.recordGameMove(roomId, playerId, 'card_placement', {
        song,
        position,
        correct: isCorrect,
        nextMysteryCard: nextMysteryCard.id,
        newScore,
        timelineLength: newTimeline.length
      });

      console.log('✅ CARD PLACEMENT: Card placed and turn advanced successfully');
      return { success: true, correct: isCorrect };
    } catch (error) {
      console.error('❌ CARD PLACEMENT: Failed to place card:', error);
      return { success: false, error: 'Failed to place card' };
    }
  }
}
