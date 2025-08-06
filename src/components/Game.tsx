
import React, { useState, useCallback, useEffect } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Song, GamePhase } from '@/types/game';
import { MainMenu } from './MainMenu';
import { HostLobby } from './HostLobby';
import { MobileJoin } from './MobileJoin';
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
    kickPlayer
  } = useGameRoom();

  const gameLogic = useGameLogic(room, players, currentPlayer, isHost, gameState.songs);
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

  // Update game state when room changes
  useEffect(() => {
    if (room) {
      setGameState(prev => ({
        ...prev,
        phase: room.phase,
        lobbyCode: room.lobby_code
      }));
    }
  }, [room?.phase, room?.lobby_code]);

  // Render current phase
  const renderCurrentPhase = () => {
    switch (gameState.phase) {
      case 'menu':
        return (
          <MainMenu 
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleGoToMobileJoin}
          />
        );

      case 'hostLobby':
        return (
          <HostLobby
            players={players}
            songs={gameState.songs}
            onStartGame={handleStartGame}
            onBackToMenu={handleBackToMenu}
            onUpdateSongs={(songs: Song[]) => {
              setGameState(prev => ({ ...prev, songs }));
              updateRoomSongs(songs);
            }}
            onUpdateGamemode={updateRoomGamemode}
            onKickPlayer={kickPlayer}
            gamemode={room?.gamemode || 'classic'}
            gamemodeSettings={room?.gamemode_settings || {}}
          />
        );

      case 'mobileJoin':
        return (
          <MobileJoin
            onJoinRoom={handleJoinRoom}
            onBackToMenu={handleBackToMenu}
          />
        );

      case 'mobileLobby':
        return (
          <MobilePlayerLobby
            lobbyCode={gameState.lobbyCode || ''}
            playerName={gameState.playerName || ''}
            players={players}
            currentPlayer={currentPlayer}
            onUpdatePlayer={updatePlayer}
            onLeaveRoom={handleLeaveRoom}
            gamemode={room?.gamemode || 'classic'}
            gamemodeSettings={room?.gamemode_settings || {}}
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
            gameLogic={gameLogic}
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
                phase: isHost ? 'hostLobby' as GamePhase : 'mobileLobby' as GamePhase
              }));
            }}
          />
        );

      default:
        return <MainMenu onCreateRoom={handleCreateRoom} onJoinRoom={handleGoToMobileJoin} />;
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
