
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
  createRoom: (hostName: string) => Promise<string | null>;
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

  const isHost = currentPlayer?.id === room?.host_id || false;

  const createRoom = useCallback(async (hostName: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { room: newRoom, lobbyCode } = await gameService.createRoom(hostName);
      setRoom(newRoom);
      
      toast({
        title: "Room created!",
        description: `Lobby code: ${lobbyCode}`,
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
      const player = await gameService.joinRoom(lobbyCode, playerName);
      const roomData = await gameService.getRoomByCode(lobbyCode);
      
      if (!roomData) {
        throw new Error('Room not found');
      }
      
      setRoom(roomData);
      setCurrentPlayer(gameService.convertDatabasePlayerToPlayer(player));
      
      toast({
        title: "Joined room!",
        description: `Welcome to lobby ${lobbyCode}`,
      });
      
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

    console.log('Setting up subscriptions for room:', room.id);

    const channel = gameService.subscribeToRoom(room.id, {
      onRoomUpdate: (updatedRoom) => {
        console.log('Room updated:', updatedRoom);
        setRoom(updatedRoom);
      },
      onPlayersUpdate: (dbPlayers) => {
        console.log('Players updated:', dbPlayers);
        const convertedPlayers = dbPlayers.map(gameService.convertDatabasePlayerToPlayer);
        setPlayers(convertedPlayers);
        
        // Update current player if it exists in the list
        if (currentPlayer) {
          const updatedCurrentPlayer = dbPlayers.find(p => p.id === currentPlayer.id);
          if (updatedCurrentPlayer) {
            setCurrentPlayer(gameService.convertDatabasePlayerToPlayer(updatedCurrentPlayer));
          }
        }
      }
    });

    // Initial load of players
    gameService.getPlayersInRoom(room.id).then(dbPlayers => {
      const convertedPlayers = dbPlayers.map(gameService.convertDatabasePlayerToPlayer);
      setPlayers(convertedPlayers);
    });

    return () => {
      console.log('Cleaning up subscriptions');
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
