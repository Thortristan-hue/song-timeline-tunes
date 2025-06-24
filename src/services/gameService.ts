
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Player, Song, GameRoom } from '@/types/game';

export type DatabasePlayer = Database['public']['Tables']['players']['Row'];
export type DatabaseRoom = Database['public']['Tables']['game_rooms']['Row'];

class GameService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getStoredSessionId() || this.generateSessionId();
    this.storeSessionId(this.sessionId);
  }

  generateSessionId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  private getStoredSessionId(): string | null {
    return localStorage.getItem('game_session_id');
  }

  private storeSessionId(sessionId: string): void {
    localStorage.setItem('game_session_id', sessionId);
  }

  // Session persistence for rejoining
  storePlayerSession(roomId: string, playerId: string, lobbyCode: string): void {
    const sessionData = {
      roomId,
      playerId,
      lobbyCode,
      timestamp: Date.now()
    };
    localStorage.setItem('player_session', JSON.stringify(sessionData));
  }

  getStoredPlayerSession(): { roomId: string; playerId: string; lobbyCode: string } | null {
    const stored = localStorage.getItem('player_session');
    if (!stored) return null;
    
    try {
      const sessionData = JSON.parse(stored);
      // Check if session is less than 24 hours old
      if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
        return sessionData;
      }
    } catch (error) {
      console.error('Failed to parse stored session:', error);
    }
    
    this.clearPlayerSession();
    return null;
  }

  clearPlayerSession(): void {
    localStorage.removeItem('player_session');
  }

  // More flexible URL validation
  validateSongUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      // Accept any valid URL protocol including file://, blob://, data://, etc.
      return ['https:', 'http:', 'data:', 'blob:', 'file:'].includes(urlObj.protocol);
    } catch {
      // If URL constructor fails, check if it's a relative path
      return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
    }
  }

  async createRoom(hostName: string): Promise<{ room: GameRoom; lobbyCode: string }> {
    const lobbyCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const { data: room, error } = await supabase
      .from('game_rooms')
      .insert({
        lobby_code: lobbyCode,
        host_id: this.sessionId,
        phase: 'lobby',
        songs: [],
        current_turn: 0,
        current_song_index: 0
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      room: this.convertDatabaseRoomToGameRoom(room),
      lobbyCode
    };
  }

  async joinRoom(lobbyCode: string, playerName: string): Promise<DatabasePlayer> {
    // Check if room exists
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('lobby_code', lobbyCode)
      .single();

    if (roomError || !room) {
      throw new Error('Room not found');
    }

    // Check if a player with this name already exists in this room
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', room.id)
      .eq('name', playerName)
      .maybeSingle();

    if (existingPlayer) {
      // Update existing player's session ID and return
      const { data: updatedPlayer, error: updateError } = await supabase
        .from('players')
        .update({
          player_session_id: this.sessionId,
          last_active: new Date().toISOString()
        })
        .eq('id', existingPlayer.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      // Store session for rejoining
      this.storePlayerSession(room.id, updatedPlayer.id, lobbyCode);
      
      return updatedPlayer;
    }

    // Create new player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        name: playerName,
        room_id: room.id,
        player_session_id: this.sessionId,
        color: this.generateRandomColor(),
        timeline_color: this.generateRandomColor(),
        score: 0,
        timeline: []
      })
      .select()
      .single();

    if (playerError) throw playerError;
    
    // Store session for rejoining
    this.storePlayerSession(room.id, player.id, lobbyCode);
    
    return player;
  }

  async reconnectPlayer(playerId: string): Promise<DatabasePlayer> {
    const sessionId = this.getSessionId();
    
    const { data, error } = await supabase
      .from('players')
      .update({
        player_session_id: sessionId,
        last_active: new Date().toISOString()
      })
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      console.error('Error reconnecting player:', error);
      throw new Error('Failed to reconnect to game');
    }

    return data;
  }

  // Auto-rejoin functionality
  async autoRejoinIfPossible(): Promise<{ room: GameRoom; player: DatabasePlayer } | null> {
    const session = this.getStoredPlayerSession();
    if (!session) return null;

    try {
      // Check if room still exists
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', session.roomId)
        .single();

      if (roomError || !room) {
        this.clearPlayerSession();
        return null;
      }

      // Check if player still exists
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', session.playerId)
        .eq('room_id', session.roomId)
        .single();

      if (playerError || !player) {
        this.clearPlayerSession();
        return null;
      }

      // Reconnect player
      const reconnectedPlayer = await this.reconnectPlayer(session.playerId);
      
      return {
        room: this.convertDatabaseRoomToGameRoom(room),
        player: reconnectedPlayer
      };
    } catch (error) {
      console.error('Auto-rejoin failed:', error);
      this.clearPlayerSession();
      return null;
    }
  }

  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  convertDatabasePlayerToPlayer(dbPlayer: DatabasePlayer): Player {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      color: dbPlayer.color,
      timelineColor: dbPlayer.timeline_color,
      score: dbPlayer.score || 0,
      timeline: Array.isArray(dbPlayer.timeline) ? (dbPlayer.timeline as unknown as Song[]) : []
    };
  }

  convertDatabaseRoomToGameRoom(dbRoom: DatabaseRoom): GameRoom {
    return {
      id: dbRoom.id,
      lobby_code: dbRoom.lobby_code,
      host_id: dbRoom.host_id,
      host_name: 'Host',
      phase: dbRoom.phase as 'lobby' | 'playing' | 'finished',
      songs: Array.isArray(dbRoom.songs) ? (dbRoom.songs as unknown as Song[]) : [],
      created_at: dbRoom.created_at,
      updated_at: dbRoom.updated_at,
      current_turn: dbRoom.current_turn || 0,
      current_song: null // We'll store this separately or derive it
    };
  }

  async updatePlayer(playerId: string, updates: Partial<{ name: string; color: string; timeline_color: string; score: number; timeline: Song[] }>): Promise<void> {
    const dbUpdates: any = { ...updates };
    
    // Convert timeline to JSON if it exists
    if (updates.timeline) {
      dbUpdates.timeline = updates.timeline as any;
    }

    const { error } = await supabase
      .from('players')
      .update(dbUpdates)
      .eq('id', playerId);

    if (error) throw error;
  }

  async updateRoomSongs(roomId: string, songs: Song[]): Promise<void> {
    // Validate song URLs before updating
    const validSongs = songs.filter(song => {
      if (song.preview_url && !this.validateSongUrl(song.preview_url)) {
        console.warn(`Invalid URL for song ${song.deezer_title}: ${song.preview_url}`);
        return false;
      }
      return true;
    });

    const { error } = await supabase
      .from('game_rooms')
      .update({ songs: validSongs as any })
      .eq('id', roomId);

    if (error) throw error;
  }

  async startGame(roomId: string): Promise<void> {
    const { error } = await supabase
      .from('game_rooms')
      .update({ phase: 'playing' })
      .eq('id', roomId);

    if (error) throw error;
  }

  async assignStartingCards(roomId: string, songs: Song[]): Promise<void> {
    // Get all players in the room (excluding host)
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId);

    if (playersError || !players) throw playersError;

    // Get room info to identify host
    const { data: room } = await supabase
      .from('game_rooms')
      .select('host_id')
      .eq('id', roomId)
      .single();

    if (!room) throw new Error('Room not found');

    // Filter out host from players
    const nonHostPlayers = players.filter(player => player.player_session_id !== room.host_id);

    // Assign each non-host player a random starting card
    for (const player of nonHostPlayers) {
      if (songs.length > 0) {
        const randomSong = songs[Math.floor(Math.random() * songs.length)];
        await this.updatePlayer(player.id, {
          timeline: [randomSong],
          score: 1
        });
      }
    }
  }

  async getRoomByCode(lobbyCode: string): Promise<GameRoom | null> {
    const { data: room, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('lobby_code', lobbyCode)
      .single();

    if (error || !room) return null;
    return this.convertDatabaseRoomToGameRoom(room);
  }

  async getPlayersInRoom(roomId: string): Promise<DatabasePlayer[]> {
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at');

    if (error) throw error;
    return players || [];
  }

  async cleanupRoom(roomId: string): Promise<void> {
    // Delete all players in the room first
    await supabase
      .from('players')
      .delete()
      .eq('room_id', roomId);

    // Then delete the room
    const { error } = await supabase
      .from('game_rooms')
      .delete()
      .eq('id', roomId);

    if (error) throw error;
  }

  // Handle card placement with full synchronization
  async placeCard(roomId: string, playerId: string, song: Song, position: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current player timeline
      const { data: player, error: fetchError } = await supabase
        .from('players')
        .select('timeline, score')
        .eq('id', playerId)
        .single();

      if (fetchError || !player) {
        throw new Error('Failed to fetch player timeline');
      }

      // Create new timeline with inserted song
      const currentTimeline = Array.isArray(player.timeline) ? (player.timeline as unknown as Song[]) : [];
      const newTimeline = [...currentTimeline];
      newTimeline.splice(position, 0, song);

      // Check if placement is correct
      const isCorrect = this.isTimelineCorrect(newTimeline);
      const newScore = isCorrect ? (player.score || 0) + 1 : (player.score || 0);

      // Update player timeline and score
      const { error: updateError } = await supabase
        .from('players')
        .update({ 
          timeline: newTimeline as any,
          score: newScore
        })
        .eq('id', playerId);

      if (updateError) {
        throw updateError;
      }

      // Get current room state and all players
      const { data: room } = await supabase
        .from('game_rooms')
        .select('current_turn, host_id')
        .eq('id', roomId)
        .single();

      const { data: allPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at');

      if (allPlayers && room) {
        // Only count non-host players for turn rotation
        const activePlayers = allPlayers.filter(p => p.player_session_id !== room.host_id);
        const currentTurn = room.current_turn || 0;
        const nextTurn = (currentTurn + 1) % Math.max(1, activePlayers.length);
        
        // Update room with next turn and reset current song index
        await supabase
          .from('game_rooms')
          .update({ 
            current_turn: nextTurn,
            current_song_index: 0
          })
          .eq('id', roomId);
      }

      return { success: isCorrect };
    } catch (error) {
      console.error('Error placing card:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Set current song for the room (using current_song_index for now)
  async setCurrentSong(roomId: string, song: Song): Promise<void> {
    try {
      // For now, we'll just update the current_song_index to 1 to indicate a song is active
      // In a full implementation, you might want to store the song data elsewhere
      const { error } = await supabase
        .from('game_rooms')
        .update({ current_song_index: 1 })
        .eq('id', roomId);

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set current song';
      throw new Error(errorMessage);
    }
  }

  private isTimelineCorrect(timeline: Song[]): boolean {
    for (let i = 0; i < timeline.length - 1; i++) {
      const currentYear = parseInt(timeline[i].release_year);
      const nextYear = parseInt(timeline[i + 1].release_year);
      if (currentYear > nextYear) {
        return false;
      }
    }
    return true;
  }

  private calculateScore(timeline: Song[]): number {
    // Check if timeline is in correct chronological order
    for (let i = 0; i < timeline.length - 1; i++) {
      const currentYear = parseInt(timeline[i].release_year);
      const nextYear = parseInt(timeline[i + 1].release_year);
      if (currentYear > nextYear) {
        return Math.max(0, timeline.length - 1); // Deduct points for incorrect order
      }
    }
    return timeline.length; // Full points for correct order
  }

  async updateGameState(roomId: string, updates: Partial<{
    currentTurn: number;
    currentSong: Song | null;
    phase: string;
  }>): Promise<void> {
    try {
      const dbUpdates: any = {};
      
      if (updates.currentTurn !== undefined) {
        dbUpdates.current_turn = updates.currentTurn;
      }
      
      if (updates.currentSong !== undefined) {
        // For now, just set current_song_index to indicate song state
        dbUpdates.current_song_index = updates.currentSong ? 1 : 0;
      }
      
      if (updates.phase) {
        dbUpdates.phase = updates.phase;
      }

      const { error } = await supabase
        .from('game_rooms')
        .update(dbUpdates)
        .eq('id', roomId);

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update game state';
      throw new Error(errorMessage);
    }
  }

  subscribeToRoom(roomId: string, callbacks: {
    onRoomUpdate: (room: GameRoom) => void;
    onPlayersUpdate: (players: DatabasePlayer[]) => void;
  }) {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          if (payload.new) {
            callbacks.onRoomUpdate(this.convertDatabaseRoomToGameRoom(payload.new as DatabaseRoom));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`
        },
        async () => {
          // Refetch all players when any player changes
          const players = await this.getPlayersInRoom(roomId);
          callbacks.onPlayersUpdate(players);
        }
      )
      .subscribe();

    return channel;
  }
}

export const gameService = new GameService();
export type { GameRoom };
