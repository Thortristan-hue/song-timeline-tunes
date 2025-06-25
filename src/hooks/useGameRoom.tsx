
import { useState, useEffect, useCallback } from 'react';
import { gameService, GameRoom, DatabasePlayer } from '@/services/gameService';
import { Player, Song } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';

interface UseGameRoomReturn {
  room: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  createRoom: (hostName?: string) => Promise<string | null>;
  joinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  updatePlayer: (name: string, color: string) => Promise<void>;
  updateRoomSongs: (songs: Song[]) => Promise<void>;
  startGame: () => Promise<void>;
  leaveRoom: () => void;
  placeCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  setCurrentSong: (song: Song) => Promise<void>;
  assignStartingCards: (songs: Song[]) => Promise<void>;
}

export function useGameRoom(): UseGameRoomReturn {
  const { toast } = useToast();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  const isHost = room ? room.host_id === gameService.getSessionId() : false;

  // DISABLED: Auto-rejoin functionality - was causing issues
  // Auto-rejoin logic has been completely removed to prevent game state conflicts

  const createRoom = useCallback(async (hostName?: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🏠 Creating room with host name:', hostName || 'Host');
      const { room: newRoom, lobbyCode } = await gameService.createRoom(hostName || 'Host');
      setRoom(newRoom);
      
      console.log('✅ Room created successfully:', lobbyCode);
      
      toast({
        title: "Room created!",
        description: `Lobby code: ${lobbyCode}. Share this with players to join.`,
      });
      
      return lobbyCode;
    } catch (err) {
      console.error('❌ Failed to create room:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const joinRoom = useCallback(async (lobbyCode: string, playerName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🎮 Attempting to join room:', lobbyCode, 'with name:', playerName);
      
      // First check if room exists
      const roomData = await gameService.getRoomByCode(lobbyCode.toUpperCase());
      if (!roomData) {
        throw new Error('Room not found. Please check the lobby code.');
      }

      console.log('✅ Room found:', roomData);

      // Join the room
      const player = await gameService.joinRoom(lobbyCode.toUpperCase(), playerName);
      
      console.log('✅ Player joined:', player);
      
      setRoom(roomData);
      setCurrentPlayer(gameService.convertDatabasePlayerToPlayer(player));
      
      toast({
        title: "Joined room!",
        description: `Welcome to lobby ${lobbyCode}`,
      });
      
      return true;
    } catch (err) {
      console.error('❌ Join room failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updatePlayer = useCallback(async (name: string, color: string): Promise<void> => {
    if (!currentPlayer) return;
    
    try {
      await gameService.updatePlayer(currentPlayer.id, { 
        name, 
        color, 
        timeline_color: color 
      });
      
      setCurrentPlayer(prev => prev ? {
        ...prev,
        name,
        color,
        timelineColor: color
      } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update player';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [currentPlayer, toast]);

  const updateRoomSongs = useCallback(async (songs: Song[]): Promise<void> => {
    if (!room) return;
    
    try {
      await gameService.updateRoomSongs(room.id, songs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update songs';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [room, toast]);

  const startGame = useCallback(async (): Promise<void> => {
    if (!room) return;
    
    try {
      await gameService.startGame(room.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start game';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [room, toast]);

  const assignStartingCards = useCallback(async (songs: Song[]): Promise<void> => {
    if (!room) return;
    
    try {
      console.log('🎯 Assigning starting cards to players...');
      await gameService.assignStartingCards(room.id, songs);
      
      toast({
        title: "Game Started!",
        description: "Starting cards have been dealt to all players",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign starting cards';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [room, toast]);

  const placeCard = useCallback(async (song: Song, position: number): Promise<{ success: boolean }> => {
    if (!room || !currentPlayer) return { success: false };
    
    try {
      console.log('🎯 Placing card:', song.deezer_title, 'at position:', position);
      const result = await gameService.placeCard(room.id, currentPlayer.id, song, position);
      
      if (result.success) {
        console.log('✅ Card placed successfully, game should progress to next turn');
        toast({
          title: "Perfect!",
          description: `${song.deezer_title} placed correctly!`,
        });
      } else {
        console.log('❌ Card placed incorrectly, game should still progress to next turn');
        toast({
          title: "Close!",
          description: `Try a different position next time!`,
          variant: "destructive",
        });
      }
      
      return { success: result.success };
    } catch (err) {
      console.error('❌ Card placement failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to place card';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false };
    }
  }, [room, currentPlayer, toast]);

  const setCurrentSong = useCallback(async (song: Song): Promise<void> => {
    if (!room) return;
    
    try {
      await gameService.setCurrentSong(room.id, song);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set current song';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [room, toast]);

  const leaveRoom = useCallback(() => {
    gameService.clearPlayerSession();
    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setError(null);
  }, []);

  // Enhanced real-time subscriptions with robust error handling and reconnection
  useEffect(() => {
    if (!room) return;

    console.log('🔄 Setting up enhanced real-time subscription for room:', room.id);

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let currentChannel: any = null;

    const setupChannel = () => {
      console.log('🔄 Setting up room subscription channel...');

      currentChannel = gameService.subscribeToRoom(room.id, {
        onRoomUpdate: (updatedRoom) => {
          console.log('🔄 Room updated:', updatedRoom);
          setRoom(updatedRoom);
          setConnectionStatus('connected');
          reconnectAttempts = 0;
        },
        onPlayersUpdate: (dbPlayers) => {
          console.log('👥 Players updated - raw data:', dbPlayers);
          const convertedPlayers = dbPlayers.map(gameService.convertDatabasePlayerToPlayer);
          console.log('👥 Players updated - converted:', convertedPlayers);
          setPlayers(convertedPlayers);
          
          if (currentPlayer) {
            const updatedCurrentPlayer = dbPlayers.find(p => p.id === currentPlayer.id);
            if (updatedCurrentPlayer) {
              const converted = gameService.convertDatabasePlayerToPlayer(updatedCurrentPlayer);
              console.log('👤 Current player updated:', converted);
              setCurrentPlayer(converted);
            }
          }
          setConnectionStatus('connected');
          reconnectAttempts = 0;
        }
      });

      // Monitor channel status
      if (currentChannel && currentChannel.subscribe) {
        currentChannel.subscribe((status: string) => {
          console.log('🔄 Channel status:', status);
          
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            reconnectAttempts = 0;
            
            if (reconnectAttempts > 0) {
              toast({
                title: "🟢 Reconnected",
                description: "Game sync restored!",
              });
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ Channel error:', status);
            handleConnectionError();
          }
        });
      }
    };

    const handleConnectionError = () => {
      setConnectionStatus('disconnected');
      
      if (reconnectAttempts < maxReconnectAttempts) {
        setConnectionStatus('reconnecting');
        reconnectAttempts++;
        
        toast({
          title: "🔄 Connection Lost",
          description: `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`,
          variant: "destructive",
        });

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
        
        reconnectTimeout = setTimeout(() => {
          console.log(`🔄 Reconnecting channel (attempt ${reconnectAttempts})...`);
          
          if (currentChannel) {
            currentChannel.unsubscribe();
          }
          setupChannel();
        }, delay);
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "❌ Connection Failed",
          description: "Cannot sync with other players. Please refresh.",
          variant: "destructive",
        });
        
        setError('Real-time sync failed. Please refresh the page.');
      }
    };

    // Load initial players with retry logic
    const loadInitialPlayers = async (retries = 3) => {
      try {
        console.log('👥 Loading initial players for room:', room.id);
        const dbPlayers = await gameService.getPlayersInRoom(room.id);
        console.log('👥 Initial players loaded:', dbPlayers);
        const convertedPlayers = dbPlayers.map(gameService.convertDatabasePlayerToPlayer);
        setPlayers(convertedPlayers);
      } catch (error) {
        console.error('❌ Failed to load initial players:', error);
        if (retries > 0) {
          console.log(`🔄 Retrying to load players... (${retries} attempts left)`);
          setTimeout(() => loadInitialPlayers(retries - 1), 1000);
        } else {
          handleConnectionError();
        }
      }
    };

    // Initial setup
    setupChannel();
    loadInitialPlayers();

    return () => {
      console.log('🔄 Cleaning up room subscriptions...');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (currentChannel) {
        currentChannel.unsubscribe();
      }
    };
  }, [room?.id, currentPlayer?.id, toast]);

  return {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    connectionStatus,
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
