import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';

export function useGameRoom() {
  const { toast } = useToast();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const hostSessionId = useRef<string | null>(null);
  const playerSessionId = useRef<string | null>(null);

  // Generate session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Generate lobby code
  const generateLobbyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Convert database player to frontend player
  const convertPlayer = useCallback((dbPlayer: any): Player => {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      color: dbPlayer.color,
      timelineColor: dbPlayer.timeline_color,
      score: dbPlayer.score || 0,
      timeline: Array.isArray(dbPlayer.timeline) ? dbPlayer.timeline : []
    };
  }, []);

  // Fetch players for a room (ONLY non-host players)
  const fetchPlayers = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      console.log('👥 All players from DB - raw data:', data);
      
      // CRITICAL: Filter out ANY host players completely
      const nonHostPlayers = data?.filter(dbPlayer => {
        // Never include host in the players array
        const isHostPlayer = dbPlayer.is_host === true || 
                           (hostSessionId.current && dbPlayer.player_session_id === hostSessionId.current);
        return !isHostPlayer;
      }) || [];
      
      const convertedPlayers = nonHostPlayers.map(convertPlayer);
      console.log('👥 Non-host players only - converted:', convertedPlayers);
      setPlayers(convertedPlayers);

      // Update current player if we have one (only for non-host players)
      if (playerSessionId.current && !isHost) {
        const current = convertedPlayers.find(p => 
          nonHostPlayers.find(dbP => dbP.id === p.id && dbP.player_session_id === playerSessionId.current)
        );
        if (current) {
          setCurrentPlayer(current);
        }
      }
    } catch (error) {
      console.error('Failed to fetch players:', error);
    }
  }, [convertPlayer, isHost]);

  // Subscribe to room changes
  useEffect(() => {
    if (!room?.id) return;

    const channel = supabase
      .channel(`room-${room.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${room.id}`
      }, (payload) => {
        console.log('🔄 Room updated:', payload.new);
        // Convert the database record to match our GameRoom type
        const roomData = payload.new as any;
        setRoom({
          id: roomData.id,
          lobby_code: roomData.lobby_code,
          host_id: roomData.host_id,
          host_name: roomData.host_name || '',
          phase: roomData.phase as 'lobby' | 'playing' | 'finished',
          songs: Array.isArray(roomData.songs) ? roomData.songs as unknown as Song[] : [],
          created_at: roomData.created_at,
          updated_at: roomData.updated_at,
          current_turn: roomData.current_turn,
          current_song: roomData.current_song || null
        });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${room.id}`
      }, () => {
        fetchPlayers(room.id);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [room?.id, fetchPlayers]);

  const createRoom = useCallback(async (hostName: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionId = generateSessionId();
      const lobbyCode = generateLobbyCode();
      hostSessionId.current = sessionId;

      console.log('🏠 Creating room with host session ID:', sessionId);

      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          lobby_code: lobbyCode,
          host_id: sessionId,
          host_name: hostName,
          phase: 'lobby'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Room created successfully:', data);

      setRoom({
        id: data.id,
        lobby_code: data.lobby_code,
        host_id: data.host_id,
        host_name: data.host_name || hostName,
        phase: data.phase as 'lobby' | 'playing' | 'finished',
        songs: Array.isArray(data.songs) ? data.songs as unknown as Song[] : [],
        created_at: data.created_at,
        updated_at: data.updated_at,
        current_turn: data.current_turn,
        current_song: null
      });

      // Create a virtual host player for local use only (not stored in database)
      const hostPlayer: Player = {
        id: `host-${sessionId}`,
        name: hostName,
        color: '#FF6B6B', // Host gets the first color
        timelineColor: '#FF8E8E',
        score: 0,
        timeline: []
      };

      setCurrentPlayer(hostPlayer);
      setIsHost(true);
      return data.lobby_code;
    } catch (error) {
      console.error('Failed to create room:', error);
      setError('Failed to create room');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (lobbyCode: string, playerName: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // First, find the room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('lobby_code', lobbyCode.toUpperCase())
        .single();

      if (roomError || !roomData) {
        throw new Error('Room not found');
      }

      // Generate colors for the player
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ];
      const timelineColors = [
        '#FF8E8E', '#5DEDE5', '#58C4E0', '#A8D8C8', '#FFE9B8',
        '#E8B7E8', '#AAE0D1', '#F9E07F', '#C8A2D0', '#97CEF0'
      ];

      const sessionId = generateSessionId();
      playerSessionId.current = sessionId;

      console.log('🎮 Joining room as player with session ID:', sessionId);

      // Create player (NEVER as host - is_host should be null/false)
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          player_session_id: sessionId,
          name: playerName,
          color: colors[Math.floor(Math.random() * colors.length)],
          timeline_color: timelineColors[Math.floor(Math.random() * timelineColors.length)],
          score: 0,
          timeline: [],
          is_host: false // Explicitly set to false to ensure no confusion
        })
        .select()
        .single();

      if (playerError) throw playerError;

      console.log('✅ Player created successfully:', playerData);

      setRoom({
        id: roomData.id,
        lobby_code: roomData.lobby_code,
        host_id: roomData.host_id,
        host_name: roomData.host_name || '',
        phase: roomData.phase as 'lobby' | 'playing' | 'finished',
        songs: Array.isArray(roomData.songs) ? roomData.songs as unknown as Song[] : [],
        created_at: roomData.created_at,
        updated_at: roomData.updated_at,
        current_turn: roomData.current_turn,
        current_song: null
      });
      setCurrentPlayer(convertPlayer(playerData));
      setIsHost(false);
      
      // Fetch all non-host players
      await fetchPlayers(roomData.id);
      
      return true;
    } catch (error) {
      console.error('Failed to join room:', error);
      setError(error instanceof Error ? error.message : 'Failed to join room');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [convertPlayer, fetchPlayers]);

  const placeCard = useCallback(async (song: Song, position: number): Promise<{ success: boolean; correct?: boolean }> => {
    if (!currentPlayer || !room) {
      console.error('Cannot place card: missing currentPlayer or room');
      return { success: false };
    }

    try {
      console.log('🎯 Placing card:', { song: song.deezer_title, position, currentTimeline: currentPlayer.timeline });
      
      // Get current timeline
      const currentTimeline = [...currentPlayer.timeline];
      
      // Insert song at position
      currentTimeline.splice(position, 0, song);
      
      // Check if placement is correct (chronological order)
      let isCorrect = true;
      for (let i = 0; i < currentTimeline.length - 1; i++) {
        const current = parseInt(currentTimeline[i].release_year);
        const next = parseInt(currentTimeline[i + 1].release_year);
        if (current > next) {
          isCorrect = false;
          break;
        }
      }

      let finalTimeline = currentTimeline;
      let newScore = currentPlayer.score;

      if (isCorrect) {
        // Correct placement - keep the card and increment score
        newScore = currentPlayer.score + 1;
        console.log('✅ Correct placement! New score:', newScore);
      } else {
        // Incorrect placement - remove the card (destroy it)
        finalTimeline = currentPlayer.timeline; // Keep original timeline without the new card
        console.log('❌ Incorrect placement - card destroyed');
      }

      // Skip database update if this is the host (since host isn't in the database)
      if (!isHost) {
        // Update player in database
        const { error } = await supabase
          .from('players')
          .update({
            timeline: finalTimeline as any,
            score: newScore
          })
          .eq('id', currentPlayer.id);

        if (error) {
          console.error('Database update error:', error);
          throw error;
        }
      }

      // Update local state immediately
      setCurrentPlayer(prev => prev ? {
        ...prev,
        timeline: finalTimeline,
        score: newScore
      } : null);

      console.log('🎯 Card placement completed successfully');
      return { success: true, correct: isCorrect };
    } catch (error) {
      console.error('Failed to place card:', error);
      return { success: false };
    }
  }, [currentPlayer, room, isHost]);

  const updatePlayer = useCallback(async (updates: Partial<Player>): Promise<boolean> => {
    if (!currentPlayer) return false;

    try {
      // Skip database update if this is the host
      if (!isHost) {
        const { error } = await supabase
          .from('players')
          .update({
            name: updates.name,
            color: updates.color,
            timeline_color: updates.timelineColor
          })
          .eq('id', currentPlayer.id);

        if (error) throw error;
      }

      setCurrentPlayer(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Failed to update player:', error);
      return false;
    }
  }, [currentPlayer, isHost]);

  const updateRoomSongs = useCallback(async (songs: Song[]): Promise<boolean> => {
    if (!room || !isHost) return false;

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ songs: songs as any })
        .eq('id', room.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update room songs:', error);
      return false;
    }
  }, [room, isHost]);

  const startGame = useCallback(async (): Promise<boolean> => {
    if (!room || !isHost) return false;

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          phase: 'playing',
          current_turn: 0
        })
        .eq('id', room.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to start game:', error);
      return false;
    }
  }, [room, isHost]);

  const leaveRoom = useCallback(async () => {
    // Only delete player record if this is a non-host player
    if (currentPlayer && !isHost) {
      await supabase
        .from('players')
        .delete()
        .eq('id', currentPlayer.id);
    }

    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setIsHost(false);
    hostSessionId.current = null;
    playerSessionId.current = null;
  }, [currentPlayer, isHost]);

  const setCurrentSong = useCallback(async (song: Song): Promise<void> => {
    if (!room || !isHost) return;

    try {
      console.log('🎵 Setting current song:', song.deezer_title);
      // Update room state locally since we don't have current_song in database
      setRoom(prev => prev ? { ...prev, current_song: song } : null);
    } catch (error) {
      console.error('Failed to set current song:', error);
    }
  }, [room, isHost]);

  const assignStartingCards = useCallback(async (availableSongs: Song[]): Promise<void> => {
    if (!room || !isHost || !availableSongs.length) {
      console.log('⚠️ Cannot assign starting cards:', { room: !!room, isHost, songsLength: availableSongs.length });
      return;
    }

    try {
      console.log('🃏 Assigning starting cards to players...');
      console.log('🎯 Players to assign cards to:', players.map(p => ({ name: p.name, timelineLength: p.timeline.length })));
      
      for (const player of players) {
        if (player.timeline.length === 0) {
          const randomSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
          console.log(`🃏 Assigning starting card to ${player.name}:`, randomSong.deezer_title);
          
          const { error } = await supabase
            .from('players')
            .update({
              timeline: [randomSong] as any
            })
            .eq('id', player.id);

          if (error) {
            console.error(`Failed to assign starting card to ${player.name}:`, error);
          } else {
            console.log(`✅ Successfully assigned starting card to ${player.name}`);
          }
        }
      }
      
      // Refresh players after assigning cards
      console.log('🔄 Refreshing players after assigning starting cards...');
      await fetchPlayers(room.id);
    } catch (error) {
      console.error('Failed to assign starting cards:', error);
    }
  }, [room, isHost, players, fetchPlayers]);

  return {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    createRoom,
    joinRoom,
    updatePlayer,
    updateRoomSongs,
    startGame,
    leaveRoom,
    placeCard,
    setCurrentSong,
    assignStartingCards
  };
}
