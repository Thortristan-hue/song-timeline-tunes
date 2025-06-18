import { createClient } from '@supabase/supabase-js';

// Generate UUID without external dependencies
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// ========== Type Definitions ==========
export interface DatabasePlayer {
  id: string;
  room_id: string;
  player_session_id: string;
  name: string;
  color: string;
  timeline_color: string;
  score: number;
  timeline: string; // JSON string in database
  is_host: boolean;
  joined_at: string;
  last_active: string;
}

// ========== Exported Types ==========
type GamePhase = "lobby" | "playing" | "finished";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
}

export interface GameRoom {
  id: string;
  lobby_code: string;
  host_id: string;
  phase: GamePhase;
  current_turn: number;
  current_song_index: number;
  songs: Song[];
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  player_session_id: string;
  name: string;
  color: string;
  timeline_color: string;
  score: number;
  timeline: Song[];
  is_host: boolean;
  joined_at: string;
  last_active: string;
}

export interface GameMove {
  id: string;
  room_id: string;
  player_id: string;
  move_data: any;
  move_type: string;
  created_at: string;
}

// ========== Helper Functions ==========
function isGamePhase(phase: string): phase is GamePhase {
  return ["lobby", "playing", "finished"].includes(phase);
}

function validateGamePhase(phase: string): GamePhase {
  if (isGamePhase(phase)) {
    return phase;
  }
  console.warn(`Invalid game phase: ${phase}. Defaulting to "lobby"`);
  return "lobby";
}

function isSong(obj: any): obj is Song {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.title === 'string' && 
         typeof obj.artist === 'string';
}

function parseSongs(json: any): Song[] {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSong);
  } catch (error) {
    console.error('Failed to parse songs:', error);
    return [];
  }
}

