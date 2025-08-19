
import { supabase } from '@/integrations/supabase/client';
import { Song, GameRoom, Player } from '@/types/game';

// Set player session ID for RLS policies
const setPlayerSessionId = async (sessionId: string) => {
  const { error } = await supabase.rpc('set_config', {
    setting_name: 'app.player_session_id',
    setting_value: sessionId,
    is_local: false
  });
  
  if (error) {
    console.warn('⚠️ Failed to set player session ID:', error);
  } else {
    console.log('✅ Player session ID set:', sessionId);
  }
};

export const createRoom = async (hostSessionId: string, gamemode: string = 'classic'): Promise<GameRoom> => {
  console.log('🏠 Creating room with host session ID:', hostSessionId, 'gamemode:', gamemode);
  
  // Set the session ID for RLS policies
  await setPlayerSessionId(hostSessionId);
  
  const { data, error } = await supabase
    .from('game_rooms')
    .insert({
      host_id: hostSessionId,
      gamemode,
      phase: 'lobby',
      gamemode_settings: gamemode === 'sprint' ? { target_score: 10 } : {}
    })
    .select('*')
    .single();

  if (error) {
    console.error('❌ Failed to create room:', error);
    throw error;
  }

  console.log('✅ Room created successfully:', data);
  return data;
};

export const joinRoom = async (lobbyCode: string, playerName: string, playerSessionId: string, character: string = 'char_dave'): Promise<{ room: GameRoom; player: Player }> => {
  console.log('🚪 Joining room with code:', lobbyCode, 'player:', playerName, 'session:', playerSessionId);
  
  // Set the session ID for RLS policies
  await setPlayerSessionId(playerSessionId);
  
  // First, find the room by lobby code
  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('lobby_code', lobbyCode.toUpperCase())
    .single();

  if (roomError || !room) {
    console.error('❌ Room not found:', roomError);
    throw new Error('Room not found');
  }

  // Check if player already exists in this room
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', room.id)
    .eq('player_session_id', playerSessionId)
    .single();

  if (existingPlayer) {
    console.log('✅ Player already exists in room, returning existing data');
    return { room, player: existingPlayer };
  }

  // Generate color and timeline color
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'lightblue'];
  const timelineColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'lightblue'];
  
  // Get existing players to avoid color conflicts
  const { data: existingPlayers } = await supabase
    .from('players')
    .select('color, timeline_color')
    .eq('room_id', room.id);

  const usedColors = existingPlayers?.map(p => p.color) || [];
  const usedTimelineColors = existingPlayers?.map(p => p.timeline_color) || [];
  
  const availableColors = colors.filter(c => !usedColors.includes(c));
  const availableTimelineColors = timelineColors.filter(c => !usedTimelineColors.includes(c));
  
  const playerColor = availableColors[0] || colors[0];
  const playerTimelineColor = availableTimelineColors[0] || timelineColors[0];

  // Create new player
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      name: playerName,
      player_session_id: playerSessionId,
      color: playerColor,
      timeline_color: playerTimelineColor,
      character,
      score: 0,
      timeline: []
    })
    .select('*')
    .single();

  if (playerError) {
    console.error('❌ Failed to create player:', playerError);
    throw playerError;
  }

  console.log('✅ Player joined successfully:', player);
  return { room, player };
};

export const getRoomByCode = async (lobbyCode: string): Promise<GameRoom | null> => {
  const { data, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('lobby_code', lobbyCode.toUpperCase())
    .single();

  if (error) {
    console.error('❌ Failed to get room by code:', error);
    return null;
  }

  return data;
};

export const updateRoom = async (roomId: string, updates: Partial<GameRoom>): Promise<GameRoom> => {
  const { data, error } = await supabase
    .from('game_rooms')
    .update(updates)
    .eq('id', roomId)
    .select('*')
    .single();

  if (error) {
    console.error('❌ Failed to update room:', error);
    throw error;
  }

  return data;
};

export const getPlayersInRoom = async (roomId: string): Promise<Player[]> => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('❌ Failed to get players:', error);
    throw error;
  }

  return data || [];
};

export const updatePlayer = async (playerId: string, updates: Partial<Player>): Promise<Player> => {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', playerId)
    .select('*')
    .single();

  if (error) {
    console.error('❌ Failed to update player:', error);
    throw error;
  }

  return data;
};

export const recordMove = async (roomId: string, playerId: string, moveType: string, moveData: any) => {
  const { error } = await supabase
    .from('game_moves')
    .insert({
      room_id: roomId,
      player_id: playerId,
      move_type: moveType,
      move_data: moveData
    });

  if (error) {
    console.error('❌ Failed to record move:', error);
    throw error;
  }
};
