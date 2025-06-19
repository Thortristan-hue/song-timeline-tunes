import React, { useState, useEffect, useRef } from 'react';
import { HostDisplay } from '@/components/HostDisplay';
import { PlayerView } from '@/components/PlayerView';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoin } from '@/components/MobileJoin';
import { MobilePlayerLobby } from '@/components/MobilePlayerLobby';
import { VictoryScreen } from '@/components/VictoryScreen';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useToast } from '@/components/ui/use-toast';
import { Song, Player, GamePhase } from '@/types/game';
import { loadSongsFromJson } from "@/utils/songLoader";
import '@/styles/enhanced-animations.css';

interface GameState {
  phase: GamePhase;
  currentTurn: number;
  currentSong: Song | null;
  timeLeft: number;
  isPlaying: boolean;
  isDarkMode: boolean;
  winner: Player | null;
  isMuted: boolean;
  currentSongProgress?: number;
  currentSongDuration?: number;
}

const Index = () => {
  const { toast } = useToast();
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
    winner: null,
    isMuted: false,
  });

  const [customSongs, setCustomSongs] = useState<Song[]>([]);

  // Initialize game when starting
  useEffect(() => {
    if (gameState.phase === 'playing' && !gameState.currentSong && customSongs.length > 0) {
      setGameState(prev => ({
        ...prev,
        currentSong: customSongs[0]
      }));
    }
  }, [gameState.phase, customSongs]);

  // Handle timer and audio updates
  useEffect(() => {
    const timer = gameState.phase === 'playing' && setInterval(() => {
      setGameState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 1)
      }));
    return () => timer && clearInterval(timer);
  }, [gameState.phase]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setGameState(prev => ({
        ...prev,
        timeLeft: 30 - Math.floor(audioRef.current?.currentTime || 0),
        currentSongProgress: audioRef.current.currentTime,
        currentSongDuration: audioRef.current.duration || 30
      }));
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !gameState.currentSong?.preview_url) return;

    if (gameState.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    
    setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handlePlaceCard = async (position: number) => {
    if (!gameState.currentSong || !currentPlayer) return;

    const nextTurn = gameState.currentTurn + 1;
    const nextSong = customSongs[nextTurn % customSongs.length];

    setGameState(prev => ({
      ...prev,
      currentTurn: nextTurn,
      currentSong: nextSong,
      timeLeft: 30,
      isPlaying: false
    }));

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleHostGame = async () => {
    setGameState(prev => ({ ...prev, phase: 'hostLobby' }));
    await createRoom();
  };

  const handleJoinGame = () => {
    setGameState(prev => ({ ...prev, phase: 'mobileJoin' }));
  };

  const handleBackToMenu = () => {
    leaveRoom();
    setGameState(prev => ({ ...prev, phase: 'menu' }));
  };

  const handleJoinLobby = async (lobbyCode: string, playerName: string) => {
    const success = await joinRoom(lobbyCode, playerName);
    if (success) {
      setGameState(prev => ({ ...prev, phase: 'mobileLobby' }));
    }
  };

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
    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      currentSong: customSongs[0]
    }));

    toast({
      title: "Game Started!",
      description: "Let the timeline battle begin!",
    });
  };

  const renderContent = () => {
    const currentTurnPlayer = players[gameState.currentTurn % players.length];
    
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
            createRoom={createRoom}
            isLoading={isLoading}
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
            onUpdatePlayer={updatePlayer}
          />
        );

      case 'playing':
        if (!currentPlayer) {
          return (
            <HostDisplay
              currentTurnPlayer={currentTurnPlayer}
              players={players}
              roomCode={room?.lobby_code || ''}
              currentSongProgress={gameState.currentSongProgress || 0}
              currentSongDuration={gameState.currentSongDuration || 30}
              gameState={gameState}
            />
          );
        }
        return (
          <PlayerView
            currentPlayer={currentPlayer}
            currentTurnPlayer={currentTurnPlayer}
            roomCode={room?.lobby_code || ''}
            isMyTurn={currentPlayer.id === currentTurnPlayer.id}
            gameState={gameState}
            onPlaceCard={handlePlaceCard}
            onPlayPause={handlePlayPause}
          />
        );

      case 'finished':
        if (!gameState.winner) return null;
        return (
          <VictoryScreen 
            winner={gameState.winner}
            players={players}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {gameState.phase === 'playing' && !currentPlayer && gameState.currentSong?.preview_url && (
        <audio
          ref={audioRef}
          src={gameState.currentSong.preview_url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setGameState(prev => ({
            ...prev,
            isPlaying: false,
            timeLeft: 30
          }))}
        />
      )}
      {renderContent()}
    </>
  );
};

export default Index;
