
import React, { useState, useCallback, useEffect } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Song, GamePhase } from '@/types/game';
import { MainMenu } from './MainMenu';
import { HostLobby } from './HostLobby';
import { MobileJoinFlow } from './MobileJoinFlow';
import MobilePlayerLobby from './MobilePlayerLobby';
import { GamePlay } from './GamePlay';
import { VictoryScreen } from './VictoryScreen';
import { useToast } from '@/components/ui/use-toast';
import { GameService } from '@/services/gameService';

interface GameState {
  phase: GamePhase;
  lobbyCode?: string;
  playerName?: string;
  isHost: boolean;
  songs: Song[];
}

export function Game() {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'menu',
    isHost: false,
    songs: []
  });

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
    updateRoomSongs,
    updateRoomGamemode,
    startGame,
    leaveRoom,
    placeCard,
    setCurrentSong,
    assignStartingCards,
    kickPlayer,
    connectionStatus
  } = useGameRoom();

  const gameLogic = useGameLogic(room?.id || null, players, room, setCurrentSong);
  const { toast } = useToast();

  // Handle create room
  const handleCreateRoom = useCallback(async (hostName: string) => {
    const lobbyCode = await createRoom(hostName);
    if (lobbyCode) {
      setGameState(prev => ({
        ...prev,
        phase: 'hostLobby' as GamePhase,
        lobbyCode,
        isHost: true
      }));
    }
  }, [createRoom]);

  // Handle join room
  const handleJoinRoom = useCallback(async (lobbyCode: string, playerName: string) => {
    const success = await joinRoom(lobbyCode, playerName);
    if (success) {
      setGameState(prev => ({
        ...prev,
        phase: 'mobileLobby' as GamePhase,
        lobbyCode,
        playerName,
        isHost: false
      }));
    }
    return success;
  }, [joinRoom]);

  // Handle pending character update when room and player are ready
  useEffect(() => {
    const handlePendingCharacter = async () => {
      const pendingCharacter = localStorage.getItem('pendingCharacter');
      
      // Only proceed if we have all the necessary conditions
      if (pendingCharacter && room?.id && currentPlayer?.id && !isHost) {
        console.log('Applying pending character:', pendingCharacter, 'for player:', currentPlayer.id);
        
        try {
          const updateSuccess = await updatePlayer({ character: pendingCharacter });
          if (updateSuccess) {
            localStorage.removeItem('pendingCharacter');
            console.log('Character successfully updated');
          } else {
            console.error('Failed to update character');
          }
        } catch (error) {
          console.error('Error updating character:', error);
        }
      }
    };

    // Add a small delay to ensure all state is settled
    const timeoutId = setTimeout(handlePendingCharacter, 500);
    return () => clearTimeout(timeoutId);
  }, [room?.id, currentPlayer?.id, isHost, updatePlayer]);

  // Handle start game
  const handleStartGame = useCallback(async () => {
    try {
      await startGame();
      setGameState(prev => ({
        ...prev,
        phase: 'playing' as GamePhase
      }));
    } catch (error) {
      console.error('Failed to start game:', error);
      toast({
        title: "Failed to Start Game",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [startGame, toast]);

  // Handle card placement
  const handlePlaceCard = useCallback(async (song: Song, position: number) => {
    if (!room || !currentPlayer) return { success: false };

    try {
      const result = await GameService.placeCard(
        room.id,
        currentPlayer.id,
        song,
        position
      );

      if (result.gameEnded) {
        setGameState(prev => ({
          ...prev,
          phase: 'finished' as GamePhase
        }));
      }

      return result;
    } catch (error) {
      console.error('Failed to place card:', error);
      return { success: false };
    }
  }, [room, currentPlayer]);

  // Handle leave room
  const handleLeaveRoom = useCallback(() => {
    // Clear any pending character data
    localStorage.removeItem('pendingCharacter');
    leaveRoom();
    setGameState({
      phase: 'menu',
      isHost: false,
      songs: []
    });
  }, [leaveRoom]);

  // Handle back to menu
  const handleBackToMenu = useCallback(() => {
    handleLeaveRoom();
  }, [handleLeaveRoom]);

  // Handle going to mobile join
  const handleGoToMobileJoin = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'mobileJoin' as GamePhase
    }));
  }, []);

  // Handle player update with correct signature
  const handleUpdatePlayer = useCallback(async (name: string, character: string) => {
    if (!currentPlayer || !room?.id) return;
    
    const updates = {
      name,
      character
    };
    
    await updatePlayer(updates);
  }, [currentPlayer, room?.id, updatePlayer]);

  // Update game state when room changes - but preserve proper UI states
  useEffect(() => {
    if (room) {
      setGameState(prev => {
        // Only update phase when it's an actual game phase change
        if (room.phase === 'playing' && prev.phase !== 'playing') {
          return { ...prev, phase: 'playing', lobbyCode: room.lobby_code };
        }
        if (room.phase === 'finished' && prev.phase !== 'finished') {
          return { ...prev, phase: 'finished', lobbyCode: room.lobby_code };
        }
        
        // Just update lobby code for other phases
        return { ...prev, lobbyCode: room.lobby_code };
      });
    }
  }, [room?.phase, room?.lobby_code]);

  // Render current phase
  const renderCurrentPhase = () => {
    switch (gameState.phase) {
      case 'menu':
        return (
          <MainMenu 
            onCreateRoom={() => {
              // Host doesn't need a name since they're not a player
              handleCreateRoom('');
            }}
            onJoinRoom={handleGoToMobileJoin}
          />
        );

      case 'hostLobby':
        return (
          <HostLobby
            room={room!}
            players={players}
            onLoadPlaylist={(songs: Song[]) => {
              setGameState(prev => ({ ...prev, songs }));
              updateRoomSongs(songs);
            }}
            customSongs={gameState.songs}
          />
        );

      case 'mobileJoin':
        return (
          <MobileJoinFlow
            onJoinRoom={handleJoinRoom}
            onBackToMenu={handleBackToMenu}
            isLoading={isLoading}
          />
        );

      case 'mobileLobby':
        return (
          <MobilePlayerLobby
            room={room}
            players={players}
            currentPlayer={currentPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onBackToMenu={handleBackToMenu}
          />
        );

      case 'playing':
        return (
          <GamePlay
            room={room}
            players={players}
            currentPlayer={currentPlayer}
            isHost={isHost}
            onPlaceCard={handlePlaceCard}
            customSongs={gameState.songs}
            onSetCurrentSong={setCurrentSong}
            connectionStatus={connectionStatus}
            onReconnect={() => {}}
            onReplayGame={() => {}}
          />
        );

      case 'finished':
        return (
          <VictoryScreen
            winner={players.find(p => p.score === Math.max(...players.map(p => p.score))) || null}
            players={players}
            onBackToMenu={handleBackToMenu}
            onPlayAgain={() => {
              setGameState(prev => ({
                ...prev,
                phase: isHost ? ('hostLobby' as GamePhase) : ('mobileLobby' as GamePhase)
              }));
            }}
          />
        );

      default:
        return (
          <MainMenu 
            onCreateRoom={() => {
              // Host doesn't need a name since they're not a player
              handleCreateRoom('');
            }}
            onJoinRoom={handleGoToMobileJoin}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentPhase()}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
