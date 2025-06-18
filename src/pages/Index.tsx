import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { useGameRoom } from '@/hooks/useGameRoom';
import { cn } from '@/lib/utils';
import { loadSongsFromJson } from "@/utils/songLoader";
import { Song, Player } from '@/types/game';
import '@/styles/enhanced-animations.css';

const PROXY_BASE = 'https://timeliner-proxy.thortristanjd.workers.dev/?url=';

// Sound Manager Class
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

  // Navigation handlers
  const handleHostGame = useCallback(async () => {
    setGameState(prev => ({ ...prev, phase: 'hostLobby' }));
    // We'll prompt for host name in the lobby component
  }, []);

  const handleJoinGame = useCallback(() => {
    setGameState(prev => ({ ...prev, phase: 'mobileJoin' }));
  }, []);

  const handleBackToMenu = useCallback(() => {
    leaveRoom();
    setGameState(prev => ({ ...prev, phase: 'menu' }));
  }, [leaveRoom]);

  // Lobby handlers
  const handleJoinLobby = useCallback(async (lobbyCode: string, playerName: string) => {
    const success = await joinRoom(lobbyCode, playerName);
    if (success) {
      setGameState(prev => ({ ...prev, phase: 'mobileLobby' }));
    }
  }, [joinRoom]);

  const handleUpdatePlayer = useCallback(async (name: string, color: string) => {
    await updatePlayer(name, color);
  }, [updatePlayer]);

  const handleStartGame = useCallback(async () => {
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
    setGameState(prev => ({ ...prev, phase: 'playing' }));

    toast({
      title: "Game Started!",
      description: "Let the timeline battle begin!",
    });
  }, [players.length, customSongs, updateRoomSongs, startGame, toast]);

  // Handle room phase changes
  useEffect(() => {
    if (room?.phase === 'playing' && gameState.phase !== 'playing') {
      setGameState(prev => ({ ...prev, phase: 'playing' }));
    }
  }, [room?.phase, gameState.phase]);

  // Render based on current phase
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
        return (
          <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-4">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-4">Game In Progress</h1>
              <p className="mb-4">Players: {players.map(p => p.name).join(', ')}</p>
              <p className="mb-4">Room: {room?.lobby_code}</p>
              <p>Game implementation coming next...</p>
              <Button 
                onClick={handleBackToMenu}
                className="mt-4 bg-red-500 hover:bg-red-600"
              >
                End Game
              </Button>
            </div>
          </div>
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

  return renderCurrentPhase();
};

export default Index;