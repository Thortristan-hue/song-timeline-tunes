
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

  // Fetch players for a room
  const fetchPlayers = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      console.log('👥 Players updated - raw data:', data);
      const convertedPlayers = data?.map(convertPlayer) || [];
      console.log('👥 Players updated - converted:', convertedPlayers);
      setPlayers(convertedPlayers);

      // Update current player if we have one
      if (playerSessionId.current) {
        const current = convertedPlayers.find(p => 
          data?.find(dbP => dbP.id === p.id && dbP.player_session_id === playerSessionId.current)
        );
        if (current) {
          setCurrentPlayer(current);
        }
      }
    } catch (error) {
      console.error('Failed to fetch players:', error);
    }
  }, [convertPlayer]);

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
          phase: roomData.phase,
          songs: roomData.songs || [],
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
      hostSessionId.current = sessionId;

      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          host_id: sessionId,
          phase: 'lobby'
        })
        .select()
        .single();

      if (error) throw error;

      setRoom({
        id: data.id,
        lobby_code: data.lobby_code,
        host_id: data.host_id,
        host_name: hostName,
        phase: data.phase,
        songs: data.songs || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
        current_turn: data.current_turn,
        current_song: null
      });
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

      // Create player
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          player_session_id: sessionId,
          name: playerName,
          color: colors[Math.floor(Math.random() * colors.length)],
          timeline_color: timelineColors[Math.floor(Math.random() * timelineColors.length)],
          score: 0,
          timeline: []
        })
        .select()
        .single();

      if (playerError) throw playerError;

      setRoom({
        id: roomData.id,
        lobby_code: roomData.lobby_code,
        host_id: roomData.host_id,
        host_name: '',
        phase: roomData.phase,
        songs: roomData.songs || [],
        created_at: roomData.created_at,
        updated_at: roomData.updated_at,
        current_turn: roomData.current_turn,
        current_song: null
      });
      setCurrentPlayer(convertPlayer(playerData));
      setIsHost(false);
      
      // Fetch all players
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
      return { success: false };
    }

    try {
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
      } else {
        // Incorrect placement - remove the card (destroy it)
        finalTimeline = currentPlayer.timeline; // Keep original timeline without the new card
      }

      // Update player in database
      const { error } = await supabase
        .from('players')
        .update({
          timeline: finalTimeline as any,
          score: newScore
        })
        .eq('id', currentPlayer.id);

      if (error) throw error;

      // Update local state
      setCurrentPlayer(prev => prev ? {
        ...prev,
        timeline: finalTimeline,
        score: newScore
      } : null);

      return { success: true, correct: isCorrect };
    } catch (error) {
      console.error('Failed to place card:', error);
      return { success: false };
    }
  }, [currentPlayer, room]);

  const updatePlayer = useCallback(async (updates: Partial<Player>): Promise<boolean> => {
    if (!currentPlayer) return false;

    try {
      const { error } = await supabase
        .from('players')
        .update({
          name: updates.name,
          color: updates.color,
          timeline_color: updates.timelineColor
        })
        .eq('id', currentPlayer.id);

      if (error) throw error;

      setCurrentPlayer(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Failed to update player:', error);
      return false;
    }
  }, [currentPlayer]);

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
    if (currentPlayer) {
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
  }, [currentPlayer]);

  const setCurrentSong = useCallback(async (song: Song): Promise<void> => {
    if (!room || !isHost) return;

    try {
      // Note: current_song doesn't exist in the database schema, so we skip this
      console.log('Setting current song:', song.deezer_title);
    } catch (error) {
      console.error('Failed to set current song:', error);
    }
  }, [room, isHost]);

  const assignStartingCards = useCallback(async (availableSongs: Song[]): Promise<void> => {
    if (!room || !isHost) return;

    try {
      const nonHostPlayers = players.filter(p => p.id !== room.host_id);
      
      for (const player of nonHostPlayers) {
        if (player.timeline.length === 0) {
          const randomSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
          
          await supabase
            .from('players')
            .update({
              timeline: [randomSong] as any
            })
            .eq('id', player.id);
        }
      }
      
      // Refresh players after assigning cards
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
