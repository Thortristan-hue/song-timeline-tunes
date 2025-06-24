import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Player, Song, GameRoom } from '@/types/game';

export type DatabasePlayer = Database['public']['Tables']['players']['Row'];
export type DatabaseRoom = Database['public']['Tables']['game_rooms']['Row'];

class GameService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  generateSessionId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getSessionId(): string {
    return this.sessionId;
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
        songs: []
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

    // Create player
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
      updated_at: dbRoom.updated_at
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
    // Get all players in the room
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId);

    if (playersError || !players) throw playersError;

    // Assign each player a random starting card
    for (const player of players) {
      if (songs.length > 0) {
        const randomSong = songs[Math.floor(Math.random() * songs.length)];
        await this.updatePlayer(player.id, {
          timeline: [randomSong]
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

  async placeCard(roomId: string, playerId: string, song: Song, position: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current player timeline
      const { data: player, error: fetchError } = await supabase
        .from('players')
        .select('timeline')
        .eq('id', playerId)
        .single();

      if (fetchError || !player) {
        throw new Error('Failed to fetch player timeline');
      }

      // Create new timeline with inserted song
      const currentTimeline = Array.isArray(player.timeline) ? (player.timeline as unknown as Song[]) : [];
      const newTimeline = [...currentTimeline];
      newTimeline.splice(position, 0, song);

      // Update player timeline in database
      const { error: updateError } = await supabase
        .from('players')
        .update({ 
          timeline: newTimeline as any,
          score: this.calculateScore(newTimeline)
        })
        .eq('id', playerId);

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error placing card:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
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
      const dbUpdates: any = { ...updates };
      
      if (updates.currentSong) {
        dbUpdates.current_song = updates.currentSong as any;
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
