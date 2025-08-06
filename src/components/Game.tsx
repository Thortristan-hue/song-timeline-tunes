
import React, { useEffect, useState } from 'react';
import { useRealtimeGameState } from '@/hooks/useRealtimeGameState';
import { GameService } from '@/services/gameService';
import { useToast } from '@/components/ui/use-toast';
import { Song, Player, GameRoom } from '@/types/game';
import { MainMenu } from './MainMenu';
import { HostLobby } from './HostLobby';
import { MobileJoinFlow } from './MobileJoinFlow';
import { GamePlay } from './GamePlay';
import { ConnectionStatus } from './ConnectionStatus';
import { supabase } from '@/integrations/supabase/client';

interface GameProps {
  initialRoomId?: string;
  initialPlayerId?: string;
}

export function Game({ initialRoomId, initialPlayerId }: GameProps) {
  const { toast } = useToast();
  
  // State for room and player IDs
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null);
  const [playerId, setPlayerId] = useState<string | null>(initialPlayerId || null);
  
  // Custom songs loaded by host
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  
  // Get realtime game state from Supabase - this is the authoritative source
  const { 
    gameState, 
    updateGameState, 
    updatePlayerData,
    refreshData 
  } = useRealtimeGameState(roomId, playerId);

  const {
    room,
    players,
    currentPlayer,
    mysteryCard,
    isHost,
    isConnected,
    error
  } = gameState;

  // Enhanced debugging for the main game component
  useEffect(() => {
    console.log('🎮 Game Component State:', {
      roomId,
      playerId,
      roomPhase: room?.phase,
      isHost,
      playersCount: players.length,
      isConnected,
      error,
      customSongsCount: customSongs.length
    });
  }, [roomId, playerId, room?.phase, isHost, players.length, isConnected, error, customSongs.length]);

  // Connection status for UI feedback
  const connectionStatus = {
    isConnected,
    isReconnecting: false,
    lastError: error,
    retryCount: 0
  };

  const handleCreateRoom = async () => {
    console.log('🏠 Creating room');
    
    try {
      // Generate a unique lobby code
      const lobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Generate a unique player session ID for the host
      const hostSessionId = crypto.randomUUID();

      // Create the room in the database with the required host_id
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          lobby_code: lobbyCode,
          host_id: hostSessionId, // Use the host session ID as host_id
          host_name: 'Host', // Default host name
          phase: 'lobby', // Use database phase 'lobby'
          gamemode: 'classic',
          songs: []
        })
        .select()
        .single();

      if (roomError) {
        console.error('❌ Failed to create room:', roomError);
        toast({
          title: "Failed to Create Room",
          description: "Could not create a new room. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Create the host player entry
      const { data: hostPlayer, error: hostError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          player_session_id: hostSessionId,
          name: 'Host',
          color: '#007AFF',
          timeline_color: '#007AFF',
          is_host: true,
          score: 0,
          timeline: []
        })
        .select()
        .single();

      if (hostError) {
        console.error('❌ Failed to create host player:', hostError);
        toast({
          title: "Failed to Create Host",
          description: "Could not set up the host player. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Room created successfully:', {
        roomId: roomData.id,
        lobbyCode: roomData.lobby_code,
        hostPlayerId: hostPlayer.id
      });

      // Set the room and player IDs to trigger the realtime subscription
      setRoomId(roomData.id);
      setPlayerId(hostSessionId);

      toast({
        title: "Room Created!",
        description: `Room created with code: ${lobbyCode}`,
      });

    } catch (error) {
      console.error('❌ Unexpected error creating room:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the room.",
        variant: "destructive",
      });
    }
  };

  const handleJoinRoom = () => {
    console.log('👤 Joining room');
    // Handle room joining logic - for now just log
  };

  const handleMobileJoin = async (lobbyCode: string, playerName: string): Promise<boolean> => {
    console.log('📱 Mobile join:', { playerName, lobbyCode });
    try {
      // Implementation for mobile join
      return true;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      return false;
    }
  };

  const handleLoadPlaylist = (songs: Song[]) => {
    console.log('🎵 Loading playlist:', songs.length, 'songs');
    setCustomSongs(songs);
    toast({
      title: "Playlist Loaded",
      description: `${songs.length} songs loaded successfully`,
    });
  };

  const handlePlaceCard = async (song: Song, position: number) => {
    if (!roomId || !currentPlayer) {
      return { success: false };
    }

    console.log('🃏 Placing card:', { song: song.deezer_title, position, playerId: currentPlayer.id });
    
    try {
      const result = await GameService.placeCardAndAdvanceTurn(
        roomId,
        currentPlayer.id,
        song,
        position,
        customSongs
      );
      
      return result;
    } catch (error) {
      console.error('❌ Failed to place card:', error);
      return { success: false };
    }
  };

  const handleSetCurrentSong = async (song: Song) => {
    if (!roomId) return;

    console.log('🎵 Setting current song:', song.deezer_title);
    
    try {
      await GameService.setCurrentSong(roomId, song);
    } catch (error) {
      console.error('❌ Failed to set current song:', error);
      toast({
        title: "Error",
        description: "Failed to set current song",
        variant: "destructive",
      });
    }
  };

  const handleReconnect = () => {
    console.log('🔄 Attempting to reconnect...');
    refreshData();
  };

  const handleReplayGame = async () => {
    if (!roomId) return;
    
    console.log('🔄 Replaying game...');
    // Reset game state back to lobby
    await updateGameState({ phase: 'hostLobby' as any });
  };

  // Determine current phase based on authoritative room state
  const currentPhase = room?.phase || 'menu';
  
  console.log('🎭 Current Phase:', currentPhase);

  // Render appropriate component based on authoritative game phase
  switch (currentPhase) {
    case 'menu':
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800">
          <MainMenu 
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        </div>
      );

    case 'hostLobby':
      if (!room || !isHost) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
              <div className="text-white">Loading lobby...</div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800">
          <HostLobby
            room={room}
            players={players}
            onLoadPlaylist={handleLoadPlaylist}
            customSongs={customSongs}
          />
        </div>
      );

    case 'mobileJoin':
    case 'mobileLobby':
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800">
          <MobileJoinFlow
            onJoinRoom={handleMobileJoin}
            onBackToMenu={handleJoinRoom}
          />
        </div>
      );

    case 'playing':
      if (!room) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
              <div className="text-white">Loading game...</div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen">
          <ConnectionStatus 
            connectionStatus={connectionStatus}
            onReconnect={handleReconnect}
          />
          <GamePlay
            room={room}
            players={players}
            currentPlayer={currentPlayer!}
            isHost={isHost}
            onPlaceCard={handlePlaceCard}
            onSetCurrentSong={handleSetCurrentSong}
            customSongs={customSongs}
            connectionStatus={connectionStatus}
            onReconnect={handleReconnect}
            onReplayGame={handleReplayGame}
          />
        </div>
      );

    case 'finished':
      // Game finished - show in GamePlay component
      if (!room) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="text-white">Game finished</div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen">
          <GamePlay
            room={room}
            players={players}
            currentPlayer={currentPlayer!}
            isHost={isHost}
            onPlaceCard={handlePlaceCard}
            onSetCurrentSong={handleSetCurrentSong}
            customSongs={customSongs}
            connectionStatus={connectionStatus}
            onReconnect={handleReconnect}
            onReplayGame={handleReplayGame}
          />
        </div>
      );

    default:
      console.warn('🚨 Unknown game phase:', currentPhase);
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800">
          <MainMenu 
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        </div>
      );
  }
}
