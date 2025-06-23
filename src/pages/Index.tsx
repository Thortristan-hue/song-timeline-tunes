
import React, { useState, useEffect, useRef } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useGameCleanup } from '@/hooks/useGameCleanup';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/lib/SoundEffects';
import { Player, Song, GameState, GamePhase } from '@/types/game';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoin } from '@/components/MobileJoin';
import { MobilePlayerLobby } from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import { VictoryScreen } from '@/components/VictoryScreen';
import { HostDisplay } from '@/components/HostDisplay';

export default function Index() {
  const { toast } = useToast();
  const soundEffects = useSoundEffects();
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    createRoom,
    joinRoom,
    updatePlayer,
    updateRoomSongs,
    startGame,
    leaveRoom
  } = useGameRoom();
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'menu',
    currentTurn: 0,
    currentSong: null,
    timeLeft: 30,
    isPlaying: false,
    isDarkMode: true,
    throwingCard: null,
    confirmingPlacement: null,
    cardResult: null,
    transitioningTurn: false,
    winner: null,
    isMuted: false,
    pendingPlacement: null,
  });

  const [currentSongProgress, setCurrentSongProgress] = useState(0);
  const [currentSongDuration, setCurrentSongDuration] = useState(30);

  // Setup game cleanup for idle rooms
  useGameCleanup({
    roomId: room?.id,
    isHost,
    onRoomClosed: () => {
      toast({
        title: "Room closed",
        description: "The room was closed due to inactivity.",
        variant: "destructive",
      });
      handleBackToMenu();
    }
  });

  // Audio progress tracking
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const updateProgress = () => {
        setCurrentSongProgress(audio.currentTime || 0);
        setCurrentSongDuration(audio.duration || 30);
      };
      
      const handleLoadedMetadata = () => {
        setCurrentSongDuration(audio.duration || 30);
      };
      
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [gameState.currentSong]);

  // Navigation handlers with sound effects
  const handleHostGame = async () => {
    soundEffects.playPlayerAction();
    
    // Host doesn't need to enter name - go straight to lobby
    const roomId = await createRoom();
    if (roomId) {
      setGameState(prev => ({ ...prev, phase: 'hostLobby' }));
    }
  };

  const handleJoinGame = () => {
    soundEffects.playPlayerAction();
    setGameState(prev => ({ ...prev, phase: 'mobileJoin' }));
  };

  const handleBackToMenu = () => {
    soundEffects.playPlayerAction();
    soundEffects.stopAllSounds();
    leaveRoom();
    setGameState(prev => ({ 
      ...prev, 
      phase: 'menu',
      currentTurn: 0,
      currentSong: null,
      timeLeft: 30,
      isPlaying: false,
      throwingCard: null,
      confirmingPlacement: null,
      cardResult: null,
      transitioningTurn: false,
      winner: null,
      pendingPlacement: null,
    }));
  };

  const handleJoinLobby = async (lobbyCode: string, playerName: string) => {
    const success = await joinRoom(lobbyCode, playerName);
    if (success) {
      soundEffects.playSound('player-join');
      setGameState(prev => ({ ...prev, phase: 'mobileLobby' }));
    }
  };

  const handleUpdatePlayer = async (name: string, color: string) => {
    await updatePlayer(name, color);
  };

  // Game control handlers with sound effects
  const handleStartGame = async () => {
    if (players.length < 2) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: "Need at least 2 players to start the game.",
        variant: "destructive",
      });
      return;
    }
    
    if (customSongs.length === 0) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: "Need songs to start the game.",
        variant: "destructive",
      });
      return;
    }
    
    await updateRoomSongs(customSongs);
    await startGame();
    
    soundEffects.playSound('game-start');
    
    // Transition ALL players to playing phase
    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      currentSong: customSongs[0],
      currentTurn: 0
    }));

    toast({
      title: "🎵 Game Started!",
      description: "Let the timeline battle begin!",
    });
  };

  const handleEndGame = (winner: Player) => {
    setGameState(prev => ({
      ...prev,
      phase: 'finished',
      winner
    }));
    
    soundEffects.playGameVictory();
  };

  const getCurrentTurnPlayer = () => {
    if (players.length === 0) return null;
    return players[gameState.currentTurn % players.length];
  };

  // Phase rendering with enhanced components
  const renderPhase = () => {
    switch (gameState.phase) {
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
            createRoom={async () => true} // Host already created room
            currentHostName="" // Host doesn't have a name
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
        if (!currentPlayer || !room) return null;
        return (
          <MobilePlayerLobby
            player={currentPlayer}
            lobbyCode={room.lobby_code}
            onUpdatePlayer={handleUpdatePlayer}
            gamePhase={room.phase}
            onGameStart={() => setGameState(prev => ({ ...prev, phase: 'playing' }))}
          />
        );

      case 'playing':
        if (isHost) {
          // Host sees the host display
          const currentTurnPlayer = getCurrentTurnPlayer();
          if (!currentTurnPlayer) return null;
          
          return (
            <HostDisplay
              currentTurnPlayer={currentTurnPlayer}
              players={players}
              roomCode={room?.lobby_code || ''}
              currentSongProgress={currentSongProgress}
              currentSongDuration={currentSongDuration}
              gameState={{
                currentSong: gameState.currentSong
              }}
            />
          );
        } else {
          // Players see the game play interface
          return (
            <GamePlay
              room={room}
              players={players}
              currentPlayer={currentPlayer}
              isHost={isHost}
              songs={customSongs}
              gameState={gameState}
              setGameState={setGameState}
              onEndGame={() => {
                const winner = players.reduce((prev, current) => 
                  (prev.score > current.score) ? prev : current
                );
                handleEndGame(winner);
              }}
              onKickPlayer={(playerId: string) => {
                console.log('Kicking player:', playerId);
              }}
            />
          );
        }

      case 'finished':
        if (!gameState.winner) return null;
        return (
          <VictoryScreen 
            winner={gameState.winner}
            players={players}
            onBackToMenu={handleBackToMenu}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Audio element for song playback - only for host */}
      {isHost && gameState.phase === 'playing' && gameState.currentSong?.preview_url && (
        <audio
          ref={audioRef}
          src={gameState.currentSong.preview_url}
          crossOrigin="anonymous"
          preload="auto"
          onError={(e) => {
            console.error('Audio error:', e);
            console.log('Failed to load:', gameState.currentSong?.preview_url);
          }}
          onLoadStart={() => console.log('Audio load start')}
          onCanPlay={() => console.log('Audio can play')}
        />
      )}
      {renderPhase()}
    </>
  );
}
