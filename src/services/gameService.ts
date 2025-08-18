
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom } from '@/types/game';
import { IGameService } from './IGameService';
import { suppressUnused } from '@/utils/suppressUnused';

// Helper function to convert database GameRoom to our GameRoom interface
const convertDatabaseRoom = (dbRoom: any): GameRoom => {
  return {
    id: dbRoom.id,
    lobby_code: dbRoom.lobby_code,
    host_id: dbRoom.host_id,
    host_name: dbRoom.host_name || '', // Handle null values
    phase: dbRoom.phase || 'lobby',
    gamemode: dbRoom.gamemode || 'classic',
    gamemode_settings: dbRoom.gamemode_settings || {},
    songs: Array.isArray(dbRoom.songs) ? dbRoom.songs : [],
    created_at: dbRoom.created_at,
    updated_at: dbRoom.updated_at,
    current_turn: dbRoom.current_turn || 0,
    current_song: dbRoom.current_song || null,
    current_player_id: dbRoom.current_player_id || null
  };
};

// Helper function to convert database Player to our Player interface
const convertDatabasePlayer = (dbPlayer: any): Player => {
  return {
    id: dbPlayer.id,
    name: dbPlayer.name || 'Unknown Player',
    color: dbPlayer.color || '#007AFF',
    timelineColor: dbPlayer.timeline_color || dbPlayer.color || '#007AFF', // Map timeline_color to timelineColor
    score: dbPlayer.score || 0,
    timeline: Array.isArray(dbPlayer.timeline) ? dbPlayer.timeline : [],
    character: dbPlayer.character || 'char_dave'
  };
};

export class GameService implements IGameService {
  // Room and Player Management
  async getRoomDetails(roomId: string): Promise<GameRoom | null> {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching room details:', error);
        return null;
      }

