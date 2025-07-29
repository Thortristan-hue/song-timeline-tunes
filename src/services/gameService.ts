
import { supabase } from '@/integrations/supabase/client';
import { Song, Player } from '@/types/game';
import type { Json } from '@/integrations/supabase/types';

export class GameService {
  static async initializeGameWithStartingCards(roomId: string, availableSongs: Song[]): Promise<void> {
    try {
      console.log('🎮 Initializing game with starting cards for room:', roomId);
      
      // Get all non-host players in the room
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false);

      if (playersError) {
        console.error('❌ Failed to fetch players for starting cards:', playersError);
        return;
      }

      if (!players || players.length === 0) {
        console.log('⚠️ No players found to assign starting cards');
        return;
      }

      console.log('👥 Found players for card assignment:', players.length);

      // Assign a random starting card to each player
      for (const player of players) {
        const timeline = Array.isArray(player.timeline) ? player.timeline as unknown as Song[] : [];
        
        if (timeline.length === 0) {
          const randomSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
          console.log(`🃏 Assigning starting card to ${player.name}:`, randomSong.deezer_title);
          
          const { error: updateError } = await supabase
            .from('players')
            .update({
              timeline: [randomSong] as unknown as Json
            })
            .eq('id', player.id);

          if (updateError) {
            console.error(`❌ Failed to assign starting card to ${player.name}:`, updateError);
          } else {
            console.log(`✅ Successfully assigned starting card to ${player.name}`);
          }
        }
      }

      // Set the first mystery card for the game
      if (availableSongs.length > 1) {
        // Use the second song as the first mystery card (first is used for starting cards)
        const mysteryCard = availableSongs[1];
        console.log('🎵 Setting initial mystery card:', mysteryCard.deezer_title);
        
        const { error: mysteryError } = await supabase
          .from('game_rooms')
          .update({
            current_song: mysteryCard as unknown as Json,
            current_turn: 0
          })
          .eq('id', roomId);

        if (mysteryError) {
          console.error('❌ Failed to set initial mystery card:', mysteryError);
        } else {
          console.log('✅ Initial mystery card set successfully');
        }
      }

      console.log('✅ Game initialized with starting cards');
    } catch (error) {
      console.error('❌ Failed to initialize game with starting cards:', error);
    }
  }

  static async placeCardAndAdvanceTurn(
    roomId: string, 
    playerId: string, 
    song: Song, 
    position: number,
    availableSongs: Song[] = []
  ): Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; error?: string }> {
    try {
      console.log('🎯 GameService: Processing card placement and turn advancement');
      
      // Get current player data
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (playerError || !player) {
        console.error('❌ Failed to get player data:', playerError);
        return { success: false, error: 'Failed to get player data' };
      }

      // Update player's timeline
      const currentTimeline = Array.isArray(player.timeline) ? player.timeline as unknown as Song[] : [];
      const newTimeline = [...currentTimeline];
      newTimeline.splice(position, 0, song);

      // Check if timeline is correct (songs in chronological order)
      const isCorrect = this.isTimelineCorrect(newTimeline);
      
      console.log('🎯 Timeline placement result:', {
        playerId,
        position,
        timelineLength: newTimeline.length,
        isCorrect
      });

      // Update player in database
      const { error: updateError } = await supabase
        .from('players')
        .update({
          timeline: newTimeline as unknown as Json,
          score: isCorrect ? (player.score || 0) + 1 : (player.score || 0)
        })
        .eq('id', playerId);

      if (updateError) {
        console.error('❌ Failed to update player timeline:', updateError);
        return { success: false, error: 'Failed to update player timeline' };
      }

      // Check for winner (10 cards in timeline)
      if (newTimeline.length >= 10) {
        console.log('🏆 Player won with 10 cards!', player.name);
        
        const { error: gameEndError } = await supabase
          .from('game_rooms')
          .update({ phase: 'finished' })
          .eq('id', roomId);

        if (gameEndError) {
          console.error('❌ Failed to end game:', gameEndError);
        }

        return { 
          success: true, 
          correct: isCorrect, 
          gameEnded: true, 
          winner: {
            id: player.id,
            name: player.name,
            color: player.color,
            timelineColor: player.timeline_color,
            score: isCorrect ? (player.score || 0) + 1 : (player.score || 0),
            timeline: newTimeline,
            character: player.character || 'char_dave'
          }
        };
      }

      // Get current room state to determine next song
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('current_turn, songs')
        .eq('id', roomId)
        .single();

      if (roomError || !room) {
        console.error('❌ Failed to get room data:', roomError);
        return { success: false, error: 'Failed to get room data' };
      }

      // Advance to next mystery card
      const nextTurn = (room.current_turn || 0) + 1;
      const songsToUse = availableSongs.length > 0 ? availableSongs : (room.songs as unknown as Song[] || []);
      
      console.log('🎯 Advancing turn:', {
        nextTurn,
        availableSongsCount: songsToUse.length,
        roomSongsCount: (room.songs as unknown as Song[] || []).length
      });

      if (songsToUse.length === 0) {
        console.error('⚠️ No songs available for next round');
        return { success: true, correct: isCorrect };
      }

      // Select next mystery card (cycle through available songs)
      const nextSongIndex = nextTurn % songsToUse.length;
      const nextSong = songsToUse[nextSongIndex];

      if (!nextSong) {
        console.error('⚠️ No valid song available for next round');
        return { success: true, correct: isCorrect };
      }

      console.log('🎵 Setting next mystery card:', nextSong.deezer_title, 'for turn', nextTurn);

      // Update room with next song and turn
      const { error: roomUpdateError } = await supabase
        .from('game_rooms')
        .update({
          current_song: nextSong as unknown as Json,
          current_turn: nextTurn
        })
        .eq('id', roomId);

      if (roomUpdateError) {
        console.error('❌ Failed to update room with next song:', roomUpdateError);
        return { success: false, error: 'Failed to update room with next song' };
      }

      console.log('✅ Card placed and turn advanced successfully');
      return { success: true, correct: isCorrect };

    } catch (error) {
      console.error('❌ Failed to place card and advance turn:', error);
      return { success: false, error: 'Failed to place card and advance turn' };
    }
  }

  private static isTimelineCorrect(timeline: Song[]): boolean {
    for (let i = 0; i < timeline.length - 1; i++) {
      const currentYear = parseInt(timeline[i].release_year);
      const nextYear = parseInt(timeline[i + 1].release_year);
      
      if (isNaN(currentYear) || isNaN(nextYear)) {
        continue; // Skip invalid years
      }
      
      if (currentYear > nextYear) {
        return false;
      }
    }
    return true;
  }

  static async setCurrentSong(roomId: string, song: Song): Promise<void> {
    try {
      console.log('🎵 Setting current song for room:', roomId, song.deezer_title);
      
      const { error } = await supabase
        .from('game_rooms')
        .update({
          current_song: song as unknown as Json
        })
        .eq('id', roomId);

      if (error) {
        console.error('❌ Failed to set current song:', error);
        throw error;
      }

      console.log('✅ Current song updated successfully');
    } catch (error) {
      console.error('❌ Failed to set current song:', error);
      throw error;
    }
  }

  static async updatePlayerTimeline(playerId: string, timeline: Song[], score?: number): Promise<void> {
    try {
      console.log('🎯 Updating player timeline:', playerId, 'with', timeline.length, 'songs');
      
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
        console.error('❌ Failed to update player timeline:', error);
        throw error;
      }

      console.log('✅ Player timeline updated successfully');
    } catch (error) {
      console.error('❌ Failed to update player timeline:', error);
      throw error;
    }
  }

  static async updatePlayerScore(playerId: string, score: number): Promise<void> {
    try {
      console.log('🎯 Updating player score:', playerId, 'to', score);
      
      const { error } = await supabase
        .from('players')
        .update({ score })
        .eq('id', playerId);

      if (error) {
        console.error('❌ Failed to update player score:', error);
        throw error;
      }

      console.log('✅ Player score updated successfully');
    } catch (error) {
      console.error('❌ Failed to update player score:', error);
      throw error;
    }
  }

  static async endGame(roomId: string, winnerId?: string): Promise<void> {
    try {
      console.log('🏁 Ending game for room:', roomId, 'winner:', winnerId || 'none');
      
      const { error } = await supabase
        .from('game_rooms')
        .update({ phase: 'finished' })
        .eq('id', roomId);

      if (error) {
        console.error('❌ Failed to end game:', error);
        throw error;
      }

      console.log('✅ Game ended successfully');
    } catch (error) {
      console.error('❌ Failed to end game:', error);
      throw error;
    }
  }

  static async resetGameForReplay(roomId: string): Promise<void> {
    try {
      console.log('🔄 Resetting game for replay:', roomId);
      
      // Reset room to lobby phase
      const { error: roomError } = await supabase
        .from('game_rooms')
        .update({ 
          phase: 'lobby',
          current_turn: 0,
          current_song: null,
          current_player_id: null
        })
        .eq('id', roomId);

      if (roomError) {
        console.error('❌ Failed to reset room:', roomError);
        throw roomError;
      }

      // Reset all players' timelines and scores
      const { error: playersError } = await supabase
        .from('players')
        .update({ 
          timeline: [] as unknown as Json,
          score: 0
        })
        .eq('room_id', roomId);

      if (playersError) {
        console.error('❌ Failed to reset players:', playersError);
        throw playersError;
      }

      console.log('✅ Game reset for replay successfully');
    } catch (error) {
      console.error('❌ Failed to reset game for replay:', error);
      throw error;
    }
  }
}
