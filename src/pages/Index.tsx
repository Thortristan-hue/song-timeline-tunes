
import React, { useState, useEffect } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Song, GamePhase } from '@/types/game';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoin } from '@/components/MobileJoin';
import { MobilePlayerLobby } from '@/components/MobilePlayerLobby';
import { HostGameDisplay } from '@/components/HostGameDisplay';
import { PlayerGameView } from '@/components/PlayerGameView';
import { VictoryScreen } from '@/components/VictoryScreen';

export default function Index() {
  const { toast } = useToast();
  const soundEffects = useSoundEffects();
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [mysteryCardRevealed, setMysteryCardRevealed] = useState(false);
  const [cardPlacementResult, setCardPlacementResult] = useState<{ correct: boolean; song: Song } | null>(null);
  
  const {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    createRoom,
    joinRoom,
    updatePlayer,
    startGame,
    leaveRoom,
    placeCard,
    setCurrentSong
  } = useGameRoom();
  
  const {
    gameState,
    setIsPlaying,
    getCurrentPlayer,
    initializeGame
  } = useGameLogic(room?.id || null, players, room, setCurrentSong);

  // Handle room phase changes and auto-navigate based on session
  useEffect(() => {
    if (room) {
      if (room.phase === 'playing' && gamePhase !== 'playing') {
        setGamePhase('playing');
      } else if (room.phase === 'lobby') {
        if (isHost) {
          setGamePhase('hostLobby');
        } else if (currentPlayer) {
          setGamePhase('mobileLobby');
        }
      }
    } else if (!isLoading && gamePhase !== 'menu') {
      // Only reset to menu if we're not loading and not already on menu
      setGamePhase('menu');
    }
  }, [room?.phase, gamePhase, isHost, currentPlayer, isLoading]);

  // Navigation handlers
  const handleHostGame = async () => {
    try {
      soundEffects.playPlayerAction();
      setGamePhase('hostLobby');
    } catch (error) {
      toast({
        title: "Navigation Failed",
        description: "Unable to navigate to host lobby.",
        variant: "destructive",
      });
    }
  };

  const handleJoinGame = () => {
    soundEffects.playPlayerAction();
    setGamePhase('mobileJoin');
  };

  const handleBackToMenu = () => {
    soundEffects.playPlayerAction();
    leaveRoom();
    setGamePhase('menu');
    setMysteryCardRevealed(false);
    setCardPlacementResult(null);
  };

  const handleCreateRoom = async () => {
    try {
      const roomId = await createRoom();
      return !!roomId;
    } catch (error) {
      toast({
        title: "Room Creation Failed",
        description: "Unable to create game room. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleJoinLobby = async (lobbyCode: string, playerName: string) => {
    try {
      const success = await joinRoom(lobbyCode, playerName);
      if (success) {
        soundEffects.playSound('player-join');
        setGamePhase('mobileLobby');
      }
    } catch (error) {
      toast({
        title: "Join Failed",
        description: "Unable to join game lobby. Please check the code and try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartGame = async () => {
    if (players.length < 2) {
      toast({
        title: "Cannot start game",
        description: "Need at least 2 players to start the game.",
        variant: "destructive",
      });
      return;
    }

    try {
      await startGame();
      await initializeGame();
      soundEffects.playSound('game-start');
      
      toast({
        title: "🎵 Game Started!",
        description: "Players can now place cards on their timelines!",
      });
    } catch (error) {
      toast({
        title: "Game Start Failed",
        description: "Unable to start the game. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!gameState.isPlaying);
  };

  const handlePlaceCard = async (position: number): Promise<{ success: boolean }> => {
    if (!gameState.currentSong || !currentPlayer) {
      return { success: false };
    }

    // Use the database-synced place card function
    const result = await placeCard(gameState.currentSong, position);
    
    // Show result
    setMysteryCardRevealed(true);
    setCardPlacementResult({
      correct: result.success,
      song: gameState.currentSong
    });

    // Play sound effects
    if (result.success) {
      soundEffects.playCardSuccess();
    } else {
      soundEffects.playCardError();
    }

    // Clear result after delay
    setTimeout(() => {
      setCardPlacementResult(null);
      setMysteryCardRevealed(false);
    }, 3000);

    return result;
  };

  // Dummy setCustomSongs function for HostLobby
  const setCustomSongs = (songs: Song[]) => {
    // For now, we only use the default playlist
    console.log('Custom songs not implemented yet:', songs);
  };

  // Reset card states on new turn
  useEffect(() => {
    if (gameState.currentSong) {
      setMysteryCardRevealed(false);
      setCardPlacementResult(null);
    }
  }, [gameState.currentSong]);

  // Check for winner
  useEffect(() => {
    if (gameState.winner) {
      setGamePhase('finished');
      soundEffects.playGameVictory();
    }
  }, [gameState.winner, soundEffects]);

  // Show loading screen while determining initial state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🎵</div>
          <div className="text-2xl font-bold mb-2">Loading...</div>
          <div className="text-slate-300">Checking for existing game session</div>
        </div>
      </div>
    );
  }

  const renderPhase = () => {
    switch (gamePhase) {
      case 'menu':
        return (
          <MainMenu 
            onHostGame={handleHostGame} 
            onJoinGame={handleJoinGame} 
          />
        );

      case 'hostLobby':
        return (
          <HostLobby
            lobbyCode={room?.lobby_code || ''}
            players={players}
            onStartGame={handleStartGame}
            onBackToMenu={handleBackToMenu}
            setCustomSongs={setCustomSongs}
            isLoading={isLoading}
            createRoom={handleCreateRoom}
          />
        );

      case 'mobileJoin':
        return (
          <MobileJoin
            onJoinLobby={handleJoinLobby}
            onBackToMenu={handleBackToMenu}
            isLoading={isLoading}
          />
        );

      case 'mobileLobby':
        return (
          <MobilePlayerLobby
            player={currentPlayer!}
            lobbyCode={room?.lobby_code || ''}
            onUpdatePlayer={updatePlayer}
            gamePhase={gamePhase}
            onGameStart={() => setGamePhase('playing')}
          />
        );

      case 'playing':
        if (gameState.phase === 'loading') {
          return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🎵</div>
                <div className="text-2xl font-bold mb-2">Loading Game...</div>
                <div className="text-slate-300">Preparing songs and player cards</div>
              </div>
            </div>
          );
        }

        if (gameState.loadingError) {
          return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-red-900 flex items-center justify-center">
              <div className="text-center text-white bg-red-900/80 backdrop-blur-lg rounded-2xl p-8 border border-red-600/50 max-w-md">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold mb-4">Game Setup Error</h2>
                <p className="text-red-200 mb-6">{gameState.loadingError}</p>
                <button
                  onClick={handleBackToMenu}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          );
        }

        const currentTurnPlayer = getCurrentPlayer();
        
        if (isHost) {
          return (
            <HostGameDisplay
              currentPlayer={currentTurnPlayer}
              allPlayers={gameState.players}
              currentSong={gameState.currentSong}
              roomCode={room?.lobby_code || ''}
              isPlaying={gameState.isPlaying}
              onPlayPause={handlePlayPause}
              mysteryCardRevealed={mysteryCardRevealed}
              cardPlacementResult={cardPlacementResult}
            />
          );
        } else {
          return (
            <PlayerGameView
              currentPlayer={currentPlayer}
              currentTurnPlayer={currentTurnPlayer}
              currentSong={gameState.currentSong}
              roomCode={room?.lobby_code || ''}
              isMyTurn={currentPlayer?.id === currentTurnPlayer?.id}
              isPlaying={gameState.isPlaying}
              onPlayPause={handlePlayPause}
              onPlaceCard={handlePlaceCard}
              mysteryCardRevealed={mysteryCardRevealed}
              cardPlacementResult={cardPlacementResult}
            />
          );
        }

      case 'finished':
        return (
          <VictoryScreen
            winner={gameState.winner}
            players={gameState.players}
            onPlayAgain={initializeGame}
            onBackToMenu={handleBackToMenu}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      {renderPhase()}
    </ErrorBoundary>
  );
}
