
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
}

export function useGameRoom(): UseGameRoomReturn {
  const { toast } = useToast();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = room ? room.host_id === gameService.getSessionId() : false;

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
      const roomData = await gameService.getRoomByCode(lobbyCode);
      if (!roomData) {
        throw new Error('Room not found');
      }

      const existingPlayers = await gameService.getPlayersInRoom(roomData.id);
      const existingPlayer = existingPlayers.find(p => p.name === playerName);

      let player: DatabasePlayer;

      if (existingPlayer) {
        player = await gameService.reconnectPlayer(existingPlayer.id);
        toast({
          title: "Reconnected!",
          description: `Welcome back, ${playerName}!`,
        });
      } else {
        player = await gameService.joinRoom(lobbyCode, playerName);
        toast({
          title: "Joined room!",
          description: `Welcome to lobby ${lobbyCode}`,
        });
      }
      
      setRoom(roomData);
      setCurrentPlayer(gameService.convertDatabasePlayerToPlayer(player));
      
      return true;
    } catch (err) {
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

  const leaveRoom = useCallback(() => {
    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setError(null);
  }, []);

  // Set up real-time subscriptions when room changes
  useEffect(() => {
    if (!room) return;

    const channel = gameService.subscribeToRoom(room.id, {
      onRoomUpdate: (updatedRoom) => {
        setRoom(updatedRoom);
      },
      onPlayersUpdate: (dbPlayers) => {
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

    gameService.getPlayersInRoom(room.id).then(dbPlayers => {
      const convertedPlayers = dbPlayers.map(gameService.convertDatabasePlayerToPlayer);
      setPlayers(convertedPlayers);
    });

    return () => {
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
    leaveRoom
  };
}
