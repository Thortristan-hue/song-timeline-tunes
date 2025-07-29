import { supabase } from '@/integrations/supabase/client';
import { Song, Player } from '@/types/game';
import { getDefaultCharacter } from '@/constants/characters';
import type { Json } from '@/integrations/supabase/types';

export class GameService {
  static async initializeGameWithStartingCards(roomId: string, availableSongs: Song[]): Promise<void> {
    try {
      console.log('🎯 Initializing game with starting cards for room:', roomId);
      
      // Get all players in the room
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false);

      if (playersError) throw playersError;

      console.log('👥 Found players for card assignment:', players?.length || 0);

      // Assign random starting cards to players who don't have any
      if (players && players.length > 0) {
        const updatePromises = players.map(async (player) => {
          const currentTimeline = Array.isArray(player.timeline) ? player.timeline : [];
          
          if (currentTimeline.length === 0) {
            const randomSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
            console.log(`🃏 Assigning starting card to ${player.name}:`, randomSong.deezer_title);
            
            return supabase
              .from('players')
              .update({
                timeline: [randomSong] as unknown as Json
              })
              .eq('id', player.id);
          }
          return Promise.resolve();
        });

        await Promise.all(updatePromises);
      }

      // Set game phase to playing and initialize turn
      const { error: roomError } = await supabase
        .from('game_rooms')
        .update({
          phase: 'playing',
          current_turn: 0
        })
        .eq('id', roomId);

      if (roomError) throw roomError;

      console.log('✅ Game initialized with starting cards');
    } catch (error) {
      console.error('❌ Failed to initialize game:', error);
      throw error;
    }
  }

  static convertDatabasePlayerToPlayer(dbPlayer: any): Player {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      color: dbPlayer.color,
      timelineColor: dbPlayer.timeline_color,
      score: dbPlayer.score || 0,
      timeline: Array.isArray(dbPlayer.timeline) ? (dbPlayer.timeline as unknown as Song[]) : [],
      character: dbPlayer.character || getDefaultCharacter().id
    };
  }

  static async placeCardAndAdvanceTurn(roomId: string, playerId: string, song: Song, position: number, availableSongs: Song[]): Promise<{ success: boolean; correct: boolean; gameEnded?: boolean; winner?: Player | null; error?: string }> {
    try {
      console.log(`Placing card ${song.deezer_title} at position ${position} for player ${playerId} in room ${roomId}`);

      // 1. Get the current player and room data
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (playerError) {
        console.error('Error fetching player:', playerError);
        return { success: false, correct: false, error: 'Failed to fetch player' };
      }

      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('Error fetching room:', roomError);
        return { success: false, correct: false, error: 'Failed to fetch room' };
      }

      if (!room) {
        console.error('Room not found');
        return { success: false, correct: false, error: 'Room not found' };
      }

      // 2. Validate the card placement
      const currentTimeline = Array.isArray(player.timeline) ? (player.timeline as unknown as Song[]) : [];
      const songAsAny = song as any;
      const correctPlacement =
        currentTimeline.length === 0 || // First card is always correct
        (position === 0 && parseInt(songAsAny.release_year) <= parseInt((currentTimeline[0] as any).release_year)) ||
        (position === currentTimeline.length && parseInt(songAsAny.release_year) >= parseInt((currentTimeline[currentTimeline.length - 1] as any).release_year)) ||
        (position > 0 && position < currentTimeline.length &&
          parseInt(songAsAny.release_year) >= parseInt((currentTimeline[position - 1] as any).release_year) &&
          parseInt(songAsAny.release_year) <= parseInt((currentTimeline[position] as any).release_year));

      // 3. Update player's timeline
      const newTimeline = [...currentTimeline];
      newTimeline.splice(position, 0, song);

      const { error: updateError } = await supabase
        .from('players')
        .update({ timeline: newTimeline as unknown as Json })
        .eq('id', playerId);

      if (updateError) {
        console.error('Error updating timeline:', updateError);
        return { success: false, correct: false, error: 'Failed to update timeline' };
      }

      // 4. Advance the turn
      const nextTurn = (room.current_turn === undefined ? 0 : room.current_turn) + 1;
      const playersInRoom = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .not('id', 'eq', room.host_id);

      if (playersInRoom.error) {
        console.error('Error fetching players in room:', playersInRoom.error);
        return { success: false, correct: false, error: 'Failed to fetch players in room' };
      }

      const playerCount = playersInRoom.data?.length || 0;
      const nextPlayersTurn = nextTurn % playerCount;

      const nextPlayer = playersInRoom.data && playersInRoom.data[nextPlayersTurn];

      // 5. Check if the game has ended (e.g., player has 10 cards)
      let gameEnded = false;
      let winner: Player | null = null;

      const winningCardsCount = 10; // Define the number of cards needed to win

      if (newTimeline.length >= winningCardsCount) {
        gameEnded = true;

        // Convert database player to frontend player
        winner = GameService.convertDatabasePlayerToPlayer(player);

        console.log(`Game ended! Winner: ${winner.name}`);
      }

      // 6. Update the game room
      const { error: roomUpdateError } = await supabase
        .from('game_rooms')
        .update({
          current_turn: nextTurn,
          current_player_id: nextPlayer ? nextPlayer.id : null
        })
        .eq('id', roomId);

      if (roomUpdateError) {
        console.error('Error updating game room:', roomUpdateError);
        return { success: false, correct: false, error: 'Failed to update game room' };
      }

      console.log(`Card placed successfully. Correct placement: ${correctPlacement}. Next turn: ${nextTurn}`);
      return { success: true, correct: correctPlacement, gameEnded, winner };
    } catch (error) {
      console.error('Error placing card:', error);
      return { success: false, correct: false, error: 'Failed to place card' };
    }
  }

  static async setCurrentSong(roomId: string, song: Song): Promise<void> {
    try {
      console.log(`Setting current song to ${song.deezer_title} in room ${roomId}`);

      const { error } = await supabase
        .from('game_rooms')
        .update({ current_song: song as unknown as Json })
        .eq('id', roomId);

      if (error) {
        console.error('Error setting current song:', error);
        throw error;
      }

      console.log('Current song set successfully');
    } catch (error) {
      console.error('Failed to set current song:', error);
      throw error;
    }
  }

  static async updatePlayerTimeline(playerId: string, timeline: Song[], score?: number): Promise<void> {
    try {
      const updateData: any = {
        timeline: timeline as unknown as Json
      };

      if (score !== undefined) {
        updateData.score = score;
      }

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId);

      if (error) {
        console.error('Error updating player timeline:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update player timeline:', error);
      throw error;
    }
  }

  static async updatePlayerScore(roomId: string, playerId: string, score: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('players')
        .update({ score })
        .eq('id', playerId)
        .eq('room_id', roomId);

      if (error) {
        console.error('Error updating player score:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update player score:', error);
      throw error;
    }
  }

  static async endGame(roomId: string, winnerId?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          phase: 'finished' as any,
          winner_id: winnerId || null
        })
        .eq('id', roomId);

      if (error) {
        console.error('Error ending game:', error);
        throw error;
      }

      console.log('Game ended successfully');
    } catch (error) {
      console.error('Failed to end game:', error);
      throw error;
    }
  }

  static async resetGameForReplay(roomId: string): Promise<void> {
    try {
      // Reset room to lobby phase
      const { error: roomError } = await supabase
        .from('game_rooms')
        .update({
          phase: 'lobby' as any,
          current_turn: 0,
          current_song: null,
          current_player_id: null,
          winner_id: null
        })
        .eq('id', roomId);

      if (roomError) throw roomError;

      // Reset all players' timelines and scores
      const { error: playersError } = await supabase
        .from('players')
        .update({
          timeline: [] as unknown as Json,
          score: 0
        })
        .eq('room_id', roomId);

      if (playersError) throw playersError;

      console.log('Game reset for replay');
    } catch (error) {
      console.error('Failed to reset game:', error);
      throw error;
    }
  }
}
