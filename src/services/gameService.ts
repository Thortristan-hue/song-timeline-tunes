
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

  async createRoom(hostName: string): Promise<{ room: GameRoom; lobbyCode: string }> {
    try {
      // Generate lobby code using the database function
      const { data: lobbyCodeData, error: codeError } = await supabase
        .rpc('generate_lobby_code');

      if (codeError) throw codeError;

      const lobbyCode = lobbyCodeData;

      // Create the room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          lobby_code: lobbyCode,
          host_id: this.sessionId,
          phase: 'lobby'
        })
        .select()
        .single();

      if (roomError) throw roomError;

      const room: GameRoom = {
        ...roomData,
        phase: roomData.phase as 'lobby' | 'playing' | 'finished',
        songs: Array.isArray(roomData.songs) ? roomData.songs as Song[] : []
      };

      // Add host as a player
      await this.joinRoom(lobbyCode, hostName, true);

      return { room, lobbyCode };
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async joinRoom(lobbyCode: string, playerName: string, isHost: boolean = false): Promise<DatabasePlayer> {
    try {
      // Find the room
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('lobby_code', lobbyCode.toUpperCase())
        .single();

      if (roomError) throw roomError;
      if (!room) throw new Error('Room not found');

      // Check if player already exists in this room
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .eq('player_session_id', this.sessionId)
        .single();

      if (existingPlayer) {
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
          timeline: Array.isArray(updatedPlayer.timeline) 
            ? updatedPlayer.timeline as Song[] 
            : []
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

      if (playerError) throw playerError;

      return {
        ...player,
        timeline: Array.isArray(player.timeline) 
          ? player.timeline as Song[] 
          : []
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
        songs: Array.isArray(room.songs) ? room.songs as Song[] : []
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
        timeline: Array.isArray(player.timeline) 
          ? player.timeline as Song[] 
          : []
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
            songs: Array.isArray(room.songs) ? room.songs as Song[] : []
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