      return data ? convertDatabaseRoom(data) : null;
    } catch (error) {
      console.error('Failed to get room details:', error);
      return null;
    }
  }

  async getPlayer(playerId: string): Promise<Player | null> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching player:', error);
        return null;
      }

      return data ? convertDatabasePlayer(data) : null;
    } catch (error) {
      console.error('Failed to get player:', error);
      return null;
    }
  }

  // Game Initialization
  async initializeGameWithStartingCards(roomId: string, songs: Song[]): Promise<void> {
    try {
      // Set first two songs as starting cards and select first song as current
      const startingCards = songs.slice(0, 2);
      const currentSong = songs[Math.floor(Math.random() * songs.length)];

      // Get the first player to start
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      const firstPlayer = players?.[0];

      // Update room with game state
      const { error } = await supabase
        .from('game_rooms')
        .update({
          phase: 'playing',
          current_song: currentSong as unknown as any,
          current_player_id: firstPlayer?.id,
          current_turn: 1,
          songs: songs as unknown as any
        })
        .eq('id', roomId);

      if (error) throw error;

      // Set starting cards for each player
      if (players) {
        for (const player of players) {
          await supabase
            .from('players')
            .update({
              timeline: startingCards as unknown as any
            })
            .eq('id', player.id);
        }
      }

    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }

  // Card Placement and Game Logic
  async placeCard(roomId: string, playerId: string, song: Song, position: number): Promise<{
    success: boolean;
    correct?: boolean;
    gameEnded?: boolean;
    winner?: Player;
  }> {
    try {
      // Get player timeline
      const player = await this.getPlayer(playerId);
      if (!player) {
        return { success: false };
      }

      // Check if placement is correct
      const isCorrect = await this.isCardPlacementCorrect(roomId, playerId, song, position);

      // Update player timeline
      const newTimeline = [...(player.timeline || [])];
      newTimeline.splice(position, 0, song);

      await supabase
        .from('players')
        .update({
          timeline: newTimeline as unknown as any,
          score: isCorrect ? (player.score || 0) + 1 : (player.score || 0)
        })
        .eq('id', playerId);

      // Check if game ended
      const gameEnded = await this.checkIfGameEnded(roomId);
      let winner = null;
      
      if (gameEnded) {
        winner = await this.determineWinner(roomId);
      } else {
        // Advance turn if game continues
        await this.advanceTurn(roomId);
      }

      return {
        success: true,
        correct: isCorrect,
        gameEnded,
        winner
      };

    } catch (error) {
      console.error('Failed to place card:', error);
      return { success: false };
    }
  }

  // Turn Management
  async advanceTurn(roomId: string): Promise<void> {
    try {
      const room = await this.getRoomDetails(roomId);
      if (!room) return;

      // Get all players
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (!players || players.length === 0) return;

      // Find current player index and move to next
      const currentPlayerIndex = players.findIndex(p => p.id === room.current_player_id);
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      const nextPlayer = players[nextPlayerIndex];

      // Update room with next player
      await supabase
        .from('game_rooms')
        .update({
          current_player_id: nextPlayer.id,
          current_turn: (room.current_turn || 0) + 1
        })
        .eq('id', roomId);

    } catch (error) {
      console.error('Failed to advance turn:', error);
    }
  }

  // Game State Management
  async endGame(roomId: string): Promise<void> {
    try {
      await supabase
        .from('game_rooms')
        .update({
          phase: 'finished'
        })
        .eq('id', roomId);
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  }

  async checkIfGameEnded(roomId: string): Promise<boolean> {
    try {
      // Simple check: game ends when any player reaches 10 points
      const { data: players } = await supabase
        .from('players')
        .select('score')
        .eq('room_id', roomId);

      return players?.some(player => (player.score || 0) >= 10) || false;
    } catch (error) {
      console.error('Failed to check if game ended:', error);
      return false;
    }
  }

  async determineWinner(roomId: string): Promise<Player | null> {
    try {
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('score', { ascending: false })
        .limit(1);

      return players?.[0] ? convertDatabasePlayer(players[0]) : null;
    } catch (error) {
      console.error('Failed to determine winner:', error);
      return null;
    }
  }

  // Game Validation
  async isCardPlacementCorrect(roomId: string, playerId: string, song: Song, position: number): Promise<boolean> {
    suppressUnused(roomId, playerId, song, position);
    // TODO: Implement actual chronological validation logic
    return Math.random() > 0.5; // Temporary random logic
  }

  // Player Management
  async awardPoints(roomId: string, playerId: string, points: number): Promise<void> {
    try {
      const player = await this.getPlayer(playerId);
      if (!player) return;

      await supabase
        .from('players')
        .update({
          score: (player.score || 0) + points
        })
        .eq('id', playerId);
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  }

  async revertTimeline(roomId: string, playerId: string, position: number): Promise<void> {
    suppressUnused(roomId);
    try {
      const player = await this.getPlayer(playerId);
      if (!player || !player.timeline) return;

      const newTimeline = [...player.timeline];
      newTimeline.splice(position, 1);

      await supabase
        .from('players')
        .update({
          timeline: newTimeline as unknown as any
        })
        .eq('id', playerId);
    } catch (error) {
      console.error('Failed to revert timeline:', error);
    }
  }

  // Legacy methods for backward compatibility
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
        .maybeSingle();

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

      return { success: true, data: { room: convertDatabaseRoom(room), player: convertDatabasePlayer(player) } };
    } catch (error) {
      return { success: false, error: 'Failed to join room' };
    }
  }

  async updatePlayer(playerId: string, updates: Partial<Player>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          name: updates.name,
          color: updates.color,
          timeline_color: updates.timelineColor, // Map timelineColor to timeline_color
          score: updates.score,
          timeline: updates.timeline as any,
          character: updates.character
        })
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
        .update(updates as any)
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
    suppressUnused(playerId, guess);
    return { success: false, error: 'Not implemented yet' };
  }

  async getRoomState(roomId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

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

      return { 
        success: true, 
        data: { 
          room: room ? convertDatabaseRoom(room) : null, 
          players: players ? players.map(convertDatabasePlayer) : [] 
        } 
      };
    } catch (error) {
      return { success: false, error: 'Failed to get room state' };
    }
  }
}

export const gameService = new GameService();
