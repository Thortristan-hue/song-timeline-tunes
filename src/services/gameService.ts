import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom, GameMode, GameModeSettings, GamePhase } from '@/types/game';
import { DeezerAudioService } from './DeezerAudioService';
import { Json } from '@/integrations/supabase/types';

export class GameService {
  // Helper function to safely convert Json to Song
  private static jsonToSong = (json: Json): Song | null => {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
    
    const obj = json as Record<string, any>;
    if (!obj.deezer_title) return null;
    
    return {
      id: obj.id || `song-${Math.random().toString(36).substr(2, 9)}`,
      deezer_title: obj.deezer_title || 'Unknown Title',
      deezer_artist: obj.deezer_artist || 'Unknown Artist',
      deezer_album: obj.deezer_album || 'Unknown Album',
      release_year: obj.release_year || '2000',
      genre: obj.genre || 'Unknown',
      cardColor: obj.cardColor || '#007AFF',
      preview_url: obj.preview_url || '',
      deezer_url: obj.deezer_url || ''
    };
  };

  // Helper function to safely convert Json array to Song array
  private static jsonArrayToSongs = (jsonArray: Json): Song[] => {
    if (!Array.isArray(jsonArray)) return [];
    
    return jsonArray
      .map(item => GameService.jsonToSong(item))
      .filter((song): song is Song => song !== null);
  };

  // Helper function to safely convert database phase to GamePhase
  private static toGamePhase = (dbPhase: string): GamePhase => {
    switch (dbPhase) {
      case 'lobby': return 'hostLobby';
      case 'playing': return 'playing';
      case 'finished': return 'finished';
      default: return 'menu';
    }
  };

