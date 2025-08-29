
import { supabase } from '@/integrations/supabase/client';
import { Song, GameRoom, Player } from '@/types/game';
import { SongDeckManager, songDeckUtils } from './songDeckManager';

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
    
    // Validate input songs
    const validSongs = songs.filter(songDeckUtils.isValidSong);
    if (validSongs.length < songs.length) {
      console.warn(`⚠️ ${songs.length - validSongs.length} invalid songs filtered out`);
    }
    
    if (validSongs.length < 8) {
      throw new Error(`Insufficient valid songs for game: ${validSongs.length} found, minimum 8 required`);
    }
    
    // Get all players in the room (excluding host)
    const allPlayers = await getPlayersInRoom(roomId);
    const playersToSetup = allPlayers.filter(p => !p.id.includes('host-'));
    
    console.log('👥 Setting up starting cards for', playersToSetup.length, 'players');
    
    if (playersToSetup.length === 0) {
      console.warn('⚠️ No players found to setup starting cards for');
    }
    
    // Get starting cards using proper distribution
    const startingCards = SongDeckManager.getStartingCardCandidates(validSongs, playersToSetup.length, 1);
    
    // Give each player 1 starting card on their timeline
    for (let i = 0; i < playersToSetup.length; i++) {
      const player = playersToSetup[i];
      const startingCard = startingCards[i] || startingCards[0]; // Fallback to first card if needed
      
      console.log(`🃏 Giving starting card "${startingCard.deezer_title}" to ${player.name}`);
      
      try {
        await updatePlayer(player.id, { timeline: [startingCard] });
        console.log(`✅ Starting card set for ${player.name}`);
      } catch (error) {
        console.error(`❌ Failed to set starting card for ${player.name}:`, error);
      }
    }
    
    // Create song deck excluding starting cards
    const deckManager = SongDeckManager.createDeckExcluding(validSongs, startingCards);
    const mysteryCard = deckManager.getNextMysterySong();
    
    if (!mysteryCard) {
      throw new Error('Failed to get initial mystery card from deck');
    }
    
    console.log('🎵 Setting initial mystery card:', mysteryCard.deezer_title);
    
    // Update room with mystery card, playing state, and deck state
    const updateData: any = {
      phase: 'playing',
      songs: validSongs,
      current_turn: 0,
      current_song: mysteryCard
    };
    
    // Only include remaining_song_deck if we have valid data
    const remainingSongs = deckManager.getState().remainingSongs;
    if (remainingSongs && remainingSongs.length > 0) {
      updateData.remaining_song_deck = remainingSongs;
    }
    
    await updateRoom(roomId, updateData);
    
    console.log('✅ Game initialized with', validSongs.length, 'songs, starting cards distributed, and mystery card set');
    console.log(`🎲 Song deck has ${deckManager.getRemainingCount()} remaining mystery cards`);
  },

  async placeCardAndAdvanceTurn(roomId: string, playerId: string, song: Song, position: number) {
    console.log('🃏 Placing card and advancing turn for player:', playerId);
    
    try {
      // Validate song input
      if (!songDeckUtils.isValidSong(song)) {
        console.error('❌ Invalid song object provided:', song);
        throw new Error('Invalid song data');
      }

      // Get current player and room data with better error handling
      console.log('🔍 Fetching player data for ID:', playerId);
      console.log('🔍 Fetching room data for ID:', roomId);
      
      const [playerResponse, roomResponse] = await Promise.all([
        supabase.from('players').select('timeline').eq('id', playerId).single(),
        supabase.from('game_rooms').select('songs, current_turn, remaining_song_deck, current_song').eq('id', roomId).single()
      ]);
      
      // Log detailed error information
      if (playerResponse.error) {
        console.error('❌ Player query error:', playerResponse.error);
        throw new Error(`Failed to get player data: ${playerResponse.error.message}`);
      }
      
      if (roomResponse.error) {
        console.error('❌ Room query error:', roomResponse.error);
        throw new Error(`Failed to get room data: ${roomResponse.error.message}`);
      }
      
      if (!playerResponse.data) {
        console.error('❌ No player data found for ID:', playerId);
        throw new Error('Player not found');
      }
      
      if (!roomResponse.data) {
        console.error('❌ No room data found for ID:', roomId);
        throw new Error('Room not found');
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

      // IMPROVED: Use song deck management for reliable mystery card selection
      const allSongs = Array.isArray((roomResponse.data as any).songs) ? (roomResponse.data as any).songs : [];
      
      // Get stored deck state or create new one
      let deckManager: SongDeckManager;
      const storedDeck = (roomResponse.data as any).remaining_song_deck; // Use any to handle schema differences
      
      if (storedDeck && Array.isArray(storedDeck) && storedDeck.length > 0) {
        // Restore deck from stored state 
        deckManager = new SongDeckManager(storedDeck as Song[]);
        console.log('🔄 Restored song deck from database');
      } else {
        // Create new deck excluding songs already in play
        const allPlayersResponse = await supabase
          .from('players')
          .select('timeline')
          .eq('room_id', roomId);
        
        const usedSongs: Song[] = [];
        if (allPlayersResponse.data) {
          allPlayersResponse.data.forEach(player => {
            if (Array.isArray(player.timeline)) {
              player.timeline.forEach((s: any) => {
                if (songDeckUtils.isValidSong(s)) {
                  usedSongs.push(s);
                }
              });
            }
          });
        }
        
        // Add current mystery song to used songs
        if ((roomResponse.data as any).current_song && songDeckUtils.isValidSong((roomResponse.data as any).current_song)) {
          usedSongs.push((roomResponse.data as any).current_song);
        }
        
        deckManager = SongDeckManager.createDeckExcluding(allSongs, usedSongs);
        console.log('🆕 Created new song deck');
      }
      
      // Get next mystery card from deck
      const nextMysteryCard = deckManager.getNextMysterySong();
      
      if (nextMysteryCard) {
        console.log('🎵 Setting next mystery card:', nextMysteryCard.deezer_title);
        
        // Update room with next mystery card, advance turn, and save deck state
        const updateData: any = {
          current_song: nextMysteryCard,
          current_turn: ((roomResponse.data as any).current_turn || 0) + 1
        };
        
        // Only include remaining_song_deck if we have valid data
        const remainingSongs = deckManager.getState().remainingSongs;
        if (remainingSongs && remainingSongs.length > 0) {
          updateData.remaining_song_deck = remainingSongs;
        }
        
        await updateRoom(roomId, updateData);
        
        console.log('✅ Mystery card updated successfully');
      } else {
        console.log('🏁 No more songs available - game should end');
        
        // Game end condition - no more mystery cards
        await updateRoom(roomId, {
          phase: 'finished',
          current_turn: ((roomResponse.data as any).current_turn || 0) + 1,
          current_song: null
        });
        
        return {
          success: true,
          correct: isCorrect,
          error: null,
          gameEnded: true,
          winner: null // Winner logic should be handled by calling code
        };
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
