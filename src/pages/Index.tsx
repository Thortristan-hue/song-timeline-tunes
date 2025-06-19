import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Clock, Sun, Moon, Trophy, Volume2, VolumeX, Users, Check, X, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlayerTimeline } from '@/components/PlayerTimeline';
import { CircularPlayersLayout } from '@/components/CircularPlayersLayout';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { PlayerJoinForm } from '@/components/PlayerJoinForm';
import VictoryScreen from '@/components/VictoryScreen';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoin } from '@/components/MobileJoin';
import { MobilePlayerLobby } from '@/components/MobilePlayerLobby';
import { HostDisplay } from '@/components/HostDisplay';
import { PlayerView } from '@/components/PlayerView';
import { useToast } from '@/components/ui/use-toast';
import { useGameRoom } from '@/hooks/useGameRoom';
import { cn } from '@/lib/utils';
import { loadSongsFromJson } from "@/utils/songLoader";
import { Song, Player } from '@/types/game';
import '@/styles/enhanced-animations.css';

const PROXY_BASE = 'https://timeliner-proxy.thortristanjd.workers.dev/?url=';

class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private bgMusic: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds() {
    const soundFiles = {
      cardPlace: '/sounds/card-place.mp3',
      cardCorrect: '/sounds/correct.mp3',
      cardWrong: '/sounds/incorrect.mp3',
      victory: '/sounds/victory.mp3',
      buttonClick: '/sounds/button-click.mp3',
      woosh: '/sounds/card-woosh.mp3'
    };

    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      if (key === 'bgMusic') {
        audio.loop = true;
        this.bgMusic = audio;
      } else {
        this.sounds[key] = audio;
      }
      audio.volume = this.volume;
    });
  }

  playSound(soundName: string, volume?: number) {
    if (this.isMuted) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.volume = volume ?? this.volume;
      sound.play().catch(() => {});
    }
  }

  playSoundWithDelay(soundName: string, delay: number) {
    setTimeout(() => this.playSound(soundName), delay);
  }

  playBgMusic() {
    if (this.isMuted || !this.bgMusic) return;
    this.bgMusic.play().catch(() => {});
  }

  pauseBgMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    Object.values(this.sounds).forEach(sound => {
      sound.muted = this.isMuted;
    });
    if (this.bgMusic) {
      this.bgMusic.muted = this.isMuted;
    }
    return this.isMuted;
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
    if (this.bgMusic) {
      this.bgMusic.volume = this.volume * 0.5;
    }
  }
}

interface GameState {
  phase: 'menu' | 'hostLobby' | 'mobileJoin' | 'mobileLobby' | 'playing' | 'finished';
  currentTurn: number;
  currentSong: Song | null;
  timeLeft: number;
  isPlaying: boolean;
  isDarkMode: boolean;
  throwingCard: { song: Song; playerId: string; position: number } | null;
  confirmingPlacement: { song: Song; position: number } | null;
  cardResult: { correct: boolean; message: string; song: Song } | null;
  transitioningTurn: boolean;
  winner: Player | null;
  isMuted: boolean;
  pendingPlacement: { playerId: string; song: Song; position: number } | null;
}

const Index = () => {
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

  const handleTurnEnd = () => {
    setGameState(prev => ({
      ...prev,
      currentTurn: prev.currentTurn + 1,
      timeLeft: 30,
      isPlaying: false,
      transitioningTurn: true
    }));

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        transitioningTurn: false,
        currentSong: customSongs[Math.floor(Math.random() * customSongs.length)]
      }));
    }, 1000);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setGameState(prev => ({
        ...prev,
        timeLeft: 30 - Math.floor(audioRef.current?.currentTime || 0)
      }));
    }
  };

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

    soundManager.current.playSound('cardCorrect');
    handleTurnEnd();
  };

  const handleHostGame = async () => {
    setGameState(prev => ({ ...prev, phase: 'hostLobby' }));
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

  const handleUpdatePlayer = async (name: string, color: string) => {
    await updatePlayer(name, color);
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

  const handlePlayPauseAudio = () => {
    setGameState(prev => {
      const newState = { ...prev, isPlaying: !prev.isPlaying };
      if (newState.isPlaying) {
        soundManager.current.playBgMusic();
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      } else {
        soundManager.current.pauseBgMusic();
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
      return newState;
    });
  };

  useEffect(() => {
    if (room?.phase === 'playing' && gameState.phase !== 'playing') {
      setGameState(prev => ({ ...prev, phase: 'playing' }));
    }
  }, [room?.phase, gameState.phase]);

  const renderContent = () => {
    if (!currentPlayer) {
      return (
        <HostDisplay
          currentTurnPlayer={players[gameState.currentTurn % players.length]}
          players={players}
          roomCode={room?.lobby_code || ''}
          currentSongDuration={30}
          currentSongProgress={gameState.timeLeft}
          onSongEnd={handleTurnEnd}
        />
      );
    }

    return (
      <PlayerView
        currentPlayer={currentPlayer}
        currentTurnPlayer={players[gameState.currentTurn % players.length]}
        roomCode={room?.lobby_code || ''}
        isMyTurn={currentPlayer.id === players[gameState.currentTurn % players.length].id}
        gameState={gameState}
        onPlaceCard={handlePlaceCard}
        onPlayPause={handlePlayPauseAudio}
      />
    );
  };

  const renderCurrentPhase = () => {
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
            onUpdatePlayer={handleUpdatePlayer}
          />
        );

      case 'playing':
        return renderContent();

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
      {!currentPlayer && gameState.currentSong?.preview_url && (
        <audio
          ref={audioRef}
          src={gameState.currentSong.preview_url}
          onEnded={handleTurnEnd}
          onTimeUpdate={handleTimeUpdate}
        />
      )}
      {renderCurrentPhase()}
    </>
  );
};

export default Index;
