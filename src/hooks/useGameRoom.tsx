
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
  createRoom: (hostName?: string) => Promise<string | null>;
  joinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  updatePlayer: (name: string, color: string) => Promise<void>;
  updateRoomSongs: (songs: Song[]) => Promise<void>;
  startGame: () => Promise<void>;
  leaveRoom: () => void;
  placeCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  setCurrentSong: (song: Song) => Promise<void>;
}

export function useGameRoom(): UseGameRoomReturn {
  const { toast } = useToast();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isHost = room ? room.host_id === gameService.getSessionId() : false;

  // Auto-rejoin on page load - but only once
  useEffect(() => {
    let hasAttemptedRejoin = false;
    
    const attemptAutoRejoin = async () => {
      if (hasAttemptedRejoin) return;
      hasAttemptedRejoin = true;
      
      setIsLoading(true);
      try {
        const rejoinResult = await gameService.autoRejoinIfPossible();
        if (rejoinResult) {
          setRoom(rejoinResult.room);
          setCurrentPlayer(gameService.convertDatabasePlayerToPlayer(rejoinResult.player));
          
          toast({
            title: "Welcome back!",
            description: `Rejoined lobby ${rejoinResult.room.lobby_code}`,
          });
        }
      } catch (err) {
        console.error('Auto-rejoin failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    attemptAutoRejoin();
  }, [toast]);

  const createRoom = useCallback(async (hostName?: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { room: newRoom, lobbyCode } = await gameService.createRoom(hostName || 'Host');
      setRoom(newRoom);
      
      toast({
        title: "Room created!",
        description: `Lobby code: ${lobbyCode}. Share this with players to join.`,
      });
      
      return lobbyCode;
    } catch (err) {
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

  // Set up real-time subscriptions when room changes
  useEffect(() => {
    if (!room) return;

    console.log('🔄 Setting up real-time subscription for room:', room.id);

    const channel = gameService.subscribeToRoom(room.id, {
      onRoomUpdate: (updatedRoom) => {
        console.log('🔄 Room updated:', updatedRoom);
        setRoom(updatedRoom);
      },
      onPlayersUpdate: (dbPlayers) => {
        console.log('👥 Players updated:', dbPlayers);
        const convertedPlayers = dbPlayers.map(gameService.convertDatabasePlayerToPlayer);
        setPlayers(convertedPlayers);
        
        if (currentPlayer) {
          const updatedCurrentPlayer = dbPlayers.find(p => p.id === currentPlayer.id);
          if (updatedCurrentPlayer) {
            setCurrentPlayer(gameService.convertDatabasePlayerToPlayer(updatedCurrentPlayer));
          }
        }
      }
    });

    // Load initial players
    gameService.getPlayersInRoom(room.id).then(dbPlayers => {
      const convertedPlayers = dbPlayers.map(gameService.convertDatabasePlayerToPlayer);
      setPlayers(convertedPlayers);
    });

    return () => {
      console.log('🔄 Unsubscribing from room channel');
      channel.unsubscribe();
    };
  }, [room?.id, currentPlayer?.id]);

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
    setCurrentSong
  };
}
