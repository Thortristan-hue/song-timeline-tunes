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

const playerColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const getRandomCardColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', 
    '#BB8FCE', '#85C1E9', '#FFB6C1', '#87CEEB', '#DDA0DD', '#F0E68C',
    '#FF9999', '#66CDAA', '#87CEFA', '#DEB887', '#F0A0A0', '#B0E0E6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const generateLobbyCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

interface GameState {
  phase: 'menu' | 'hostLobby' | 'mobileJoin' | 'mobileLobby' | 'playing' | 'finished';
  players: Player[];
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
  hostId: string;
  pendingPlacement: { playerId: string; song: Song; position: number } | null;
  lobbyCode: string;
  playerRole: 'host' | 'mobile' | null;
  currentPlayerId: string | null;
}

const Index = () => {
  const { toast } = useToast();
  const soundManager = useRef<SoundManager>(new SoundManager());
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'menu',
    players: [],
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
    hostId: 'host-1',
    pendingPlacement: null,
    lobbyCode: '',
    playerRole: null,
    currentPlayerId: null
  });

  // Navigation handlers
  const handleHostGame = () => {
    const lobbyCode = generateLobbyCode();
    setGameState(prev => ({
      ...prev,
      phase: 'hostLobby',
      playerRole: 'host',
      lobbyCode
    }));
  };

  const handleJoinGame = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'mobileJoin',
      playerRole: 'mobile'
    }));
  };

  const handleBackToMenu = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'menu',
      playerRole: null,
      players: [],
      lobbyCode: '',
      currentPlayerId: null
    }));
  };

  // Lobby handlers
  const handleJoinLobby = (lobbyCode: string, playerName: string) => {
    // In a real implementation, this would communicate with a server
    // For now, we'll simulate joining a lobby
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: playerName,
      color: playerColors[0],
      timelineColor: playerColors[0],
      score: 0,
      timeline: []
    };

    setGameState(prev => ({
      ...prev,
      phase: 'mobileLobby',
      currentPlayerId: newPlayer.id,
      players: [...prev.players, newPlayer]
    }));

    toast({
      title: "Joined lobby!",
      description: `Connected to lobby ${lobbyCode}`,
    });
  };

  const handleUpdatePlayer = (name: string, color: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player => 
        player.id === prev.currentPlayerId 
          ? { ...player, name, color, timelineColor: color }
          : player
      )
    }));
  };

  const handleStartGame = () => {
    if (gameState.players.length === 0 || customSongs.length === 0) return;
    
    // Initialize game state for multiplayer
    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      currentTurn: 0
    }));

    toast({
      title: "Game Started!",
      description: "Let the timeline battle begin!",
    });
  };

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
            lobbyCode={gameState.lobbyCode}
            players={gameState.players}
            onStartGame={handleStartGame}
            onBackToMenu={handleBackToMenu}
            setCustomSongs={setCustomSongs}
          />
        );

      case 'mobileJoin':
        return (
          <MobileJoin
            onJoinLobby={handleJoinLobby}
            onBackToMenu={handleBackToMenu}
          />
        );

      case 'mobileLobby':
        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
        if (!currentPlayer) return null;
        
        return (
          <MobilePlayerLobby
            player={currentPlayer}
            lobbyCode={gameState.lobbyCode}
            onUpdatePlayer={handleUpdatePlayer}
          />
        );

      case 'playing':
        // This will need to be implemented with the actual game logic
        return (
          <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-4">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-4">Game In Progress</h1>
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
            players={gameState.players}
          />
        );

      default:
        return null;
    }
  };

  return renderCurrentPhase();
};

export default Index;
