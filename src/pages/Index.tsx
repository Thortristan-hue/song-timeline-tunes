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
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { loadSongsFromJson } from "@/utils/songLoader";
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

// Types
export interface Song {
  id: string;
  deezer_title: string;
  deezer_artist: string;
  deezer_album: string;
  release_year: string;
  genre: string;
  cardColor: string;
  preview_url?: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  timelineColor: string;
  score: number;
  timeline: Song[];
}

interface GameState {
  phase: 'lobby' | 'playing' | 'finished';
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

const filterValidSongs = (songs: Song[]): Song[] => {
  return songs.filter(song => 
    song.release_year && 
    song.release_year !== "Unknown" && 
    song.preview_url && 
    song.preview_url.trim() !== ""
  );
};

const assignCardColor = (song: Song): Song => {
  if (!song.cardColor) {
    return { ...song, cardColor: getRandomCardColor() };
  }
  return song;
};

const Index = () => {
  const { toast } = useToast();
  const soundManager = useRef<SoundManager>(new SoundManager());
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
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
    pendingPlacement: null
  });

  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [audioRetryCount, setAudioRetryCount] = useState(0);
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<{
    playerId: string;
    position: number;
    song: Song | null;
  } | null>(null);
  const [placedCardPosition, setPlacedCardPosition] = useState<number | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [showPlaylistLoader, setShowPlaylistLoader] = useState(false);

  // Initialize background music
  useEffect(() => {
    if (gameState.phase === 'playing') {
      soundManager.current.playBgMusic();
    } else {
      soundManager.current.pauseBgMusic();
    }
  }, [gameState.phase]);

  // Audio handling for preview
  useEffect(() => {
    if (gameState.currentSong?.preview_url && !audio) {
      const newAudio = new Audio(gameState.currentSong.preview_url);
      newAudio.addEventListener('ended', () => {
        setGameState(prev => ({ ...prev, isPlaying: false }));
      });
      
      newAudio.addEventListener('error', () => {
        if (audioRetryCount < 10) {
          setAudioRetryCount(prev => prev + 1);
          setTimeout(() => {
            newAudio.load();
            if (gameState.isPlaying) newAudio.play();
          }, 1000);
        } else {
          toast({
            title: "Audio Error",
            description: "Failed to load song preview. Please try another song.",
            variant: "destructive"
          });
          setGameState(prev => ({ ...prev, isPlaying: false }));
        }
      });
      
      setAudio(newAudio);
    }
    
    return () => {
      if (audio) {
        audio.pause();
        audio.remove();
      }
    };
  }, [gameState.currentSong?.preview_url]);

  // Timer effect
  useEffect(() => {
    let interval: number;
    if (gameState.phase === 'playing' && gameState.timeLeft > 0) {
      interval = window.setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 5) {
            soundManager.current.playSound('tick', 0.4);
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else if (gameState.timeLeft === 0) {
      setGameState(prev => ({ ...prev, isPlaying: false }));
      if (audio) {
        audio.pause();
      }
    }
    return () => window.clearInterval(interval);
  }, [gameState.phase, gameState.timeLeft, audio]);

  // Rest of your component code...
  // [Keep all your existing handler functions and JSX as is]

  return (
    <>
      {gameState.phase === 'lobby' && (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
          {/* Lobby UI */}
        </div>
      )}

      {gameState.phase === 'finished' && gameState.winner && (
        <VictoryScreen 
          winner={gameState.winner}
          players={gameState.players}
        />
      )}

      {gameState.phase === 'playing' && (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
          {/* Game UI */}
        </div>
      )}
    </>
  );
};

export default Index;