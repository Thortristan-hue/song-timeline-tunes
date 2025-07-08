import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Player, Song, GameRoom } from '@/types/game';
import { DeezerAudioService } from '@/services/DeezerAudioService';

export type DatabasePlayer = Database['public']['Tables']['players']['Row'];
export type DatabaseRoom = Database['public']['Tables']['game_rooms']['Row'];

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
  private static convertJsonToSong(jsonData: any): Song | null {
    if (!jsonData || typeof jsonData !== 'object') {
      return null;
    }

    if (!jsonData.id || !jsonData.deezer_title || !jsonData.deezer_artist) {
      return null;
    }

    return {
      id: jsonData.id,
      deezer_title: jsonData.deezer_title,
      deezer_artist: jsonData.deezer_artist,
      deezer_album: jsonData.deezer_album || '',
      release_year: jsonData.release_year || '',
      genre: jsonData.genre || '',
      cardColor: jsonData.cardColor || '',
      preview_url: jsonData.preview_url,
      deezer_url: jsonData.deezer_url
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
            const moveData = move.move_data as any;
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

  // Select a fresh mystery card that hasn't been used anywhere in the game
  private static async selectFreshMysteryCard(
    roomId: string, 
    availableSongs: Song[], 
    players: Player[], 
    currentMysteryCard?: Song
  ): Promise<Song | null> {
    const usedSongIds = await this.getAllUsedSongs(roomId, players, currentMysteryCard);
    
    // Filter out already used songs
    const unusedSongs = availableSongs.filter(song => 
      song && song.id && !usedSongIds.includes(song.id)
    );
    
    console.log('🎯 FRESH MYSTERY CARD SELECTION:', {
      totalAvailable: availableSongs.length,
      alreadyUsed: usedSongIds.length,
      availableForSelection: unusedSongs.length
    });
    
    if (unusedSongs.length === 0) {
      console.error('❌ CRITICAL: No unused songs available!');
      return null;
    }
    
    // Select random unused song
    const selectedSong = unusedSongs[Math.floor(Math.random() * unusedSongs.length)];
    console.log('✅ SELECTED FRESH MYSTERY CARD:', selectedSong.deezer_title);
    
    return selectedSong;
  }

  // CRITICAL FIX: Initialize game with starting cards for all players
  static async initializeGameWithStartingCards(roomId: string, availableSongs: Song[]): Promise<Song> {
    if (!availableSongs || availableSongs.length < 10) {
      throw new Error('Not enough songs available to start game');
    }

    // Get all non-host players
    const { data: allPlayers, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_host', false)
      .order('joined_at', { ascending: true });

    if (playersError || !allPlayers || allPlayers.length === 0) {
      throw new Error('No players available to start game');
    }

    console.log('🎯 STARTING CARD ASSIGNMENT: Assigning to all players');

    // Shuffle songs to ensure random selection
    const shuffledSongs = [...availableSongs].sort(() => Math.random() - 0.5);
    let songIndex = 0;

    // Assign starting card to each player
    for (const player of allPlayers) {
      const startingCard = shuffledSongs[songIndex % shuffledSongs.length];
      songIndex++;

      console.log(`🃏 STARTING CARD: Assigned to ${player.name}:`, startingCard.deezer_title);
      
      const { error } = await supabase
        .from('players')
        .update({
          timeline: [startingCard] as any,
          score: 1 // Start with 1 point for the starting card
        })
        .eq('id', player.id);

      if (error) {
        console.error(`Failed to assign starting card to ${player.name}:`, error);
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
    console.log('🎯 INIT: Setting initial mystery card:', initialMysteryCard.deezer_title);

    // Set random first player
    const randomPlayerIndex = Math.floor(Math.random() * allPlayers.length);
    const firstPlayerId = allPlayers[randomPlayerIndex].id;

    // Initialize game state
    const { error } = await supabase
      .from('game_rooms')
      .update({
        current_turn: randomPlayerIndex,
        current_player_id: firstPlayerId,
        current_song: initialMysteryCard as any,
        phase: 'playing',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      throw error;
    }

    console.log('✅ INIT: Game initialized with starting cards and mystery card');
    return initialMysteryCard;
  }

  // CRITICAL FIX: Proper turn advancement after card placement
  static async placeCardAndAdvanceTurn(
    roomId: string,
    playerId: string,
    song: Song,
    position: number,
    availableSongs: Song[]
  ): Promise<{ success: boolean; correct?: boolean; error?: string; gameEnded?: boolean; winner?: Player }> {
    try {
      console.log('🃏 CARD PLACEMENT: Starting with turn advancement');

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

      // Check if placement was correct (chronological order)
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

      // CRITICAL FIX: Only add to timeline if placement is correct
      const finalTimeline = isCorrect ? newTimeline : currentTimeline;
      const newScore = playerData.score + (isCorrect ? 1 : 0);

      // Update player timeline and score
      const { error: updateError } = await supabase
        .from('players')
        .update({
          timeline: finalTimeline as any,
          score: newScore,
          last_active: new Date().toISOString()
        })
        .eq('id', playerId);

      if (updateError) {
        throw updateError;
      }

      console.log('✅ CARD PLACEMENT: Player timeline updated');

      // Check for game end condition (10 cards) - only if placement was correct
      if (isCorrect && finalTimeline.length >= 10) {
        console.log('🎯 GAME END: Player reached 10 cards');
        await this.endGame(roomId, playerId);
        
        const updatedPlayer = this.convertDatabasePlayerToPlayer({
          ...playerData,
          timeline: finalTimeline as any,
          score: newScore
        });
        
        return { 
          success: true, 
          correct: isCorrect, 
          gameEnded: true,
          winner: updatedPlayer
        };
      }

      // CRITICAL: Advance to next player turn
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

      // Calculate next turn
      const currentTurn = roomData.current_turn || 0;
      const nextTurn = (currentTurn + 1) % allPlayers.length;
      const nextPlayerId = allPlayers[nextTurn]?.id;

      console.log('🎯 TURN ADVANCEMENT:', {
        currentTurn,
        nextTurn,
        nextPlayer: allPlayers[nextTurn]?.name
      });

      // Get fresh mystery card for next turn
      const players = allPlayers.map(this.convertDatabasePlayerToPlayer);
      const currentMysteryCard = this.convertJsonToSong(roomData.current_song);
      
      const nextMysteryCard = await this.selectFreshMysteryCard(
        roomId,
        availableSongs,
        players,
        currentMysteryCard
      );
      
      if (!nextMysteryCard) {
        console.error('❌ CRITICAL: No fresh mystery card available for next turn!');
        return { success: false, error: 'No fresh mystery card available' };
      }

      // Update room with new turn and mystery card
      const { error: turnUpdateError } = await supabase
        .from('game_rooms')
        .update({
          current_turn: nextTurn,
          current_song: nextMysteryCard as any,
          current_player_id: nextPlayerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (turnUpdateError) {
        console.error('❌ TURN ADVANCEMENT: Failed:', turnUpdateError);
        throw turnUpdateError;
      }

      // Record the move
      await this.recordGameMove(roomId, playerId, 'card_placement', {
        song,
        position,
        correct: isCorrect,
        oldMysteryCard: currentMysteryCard?.id,
        nextMysteryCard: nextMysteryCard.id,
        newScore,
        timelineLength: finalTimeline.length,
        turnAdvanced: true
      });

      console.log('✅ TURN ADVANCEMENT: Turn advanced successfully with fresh mystery card');
      return { success: true, correct: isCorrect };
    } catch (error) {
      console.error('❌ CARD PLACEMENT: Failed:', error);
      return { success: false, error: 'Failed to place card and advance turn' };
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
        current_song: mysteryCard as any,
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

  static shouldGameEnd(players: Player[], maxTimelineLength: number = 10): { shouldEnd: boolean; winner: Player | null } {
    const winner = players.find(player => player.timeline.length >= maxTimelineLength);
    return {
      shouldEnd: !!winner,
      winner: winner || null
    };
  }

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
        current_song: song as any,
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