  static async createRoom(
    hostId: string,
    hostName: string,
    lobbyCode: string,
    gamemode: string,
    gamemodeSettings: any,
  ): Promise<{ data: GameRoom | null; error: any }> {
    try {
      console.log('[GameService] Creating room:', { hostId, lobbyCode, gamemode });

      const { data, error } = await supabase
        .from('game_rooms')
        .insert([
          {
            host_id: hostId,
            host_name: hostName,
            lobby_code: lobbyCode,
            phase: 'lobby',
            gamemode: gamemode as GameMode,
            gamemode_settings: gamemodeSettings as Json,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('[GameService] Error creating room:', error);
        return { data: null, error };
      }

      const gameRoom: GameRoom = {
        id: data.id,
        lobby_code: data.lobby_code,
        host_id: data.host_id,
        host_name: data.host_name,
        phase: GameService.toGamePhase(data.phase),
        gamemode: data.gamemode as GameMode,
        gamemode_settings: (data.gamemode_settings as GameModeSettings) || {},
        songs: GameService.jsonArrayToSongs(data.songs),
        current_song: GameService.jsonToSong(data.current_song),
        current_turn: data.current_turn || 1,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      console.log('[GameService] Room created successfully:', gameRoom);
      return { data: gameRoom, error: null };
    } catch (error) {
      console.error('[GameService] Exception creating room:', error);
      return { data: null, error };
    }
  }

  static async addPlayer(
    roomId: string,
    name: string,
    character: string,
    color: string,
    playerSessionId: string
  ): Promise<{ data: Player | null; error: any }> {
    try {
      console.log('[GameService] Adding player:', { roomId, name, character, color });

      // Check if the player already exists in the room
      const { data: existingPlayers, error: existingPlayersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('name', name);

      if (existingPlayersError) {
        console.error('[GameService] Error checking for existing players:', existingPlayersError);
        return { data: null, error: existingPlayersError };
      }

      if (existingPlayers && existingPlayers.length > 0) {
        const errorMessage = 'Player with this name already exists in the room';
        console.warn('[GameService] ' + errorMessage);
        return { data: null, error: { message: errorMessage } };
      }

      const { data, error } = await supabase
        .from('players')
        .insert({
          room_id: roomId,
          name: name,
          character: character,
          color: color,
          timeline_color: color,
          player_session_id: playerSessionId
        })
        .select()
        .single();

      if (error) {
        console.error('[GameService] Error adding player:', error);
        return { data: null, error };
      }

      const player: Player = {
        id: data.id,
        name: data.name,
        character: data.character,
        color: data.color,
        score: data.score || 0,
        timeline: GameService.jsonArrayToSongs(data.timeline),
        timelineColor: data.timeline_color
      };

      console.log('[GameService] Player added successfully:', player);
      return { data: player, error: null };
    } catch (error) {
      console.error('[GameService] Exception adding player:', error);
      return { data: null, error };
    }
  }

  static async startGame(roomId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[GameService] Starting game in room:', roomId);

      // Fetch players in the room
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) {
        console.error('[GameService] Error fetching players:', playersError);
        return { success: false, error: playersError.message };
      }

      if (!players || players.length === 0) {
        console.warn('[GameService] No players in the room, cannot start the game');
        return { success: false, error: 'No players in the room' };
      }

      // Randomly select the first player as the current player
      const randomIndex = Math.floor(Math.random() * players.length);
      const firstPlayer = players[randomIndex];

      // Update the room to set the phase to 'playing' and assign the current player
      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({ phase: 'playing', current_player_id: firstPlayer.id })
        .eq('id', roomId);

      if (updateError) {
        console.error('[GameService] Error updating room:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('[GameService] Game started successfully in room:', roomId, 'Current player:', firstPlayer.id);
      return { success: true };
    } catch (error) {
      console.error('[GameService] Exception starting game:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async initializeGameWithStartingCards(roomId: string, songs: Song[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[GameService] Initializing game with starting cards:', roomId);

      // Get first song as mystery card
      const mysteryCard = songs[0];
      
      // Update room to playing phase with mystery card
      const { error: roomError } = await supabase
        .from('game_rooms')
        .update({ 
          phase: 'playing',
          current_song: mysteryCard as unknown as Json,
          songs: songs as unknown as Json
        })
        .eq('id', roomId);

      if (roomError) {
        console.error('[GameService] Error updating room for game start:', roomError);
        return { success: false, error: roomError.message };
      }

      console.log('[GameService] Game initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('[GameService] Exception initializing game:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async placeCardAndAdvanceTurn(
    roomId: string,
    playerId: string,
    song: Song,
    position: number,
    availableSongs: Song[]
  ): Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; error?: string }> {
    try {
      console.log('[GameService] Placing card and advancing turn:', { roomId, playerId, song: song.deezer_title, position });

      const result = await this.placeCard(roomId, playerId, song, position);
      
      if (!result.success) {
        return result;
      }

      // If game ended, don't set next song
      if (result.gameEnded) {
        return result;
      }

      // Set next mystery card
      if (availableSongs.length > 0) {
        const nextSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
        await this.updateRoomCurrentSong(roomId, nextSong);
      }

      return result;
    } catch (error) {
      console.error('[GameService] Exception placing card and advancing turn:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async setCurrentSong(roomId: string, song: Song): Promise<{ success: boolean; error?: string }> {
    return this.updateRoomCurrentSong(roomId, song);
  }

  static async endGame(roomId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[GameService] Ending game in room:', roomId);

      const { error } = await supabase
        .from('game_rooms')
        .update({ phase: 'finished' })
        .eq('id', roomId);

      if (error) {
        console.error('[GameService] Error ending game:', error);
        return { success: false, error: error.message };
      }

      console.log('[GameService] Game ended successfully');
      return { success: true };
    } catch (error) {
      console.error('[GameService] Exception ending game:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async placeCard(
    roomId: string,
    playerId: string,
    song: Song,
    position: number
  ): Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; error?: string }> {
    try {
      console.log('[GameService] Placing card:', { roomId, playerId, song: song.deezer_title, position });

      // Get the room and players
      const { room, players, error: roomError } = await this.getRoomWithPlayers(roomId);
      if (!room || !players || roomError) {
        console.error('[GameService] Error fetching room with players:', roomError);
        return { success: false, error: roomError };
      }

      // Find the current player
      const currentPlayer = players.find(p => p.id === playerId);
      if (!currentPlayer) {
        console.warn('[GameService] Current player not found:', playerId);
        return { success: false, error: 'Current player not found' };
      }

      // Check if it's the player's turn
      if (room.current_player_id !== playerId) {
        console.warn('[GameService] Not current player\'s turn:', { currentPlayerId: room.current_player_id, playerId });
        return { success: false, error: 'Not current player\'s turn' };
      }

      // Get the current song
      const currentSong = room.current_song;
      if (!currentSong) {
        console.warn('[GameService] No current song set for the room');
        return { success: false, error: 'No current song set for the room' };
      }

      // Update the player's timeline
      const timeline = Array.isArray(currentPlayer.timeline) ? [...currentPlayer.timeline] : [];
      timeline.splice(position, 0, currentSong);

      const { success: timelineSuccess, error: timelineError } = await this.updatePlayerTimeline(playerId, timeline);
      if (!timelineSuccess) {
        console.error('[GameService] Error updating player timeline:', timelineError);
        return { success: false, error: timelineError };
      }

      // Determine if the card placement was correct
      let correct = false;
      if (timeline.length > 1) {
        if (position === 0) {
          // First card in timeline
          correct = currentSong.release_year <= timeline[1].release_year;
        } else if (position === timeline.length - 1) {
          // Last card in timeline
          correct = currentSong.release_year >= timeline[position - 1].release_year;
        } else {
          // Card in the middle of timeline
          correct = currentSong.release_year >= timeline[position - 1].release_year &&
            currentSong.release_year <= timeline[position + 1].release_year;
        }
      } else {
        correct = true; // First card is always correct
      }

      // Update player's score
      let newScore = currentPlayer.score || 0;
      if (correct) {
        newScore += 1;
      }

      const { error: scoreError } = await supabase
        .from('players')
        .update({ score: newScore })
        .eq('id', playerId);

      if (scoreError) {
        console.error('[GameService] Error updating player score:', scoreError);
        return { success: false, error: scoreError.message };
      }

      // Check for game end condition (timeline complete)
      let gameEnded = false;
      let winner: Player | undefined;
      if (timeline.length >= 5) {
        gameEnded = true;
        winner = currentPlayer;

        // Update room phase to 'finished'
        const { error: roomUpdateError } = await supabase
          .from('game_rooms')
          .update({ phase: 'finished' })
          .eq('id', roomId);

        if (roomUpdateError) {
          console.error('[GameService] Error updating room phase:', roomUpdateError);
          return { success: false, error: roomUpdateError.message };
        }
      }

      // Determine the next player
      let nextPlayerId: string | undefined;
      if (!gameEnded) {
        const currentPlayerIndex = players.findIndex(p => p.id === playerId);
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        nextPlayerId = players[nextPlayerIndex].id;

        // Update the room with the next player
        const { error: nextPlayerError } = await supabase
          .from('game_rooms')
          .update({ current_player_id: nextPlayerId })
          .eq('id', roomId);

        if (nextPlayerError) {
          console.error('[GameService] Error updating current player:', nextPlayerError);
          return { success: false, error: nextPlayerError.message };
        }
      }

      console.log('[GameService] Card placed successfully:', { correct, gameEnded, nextPlayerId });
      return { success: true, correct, gameEnded, winner };
    } catch (error) {
      console.error('[GameService] Exception placing card:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async updatePlayerTimeline(
    playerId: string, 
    timeline: Song[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[GameService] Updating player timeline:', { playerId, timelineLength: timeline.length });
      
      const { error } = await supabase
        .from('players')
        .update({ 
          timeline: timeline as unknown as Json
        })
        .eq('id', playerId);

      if (error) {
        console.error('[GameService] Error updating timeline:', error);
        return { success: false, error: error.message };
      }

      console.log('[GameService] Timeline updated successfully');
      return { success: true };
    } catch (error) {
      console.error('[GameService] Exception updating timeline:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getRoomWithPlayers(roomId: string): Promise<{
    room: GameRoom | null;
    players: Player[];
    error?: string;
  }> {
    try {
      console.log('[GameService] Fetching room with players:', roomId);

      // Fetch room data
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('[GameService] Error fetching room:', roomError);
        return { room: null, players: [], error: roomError.message };
      }

      // Fetch players for the room
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (playersError) {
        console.error('[GameService] Error fetching players:', playersError);
        return { room: roomData, players: [], error: playersError.message };
      }

      // Convert database records to typed objects
      const room: GameRoom = {
        id: roomData.id,
        lobby_code: roomData.lobby_code,
        host_id: roomData.host_id,
        host_name: roomData.host_name,
        phase: GameService.toGamePhase(roomData.phase),
        gamemode: roomData.gamemode as GameMode,
        gamemode_settings: (roomData.gamemode_settings as GameModeSettings) || {},
        songs: GameService.jsonArrayToSongs(roomData.songs),
        current_song: GameService.jsonToSong(roomData.current_song),
        current_turn: roomData.current_turn || 1,
        created_at: roomData.created_at,
        updated_at: roomData.updated_at,
        current_player_id: roomData.current_player_id
      };

      const players: Player[] = playersData.map(player => ({
        id: player.id,
        name: player.name,
        character: player.character,
        color: player.color,
        score: player.score || 0,
        timeline: GameService.jsonArrayToSongs(player.timeline),
        timelineColor: player.timeline_color
      }));

      console.log('[GameService] Room and players fetched successfully:', {
        roomPhase: room.phase,
        playersCount: players.length
      });

      return { room, players };
    } catch (error) {
      console.error('[GameService] Exception fetching room with players:', error);
      return { 
        room: null, 
        players: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async updateRoomCurrentSong(
    roomId: string,
    song: Song
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[GameService] Updating current song for room:', roomId, song.deezer_title);
      
      // Try to fetch preview URL for the song
      let songWithPreview = { ...song };
      try {
        if (!song.preview_url) {
          // Extract a mock Deezer ID from song data for preview fetching
          const mockTrackId = Math.abs(song.id.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0)) % 1000000;

          const previewUrl = await DeezerAudioService.getPreviewUrl(mockTrackId);
          songWithPreview.preview_url = previewUrl;
          console.log('[GameService] Preview URL fetched for current song:', previewUrl);
        }
      } catch (previewError) {
        console.warn('[GameService] Failed to fetch preview URL, continuing without preview:', previewError);
      }
      
      const { error } = await supabase
        .from('game_rooms')
        .update({ current_song: songWithPreview as unknown as Json })
        .eq('id', roomId);

      if (error) {
        console.error('[GameService] Error updating current song:', error);
        return { success: false, error: error.message };
      }

      console.log('[GameService] Current song updated successfully');
      return { success: true };
    } catch (error) {
      console.error('[GameService] Exception updating current song:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async resetGame(roomId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[GameService] Resetting game in room:', roomId);

      // Reset room state
      const { error: roomError } = await supabase
        .from('game_rooms')
        .update({
          phase: 'lobby',
          current_song: null,
          current_player_id: null,
          current_turn: 1
        })
        .eq('id', roomId);

      if (roomError) {
        console.error('[GameService] Error resetting room:', roomError);
        return { success: false, error: roomError.message };
      }

      // Reset player states (score and timeline)
      const { error: playersError } = await supabase
        .from('players')
        .update({
          score: 0,
          timeline: []
        })
        .eq('room_id', roomId);

      if (playersError) {
        console.error('[GameService] Error resetting players:', playersError);
        return { success: false, error: playersError.message };
      }

      console.log('[GameService] Game reset successfully in room:', roomId);
      return { success: true };
    } catch (error) {
      console.error('[GameService] Exception resetting game:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getSongsForRoom(roomId: string): Promise<{ songs: Song[]; error?: string }> {
    try {
      console.log('[GameService] Fetching songs for room:', roomId);

      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('songs')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('[GameService] Error fetching room:', roomError);
        return { songs: [], error: roomError.message };
      }

      const songs = GameService.jsonArrayToSongs(roomData?.songs);

      console.log('[GameService] Songs fetched successfully:', { count: songs.length });
      return { songs, error: undefined };
    } catch (error) {
      console.error('[GameService] Exception fetching songs:', error);
      return { songs: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async addSongToRoom(roomId: string, song: Song): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[GameService] Adding song to room:', { roomId, song: song.deezer_title });

      // Fetch existing songs
      const { songs: existingSongs, error: fetchError } = await this.getSongsForRoom(roomId);
      if (fetchError) {
        console.error('[GameService] Error fetching existing songs:', fetchError);
        return { success: false, error: fetchError };
      }

      // Check if the song already exists
      if (existingSongs.find(s => s.id === song.id)) {
        console.warn('[GameService] Song already exists in room:', song.deezer_title);
        return { success: false, error: 'Song already exists in room' };
      }

      // Add the new song
      const updatedSongs = [...existingSongs, song];

      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({ songs: updatedSongs as unknown as Json })
        .eq('id', roomId);

      if (updateError) {
        console.error('[GameService] Error updating songs:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('[GameService] Song added successfully:', song.deezer_title);
      return { success: true };
    } catch (error) {
      console.error('[GameService] Exception adding song:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async removeSongFromRoom(roomId: string, songId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[GameService] Removing song from room:', { roomId, songId });

      // Fetch existing songs
      const { songs: existingSongs, error: fetchError } = await this.getSongsForRoom(roomId);
      if (fetchError) {
        console.error('[GameService] Error fetching existing songs:', fetchError);
        return { success: false, error: fetchError };
      }

      // Filter out the song to be removed
      const updatedSongs = existingSongs.filter(song => song.id !== songId);

      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({ songs: updatedSongs as unknown as Json })
        .eq('id', roomId);

      if (updateError) {
        console.error('[GameService] Error updating songs:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('[GameService] Song removed successfully:', songId);
      return { success: true };
    } catch (error) {
      console.error('[GameService] Exception removing song:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