// ========== Game Service Implementation ==========
export class GameService {
  // Game Rooms
  async createGameRoom(roomData: Omit<GameRoom, 'id' | 'created_at' | 'updated_at'>): Promise<GameRoom> {
    const roomId = generateUUID(); // Generate UUID for room
    const { data, error } = await supabase
      .from('game_rooms')
      .insert([{
        id: roomId, // Include the generated ID
        ...roomData,
        songs: JSON.stringify(roomData.songs)
      }])
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      songs: parseSongs(data.songs)
    };
  }

  async getGameRoom(roomId: string): Promise<GameRoom> {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    if (error) throw error;
    return {
      ...data,
      phase: validateGamePhase(data.phase),
      songs: parseSongs(data.songs)
    };
  }

  async updateGameRoom(roomId: string, updates: Partial<GameRoom>): Promise<void> {
    const dbUpdates: any = { ...updates };
    if (updates.songs !== undefined) {
      dbUpdates.songs = JSON.stringify(updates.songs);
    }
    const { error } = await supabase
      .from('game_rooms')
      .update(dbUpdates)
      .eq('id', roomId);
    if (error) throw error;
  }

  // Players
  async createPlayer(playerData: Omit<Player, 'id' | 'joined_at' | 'last_active'>): Promise<Player> {
    const playerId = generateUUID(); // Generate UUID for player
    console.log('Generated player ID:', playerId); // Debug log
    
    const { data, error } = await supabase
      .from('players')
      .insert([{
        id: playerId, // Include the generated ID
        ...playerData,
        timeline: JSON.stringify(playerData.timeline)
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Player creation error:', error);
      throw error;
    }
    
    return {
      ...data,
      timeline: parseSongs(data.timeline)
    };
  }

  async getPlayer(playerId: string): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
    if (error) throw error;
    return {
      ...data,
      timeline: parseSongs(data.timeline)
    };
  }

  async getPlayersInRoom(roomId: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId);
    if (error) throw error;
    return data.map(player => ({
      ...player,
      timeline: parseSongs(player.timeline)
    }));
  }

  async updatePlayer(playerId: string, updates: Partial<Player>): Promise<void> {
    const dbUpdates: any = { ...updates };
    if (updates.timeline !== undefined) {
      dbUpdates.timeline = JSON.stringify(updates.timeline);
    }
    const { error } = await supabase
      .from('players')
      .update(dbUpdates)
      .eq('id', playerId);
    if (error) throw error;
  }

  // Game Moves
  async createGameMove(move: Omit<GameMove, 'id' | 'created_at'>): Promise<GameMove> {
    const moveId = generateUUID(); // Generate UUID for move
    const { data, error } = await supabase
      .from('game_moves')
      .insert([{
        id: moveId, // Include the generated ID
        ...move
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getGameMoves(roomId: string): Promise<GameMove[]> {
    const { data, error } = await supabase
      .from('game_moves')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  // Additional methods needed by useGameRoom hook
  async createRoom(hostName: string): Promise<{ room: GameRoom; lobbyCode: string }> {
    const lobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hostId = generateUUID();
    
    // Create room
    const room = await this.createGameRoom({
      lobby_code: lobbyCode,
      host_id: hostId,
      phase: 'lobby',
      current_turn: 0,
      current_song_index: 0,
      songs: []
    });

    // Create host player
    await this.createPlayer({
      room_id: room.id,
      player_session_id: generateUUID(),
      name: hostName,
      color: '#3B82F6',
      timeline_color: '#3B82F6',
      score: 0,
      timeline: [],
      is_host: true
    });

    return { room, lobbyCode };
  }

  async joinRoom(lobbyCode: string, playerName: string): Promise<DatabasePlayer> {
    const room = await this.getRoomByCode(lobbyCode);
    if (!room) {
      throw new Error('Room not found');
    }

    const player = await this.createPlayer({
      room_id: room.id,
      player_session_id: generateUUID(),
      name: playerName,
      color: '#10B981',
      timeline_color: '#10B981',
      score: 0,
      timeline: [],
      is_host: false
    });

    // Convert to DatabasePlayer format
    return {
      ...player,
      timeline: JSON.stringify(player.timeline)
    };
  }

  async getRoomByCode(lobbyCode: string): Promise<GameRoom | null> {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('lobby_code', lobbyCode)
      .single();
    
    if (error) return null;
    
    return {
      ...data,
      phase: validateGamePhase(data.phase),
      songs: parseSongs(data.songs)
    };
  }

  async updateRoomSongs(roomId: string, songs: Song[]): Promise<void> {
    await this.updateGameRoom(roomId, { songs });
  }

  async startGame(roomId: string): Promise<void> {
    await this.updateGameRoom(roomId, { phase: 'playing' });
  }

  convertDatabasePlayerToPlayer(dbPlayer: DatabasePlayer): any {
    return {
      id: dbPlayer.id,
      roomId: dbPlayer.room_id,
      sessionId: dbPlayer.player_session_id,
      name: dbPlayer.name,
      color: dbPlayer.color,
      timelineColor: dbPlayer.timeline_color,
      score: dbPlayer.score,
      timeline: parseSongs(dbPlayer.timeline),
      isHost: dbPlayer.is_host,
      joinedAt: dbPlayer.joined_at,
      lastActive: dbPlayer.last_active
    };
  }

  subscribeToRoom(roomId: string, callbacks: {
    onRoomUpdate: (room: GameRoom) => void;
    onPlayersUpdate: (players: DatabasePlayer[]) => void;
  }) {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const room = {
            ...payload.new,
            phase: validateGamePhase(payload.new.phase),
            songs: parseSongs(payload.new.songs)
          } as GameRoom;
          callbacks.onRoomUpdate(room);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        () => {
          // Refetch all players when any player changes
          this.getPlayersInRoom(roomId).then(players => {
            const dbPlayers = players.map(p => ({
              ...p,
              timeline: JSON.stringify(p.timeline)
            } as DatabasePlayer));
            callbacks.onPlayersUpdate(dbPlayers);
          });
        }
      )
      .subscribe();

    return channel;
  }
}

// Export singleton instance
export const gameService = new GameService();