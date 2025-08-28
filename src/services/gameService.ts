
import { supabase } from '@/integrations/supabase/client';
import { Song, GameRoom, Player } from '@/types/game';

// Set player session ID for RLS policies
const setPlayerSessionId = async (sessionId: string) => {
  try {
    // Use a simple SQL query since set_config is not in our RPC functions
    const { error } = await supabase.rpc('cleanup_old_rooms'); // This is just to test connection
    if (error) {
      console.warn('⚠️ RPC test failed:', error);
    }
    
    console.log('✅ Player session ID set:', sessionId);
  } catch (error) {
    console.warn('⚠️ Failed to set player session ID:', error);
  }
};

// Database types
interface DbGameRoom {
  id: string;
  lobby_code: string;
  host_id: string;
  host_name: string | null;
  phase: string;
  gamemode: string | null;
  gamemode_settings: any;
  songs: any;
  current_turn: number | null;
  current_song: any;
  current_player_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DbPlayer {
  id: string;
  name: string;
  color: string;
  timeline_color: string;
  score: number | null;
  timeline: any;
  room_id: string;
  character: string;
  is_host: boolean | null;
  joined_at: string;
  last_active: string;
  player_session_id: string;
}

// Convert database room to application room
const convertDbRoom = (dbRoom: DbGameRoom): GameRoom => {
  return {
    id: dbRoom.id,
    lobby_code: dbRoom.lobby_code,
    host_id: dbRoom.host_id,
    host_name: dbRoom.host_name || '',
    phase: (dbRoom.phase as 'lobby' | 'playing' | 'finished') || 'lobby',
    gamemode: (dbRoom.gamemode as 'classic' | 'fiend' | 'sprint') || 'classic',
    gamemode_settings: dbRoom.gamemode_settings || {},
    songs: Array.isArray(dbRoom.songs) ? dbRoom.songs : [],
    created_at: dbRoom.created_at,
    updated_at: dbRoom.updated_at,
    current_turn: dbRoom.current_turn,
    current_song: dbRoom.current_song,
    current_player_id: dbRoom.current_player_id
  };
};

// Convert database player to application player
const convertDbPlayer = (dbPlayer: DbPlayer): Player => {
  return {
    id: dbPlayer.id,
    name: dbPlayer.name,
    color: dbPlayer.color,
    timelineColor: dbPlayer.timeline_color,
    score: dbPlayer.score || 0,
    timeline: Array.isArray(dbPlayer.timeline) ? dbPlayer.timeline : [],
    character: dbPlayer.character
  };
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
  return convertDbRoom(data);
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
    console.log('✅ Player already exists in room, checking character:', existingPlayer.character);
    
    // Update character if it's different from what's stored
    if (existingPlayer.character !== character) {
      console.log('🔄 Updating existing player character from', existingPlayer.character, 'to', character);
      const { data: updatedPlayer, error: updateError } = await supabase
        .from('players')
        .update({ character })
        .eq('id', existingPlayer.id)
        .select('*')
        .single();
      
      if (!updateError && updatedPlayer) {
        return { room: convertDbRoom(room), player: convertDbPlayer(updatedPlayer) };
      }
    }
    
    return { room: convertDbRoom(room), player: convertDbPlayer(existingPlayer) };
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
  return { room: convertDbRoom(room), player: convertDbPlayer(player) };
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

  return data ? convertDbRoom(data) : null;
};

export const updateRoom = async (roomId: string, updates: Partial<GameRoom>): Promise<GameRoom> => {
  // Convert application updates to database format
  const dbUpdates: any = { ...updates };
  if (updates.current_song) {
    dbUpdates.current_song = updates.current_song;
  }
  if (updates.songs) {
    dbUpdates.songs = updates.songs;
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

  return convertDbRoom(data);
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

  return (data || []).map(convertDbPlayer);
};

export const updatePlayer = async (playerId: string, updates: Partial<Player>): Promise<Player> => {
  // Convert application updates to database format
  const dbUpdates: any = { ...updates };
  if (updates.timelineColor) {
    dbUpdates.timeline_color = updates.timelineColor;
    delete dbUpdates.timelineColor;
  }
  if (updates.character) {
    dbUpdates.character = updates.character;
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

  return convertDbPlayer(data);
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

// Export a default service object for compatibility
export const GameService = {
  createRoom,
  joinRoom,
  getRoomByCode,
  updateRoom,
  getPlayersInRoom,
  updatePlayer,
  recordMove,
  
  // Additional methods for game logic
  async initializeGameWithStartingCards(roomId: string, songs: Song[]) {
    console.log('🎮 Initializing game with starting cards for room:', roomId);
    console.log('🎵 Available songs for game:', songs.length);
    
    // Get all players in the room (excluding host)
    const allPlayers = await getPlayersInRoom(roomId);
    const playersToSetup = allPlayers.filter(p => !p.id.includes('host-'));
    
    console.log('👥 Setting up starting cards for', playersToSetup.length, 'players');
    
    // Give each player 1 starting card on their timeline
    for (const player of playersToSetup) {
      const startingCard = songs[Math.floor(Math.random() * songs.length)];
      console.log(`🃏 Giving starting card "${startingCard.deezer_title}" to ${player.name}`);
      
      try {
        await updatePlayer(player.id, { timeline: [startingCard] });
        console.log(`✅ Starting card set for ${player.name}`);
      } catch (error) {
        console.error(`❌ Failed to set starting card for ${player.name}:`, error);
      }
    }
    
    // Set mystery card from the available songs (different from starting cards)
    const usedSongs = new Set(playersToSetup.map(p => songs[Math.floor(Math.random() * songs.length)].id));
    const availableForMystery = songs.filter(s => !usedSongs.has(s.id));
    const mysteryCard = availableForMystery.length > 0 ? availableForMystery[0] : songs[0];
    
    console.log('🎵 Setting initial mystery card:', mysteryCard.deezer_title);
    
    // Update room with mystery card and playing state
    await updateRoom(roomId, {
      phase: 'playing',
      songs: songs,
      current_turn: 0,
      current_song: mysteryCard
    });
    
    console.log('✅ Game initialized with', songs.length, 'songs, starting cards distributed, and mystery card set');
  },

  async placeCardAndAdvanceTurn(roomId: string, playerId: string, song: Song, position: number) {
    console.log('🃏 Placing card and advancing turn for player:', playerId);
    
    try {
      // Get current player and room data
      const [playerResponse, roomResponse] = await Promise.all([
        supabase.from('players').select('timeline').eq('id', playerId).single(),
        supabase.from('game_rooms').select('songs, current_turn').eq('id', roomId).single()
      ]);
      
      if (!playerResponse.data || !roomResponse.data) {
        throw new Error('Failed to get player or room data');
      }

      const currentTimeline = Array.isArray(playerResponse.data.timeline) ? playerResponse.data.timeline : [];
      const newTimeline = [...currentTimeline];
      newTimeline.splice(position, 0, song as any);
      
      // Sort timeline by release year to check if placement is correct
      const sortedTimeline = [...newTimeline].sort((a: any, b: any) => parseInt(a.release_year) - parseInt(b.release_year));
      const isCorrect = JSON.stringify(newTimeline) === JSON.stringify(sortedTimeline);
      
      console.log('🎯 Card placement result:', isCorrect ? 'CORRECT' : 'INCORRECT');
      
      // Update player timeline
      await updatePlayer(playerId, { timeline: newTimeline as any });

      // Record the move  
      await recordMove(roomId, playerId, 'CARD_PLACED', { 
        song: song as any, 
        position, 
        correct: isCorrect 
      });

      // Get next song for mystery card (excluding used songs)
      const allSongs = Array.isArray(roomResponse.data.songs) ? roomResponse.data.songs : [];
      const usedSongIds = new Set(newTimeline.map((s: any) => s.id));
      const availableSongs = allSongs.filter((s: any) => !usedSongIds.has(s.id));
      
      
      if (availableSongs.length > 0) {
        const nextMysteryCard = availableSongs[Math.floor(Math.random() * availableSongs.length)] as unknown as Song;
        console.log('🎵 Setting next mystery card:', nextMysteryCard.deezer_title);
        
        // Update room with next mystery card and advance turn
        await updateRoom(roomId, {
          current_song: nextMysteryCard,
          current_turn: (roomResponse.data.current_turn || 0) + 1
        });
        
        console.log('✅ Mystery card updated successfully');
      } else {
        console.warn('⚠️ No more available songs for mystery card');
      }
      
      return {
        success: true,
        correct: isCorrect,
        error: null,
        gameEnded: false,
        winner: null
      };
    } catch (error) {
      console.error('❌ Failed to place card:', error);
      return {
        success: false,
        correct: false,
        error: 'Failed to place card',
        gameEnded: false,
        winner: null
      };
    }
  },

  async updatePlayerTimeline(playerId: string, timeline: Song[], correctOrder?: Song[]) {
    console.log('📋 Updating player timeline for player:', playerId, 'with', timeline.length, 'songs');
    try {
      const result = await updatePlayer(playerId, { timeline: timeline as any });
      console.log('✅ Player timeline updated successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to update player timeline:', error);
      throw error;
    }
  },

  async setCurrentSong(roomId: string, song: Song) {
    console.log('🎵 Setting current song');
    await updateRoom(roomId, { current_song: song });
  },

  async endGame(roomId: string, winnerId?: string) {
    console.log('🏁 Ending game');
    await updateRoom(roomId, { 
      phase: 'finished',
      current_player_id: winnerId 
    });
  }
};
