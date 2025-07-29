import { supabase } from '@/integrations/supabase/client';
import { Song, Player } from '@/types/game';
import type { Json } from '@/integrations/supabase/types';
import { getDefaultCharacter } from '@/constants/characters';

interface PlaceCardResult {
  success: boolean;
  correct?: boolean;
  gameEnded?: boolean;
  winner?: Player;
  error?: string;
}

export class GameService {
  static async initializeGameWithStartingCards(roomId: string, songs: Song[]): Promise<void> {
    try {
      console.log('Initializing game with starting cards for room:', roomId);

      // Fetch all players in the room
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) {
        console.error('Error fetching players:', playersError);
        throw playersError;
      }

      console.log('Players in room:', players);

      // Assign a random starting card to each player
      for (const player of players) {
        if (Array.isArray(player.timeline) && player.timeline.length === 0) {
          const randomSong = songs[Math.floor(Math.random() * songs.length)];

          // Update player's timeline with the random song
          const { error: updateError } = await supabase
            .from('players')
            .update({ timeline: [randomSong] as unknown as Json })
            .eq('id', player.id);

          if (updateError) {
            console.error('Error updating player timeline:', updateError);
          } else {
            console.log(`Assigned starting card ${randomSong.deezer_title} to player ${player.name}`);
          }
        } else {
          console.log(`Player ${player.name} already has a timeline, skipping...`);
        }
      }

      console.log('Finished assigning starting cards to players.');
    } catch (error) {
      console.error('Failed to initialize game with starting cards:', error);
    }
  }

  static async setCurrentSong(roomId: string, song: Song): Promise<void> {
    try {
      console.log('Setting current song for room:', roomId, 'to', song.deezer_title);

      const { error } = await supabase
        .from('game_rooms')
        .update({ current_song: song as unknown as Json })
        .eq('id', roomId);

      if (error) {
        console.error('Failed to set current song:', error);
        throw error;
      }

      console.log('Current song updated successfully.');
    } catch (error) {
      console.error('Failed to set current song:', error);
      throw error;
    }
  }

  static async placeCardAndAdvanceTurn(
    roomId: string, 
    playerId: string, 
    song: Song, 
    position: number, 
    availableSongs: Song[] = []
  ): Promise<PlaceCardResult> {
    try {
      console.log('🃏 GameService: Placing card and advancing turn', { roomId, playerId, song: song.deezer_title, position });

      // Get current player data
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (playerError || !playerData) {
        console.error('❌ Failed to get player data:', playerError);
        return { success: false, error: 'Player not found' };
      }

      // Update player timeline
      const currentTimeline = Array.isArray(playerData.timeline) ? playerData.timeline as unknown as Song[] : [];
      const newTimeline = [...currentTimeline];
      
      if (position >= newTimeline.length) {
        newTimeline.push(song);
      } else {
        newTimeline.splice(position, 0, song);
      }

      // Simple correctness check (you can implement more complex logic here)
      const isCorrect = Math.random() > 0.3; // 70% chance of being correct for demo

      // Update player data
      const newScore = playerData.score + (isCorrect ? 1 : 0);
      const { error: updateError } = await supabase
        .from('players')
        .update({
          timeline: newTimeline as unknown as Json,
          score: newScore
        })
        .eq('id', playerId);

      if (updateError) {
        console.error('❌ Failed to update player:', updateError);
        return { success: false, error: 'Failed to update player' };
      }

      // Check for winner
      let winner: Player | null = null;
      let gameEnded = false;

      if (newScore >= 10) {
        // Convert database player to Player type
        winner = {
          id: playerData.id,
          name: playerData.name,
          color: playerData.color,
          timelineColor: playerData.timeline_color,
          score: newScore,
          timeline: newTimeline,
          character: playerData.character || getDefaultCharacter().id
        };
        gameEnded = true;

        // Update room to finished state
        await supabase
          .from('game_rooms')
          .update({ phase: 'finished' })
          .eq('id', roomId);
      }

      // Advance turn (simple implementation)
      const { error: turnError } = await supabase
        .from('game_rooms')
        .update({ 
          current_turn: (playerData.room_id ? 1 : 0) + 1 // Simple turn advancement
        })
        .eq('id', roomId);

      if (turnError) {
        console.warn('⚠️ Failed to advance turn:', turnError);
      }

      console.log('✅ Card placed successfully', { isCorrect, newScore, gameEnded, winner: winner?.name });

      return { 
        success: true, 
        correct: isCorrect, 
        gameEnded, 
        winner: winner || undefined 
      };

    } catch (error) {
      console.error('❌ GameService: Failed to place card:', error);
      return { success: false, error: 'Failed to place card' };
    }
  }
}
