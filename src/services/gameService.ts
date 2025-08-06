import { supabase } from '@/integrations/supabase/client';
import { Song, Player } from '@/types/game';
import type { Json } from '@/integrations/supabase/types';
import { getDefaultCharacter } from '@/constants/characters';

/**
 * Validates that a timeline is in correct chronological order by release year
 * @param timeline Array of songs to validate
 * @returns true if timeline is in correct chronological order, false otherwise
 */
function validateTimelineOrder(timeline: Song[]): boolean {
  if (timeline.length <= 1) {
    return true; // Single song or empty timeline is always valid
  }

  for (let i = 0; i < timeline.length - 1; i++) {
    const currentYear = parseInt(timeline[i].release_year);
    const nextYear = parseInt(timeline[i + 1].release_year);
    
    // Check if years are valid numbers
    if (isNaN(currentYear) || isNaN(nextYear)) {
      console.warn('⚠️ Invalid release year found in timeline validation:', {
        current: timeline[i].release_year,
        next: timeline[i + 1].release_year
      });
      return false; // Invalid years are considered incorrect
    }
    
    // Timeline should be in ascending chronological order
    if (currentYear > nextYear) {
      console.log('❌ Timeline order violation:', {
        currentSong: `${timeline[i].deezer_title} (${currentYear})`,
        nextSong: `${timeline[i + 1].deezer_title} (${nextYear})`,
        position: i
      });
      return false;
    }
  }
  
  return true;
}

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

      // Robust validation of songs array
      if (!songs || !Array.isArray(songs) || songs.length === 0) {
        console.error('❌ CRITICAL: No songs provided to initialize game');
        throw new Error('No songs available to start the game');
      }

      if (songs.length < 2) {
        console.error('❌ CRITICAL: Not enough songs to initialize game');
        throw new Error('Need at least 2 songs to initialize game');
      }

      // Validate that songs have required properties
      const validSongs = songs.filter(song => 
        song && 
        song.deezer_title && 
        song.deezer_artist && 
        song.release_year
      );

      if (validSongs.length < 2) {
        console.error('❌ CRITICAL: Not enough valid songs to initialize game');
        throw new Error('Not enough valid songs to initialize game');
      }

      console.log('✅ Using', validSongs.length, 'valid songs for game initialization');

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

      // CRITICAL: Set the first player as the current player for turn management
      const firstPlayer = players[0];
      console.log('🎯 Setting first player for turn:', firstPlayer.name);

      // Create a copy of valid songs to work with
      const availableSongs = [...validSongs];
      
      // Pick and remove mystery card from available songs
      const mysteryCardIndex = Math.floor(Math.random() * availableSongs.length);
      const mysteryCard = availableSongs.splice(mysteryCardIndex, 1)[0];
      
      if (!mysteryCard) {
        console.error('❌ CRITICAL: Failed to select mystery card');
        throw new Error('Failed to select mystery card');
      }
      
      console.log('🎵 Selected mystery card:', mysteryCard.deezer_title);

      // CRITICAL: Update room with mystery card AND set phase to playing AND set current player
      // This is the authoritative state change that will trigger the UI update
      const { error: roomUpdateError } = await supabase
        .from('game_rooms')
        .update({ 
          current_song: mysteryCard as unknown as Json,
          songs: validSongs as unknown as Json,
          phase: 'playing', // This is the key - authoritative phase change
          current_turn: 0,
          current_song_index: 0,
          current_player_id: firstPlayer.id
        })
        .eq('id', roomId);

      if (roomUpdateError) {
        console.error('❌ Failed to update room:', roomUpdateError);
        throw roomUpdateError;
      }

      console.log('✅ Room updated with mystery card and playing phase');

      // Assign starting cards to each player
      for (const player of players) {
        if (availableSongs.length === 0) {
          console.warn('⚠️ Ran out of songs to assign as starting cards');
          break;
        }

        // Pick a random starting card for this player
        const startingCardIndex = Math.floor(Math.random() * availableSongs.length);
        const startingCard = availableSongs.splice(startingCardIndex, 1)[0];

        if (!startingCard) {
          console.error(`❌ CRITICAL: Failed to get starting card for player ${player.name}`);
          throw new Error(`Failed to get starting card for player ${player.name}`);
        }

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

      const { error } = await supabase
        .from('game_rooms')
        .update({ current_song: song as unknown as Json })
        .eq('id', roomId);

      if (error) {
        console.error('❌ Failed to set current song:', error);
        throw error;
      }

      console.log('✅ Current song updated successfully.');
    } catch (error) {
      console.error('❌ Failed to set current song:', error);
      throw error;
    }
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

      // Get current room data to understand turn state
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) {
        console.error('❌ Failed to get room data:', roomError);
        return { success: false, error: 'Room not found' };
      }

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

      // Get all non-host players to determine turn order
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false)
        .order('id', { ascending: true });

      if (playersError || !allPlayers || allPlayers.length === 0) {
        console.error('❌ Failed to get players for turn rotation:', playersError);
        return { success: false, error: 'No players found' };
      }

      // Update player timeline
      const currentTimeline = Array.isArray(playerData.timeline) ? playerData.timeline as unknown as Song[] : [];
      const testTimeline = [...currentTimeline];
      
      // Insert the card at the specified position
      if (position >= testTimeline.length) {
        testTimeline.push(song);
      } else {
        testTimeline.splice(position, 0, song);
      }

      // CRITICAL FIX: Proper timeline validation based on release years
      const isCorrect = validateTimelineOrder(testTimeline);
      
      console.log('🔍 Timeline validation:', {
        playerName: playerData.name,
        songTitle: song.deezer_title,
        songYear: song.release_year,
        position,
        timelineBefore: currentTimeline.map(s => `${s.deezer_title} (${s.release_year})`),
        timelineAfter: testTimeline.map(s => `${s.deezer_title} (${s.release_year})`),
        isCorrect
      });

      // If placement is incorrect, do NOT update the timeline - reject the placement
      let finalTimeline = currentTimeline;
      let newScore = playerData.score;
      
      if (isCorrect) {
        // Only update timeline if placement is correct
        finalTimeline = testTimeline;
        newScore = playerData.score + 1;
        console.log('✅ Correct placement - timeline updated');
      } else {
        // Incorrect placement - keep original timeline, no score increase
        console.log('❌ Incorrect placement - timeline unchanged');
      }

      // Update player data
      const { error: updateError } = await supabase
        .from('players')
        .update({
          timeline: finalTimeline as unknown as Json,
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
        // Convert database player to Player type - use getDefaultCharacter for missing character
        winner = {
          id: playerData.id,
          name: playerData.name,
          color: playerData.color,
          timelineColor: playerData.timeline_color,
          score: newScore,
          timeline: finalTimeline,
          character: (playerData as any).character || getDefaultCharacter().id
        };
        gameEnded = true;

        // Update room to finished state
        await supabase
          .from('game_rooms')
          .update({ phase: 'finished' })
          .eq('id', roomId);

        console.log('✅ Game ended with winner:', winner.name);
        return { 
          success: true, 
          correct: isCorrect, 
          gameEnded, 
          winner: winner 
        };
      }

      // CRITICAL FIX: Implement proper turn rotation
      // Find current player index in the turn order
      const currentPlayerIndex = allPlayers.findIndex(p => p.id === playerId);
      if (currentPlayerIndex === -1) {
        console.error('❌ Current player not found in players list');
        return { success: false, error: 'Current player not found' };
      }

      // Calculate next player index (with wraparound)
      const nextPlayerIndex = (currentPlayerIndex + 1) % allPlayers.length;
      const nextPlayer = allPlayers[nextPlayerIndex];

      console.log('🔄 Turn rotation:', {
        currentPlayer: playerData.name,
        currentPlayerIndex,
        nextPlayer: nextPlayer.name,
        nextPlayerIndex,
        totalPlayers: allPlayers.length
      });

      // CRITICAL FIX: Generate new card for the CURRENT player (who just played)
      // Remove the song they just placed from available songs to prevent duplicates
      const availableForNewCard = (roomData.songs as Song[] || availableSongs).filter(
        availableSong => availableSong.deezer_title !== song.deezer_title
      );

      let newCardForCurrentPlayer: Song | null = null;
      if (availableForNewCard.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableForNewCard.length);
        newCardForCurrentPlayer = availableForNewCard[randomIndex];
        
        console.log('🎴 Generating new card for current player:', {
          player: playerData.name,
          newCard: newCardForCurrentPlayer.deezer_title,
          availableCards: availableForNewCard.length
        });

        // Update the current player with their new card (replacing their hand)
        const { error: newCardError } = await supabase
          .from('players')
          .update({
            current_song: newCardForCurrentPlayer as unknown as Json
          })
          .eq('id', playerId);

        if (newCardError) {
          console.warn('⚠️ Failed to assign new card to current player:', newCardError);
        }
      }

      // Set new mystery card for the next player if available
      let newMysteryCard: Song | null = null;
      if (availableForNewCard.length > 1) {
        // Pick a different song than the one given to current player
        const mysteryCardCandidates = availableForNewCard.filter(
          s => !newCardForCurrentPlayer || s.deezer_title !== newCardForCurrentPlayer.deezer_title
        );
        
        if (mysteryCardCandidates.length > 0) {
          const mysteryIndex = Math.floor(Math.random() * mysteryCardCandidates.length);
          newMysteryCard = mysteryCardCandidates[mysteryIndex];
        }
      }

      // Update room with next player turn and new mystery card
      const roomUpdates: {
        current_player_id: string;
        current_turn: number;
        current_song?: Json;
      } = {
        current_player_id: nextPlayer.id,
        current_turn: (roomData.current_turn || 0) + 1
      };

      if (newMysteryCard) {
        roomUpdates.current_song = newMysteryCard as unknown as Json;
        console.log('🎵 New mystery card for next turn:', newMysteryCard.deezer_title);
      }

      const { error: turnError } = await supabase
        .from('game_rooms')
        .update(roomUpdates)
        .eq('id', roomId);

      if (turnError) {
        console.error('❌ Failed to advance turn:', turnError);
        return { success: false, error: 'Failed to advance turn' };
      }

      console.log('✅ Card placed and turn advanced successfully', { 
        isCorrect, 
        newScore, 
        nextPlayer: nextPlayer.name,
        newMysteryCard: newMysteryCard?.deezer_title || 'None'
      });

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
