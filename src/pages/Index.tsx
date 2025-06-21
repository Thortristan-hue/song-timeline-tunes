
import React, { useState, useEffect, useRef } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useGameCleanup } from '@/hooks/useGameCleanup';
import { useToast } from '@/components/ui/use-toast';
import { Player, Song, GameState, GamePhase } from '@/types/game';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoin } from '@/components/MobileJoin';
import { MobilePlayerLobby } from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import { VictoryScreen } from '@/components/VictoryScreen';
import SoundManager from '@/lib/SoundManager';
import { loadSongsFromJson } from "@/utils/songLoader";

export default function Index() {
  const { toast } = useToast();
  const soundManager = useRef<SoundManager>(new SoundManager());
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

  // Initialize game with songs
  useEffect(() => {
    const loadInitialSongs = async () => {
      try {
        const songs = await loadSongsFromJson();
        setCustomSongs(songs);
      } catch (error) {
        console.error('Failed to load songs:', error);
        // Fallback to empty array
        setCustomSongs([]);
        toast({
          title: "Failed to load songs",
          description: "Please try refreshing the page or upload your own songs.",
          variant: "destructive",
        });
      }
    };
    loadInitialSongs();
  }, []);

  // Handle turn transitions
  const handleTurnEnd = () => {
    setGameState(prev => ({
      ...prev,
      currentTurn: prev.currentTurn + 1,
      timeLeft: 30,
      isPlaying: false,
      transitioningTurn: true,
      cardResult: null
    }));

    // Clear card result after showing it briefly
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        transitioningTurn: false,
        currentSong: customSongs[(prev.currentTurn + 1) % customSongs.length],
        cardResult: null
      }));
    }, 2000);
  };

  // Handle audio updates
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setGameState(prev => ({
        ...prev,
        timeLeft: 30 - Math.floor(audioRef.current?.currentTime || 0)
      }));
    }
  };

  // Handle card placement
  const handlePlaceCard = async (position: number) => {
    if (!gameState.currentSong || !currentPlayer) return;

    const updatedPlayers = players.map(p => {
      if (p.id === currentPlayer.id) {
        const newTimeline = [...p.timeline];
        newTimeline.splice(position, 0, gameState.currentSong!);
        return {
          ...p,
          timeline: newTimeline,
          score: p.score + 1
        };
      }
      return p;
    });

    // Show result briefly before continuing
    setGameState(prev => ({
      ...prev,
      cardResult: { correct: true, song: gameState.currentSong! }
    }));

    soundManager.current.playSound('cardCorrect');
    
    // Check for winner
    const winner = updatedPlayers.find(p => p.score >= 10);
    if (winner) {
      setTimeout(() => {
        setGameState(prev => ({ ...prev, phase: 'finished', winner }));
      }, 2000);
      return;
    }

    // Continue to next turn
    setTimeout(() => {
      handleTurnEnd();
    }, 2000);
  };

  // Navigation handlers
  const handleHostGame = async () => {
    if (!currentPlayer?.name) {
      // Instead of prompt, navigate to host lobby where they can enter name
      setGameState(prev => ({ ...prev, phase: 'hostLobby' }));
      return;
    }
    
    const success = await createRoom(currentPlayer.name);
    if (success) {
      setGameState(prev => ({ ...prev, phase: 'hostLobby' }));
    }
  };

  const handleJoinGame = () => {
    setGameState(prev => ({ ...prev, phase: 'mobileJoin' }));
  };

  const handleBackToMenu = () => {
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
      setGameState(prev => ({ ...prev, phase: 'mobileLobby' }));
    }
  };

  const handleUpdatePlayer = async (name: string, color: string) => {
    await updatePlayer(name, color);
  };

  // Game control handlers
  const handleStartGame = async () => {
    if (players.length === 0 || customSongs.length === 0) {
      toast({
        title: "Cannot start game",
        description: "Need players and songs to start the game.",
        variant: "destructive",
      });
      return;
    }
    
    await updateRoomSongs(customSongs);
    await startGame();
    
    // Transition ALL players to playing phase
    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      currentSong: customSongs[0]
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
    
    // Play victory sound
    soundManager.current.playSound('victory');
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (gameState.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    
    setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
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
            createRoom={createRoom}
            currentHostName={currentPlayer?.name || ''}
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
            onPlayPause={handlePlayPause}
            onStartGame={handleStartGame}
            onBackToMenu={handleBackToMenu}
            onUpdatePlayer={handleUpdatePlayer}
            onJoinLobby={handleJoinLobby}
            onPlaceCard={handlePlaceCard}
            isLoading={isLoading}
          />
        );

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
      {gameState.phase === 'playing' && gameState.currentSong?.preview_url && (
        <audio
          ref={audioRef}
          src={gameState.currentSong.preview_url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleTurnEnd}
        />
      )}
      {renderPhase()}
    </>
  );
}
