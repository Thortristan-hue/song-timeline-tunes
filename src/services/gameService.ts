import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// ========== Type Definitions ==========
type GamePhase = "lobby" | "playing" | "finished";

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
}

interface GameRoom {
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

interface Player {
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

interface GameMove {
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
    const { data, error } = await supabase
      .from('game_rooms')
      .insert([{
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
    const { data, error } = await supabase
      .from('players')
      .insert([{
        ...playerData,
        timeline: JSON.stringify(playerData.timeline)
      }])
      .select()
      .single();
    if (error) throw error;
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
    const { data, error } = await supabase
      .from('game_moves')
      .insert([move])
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
}