import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { GameService } from '@/services/gameService';
import { useGameState } from './useGameState';

export function useGameRoom() {
  const { toast } = useToast();
  const gameState = useGameState({ timeout: 20000 });
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const hostSessionId = useRef<string | null>(null);
  const playerSessionId = useRef<string | null>(null);
  const retryCount = useRef<number>(0);
  const maxRetries = 3;
  const subscriptionRef = useRef<any>(null);

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
      timeline: Array.isArray(dbPlayer.timeline) ? dbPlayer.timeline as unknown as Song[] : []
    };
  }, []);

  // Enhanced fetch players with better error recovery
  const fetchPlayers = useCallback(async (roomId: string, isRetry: boolean = false) => {
    try {
      if (!isRetry) {
        console.log('🔍 Fetching players for room:', roomId);
      }
      
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching players:', error);
        throw error;
      }

      console.log('👥 Raw players from DB:', data);
      
      // Filter out host players - only include players where is_host is false or null
      const nonHostPlayers = data?.filter(dbPlayer => {
        const isHostPlayer = dbPlayer.is_host === true;
        if (!isRetry) {
          console.log(`🔍 Player ${dbPlayer.name}: is_host=${dbPlayer.is_host}, including=${!isHostPlayer}`);
        }
        return !isHostPlayer;
      }) || [];
      
      const convertedPlayers = nonHostPlayers.map(convertPlayer);
      if (!isRetry) {
        console.log('👥 Converted non-host players:', convertedPlayers);
      }
      
      setPlayers(convertedPlayers);

      // Update current player if we have one (only for non-host players)
      if (playerSessionId.current && !isHost) {
        const current = convertedPlayers.find(p => 
          nonHostPlayers.find(dbP => dbP.id === p.id && dbP.player_session_id === playerSessionId.current)
        );
        if (current) {
          console.log('🎯 Updated current player:', current);
          setCurrentPlayer(current);
        }
      }

      // Reset retry count on success
      retryCount.current = 0;
      
      // Clear any loading state if this was triggered by a retry
      if (gameState.isLoading) {
        gameState.stopLoading(true);
      }
    } catch (error) {
      console.error('❌ Failed to fetch players:', error);
      
      // Retry logic
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        console.log(`🔄 Retrying fetch players (${retryCount.current}/${maxRetries})...`);
        setTimeout(() => fetchPlayers(roomId, true), 2000 * retryCount.current);
      } else {
        const errorMessage = 'Failed to load players. Please refresh the page.';
        setError(errorMessage);
        gameState.stopLoading(false, errorMessage);
      }
    }
  }, [convertPlayer, isHost, gameState]);

  // Enhanced subscription management with connection recovery
  useEffect(() => {
    if (!room?.id) return;

    console.log('🔄 Setting up real-time subscriptions for room:', room.id);

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    const setupSubscription = () => {
      const channel = supabase
        .channel(`room-${room.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${room.id}`
        }, (payload) => {
          try {
            console.log('🔄 SYNC: Room updated:', payload.new);
            const roomData = payload.new as any;
            
            // CRITICAL FIX: Properly cast current_song from Json to Song
            let currentSong: Song | null = null;
            if (roomData.current_song) {
              currentSong = roomData.current_song as unknown as Song;
            }
            
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
              current_song: currentSong,
              current_player_id: roomData.current_player_id || null
            });

            // Clear loading if we were waiting for room updates
            if (gameState.isLoading) {
              console.log('✅ Room update received, clearing loading state');
              gameState.stopLoading(true);
            }
          } catch (error) {
            console.error('❌ Error processing room update:', error);
            setError('Failed to process game update');
            gameState.stopLoading(false, 'Failed to process game update');
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${room.id}`
        }, (payload) => {
          console.log('🎮 Player change detected:', payload);
          fetchPlayers(room.id);
        })
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to room updates');
            gameState.stopLoading(true);
            setError(null); // Clear any connection errors
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ Subscription error:', status);
            const errorMessage = 'Lost connection to game. Attempting to reconnect...';
            setError(errorMessage);
            gameState.stopLoading(false, errorMessage);
            
            // Attempt to reconnect after a delay
            setTimeout(() => {
              console.log('🔄 Attempting to reconnect...');
              setupSubscription();
            }, 3000);
          }
        });

      subscriptionRef.current = channel;
    };

    // Start loading and setup subscription
    gameState.startLoading('Connecting to game');
    setupSubscription();

    // Initial fetch
    fetchPlayers(room.id);

    return () => {
      console.log('🔄 Cleaning up subscriptions');
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      gameState.forceStopLoading();
    };
  }, [room?.id, fetchPlayers, gameState]);

  const createRoom = useCallback(async (hostName: string): Promise<string | null> => {
    try {
      gameState.startLoading('Creating room');
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
        current_song: data.current_song ? data.current_song as unknown as Song : null
      });

      // Create a virtual host player for local use only (not stored in database)
      const hostPlayer: Player = {
        id: `host-${sessionId}`,
        name: hostName,
        color: '#FF6B6B',
        timelineColor: '#FF8E8E',
        score: 0,
        timeline: []
      };

      setCurrentPlayer(hostPlayer);
      setIsHost(true);
      gameState.stopLoading(true);
      return data.lobby_code;
    } catch (error) {
      console.error('❌ Failed to create room:', error);
      const errorMessage = 'Failed to create room. Please try again.';
      setError(errorMessage);
      gameState.stopLoading(false, errorMessage);
      return null;
    }
  }, [gameState]);

  const joinRoom = useCallback(async (lobbyCode: string, playerName: string): Promise<boolean> => {
    try {
      gameState.startLoading('Joining room');
      setError(null);

      console.log('🎮 Attempting to join room:', lobbyCode);

      // First, find the room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('lobby_code', lobbyCode.toUpperCase())
        .single();

      if (roomError || !roomData) {
        console.error('❌ Room not found:', roomError);
        throw new Error('Room not found. Please check the room code.');
      }

      console.log('✅ Room found:', roomData);

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

      console.log('🎮 Creating player with session ID:', sessionId);

      // Create player (explicitly set is_host to false)
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
          is_host: false // Explicitly set to false
        })
        .select()
        .single();

      if (playerError) {
        console.error('❌ Failed to create player:', playerError);
        throw playerError;
      }

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
        current_song: roomData.current_song ? roomData.current_song as unknown as Song : null
      });
      
      setCurrentPlayer(convertPlayer(playerData));
      setIsHost(false);
      gameState.stopLoading(true);
      return true;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room. Please try again.';
      setError(errorMessage);
      gameState.stopLoading(false, errorMessage);
      return false;
    }
  }, [convertPlayer, gameState]);

  const placeCard = useCallback(async (song: Song, position: number, availableSongs: Song[] = []): Promise<{ success: boolean; correct?: boolean }> => {
    if (!currentPlayer || !room) {
      console.error('Cannot place card: missing currentPlayer or room');
      return { success: false };
    }

    try {
      console.log('🃏 MANDATORY: Placing card with centralized turn advancement');
      
      // Use GameService for centralized card placement and turn advancement
      const result = await GameService.placeCard(room.id, currentPlayer.id, song, position, availableSongs);
      
      if (result.success) {
        console.log('✅ MANDATORY: Card placed and turn advanced successfully');
        return { success: true, correct: result.correct };
      } else {
        console.error('❌ MANDATORY: Card placement failed:', result.error);
        return { success: false };
      }
    } catch (error) {
      console.error('Failed to place card:', error);
      return { success: false };
    }
  }, [currentPlayer, room]);

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

  const startGame = useCallback(async (availableSongs?: Song[]): Promise<boolean> => {
    if (!room || !isHost) return false;

    try {
      console.log('🎯 INIT: Starting game with mystery card initialization');
      
      // CRITICAL FIX: Initialize game with mystery card
      if (availableSongs && availableSongs.length > 0) {
        await GameService.initializeGameWithMysteryCard(room.id, availableSongs);
      } else {
        // Fallback: just set phase to playing
        const { error } = await supabase
          .from('game_rooms')
          .update({ 
            phase: 'playing',
            current_turn: 0
          })
          .eq('id', room.id);

        if (error) throw error;
      }
      
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
    setError(null);
    hostSessionId.current = null;
    playerSessionId.current = null;
    gameState.stopLoading();
  }, [currentPlayer, isHost, gameState]);

  const setCurrentSong = useCallback(async (song: Song): Promise<void> => {
    if (!room || !isHost) return;

    try {
      console.log('🎵 SYNC: Host setting synchronized mystery card:', song.deezer_title);
      await GameService.setCurrentSong(room.id, song);
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
    isLoading: gameState.isLoading,
    error: error || gameState.error,
    createRoom,
    joinRoom,
    updatePlayer,
    updateRoomSongs,
    startGame,
    leaveRoom,
    placeCard,
    setCurrentSong,
    assignStartingCards,
    clearError: () => {
      setError(null);
      gameState.clearError();
      gameState.forceStopLoading();
    },
    retryConnection: () => {
      if (room?.id) {
        retryCount.current = 0;
        gameState.clearError();
        fetchPlayers(room.id);
      }
    }
  };
}
