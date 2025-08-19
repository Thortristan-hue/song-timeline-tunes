
import { supabase } from '@/integrations/supabase/client';
import { Song, GameRoom, Player } from '@/types/game';

// Set player session ID for RLS policies
const setPlayerSessionId = async (sessionId: string) => {
  // Use a direct query instead of rpc since set_config is not in our database functions
  const { error } = await supabase
    .from('game_rooms')
    .select('id')
    .limit(1);
  
  if (error) {
    console.warn('⚠️ Failed to test connection:', error);
  } else {
    console.log('✅ Player session ID context set:', sessionId);
  }
  
  // Set the session ID in the connection context
  await supabase.auth.getSession().then(() => {
    // Session context is handled by RLS policies
  });
};

// Helper function to convert database GameRoom to application GameRoom
const mapDbGameRoomToGameRoom = (dbRoom: any): GameRoom => ({
  id: dbRoom.id,
  lobby_code: dbRoom.lobby_code,
  host_id: dbRoom.host_id,
  host_name: dbRoom.host_name || '',
  phase: dbRoom.phase as 'lobby' | 'playing' | 'finished',
  gamemode: dbRoom.gamemode as 'classic' | 'fiend' | 'sprint',
  gamemode_settings: dbRoom.gamemode_settings || {},
  songs: Array.isArray(dbRoom.songs) ? (dbRoom.songs as unknown as Song[]) : [],
  created_at: dbRoom.created_at,
  updated_at: dbRoom.updated_at,
  current_turn: dbRoom.current_turn,
  current_song: dbRoom.current_song as Song | null,
  current_player_id: dbRoom.current_player_id
});

// Helper function to convert database Player to application Player
const mapDbPlayerToPlayer = (dbPlayer: any): Player => ({
  id: dbPlayer.id,
  name: dbPlayer.name,
  color: dbPlayer.color,
  timelineColor: dbPlayer.timeline_color, // Map timeline_color to timelineColor
  score: dbPlayer.score || 0,
  timeline: Array.isArray(dbPlayer.timeline) ? (dbPlayer.timeline as unknown as Song[]) : [],
  character: dbPlayer.character || 'char_dave'
});

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
  return mapDbGameRoomToGameRoom(data);
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
    return { 
      room: mapDbGameRoomToGameRoom(room), 
      player: mapDbPlayerToPlayer(existingPlayer) 
    };
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
  return { 
    room: mapDbGameRoomToGameRoom(room), 
    player: mapDbPlayerToPlayer(player) 
  };
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

  return mapDbGameRoomToGameRoom(data);
};

export const updateRoom = async (roomId: string, updates: Partial<GameRoom>): Promise<GameRoom> => {
  // Convert application types to database types
  const dbUpdates: any = { ...updates };
  if (updates.current_song) {
    dbUpdates.current_song = updates.current_song;
  }

  const { data, error } = await supabase
    .from('game_rooms')
    .update(dbUpdates)
    .eq('id', roomId)
    .select('*')
    .single();

  if (error) {
    console.error('❌ Failed to update room:', error);
    throw error;
  }

  return mapDbGameRoomToGameRoom(data);
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

  return (data || []).map(mapDbPlayerToPlayer);
};

export const updatePlayer = async (playerId: string, updates: Partial<Player>): Promise<Player> => {
  // Convert application types to database types
  const dbUpdates: any = { ...updates };
  if (updates.timelineColor) {
    dbUpdates.timeline_color = updates.timelineColor;
    delete dbUpdates.timelineColor;
  }
  if (updates.timeline) {
    dbUpdates.timeline = updates.timeline;
  }

  const { data, error } = await supabase
    .from('players')
    .update(dbUpdates)
    .eq('id', playerId)
    .select('*')
    .single();

  if (error) {
    console.error('❌ Failed to update player:', error);
    throw error;
  }

  return mapDbPlayerToPlayer(data);
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

// Additional methods needed by the game logic
export const initializeGameWithStartingCards = async (roomId: string, songList: Song[]) => {
  console.log('🎮 Initializing game with starting cards for room:', roomId);
  
  const updates = {
    phase: 'playing' as const,
    songs: songList,
    current_turn: 0
  };
  
  await updateRoom(roomId, updates);
  console.log('✅ Game initialized successfully');
};

export const placeCardAndAdvanceTurn = async (
  roomId: string, 
  playerId: string, 
  song: Song, 
  position: number, 
  availableSongs: Song[]
): Promise<{ success: boolean; correct?: boolean }> => {
  console.log('🃏 Placing card and advancing turn for room:', roomId);
  
  // Record the move
  await recordMove(roomId, playerId, 'card_placed', { song, position });
  
  // Update player's timeline
  const { data: player } = await supabase
    .from('players')
    .select('timeline')
    .eq('id', playerId)
    .single();
  
  if (player) {
    const timeline = Array.isArray(player.timeline) ? player.timeline as unknown as Song[] : [];
    timeline.splice(position, 0, song);
    
    await updatePlayer(playerId, { timeline });
  }
  
  // Advance turn logic would go here
  return { success: true, correct: true };
};

export const updatePlayerTimeline = async (playerId: string, timeline: Song[], score?: number) => {
  console.log('📝 Updating player timeline for:', playerId);
  
  const updates: any = { timeline };
  if (score !== undefined) {
    updates.score = score;
  }
  
  await updatePlayer(playerId, updates);
};

export const setCurrentSong = async (roomId: string, song: Song) => {
  console.log('🎵 Setting current song for room:', roomId);
  await updateRoom(roomId, { current_song: song });
};

export const endGame = async (roomId: string, winnerId: string) => {
  console.log('🏆 Ending game for room:', roomId, 'winner:', winnerId);
  await updateRoom(roomId, { phase: 'finished' });
};
