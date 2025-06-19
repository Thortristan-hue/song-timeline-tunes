import { supabase } from '@/integrations/supabase/client';
import { Song, Player } from '@/types/game';

export interface GameRoom {
  id: string;
  lobby_code: string;
  host_id: string;
  phase: 'lobby' | 'playing' | 'finished';
  current_turn: number | null;
  current_song_index: number | null;
  songs: Song[];
  created_at: string;
  updated_at: string;
}

export interface DatabasePlayer {
  id: string;
  room_id: string;
  player_session_id: string;
  name: string;
  color: string;
  timeline_color: string;
  score: number | null;
  timeline: Song[];
  is_host: boolean | null;
  joined_at: string;
  last_active: string;
}

export class GameService {
  private sessionId: string;

  constructor() {
    // Generate a unique session ID for this browser session
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private convertJsonToSongs(jsonData: any): Song[] {
    if (!Array.isArray(jsonData)) return [];
    return jsonData.map(item => ({
      id: item.id || '',
      deezer_title: item.deezer_title || '',
      deezer_artist: item.deezer_artist || '',
      deezer_album: item.deezer_album || '',
      release_year: item.release_year || '',
      genre: item.genre || '',
      cardColor: item.cardColor || '#FF6B6B',
      preview_url: item.preview_url
    }));
  }

  // Enhanced method to extract playlist ID from various Deezer URL formats
  private extractDeezerPlaylistId(url: string): string | null {
    try {
      // Handle various Deezer URL formats:
      // https://www.deezer.com/playlist/1234567890
      // https://deezer.com/playlist/1234567890
      // https://www.deezer.com/en/playlist/1234567890
      // https://deezer.com/us/playlist/1234567890
      const patterns = [
        /deezer\.com\/(?:[a-z]{2}\/)?playlist\/(\d+)/i,
        /deezer\.page\.link\/.*playlist[/=](\d+)/i,
        /^(\d+)$/ // Just the ID itself
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    } catch (error) {
      console.error('Error extracting playlist ID:', error);
      return null;
    }
  }

  // Enhanced method to load songs from Deezer playlist
  async loadSongsFromDeezerPlaylist(playlistUrl: string): Promise<Song[]> {
    try {
      const playlistId = this.extractDeezerPlaylistId(playlistUrl);
      if (!playlistId) {
        throw new Error('Invalid Deezer playlist URL format');
      }

      console.log('Loading playlist with ID:', playlistId);

      // Use CORS proxy for Deezer API requests
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const deezerApiUrl = `https://api.deezer.com/playlist/${playlistId}`;
      const proxiedUrl = corsProxy + encodeURIComponent(deezerApiUrl);

      const response = await fetch(proxiedUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch playlist: ${response.status}`);
      }

      const playlistData = await response.json();
      
      if (!playlistData.tracks || !playlistData.tracks.data) {
        throw new Error('No tracks found in playlist');
      }

      const songs: Song[] = playlistData.tracks.data.map((track: any, index: number) => {
        // Generate a color for each song
        const colors = [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
          '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
          '#F8C471', '#82E0AA', '#AED6F1', '#E8DAEF'
        ];
        
        return {
          id: track.id?.toString() || `track_${index}`,
          deezer_title: track.title || 'Unknown Title',
          deezer_artist: track.artist?.name || 'Unknown Artist',
          deezer_album: track.album?.title || 'Unknown Album',
          release_year: track.album?.release_date ? 
            new Date(track.album.release_date).getFullYear().toString() : 
            'Unknown',
          genre: 'Unknown', // Deezer API doesn't always provide genre in playlist endpoint
          cardColor: colors[index % colors.length],
          preview_url: track.preview || undefined
        };
      });

      console.log(`Loaded ${songs.length} songs from Deezer playlist`);
      return songs;

    } catch (error) {
      console.error('Error loading Deezer playlist:', error);
      throw new Error(`Failed to load playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createRoom(hostName: string): Promise<{ room: GameRoom; lobbyCode: string }> {
    try {
      console.log('Creating room with host:', hostName, 'Session ID:', this.sessionId);
      
      // Generate lobby code using the database function
      const { data: lobbyCodeData, error: codeError } = await supabase
        .rpc('generate_lobby_code');

      if (codeError) {
        console.error('Error generating lobby code:', codeError);
        throw codeError;
      }

      const lobbyCode = lobbyCodeData;
      console.log('Generated lobby code:', lobbyCode);

      // Create the room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          lobby_code: lobbyCode,
          host_id: this.sessionId, // Now using text session ID
          phase: 'lobby'
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating room:', roomError);
        throw roomError;
      }

      console.log('Room created successfully:', roomData);

      const room: GameRoom = {
        ...roomData,
        phase: roomData.phase as 'lobby' | 'playing' | 'finished',
        songs: this.convertJsonToSongs(roomData.songs)
      };

      // Add host as a player
      console.log('Adding host as player...');
      await this.joinRoom(lobbyCode, hostName, true);

      return { room, lobbyCode };
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async joinRoom(lobbyCode: string, playerName: string, isHost: boolean = false): Promise<DatabasePlayer> {
    try {
      console.log('Joining room:', lobbyCode, 'as:', playerName, 'isHost:', isHost);
      
      // Find the room
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('lobby_code', lobbyCode.toUpperCase())
        .single();

      if (roomError) {
        console.error('Room lookup error:', roomError);
        throw roomError;
      }
      if (!room) throw new Error('Room not found');

      console.log('Found room:', room.id);

      // Check if player already exists in this room
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .eq('player_session_id', this.sessionId)
        .single();

      if (existingPlayer) {
        console.log('Player already exists, updating...');
        // Update existing player's activity
        const { data: updatedPlayer, error: updateError } = await supabase
          .from('players')
          .update({ 
            last_active: new Date().toISOString(),
            name: playerName
          })
          .eq('id', existingPlayer.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return {
          ...updatedPlayer,
          timeline: this.convertJsonToSongs(updatedPlayer.timeline)
        };
      }

      // Generate player color
      const playerColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ];

      // Get existing players to avoid color conflicts
      const { data: existingPlayers } = await supabase
        .from('players')
        .select('color')
        .eq('room_id', room.id);

      const usedColors = existingPlayers?.map(p => p.color) || [];
      const availableColors = playerColors.filter(color => !usedColors.includes(color));
      const playerColor = availableColors[0] || playerColors[0];

      console.log('Creating new player with color:', playerColor);

      // Create new player
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          player_session_id: this.sessionId,
          name: playerName,
          color: playerColor,
          timeline_color: playerColor,
          is_host: isHost,
          score: 0,
          timeline: []
        })
        .select()
        .single();

      if (playerError) {
        console.error('Player creation error:', playerError);
        throw playerError;
      }

      console.log('Player created successfully:', player);

      return {
        ...player,
        timeline: this.convertJsonToSongs(player.timeline)
      };
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  async updatePlayer(playerId: string, updates: Partial<Pick<DatabasePlayer, 'name' | 'color' | 'timeline_color'>>): Promise<void> {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          ...updates,
          last_active: new Date().toISOString()
        })
        .eq('id', playerId)
        .eq('player_session_id', this.sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  }

  async getRoomByCode(lobbyCode: string): Promise<GameRoom | null> {
    try {
      const { data: room, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('lobby_code', lobbyCode.toUpperCase())
        .single();

      if (error) throw error;

      return {
        ...room,
        phase: room.phase as 'lobby' | 'playing' | 'finished',
        songs: this.convertJsonToSongs(room.songs)
      };
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  }

  async getPlayersInRoom(roomId: string): Promise<DatabasePlayer[]> {
    try {
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return (players || []).map(player => ({
        ...player,
        timeline: this.convertJsonToSongs(player.timeline)
      }));
    } catch (error) {
      console.error('Error getting players:', error);
      return [];
    }
  }

  async updateRoomSongs(roomId: string, songs: Song[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          songs: songs as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating room songs:', error);
      throw error;
    }
  }

  async startGame(roomId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          phase: 'playing',
          current_turn: 0,
          current_song_index: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  }

  // Real-time subscriptions
  subscribeToRoom(roomId: string, callbacks: {
    onRoomUpdate?: (room: GameRoom) => void;
    onPlayersUpdate?: (players: DatabasePlayer[]) => void;
  }) {
    const roomChannel = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomId}`
      }, (payload) => {
        console.log('Room update:', payload);
        if (callbacks.onRoomUpdate && payload.new) {
          const room = payload.new as any;
          callbacks.onRoomUpdate({
            ...room,
            phase: room.phase as 'lobby' | 'playing' | 'finished',
            songs: this.convertJsonToSongs(room.songs)
          });
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`
      }, async () => {
        console.log('Players update');
        if (callbacks.onPlayersUpdate) {
          const players = await this.getPlayersInRoom(roomId);
          callbacks.onPlayersUpdate(players);
        }
      })
      .subscribe();

    return roomChannel;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  convertDatabasePlayerToPlayer(dbPlayer: DatabasePlayer): Player {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      color: dbPlayer.color,
      timelineColor: dbPlayer.timeline_color,
      score: dbPlayer.score || 0,
      timeline: dbPlayer.timeline || []
    };
  }
}

export const gameService = new GameService();
