import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Player, Song, GameRoom } from '@/types/game';
import { DeezerAudioService } from '@/services/DeezerAudioService';
import type { Json } from '@/integrations/supabase/types';

export type DatabasePlayer = Database['public']['Tables']['players']['Row'];
export type DatabaseRoom = Database['public']['Tables']['game_rooms']['Row'];

// Helper type for database JSON data that might contain Song objects
interface JsonSongData {
  id: string;
  deezer_title: string;
  deezer_artist: string;
  deezer_album?: string;
  release_year: string;
  genre?: string;
  cardColor: string;
  preview_url?: string;
  deezer_url?: string;
}

interface MoveData {
  song?: JsonSongData;
  position?: number;
  playerId?: string;
  oldMysteryCard?: string;
  nextMysteryCard?: string;
  correct?: boolean;
  newScore?: number;
  timelineLength?: number;
  turnAdvanced?: boolean;
}

// Game service functions for managing multiplayer game state
export class GameService {
  // Helper function to convert database player to Player type
  private static convertDatabasePlayerToPlayer(dbPlayer: DatabasePlayer): Player {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      color: dbPlayer.color,
      timelineColor: dbPlayer.timeline_color,
      score: dbPlayer.score || 0,
      timeline: Array.isArray(dbPlayer.timeline) ? (dbPlayer.timeline as unknown as Song[]) : []
    };
  }

  // Helper function to safely convert JSON to Song type
  private static convertJsonToSong(jsonData: unknown): Song | null {
    if (!jsonData || typeof jsonData !== 'object') {
      return null;
    }

    const data = jsonData as Record<string, unknown>;
    if (!data.id || !data.deezer_title || !data.deezer_artist) {
      return null;
    }

    return {
      id: String(data.id),
      deezer_title: String(data.deezer_title),
      deezer_artist: String(data.deezer_artist),
      deezer_album: String(data.deezer_album || ''),
      release_year: String(data.release_year || ''),
      genre: String(data.genre || ''),
      cardColor: String(data.cardColor || ''),
      preview_url: data.preview_url ? String(data.preview_url) : undefined,
      deezer_url: data.deezer_url ? String(data.deezer_url) : undefined
    };
  }

  // Get all used songs from all players' timelines and game moves
  private static async getAllUsedSongs(roomId: string, players: Player[], currentMysteryCard?: Song): Promise<string[]> {
    const usedSongIds = new Set<string>();
    
    // Add all songs from players' timelines
    players.forEach(player => {
      if (Array.isArray(player.timeline)) {
        player.timeline.forEach(song => {
          if (song && song.id) {
            usedSongIds.add(song.id);
          }
        });
      }
    });
    
    // Add current mystery card to avoid immediate repetition
    if (currentMysteryCard && currentMysteryCard.id) {
      usedSongIds.add(currentMysteryCard.id);
    }

    // Get all previously used mystery cards from game moves
    try {
      const { data: gameMoves, error } = await supabase
        .from('game_moves')
        .select('move_data')
        .eq('room_id', roomId)
        .eq('move_type', 'card_placement');

      if (!error && gameMoves) {
        gameMoves.forEach(move => {
          if (move.move_data && typeof move.move_data === 'object') {
            const moveData = move.move_data as MoveData;
            if (moveData.oldMysteryCard) {
              usedSongIds.add(moveData.oldMysteryCard);
            }
            if (moveData.nextMysteryCard) {
              usedSongIds.add(moveData.nextMysteryCard);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Could not fetch game moves for used songs:', error);
    }
    
    return Array.from(usedSongIds);
  }

  // ENHANCED: Select a fresh mystery card with improved validation and logging
  private static async selectFreshMysteryCard(
    roomId: string, 
    availableSongs: Song[], 
    players: Player[], 
    currentMysteryCard?: Song
  ): Promise<Song | null> {
    console.log('🎯 ENHANCED MYSTERY CARD SELECTION: Starting selection process');
    
    const usedSongIds = await this.getAllUsedSongs(roomId, players, currentMysteryCard);
    
    // Filter out already used songs
    const unusedSongs = availableSongs.filter(song => 
      song && song.id && !usedSongIds.includes(song.id)
    );
    
    // Enhanced logging with more details
    console.log('🎯 ENHANCED MYSTERY CARD SELECTION:', {
      totalAvailable: availableSongs.length,
      alreadyUsed: usedSongIds.length,
      availableForSelection: unusedSongs.length,
      usedSongs: usedSongIds.slice(0, 5), // Show first 5 used songs
      currentMystery: currentMysteryCard?.deezer_title || 'None'
    });
    
    // Enhanced validation
    if (unusedSongs.length === 0) {
      console.error('❌ CRITICAL: No unused songs available!');
      console.log('📊 FALLBACK ANALYSIS:', {
        availableSongsDetails: availableSongs.map(s => ({ id: s.id, title: s.deezer_title })).slice(0, 3),
        playersTimelines: players.map(p => ({ 
          id: p.id, 
          name: p.name, 
          timelineLength: p.timeline?.length || 0 
        }))
      });
      
      // ENHANCED FALLBACK: Try to use any available song as last resort
      if (availableSongs.length > 0) {
        console.log('🆘 FALLBACK: Using any available song as mystery card');
        const fallbackSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
        console.log('🆘 FALLBACK SELECTED:', fallbackSong.deezer_title);
        return fallbackSong;
      }
      
      return null;
    }
    
    // ENHANCED: Prioritize songs with preview URLs
    const songsWithPreview = unusedSongs.filter(song => song.preview_url && song.preview_url.trim() !== '');
    const songsToChooseFrom = songsWithPreview.length > 0 ? songsWithPreview : unusedSongs;
    
    console.log('🎵 PREVIEW URL ANALYSIS:', {
      totalUnused: unusedSongs.length,
      withPreview: songsWithPreview.length,
      usingPreviewPriority: songsWithPreview.length > 0
    });
    
    // Select random unused song
    const selectedSong = songsToChooseFrom[Math.floor(Math.random() * songsToChooseFrom.length)];
    
    // Enhanced validation of selected song
    if (!selectedSong || !selectedSong.id || !selectedSong.deezer_title) {
      console.error('❌ SELECTED SONG VALIDATION FAILED:', selectedSong);
      return null;
    }
    
    console.log('✅ ENHANCED MYSTERY CARD SELECTED:', {
      title: selectedSong.deezer_title,
      artist: selectedSong.deezer_artist,
      year: selectedSong.release_year,
      hasPreview: Boolean(selectedSong.preview_url),
      id: selectedSong.id
    });
    
    return selectedSong;
  }

  // CRITICAL FIX: Initialize game with starting cards for all players
  static async initializeGameWithStartingCards(roomId: string, availableSongs: Song[]): Promise<Song> {
    console.log('🚀 GAME INIT: Starting game initialization process...');
    
    if (!roomId) {
      throw new Error('Room ID is required to initialize game');
    }
    
    if (!availableSongs || availableSongs.length < 8) {
      throw new Error(`Not enough songs available to start game. Got ${availableSongs?.length || 0} songs, need at least 8.`);
    }

    console.log('🎯 INIT: Getting all non-host players...');
    // Get all non-host players
    const { data: allPlayers, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_host', false)
      .order('joined_at', { ascending: true });

    if (playersError) {
      console.error('❌ INIT: Error fetching players:', playersError);
      throw new Error(`Failed to fetch players: ${playersError.message}`);
    }

    if (!allPlayers || allPlayers.length === 0) {
      throw new Error('No players found in room. Players must join before starting game.');
    }

    console.log(`🎯 INIT: Found ${allPlayers.length} players for game initialization`);

    // Shuffle songs to ensure random selection
    const shuffledSongs = [...availableSongs].sort(() => Math.random() - 0.5);
    let songIndex = 0;

    console.log('🃏 INIT: Assigning starting cards to all players...');
    // Assign starting card to each player
    for (const player of allPlayers) {
      const startingCard = shuffledSongs[songIndex % shuffledSongs.length];
      songIndex++;

      console.log(`🃏 STARTING CARD: Assigning to ${player.name}: ${startingCard.deezer_title} (${startingCard.release_year})`);
      
      const { error } = await supabase
        .from('players')
        .update({
          timeline: [startingCard] as unknown as Json,
          score: 1 // Start with 1 point for the starting card
        })
        .eq('id', player.id);

      if (error) {
        console.error(`❌ INIT: Failed to assign starting card to ${player.name}:`, error);
        throw new Error(`Failed to assign starting card to player ${player.name}: ${error.message}`);
      }
    }

    // Convert database players to Player type for mystery card selection
    const players = allPlayers.map(this.convertDatabasePlayerToPlayer);
    
    // Select initial mystery card that's different from starting cards
    const usedSongIds = shuffledSongs.slice(0, allPlayers.length).map(s => s.id);
    const availableForMystery = shuffledSongs.filter(s => !usedSongIds.includes(s.id));
    
    if (availableForMystery.length === 0) {
      throw new Error('No songs available for mystery card after assigning starting cards');
    }

    const initialMysteryCard = availableForMystery[Math.floor(Math.random() * availableForMystery.length)];
    console.log(`🎯 INIT: Setting initial mystery card: ${initialMysteryCard.deezer_title} (${initialMysteryCard.release_year})`);

    // Set random first player
    const randomPlayerIndex = Math.floor(Math.random() * allPlayers.length);
    const firstPlayerId = allPlayers[randomPlayerIndex].id;
    const firstPlayerName = allPlayers[randomPlayerIndex].name;

    console.log(`🎯 INIT: Setting first turn to player: ${firstPlayerName} (index ${randomPlayerIndex})`);

    // Initialize game state - CRITICAL: Include songs array in room update
    const { error } = await supabase
      .from('game_rooms')
      .update({
        current_turn: randomPlayerIndex,
        current_player_id: firstPlayerId,
        current_song: initialMysteryCard as unknown as Json,
        songs: availableSongs as unknown as Json, // CRITICAL: Update room with available songs
        phase: 'playing',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      console.error('❌ INIT: Failed to update game room:', error);
      throw new Error(`Failed to initialize game state: ${error.message}`);
    }

    console.log('✅ INIT: Game successfully initialized with starting cards and mystery card!');
    return initialMysteryCard;
  }

  // ENHANCED: Card placement with improved turn advancement and animation coordination
  static async placeCardAndAdvanceTurn(
    roomId: string,
    playerId: string,
    song: Song,
    position: number,
    availableSongs?: Song[]
  ): Promise<{ success: boolean; correct?: boolean; error?: string; gameEnded?: boolean; winner?: Player }> {
    try {
      console.log('🃏 ENHANCED CARD PLACEMENT: Starting with improved turn advancement');
      console.log('🎯 ENHANCED: Available songs for next mystery:', availableSongs?.length || 0);

      // Get current room data to access songs
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) {
        console.error('❌ ENHANCED: Room not found:', roomError);
        return { success: false, error: 'Room not found' };
      }

      // Use room's songs if availableSongs not provided
      let roomSongs: Song[] = [];
      if (availableSongs && availableSongs.length > 0) {
        roomSongs = availableSongs;
      } else if (roomData.songs) {
        try {
          roomSongs = Array.isArray(roomData.songs) ? roomData.songs as unknown as Song[] : [];
        } catch (e) {
          console.error('ENHANCED: Failed to parse room songs:', e);
          return { success: false, error: 'Invalid room songs data' };
        }
      }

      if (roomSongs.length === 0) {
        console.error('❌ ENHANCED CRITICAL: No available songs found in room or provided');
        return { success: false, error: 'No available songs' };
      }

      console.log('🎯 ENHANCED: Using songs:', {
        source: availableSongs ? 'provided' : 'room',
        count: roomSongs.length,
        placedSong: song.deezer_title,
        roomPhase: roomData.phase
      });

      // Get current player data
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (playerError || !playerData) {
        console.error('❌ ENHANCED: Player not found:', playerError);
        return { success: false, error: 'Player not found' };
      }

      // ENHANCED: Validate player timeline structure
      const currentTimeline = Array.isArray(playerData.timeline) ? (playerData.timeline as unknown as Song[]) : [];
      console.log('🎯 ENHANCED: Current player timeline validation:', {
        playerId: playerData.id,
        playerName: playerData.name,
        timelineLength: currentTimeline.length,
        timelineValid: Array.isArray(currentTimeline)
      });

      // Update player's timeline
      const newTimeline = [...currentTimeline];
      newTimeline.splice(position, 0, song);

      // ENHANCED: Check if placement was correct with detailed logging
      let isCorrect = true;
      const validationDetails = [];
      
      if (newTimeline.length > 1) {
        for (let i = 1; i < newTimeline.length; i++) {
          const prevYear = parseInt(newTimeline[i-1].release_year);
          const currYear = parseInt(newTimeline[i].release_year);
          
          validationDetails.push({
            position: i,
            prevSong: `${newTimeline[i-1].deezer_title} (${prevYear})`,
            currSong: `${newTimeline[i].deezer_title} (${currYear})`,
            valid: prevYear <= currYear
          });
          
          if (prevYear > currYear) {
            isCorrect = false;
            break;
          }
        }
      }

      console.log('📝 ENHANCED PLACEMENT VALIDATION:', {
        placementCorrect: isCorrect,
        placedSong: `${song.deezer_title} (${song.release_year})`,
        position,
        newTimelineLength: newTimeline.length,
        chronologyCheck: validationDetails
      });

      // ENHANCED: Only add to timeline if placement is correct
      const finalTimeline = isCorrect ? newTimeline : currentTimeline;
      const newScore = playerData.score + (isCorrect ? 1 : 0);

      // Update player timeline and score
      const { error: updateError } = await supabase
        .from('players')
        .update({
          timeline: finalTimeline as unknown as Json,
          score: newScore,
          last_active: new Date().toISOString()
        })
        .eq('id', playerId);

      if (updateError) {
        console.error('❌ ENHANCED: Failed to update player:', updateError);
        throw updateError;
      }

      console.log('✅ ENHANCED: Player timeline updated successfully');

      // ENHANCED: Check for game end condition with proper validation
      if (isCorrect && finalTimeline.length >= 10) {
        console.log('🎯 ENHANCED GAME END: Player reached 10 cards');
        
        const updatedPlayer = this.convertDatabasePlayerToPlayer({
          ...playerData,
          timeline: finalTimeline as unknown as Json,
          score: newScore
        });
        
        await this.endGame(roomId, playerId);
        
        return { 
          success: true, 
          correct: isCorrect, 
          gameEnded: true,
          winner: updatedPlayer
        };
      }

      // Get all players to determine next turn
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false)
        .order('joined_at', { ascending: true });

      if (playersError || !allPlayers) {
        console.error('❌ ENHANCED: Failed to get players:', playersError);
        return { success: false, error: 'Failed to get players' };
      }

      // ENHANCED: Calculate next turn with validation
      const currentTurn = roomData.current_turn || 0;
      const nextTurn = (currentTurn + 1) % allPlayers.length;
      const nextPlayer = allPlayers[nextTurn];

      if (!nextPlayer) {
        console.error('❌ ENHANCED: Next player not found');
        return { success: false, error: 'Next player not found' };
      }

      console.log('🎯 ENHANCED TURN ADVANCEMENT:', {
        currentTurn,
        nextTurn,
        nextPlayer: nextPlayer.name,
        totalPlayers: allPlayers.length,
        placedSong: song.deezer_title,
        placementResult: isCorrect ? 'CORRECT' : 'INCORRECT'
      });

      // ENHANCED: Remove the placed song from available songs for next mystery card selection
      const availableForNextMystery = roomSongs.filter(s => s.id !== song.id);
      console.log('🎯 ENHANCED SONG REMOVAL: Removed placed song from pool:', {
        placedSong: song.deezer_title,
        previousCount: roomSongs.length,
        remainingCount: availableForNextMystery.length,
        removalSuccessful: availableForNextMystery.length === (roomSongs.length - 1)
      });

      // ENHANCED: Get fresh mystery card with improved selection
      const players = allPlayers.map(this.convertDatabasePlayerToPlayer);
      const currentMysteryCard = this.convertJsonToSong(roomData.current_song);
      
      console.log('🎯 ENHANCED: Current mystery card analysis:', {
        current: currentMysteryCard?.deezer_title || 'None',
        currentId: currentMysteryCard?.id || 'None',
        aboutToBeReplaced: true
      });
      
      const nextMysteryCard = await this.selectFreshMysteryCard(
        roomId,
        availableForNextMystery,
        players,
        currentMysteryCard
      );
      
      if (!nextMysteryCard) {
        console.error('❌ ENHANCED CRITICAL: No fresh mystery card available for next turn!');
        
        // ENHANCED FALLBACK: Emergency song selection
        console.log('🆘 ENHANCED EMERGENCY: Attempting emergency song selection');
        const emergencySongs = roomSongs.filter(s => s.id !== song.id);
        if (emergencySongs.length > 0) {
          const emergencyCard = emergencySongs[Math.floor(Math.random() * emergencySongs.length)];
          console.log('🆘 ENHANCED EMERGENCY: Selected emergency card:', emergencyCard.deezer_title);
          
          // Continue with emergency card
          const { error: emergencyUpdateError } = await supabase
            .from('game_rooms')
            .update({
              current_turn: nextTurn,
              current_song: emergencyCard as unknown as Json,
              current_player_id: nextPlayer.id,
              songs: emergencySongs as unknown as Json,
              updated_at: new Date().toISOString()
            })
            .eq('id', roomId);

          if (emergencyUpdateError) {
            console.error('❌ ENHANCED EMERGENCY: Failed to update room:', emergencyUpdateError);
            return { success: false, error: 'Failed to advance turn with emergency card' };
          }

          // Record the move with emergency flag
          await this.recordGameMove(roomId, playerId, 'card_placement', {
            song,
            position,
            correct: isCorrect,
            oldMysteryCard: currentMysteryCard?.id,
            nextMysteryCard: emergencyCard.id,
            newScore,
            timelineLength: finalTimeline.length,
            turnAdvanced: true,
            songsRemaining: emergencySongs.length,
            emergencyCardUsed: true
          });

          return { success: true, correct: isCorrect };
        }
        
        return { success: false, error: 'No mystery card available and no emergency options' };
      }

      console.log('🎯 ENHANCED NEW MYSTERY CARD SELECTED:', {
        title: nextMysteryCard.deezer_title,
        artist: nextMysteryCard.deezer_artist,
        year: nextMysteryCard.release_year,
        id: nextMysteryCard.id,
        hasPreview: Boolean(nextMysteryCard.preview_url)
      });

      // ENHANCED: Update room with comprehensive logging
      const roomUpdateData = {
        current_turn: nextTurn,
        current_song: nextMysteryCard as unknown as Json,
        current_player_id: nextPlayer.id,
        songs: availableForNextMystery as unknown as Json,
        updated_at: new Date().toISOString()
      };

      console.log('🎯 ENHANCED ROOM UPDATE:', {
        previousTurn: currentTurn,
        newTurn: nextTurn,
        previousPlayer: allPlayers[currentTurn]?.name,
        newPlayer: nextPlayer.name,
        previousSongsCount: roomSongs.length,
        newSongsCount: availableForNextMystery.length,
        mysteryCardChanged: currentMysteryCard?.id !== nextMysteryCard.id
      });

      const { error: turnUpdateError } = await supabase
        .from('game_rooms')
        .update(roomUpdateData)
        .eq('id', roomId);

      if (turnUpdateError) {
        console.error('❌ ENHANCED TURN ADVANCEMENT: Failed:', turnUpdateError);
        throw turnUpdateError;
      }

      console.log('✅ ENHANCED TURN ADVANCEMENT: Room updated successfully');

      // ENHANCED: Record comprehensive move data
      await this.recordGameMove(roomId, playerId, 'card_placement', {
        song,
        position,
        correct: isCorrect,
        oldMysteryCard: currentMysteryCard?.id,
        nextMysteryCard: nextMysteryCard.id,
        newScore,
        timelineLength: finalTimeline.length,
        turnAdvanced: true,
        songsRemaining: availableForNextMystery.length,
        playerName: playerData.name,
        nextPlayerName: nextPlayer.name,
        turnNumber: nextTurn,
        timestamp: new Date().toISOString()
      });

      console.log('✅ ENHANCED TURN ADVANCEMENT: Turn advanced successfully with fresh mystery card');
      console.log('🎯 ENHANCED NEXT MYSTERY CARD:', `${nextMysteryCard.deezer_title} by ${nextMysteryCard.deezer_artist} (${nextMysteryCard.release_year})`);

      return { success: true, correct: isCorrect };
    } catch (error) {
      console.error('❌ ENHANCED CARD PLACEMENT: Failed:', error);
      return { success: false, error: 'Enhanced card placement and turn advancement failed' };
    }
  }

  static getCurrentPlayer(players: Player[], currentPlayerIndex: number): Player {
    if (!players || players.length === 0) {
      throw new Error('No players available');
    }
    return players[currentPlayerIndex % players.length];
  }

  static getNextPlayerIndex(currentIndex: number, totalPlayers: number): number {
    return (currentIndex + 1) % totalPlayers;
  }

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
        current_song: mysteryCard as unknown as Json,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      console.error('Failed to update game turn:', error);
      throw error;
    }
  }

  static async updatePlayerTimeline(
    playerId: string,
    newTimeline: Song[],
    newScore: number
  ): Promise<void> {
    const { error } = await supabase
      .from('players')
      .update({
        timeline: newTimeline as unknown as Json,
        score: newScore,
        last_active: new Date().toISOString()
      })
      .eq('id', playerId);

    if (error) {
      console.error('Failed to update player timeline:', error);
      throw error;
    }
  }

  static async recordGameMove(
    roomId: string,
    playerId: string,
    moveType: 'card_placement' | 'turn_advance' | 'game_end',
    moveData: Record<string, unknown>
  ): Promise<void> {
      const { error } = await supabase
        .from('game_moves')
        .insert({
          room_id: roomId,
          player_id: playerId,
          move_type: moveType,
          move_data: moveData as Json
        });

    if (error) {
      console.error('Failed to record game move:', error);
      throw error;
    }
  }

  static shouldGameEnd(players: Player[], maxTimelineLength: number = 10): { shouldEnd: boolean; winner: Player | null } {
    const winner = players.find(player => player.timeline.length >= maxTimelineLength);
    return {
      shouldEnd: !!winner,
      winner: winner || null
    };
  }

  static async endGame(roomId: string, winnerId?: string): Promise<void> {
    const updateData: Partial<DatabaseRoom> = {
      phase: 'finished',
      updated_at: new Date().toISOString()
    };

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

  static async resetGameForReplay(roomId: string): Promise<void> {
    try {
      // Reset room to lobby phase
      const { error: roomError } = await supabase
        .from('game_rooms')
        .update({
          phase: 'lobby',
          current_turn: 0,
          current_player_id: null,
          current_song: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (roomError) {
        console.error('Failed to reset room:', roomError);
        throw roomError;
      }

      // Reset all players' timelines and scores
      const { error: playersError } = await supabase
        .from('players')
        .update({
          timeline: [],
          score: 0,
          updated_at: new Date().toISOString()
        })
        .eq('room_id', roomId);

      if (playersError) {
        console.error('Failed to reset players:', playersError);
        throw playersError;
      }

      console.log('✅ Game reset successfully for replay');
    } catch (error) {
      console.error('❌ Failed to reset game:', error);
      throw error;
    }
  }

  static async updatePlayerScore(roomId: string, playerId: string, newScore: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          score: newScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', playerId)
        .eq('room_id', roomId);

      if (error) {
        console.error('Failed to update player score:', error);
        throw error;
      }

      console.log(`✅ Updated player ${playerId} score to ${newScore}`);
    } catch (error) {
      console.error('❌ Failed to update player score:', error);
      throw error;
    }
  }

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

  static async setCurrentSong(roomId: string, song: Song): Promise<void> {
    if (!song) {
      throw new Error('Song cannot be undefined');
    }

    const { error } = await supabase
      .from('game_rooms')
      .update({
        current_song: song as unknown as Json,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      throw error;
    }
  }

  static async forceMysteryCardChange(
    roomId: string,
    availableSongs: Song[],
    newPlayerIndex: number
  ): Promise<Song | null> {
    try {
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false)
        .order('joined_at', { ascending: true });

      if (playersError || !allPlayers || allPlayers.length === 0) {
        return null;
      }

      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('current_song')
        .eq('id', roomId)
        .single();

      if (roomError) {
        return null;
      }

      const players = allPlayers.map(this.convertDatabasePlayerToPlayer);
      const currentMysteryCard = this.convertJsonToSong(roomData.current_song);

      const newMysteryCard = await this.selectFreshMysteryCard(
        roomId,
        availableSongs,
        players,
        currentMysteryCard
      );

      if (!newMysteryCard) {
        return null;
      }

      await this.setCurrentSong(roomId, newMysteryCard);
      return newMysteryCard;
    } catch (error) {
      console.error('❌ Failed to force mystery card change:', error);
      return null;
    }
  }
}
