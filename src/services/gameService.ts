
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom } from '@/types/game';
import { IGameService } from './IGameService';
import { suppressUnused } from '@/utils/suppressUnused';

export class GameService implements IGameService {
  async createRoom(hostName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const lobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          lobby_code: lobbyCode,
          host_name: hostName,
          phase: 'lobby',
          songs: []
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to create room' };
    }
  }

  async joinRoom(lobbyCode: string, playerName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // First find the room
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('lobby_code', lobbyCode.toUpperCase())
        .single();

      if (roomError || !room) {
        return { success: false, error: 'Room not found' };
      }

      // Create player
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          name: playerName,
          color: '#FF6B9D',
          score: 0,
          timeline: []
        })
        .select()
        .single();

      if (playerError) {
        return { success: false, error: 'Failed to join room' };
      }

      return { success: true, data: { room, player } };
    } catch (error) {
      return { success: false, error: 'Failed to join room' };
    }
  }

  async updatePlayer(playerId: string, updates: Partial<Player>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update player' };
    }
  }

  async updateRoom(roomId: string, updates: Partial<GameRoom>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update(updates)
        .eq('id', roomId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update room' };
    }
  }

  async setSongs(roomId: string, songs: Song[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ songs: songs as unknown as any })
        .eq('id', roomId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to set songs' };
    }
  }

  async processGuess(playerId: string, guess: any): Promise<{ success: boolean; data?: any; error?: string }> {
    // Suppress unused warnings for development stub
    suppressUnused(playerId, guess);
    
    // TODO: Implement guess processing logic
    return { success: false, error: 'Not implemented yet' };
  }

  async getRoomState(roomId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        return { success: false, error: roomError.message };
      }

      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) {
        return { success: false, error: playersError.message };
      }

      return { success: true, data: { room, players } };
    } catch (error) {
      return { success: false, error: 'Failed to get room state' };
    }
  }
}

export const gameService = new GameService();
