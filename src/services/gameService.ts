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
      console.log('🎯 GAME INIT: Starting initialization for room:', roomId, 'with', songs.length, 'songs');

      if (songs.length < 2) {
        throw new Error('Need at least 2 songs to initialize game');
      }

      // Fetch all non-host players in the room
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false);

      if (playersError) {
        console.error('❌ Error fetching players:', playersError);
        throw playersError;
      }

      console.log('👥 Non-host players in room for initialization:', players.length);

      if (players.length === 0) {
        throw new Error('No players found to start the game');
      }

      // Create a copy of songs to work with
      let availableSongs = [...songs];
      
      // Pick and remove mystery card from available songs
      const mysteryCardIndex = Math.floor(Math.random() * availableSongs.length);
      const mysteryCard = availableSongs.splice(mysteryCardIndex, 1)[0];
      
      console.log('🎵 Selected mystery card:', mysteryCard.deezer_title);

      // Enhanced mystery card with track ID extraction for audio
      const enhancedMysteryCard = {
        ...mysteryCard,
        trackId: this.extractTrackIdFromSong(mysteryCard)
      };

      // Update room with enhanced mystery card
      const { error: roomUpdateError } = await supabase
        .from('game_rooms')
        .update({ 
          current_song: enhancedMysteryCard as unknown as Json,
          songs: songs as unknown as Json,
          phase: 'playing',
          current_turn: 0,
          current_song_index: 0
        })
        .eq('id', roomId);

      if (roomUpdateError) {
        console.error('❌ Failed to update room:', roomUpdateError);
        throw roomUpdateError;
      }

      console.log('✅ Room updated with enhanced mystery card and playing phase');

      // Assign starting cards to each player
      for (const player of players) {
        if (availableSongs.length === 0) {
          console.warn('⚠️ Ran out of songs to assign as starting cards');
          break;
        }

        // Pick a random starting card for this player
        const startingCardIndex = Math.floor(Math.random() * availableSongs.length);
        const startingCard = availableSongs.splice(startingCardIndex, 1)[0];

        console.log(`🎴 Assigning starting card "${startingCard.deezer_title}" to player ${player.name}`);

        // Update player's timeline with the starting card
        const { error: updateError } = await supabase
          .from('players')
          .update({ 
            timeline: [startingCard] as unknown as Json,
            score: 0 // Ensure score is reset
          })
          .eq('id', player.id);

        if (updateError) {
          console.error('❌ Error updating player timeline:', updateError);
          throw updateError;
        }

        console.log(`✅ Starting card assigned to ${player.name}`);
      }

      console.log('✅ GAME INIT: Finished assigning starting cards and mystery card');
    } catch (error) {
      console.error('❌ GAME INIT: Failed to initialize game:', error);
      throw error;
    }
  }

  static async setCurrentSong(roomId: string, song: Song): Promise<void> {
    try {
      console.log('🎵 Setting current song for room:', roomId, 'to', song.deezer_title);

      // Enhanced song with track ID for audio playback
      const enhancedSong = {
        ...song,
        trackId: this.extractTrackIdFromSong(song)
      };

      const { error } = await supabase
        .from('game_rooms')
        .update({ current_song: enhancedSong as unknown as Json })
        .eq('id', roomId);

      if (error) {
        console.error('❌ Failed to set current song:', error);
        throw error;
      }

      console.log('✅ Current song updated successfully with track ID:', enhancedSong.trackId);
    } catch (error) {
      console.error('❌ Failed to set current song:', error);
      throw error;
    }
  }

  // Helper method to extract track ID from song for audio playback
  private static extractTrackIdFromSong(song: Song): string | undefined {
    if (song.deezer_url) {
      const trackIdMatch = song.deezer_url.match(/track\/(\d+)/);
      if (trackIdMatch) {
        console.log('🎵 Extracted track ID:', trackIdMatch[1], 'from URL:', song.deezer_url);
        return trackIdMatch[1];
      }
    }
    
    // Fallback: generate a consistent ID from song properties
    const fallbackId = btoa(`${song.deezer_artist}-${song.deezer_title}-${song.release_year}`)
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10);
    
    console.log('🎵 Generated fallback track ID:', fallbackId, 'for song:', song.deezer_title);
    return fallbackId;
  }

  static async updatePlayerTimeline(playerId: string, timeline: Song[], score?: number): Promise<void> {
    try {
      const updateData: { timeline: Json; score?: number } = {
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
        console.error('Failed to update player timeline:', error);
        throw error;
      }

      console.log('Player timeline updated successfully');
    } catch (error) {
      console.error('Failed to update player timeline:', error);
      throw error;
    }
  }

  static async endGame(roomId: string, winnerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ phase: 'finished' })
        .eq('id', roomId);

      if (error) {
        console.error('Failed to end game:', error);
        throw error;
      }

      console.log('Game ended successfully');
    } catch (error) {
      console.error('Failed to end game:', error);
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

      // Enhanced correctness check based on chronological order
      const isCorrect = this.checkTimelineCorrectness(newTimeline, song, position);

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
        winner = {
          id: playerData.id,
          name: playerData.name,
          color: playerData.color,
          timelineColor: playerData.timeline_color,
          score: newScore,
          timeline: newTimeline,
          character: (playerData as any).character || getDefaultCharacter().id
        };
        gameEnded = true;

        await supabase
          .from('game_rooms')
          .update({ phase: 'finished' })
          .eq('id', roomId);
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

  // Enhanced timeline correctness check
  private static checkTimelineCorrectness(timeline: Song[], newSong: Song, position: number): boolean {
    const sortedTimeline = [...timeline].sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));
    const newSongYear = parseInt(newSong.release_year);
    
    // Check if the song fits chronologically in the position
    const beforeSong = position > 0 ? sortedTimeline[position - 1] : null;
    const afterSong = position < sortedTimeline.length - 1 ? sortedTimeline[position + 1] : null;
    
    const beforeYear = beforeSong ? parseInt(beforeSong.release_year) : 0;
    const afterYear = afterSong ? parseInt(afterSong.release_year) : 9999;
    
    const isCorrect = newSongYear >= beforeYear && newSongYear <= afterYear;
    
    console.log('🎯 Timeline correctness check:', {
      newSong: newSong.deezer_title,
      newSongYear,
      beforeYear,
      afterYear,
      position,
      isCorrect
    });
    
    return isCorrect;
  }
}
