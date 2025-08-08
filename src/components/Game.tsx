
import { useState, useEffect } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { Song, GamePhase } from '@/types/game';
import { MainMenu } from './MainMenu';
import { HostLobby } from './HostLobby';
import { MobileJoinFlow } from './MobileJoinFlow';
import { GamePlay } from './GamePlay';
import { HostMusicController } from './HostMusicController';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GameService } from '@/services/gameService';

export function Game() {
  const {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    createRoom,
    joinRoom,
    updatePlayer,
    leaveRoom,
    setCurrentSong
  } = useGameRoom();

  const { toast } = useToast();
  const [customSongs, setCustomSongs] = useState<Song[]>([]);

  // Handle room phase changes
  useEffect(() => {
    if (!room) return;

    console.log('[Game] Room phase changed:', room.phase);

    // Initialize game with starting cards when transitioning to playing phase
    if (room.phase === 'playing' && customSongs.length > 0) {
      console.log('[Game] Initializing game with starting cards');
      GameService.initializeGameWithStartingCards(room.id, customSongs)
        .then(() => {
          console.log('[Game] Game initialized successfully');
        })
        .catch((error) => {
          console.error('[Game] Failed to initialize game:', error);
          toast({
            title: "Game Initialization Failed",
            description: "Unable to start the game. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [room?.phase, customSongs, toast]);

  // Handle create room
  const handleCreateRoom = async (hostName: string) => {
    const lobbyCode = await createRoom(hostName);
    if (lobbyCode) {
      console.log('[Game] Room created with code:', lobbyCode);
    }
  };

  // Handle join room
  const handleJoinRoom = async (lobbyCode: string, playerName: string): Promise<boolean> => {
    const success = await joinRoom(lobbyCode, playerName);
    if (success) {
      console.log('[Game] Successfully joined room');
    }
    return success;
  };

  // Handle start game
  const handleStartGame = async () => {
    if (!room || !isHost || customSongs.length === 0) return;

    try {
      console.log('[Game] Starting game...');
      
      // Update room phase to playing
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          phase: 'playing',
          songs: customSongs as any // Type assertion to handle Json type
        })
        .eq('id', room.id);

      if (error) {
        console.error('[Game] Error starting game:', error);
        toast({
          title: "Failed to Start Game",
          description: "Unable to start the game. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('[Game] Game started successfully');
      toast({
        title: "Game Started!",
        description: "The game has begun. Good luck!",
      });

    } catch (error) {
      console.error('[Game] Error in handleStartGame:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle songs loaded
  const handleSongsLoaded = (songs: Song[]) => {
    console.log('[Game] Songs loaded:', songs.length);
    setCustomSongs(songs);
  };

  // Dummy handlers for GamePlay props that aren't implemented yet
  const handlePlaceCard = async (song: Song, position: number) => {
    console.log('[Game] Place card:', song, position);
    return { success: true, correct: true };
  };

  const handleReconnect = () => {
    console.log('[Game] Reconnect');
  };

  const handleReplayGame = () => {
    console.log('[Game] Replay game');
  };

  const handlePlayPause = async () => {
    console.log('[Game] Play/pause');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error: {error}</div>
          <button
            onClick={leaveRoom}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Determine current phase
  const currentPhase: GamePhase = room?.phase || 'menu';

  // Render appropriate component based on phase
  switch (currentPhase) {
    case 'menu':
      return <MainMenu onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
    
    case 'hostLobby':
      if (!isHost || !room) return <MainMenu onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
      return (
        <HostLobby
          room={room}
          players={players}
          customSongs={customSongs}
          onStartGame={handleStartGame}
          onSongsLoaded={handleSongsLoaded}
        />
      );
    
    case 'mobileJoin':
    case 'mobileLobby':
      if (isHost) return <MainMenu onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
      return (
        <MobileJoinFlow
          onJoinRoom={handleJoinRoom}
          room={room}
          currentPlayer={currentPlayer}
          players={players}
          onUpdatePlayer={updatePlayer}
        />
      );
    
    case 'playing':
      if (!room) return <MainMenu onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
      if (!currentPlayer) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="text-white text-xl">Player not found...</div>
          </div>
        );
      }
      return (
        <>
          <HostMusicController
            room={room}
            players={players}
            isHost={isHost}
          />
          <GamePlay
            room={room}
            players={players}
            currentPlayer={currentPlayer}
            isHost={isHost}
            customSongs={customSongs}
            onSetCurrentSong={setCurrentSong}
            onPlaceCard={handlePlaceCard}
            connectionStatus={{
              isConnected: true,
              isReconnecting: false,
              lastError: null,
              retryCount: 0
            }}
            onReconnect={handleReconnect}
            onReplayGame={handleReplayGame}
            isProcessingMove={false}
            isPlaying={false}
            onPlayPause={handlePlayPause}
            mysteryCardRevealed={false}
            cardPlacementResult={null}
            gameEnded={false}
          />
        </>
      );
    
    case 'finished':
      if (!room) return <MainMenu onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
      if (!currentPlayer) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="text-white text-xl">Player not found...</div>
          </div>
        );
      }
      return (
        <GamePlay
          room={room}
          players={players}
          currentPlayer={currentPlayer}
          isHost={isHost}
          customSongs={customSongs}
          onSetCurrentSong={setCurrentSong}
          onPlaceCard={handlePlaceCard}
          connectionStatus={{
            isConnected: true,
            isReconnecting: false,
            lastError: null,
            retryCount: 0
          }}
          onReconnect={handleReconnect}
          onReplayGame={handleReplayGame}
          isProcessingMove={false}
          isPlaying={false}
          onPlayPause={handlePlayPause}
          mysteryCardRevealed={false}
          cardPlacementResult={null}
          gameEnded={true}
        />
      );
    
    default:
      return <MainMenu onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  }
}
