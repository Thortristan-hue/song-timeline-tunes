import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Users, Clock, Trophy, Music, Check, X, Moon, Sun, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadSongsFromJson } from "@/utils/songLoader";

interface Song {
  deezer_artist: string;
  deezer_title: string;
  deezer_album: string;
  preview_url: string;
  release_year: string;
  genre: string;
  cardColor?: string;
}

interface Player {
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
  isPlaying: boolean;
  timeLeft: number;
  hostId: string;
  winner: Player | null;
  pendingPlacement: { playerId: string; song: Song; position: number } | null;
  isDarkMode: boolean;
  throwingCard: { song: Song; playerId: string; position: number } | null;
  confirmingPlacement: { song: Song; position: number } | null;
  cardResult: { correct: boolean; song: Song } | null;
  transitioningTurn: boolean;
}

const mockSongs: Song[] = [
  {
    deezer_artist: "The Beatles",
    deezer_title: "Hey Jude",
    deezer_album: "Hey Jude",
    preview_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    release_year: "1968",
    genre: "Rock"
  },
  {
    deezer_artist: "Queen",
    deezer_title: "Bohemian Rhapsody",
    deezer_album: "A Night at the Opera",
    preview_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    release_year: "1975",
    genre: "Rock"
  },
  {
    deezer_artist: "Michael Jackson",
    deezer_title: "Billie Jean",
    deezer_album: "Thriller",
    preview_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    release_year: "1983",
    genre: "Pop"
  },
  {
    deezer_artist: "Madonna",
    deezer_title: "Like a Virgin",
    deezer_album: "Like a Virgin",
    preview_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    release_year: "1984",
    genre: "Pop"
  },
  {
    deezer_artist: "Nirvana",
    deezer_title: "Smells Like Teen Spirit",
    deezer_album: "Nevermind",
    preview_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    release_year: "1991",
    genre: "Grunge"
  }
];

const playerColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

// Random vibrant colors for cards
const getRandomCardColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', 
    '#BB8FCE', '#85C1E9', '#FFB6C1', '#87CEEB', '#DDA0DD', '#F0E68C',
    '#FF9999', '#66CDAA', '#87CEFA', '#DEB887', '#F0A0A0', '#B0E0E6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Filter songs to only include those with release year and preview URL
const filterValidSongs = (songs: Song[]): Song[] => {
  return songs.filter(song => 
    song.release_year && 
    song.release_year !== "Unknown" && 
    song.preview_url && 
    song.preview_url.trim() !== ""
  );
};

// Assign persistent color to song if it doesn't have one
const assignCardColor = (song: Song): Song => {
  if (!song.cardColor) {
    return { ...song, cardColor: getRandomCardColor() };
  }
  return song;
};

export type { Song, Player };

import PlayerJoinForm from "@/components/PlayerJoinForm";
import PlayerTimeline from "@/components/PlayerTimeline";
import CircularPlayersLayout from "@/components/CircularPlayersLayout";

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    players: [],
    currentTurn: 0,
    currentSong: null,
    isPlaying: false,
    timeLeft: 30,
    hostId: 'host-1',
    winner: null,
    pendingPlacement: null,
    isDarkMode: false,
    throwingCard: null,
    confirmingPlacement: null,
    cardResult: null,
    transitioningTurn: false
  });

  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<{ playerId: string; position: number } | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [customSongs, setCustomSongs] = useState<Song[]>(filterValidSongs(mockSongs));
  const [audioRetryCount, setAudioRetryCount] = useState(0);
  const [placedCardPosition, setPlacedCardPosition] = useState<number | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);

  const [activeDrag, setActiveDrag] = useState<{
    playerId: string;
    position: number;
    song: Song | null;
  } | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.isPlaying && gameState.timeLeft > 0) {
      interval = setInterval(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (gameState.timeLeft === 0) {
      setGameState(prev => ({ ...prev, isPlaying: false }));
      if (audio) {
        audio.pause();
      }
    }
    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.timeLeft, audio]);

  useEffect(() => {
    if (gameState.throwingCard) {
      const timeout = setTimeout(() => {
        setGameState(prev => ({ ...prev, throwingCard: null }));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [gameState.throwingCard]);

  // Stop audio when new song is generated
  useEffect(() => {
    if (audio && gameState.currentSong) {
      audio.pause();
      setGameState(prev => ({ ...prev, isPlaying: false }));
      setAudioRetryCount(0); // Reset retry count for new song
    }
  }, [gameState.currentSong?.deezer_title, gameState.currentSong?.deezer_artist]);

  // Smooth transition progress tracking
  useEffect(() => {
    if (gameState.transitioningTurn) {
      setTransitionProgress(0);
      const startTime = Date.now();
      const duration = 1200;
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setTransitionProgress(progress);
        
        if (progress < 1) {
          requestAnimationFrame(updateProgress);
        }
      };
      
      requestAnimationFrame(updateProgress);
    }
  }, [gameState.transitioningTurn]);

  // Card result auto-clear
  useEffect(() => {
    if (gameState.cardResult) {
      const timeout = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          cardResult: null,
          transitioningTurn: true
        }));

        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            currentTurn: (prev.currentTurn + 1) % prev.players.length,
            currentSong: assignCardColor(customSongs[Math.floor(Math.random() * customSongs.length)]),
            timeLeft: 30,
            transitioningTurn: false
          }));
          setTransitionProgress(0);
        }, 1200);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [gameState.cardResult, customSongs]);

  const toggleDarkMode = () => {
    setGameState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const joinLobby = (name: string) => {
    if (!name.trim()) return;
    
    // Enforce 6 player maximum
    if (gameState.players.length >= 6) {
      console.log("Maximum 6 players allowed");
      return;
    }
    
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name,
      color: playerColors[gameState.players.length % playerColors.length],
      timelineColor: getRandomCardColor(),
      score: 0,
      timeline: []
    };
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/json") {
      try {
        const songs = await loadSongsFromJson(file);
        // Filter valid songs and assign colors
        const validSongs = filterValidSongs(songs);
        const songsWithColors = validSongs.map(assignCardColor);
        setCustomSongs(songsWithColors);
        console.log(`Loaded ${songsWithColors.length} valid songs from JSON file`);
      } catch (error) {
        console.error("Error loading songs:", error);
      }
    }
  };

  const startGame = () => {
    if (gameState.players.length < 2) return;
    
    const validSongs = filterValidSongs(customSongs);
    if (validSongs.length === 0) {
      console.error("No valid songs available");
      return;
    }
    
    const playersWithStartingSongs = gameState.players.map(player => ({
      ...player,
      timeline: [assignCardColor(validSongs[Math.floor(Math.random() * validSongs.length)])]
    }));

    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      players: playersWithStartingSongs,
      currentSong: assignCardColor(validSongs[Math.floor(Math.random() * validSongs.length)])
    }));
  };

  const createBeepSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
      
      console.log("Fallback beep sound played");
    } catch (e) {
      console.log("Fallback audio also failed");
    }
  };

  const playPreview = async () => {
    if (!gameState.currentSong?.preview_url) {
      console.log("No preview URL available for current song");
      return;
    }
    
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    const tryPlayAudio = async (retryCount: number = 0): Promise<void> => {
      const maxRetries = 10;
      
      try {
        console.log(`Attempting to play preview (attempt ${retryCount + 1}):`, gameState.currentSong.preview_url);
        const newAudio = new Audio();
        
        return new Promise<void>((resolve, reject) => {
          const handleError = async () => {
            console.log(`Audio loading error (attempt ${retryCount + 1}):`, newAudio.error);
            
            if (retryCount < maxRetries) {
              console.log(`Retrying audio load... (${retryCount + 1}/${maxRetries})`);
              setAudioRetryCount(retryCount + 1);
              setTimeout(() => {
                tryPlayAudio(retryCount + 1).then(resolve).catch(reject);
              }, 2000); // Wait 2 seconds before retry
            } else {
              console.log("Max retries reached, using fallback beep");
              createBeepSound();
              resolve();
            }
          };

          const handleLoad = async () => {
            try {
              await newAudio.play();
              setAudio(newAudio);
              setAudioRetryCount(0);
              console.log("Audio playing successfully");
              resolve();
            } catch (playError) {
              console.log("Play error:", playError);
              handleError();
            }
          };

          newAudio.addEventListener('error', handleError);
          newAudio.addEventListener('canplaythrough', handleLoad);
          
          newAudio.src = gameState.currentSong.preview_url;
          newAudio.volume = 0.5;
          newAudio.crossOrigin = "anonymous";
          newAudio.load();
        });
      } catch (error) {
        console.error("Error in tryPlayAudio:", error);
        if (retryCount < maxRetries) {
          setTimeout(() => {
            tryPlayAudio(retryCount + 1);
          }, 2000);
        } else {
          createBeepSound();
        }
      }
    };

    try {
      await tryPlayAudio(audioRetryCount);
      setGameState(prev => ({ 
        ...prev, 
        isPlaying: true, 
        timeLeft: 30 
      }));
    } catch (error) {
      console.error("Final error playing audio:", error);
      setGameState(prev => ({ 
        ...prev, 
        isPlaying: true, 
        timeLeft: 30 
      }));
    }
  };

  const pausePreview = () => {
    if (audio) {
      audio.pause();
    }
    setGameState(prev => ({ ...prev, isPlaying: false }));
  };

  const handleDragStart = (song: Song) => {
    setDraggedSong(song);
    setActiveDrag(null);
  };

  const handleDragOver = (
    e: React.DragEvent,
    playerId: string,
    position: number
  ) => {
    e.preventDefault();
    const currentPlayer = getCurrentPlayer();
    if (!draggedSong || currentPlayer?.id !== playerId) return;

    setDragOverPosition({ playerId, position });
    setActiveDrag({ playerId, position, song: draggedSong });
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
    setActiveDrag(null);
  };

  const handleDrop = (playerId: string, position: number) => {
    if (!draggedSong) return;

    const currentPlayer = getCurrentPlayer();
    if (currentPlayer?.id !== playerId) return;

    // First place the card in the timeline
    const newTimeline = [...currentPlayer.timeline];
    newTimeline.splice(position, 0, draggedSong);
    
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === currentPlayer.id 
          ? { ...p, timeline: newTimeline }
          : p
      )
    }));

    // Set the placed card position and show confirmation
    setPlacedCardPosition(position);
    setGameState(prev => ({
      ...prev,
      confirmingPlacement: { song: draggedSong, position }
    }));

    setDraggedSong(null);
    setActiveDrag(null);
  };

  const confirmPlacement = () => {
    if (!gameState.confirmingPlacement) return;

    const { song, position } = gameState.confirmingPlacement;
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;

    const isCorrect = checkPlacementCorrectness(
      currentPlayer.timeline.filter((_, index) => index !== position), 
      song, 
      position
    );

    setGameState(prev => ({
      ...prev,
      cardResult: { correct: isCorrect, song },
      confirmingPlacement: null
    }));

    setPlacedCardPosition(null);

    setTimeout(() => {
      setGameState(prev => {
        const updatedPlayers = prev.players.map(p => {
          if (p.id === currentPlayer.id) {
            if (isCorrect) {
              return { 
                ...p, 
                score: p.score + 1
              };
            } else {
              // Remove the card if incorrect
              const newTimeline = p.timeline.filter((_, index) => index !== position);
              return { 
                ...p, 
                timeline: newTimeline
              };
            }
          }
          return p;
        });

        const winner = updatedPlayers.find(p => p.score >= 10);

        return {
          ...prev,
          players: updatedPlayers,
          phase: winner ? 'finished' : 'playing',
          winner
        };
      });
    }, 2000);
  };

  const cancelPlacement = () => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || placedCardPosition === null) return;

    // Remove the placed card from timeline
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === currentPlayer.id 
          ? { ...p, timeline: p.timeline.filter((_, index) => index !== placedCardPosition) }
          : p
      ),
      confirmingPlacement: null
    }));

    setPlacedCardPosition(null);
  };

  const checkPlacementCorrectness = (timeline: Song[], newSong: Song, position: number): boolean => {
    const newYear = parseInt(newSong.release_year);
    
    if (position > 0) {
      const prevYear = parseInt(timeline[position - 1].release_year);
      if (newYear < prevYear) return false;
    }
    
    if (position < timeline.length) {
      const nextYear = parseInt(timeline[position].release_year);
      if (newYear > nextYear) return false;
    }
    
    return true;
  };

  const getCurrentPlayer = () => gameState.players[gameState.currentTurn];

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  if (gameState.phase === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Enhanced 3D Environmental Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute bottom-0 left-0 right-0 h-3/4 opacity-20"
            style={{
              background: `
                radial-gradient(ellipse at center bottom, rgba(147,51,234,0.4) 0%, transparent 70%),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
              transform: 'perspective(1000px) rotateX(60deg)',
              transformOrigin: 'bottom'
            }}
          />
          
          {/* Ambient particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-300 rounded-full opacity-30"
              style={{
                left: `${20 + (i * 7)}%`,
                top: `${30 + Math.sin(i) * 20}%`,
                animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto relative z-10 pt-20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Music className="h-16 w-16 text-purple-400" />
                <div className="absolute inset-0 h-16 w-16 text-purple-400 opacity-20">
                  <Music className="h-16 w-16" />
                </div>
              </div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                Timeline Tunes
              </h1>
              <Button
                onClick={toggleDarkMode}
                variant="outline"
                size="sm"
                className="ml-4 backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                {gameState.isDarkMode ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-purple-400" />}
              </Button>
            </div>
            <p className="text-xl mb-8 text-purple-200/80 font-medium">
              Place songs in chronological order • Feel the rhythm of time ✨
            </p>
          </div>

          <Card className="p-8 shadow-2xl rounded-3xl bg-black/30 backdrop-blur-xl border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-white">Join the Vibe</h3>
                <PlayerJoinForm onJoin={joinLobby} isDarkMode={true}/>
                
                <div className="mt-6">
                  <label htmlFor="songFile" className="block text-sm font-medium text-white mb-2">
                    Upload Songs (JSON)
                  </label>
                  <input
                    id="songFile"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                  />
                  <p className="text-xs text-purple-200 mt-1">
                    Loaded {customSongs.length} valid songs
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 text-white">Players in the Mix</h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {gameState.players.map((player, index) => (
                    <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-white/20">
                      <div 
                        className="w-5 h-5 rounded-full shadow-lg ring-2 ring-white/30" 
                        style={{ backgroundColor: player.timelineColor }}
                      />
                      <span className="font-medium text-white">{player.name}</span>
                      {index === 0 && <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold">Host</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {gameState.players.length >= 2 && (
              <div className="text-center mt-8">
                <Button 
                  onClick={startGame} 
                  size="lg" 
                  className="px-12 py-4 text-lg rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl font-bold"
                >
                  Start the Music 🎵
                </Button>
              </div>
            )}
          </Card>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </div>
    );
  }

  if (gameState.phase === 'finished' && gameState.winner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Enhanced 3D Environmental Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute bottom-0 left-0 right-0 h-3/4 opacity-20"
            style={{
              background: `
                radial-gradient(ellipse at center bottom, rgba(147,51,234,0.4) 0%, transparent 70%),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
              transform: 'perspective(1000px) rotateX(60deg)',
              transformOrigin: 'bottom'
            }}
          />
          
          {/* Celebration particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `celebration ${1 + Math.random()}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 pt-20">
          <div className="mb-12">
            <div className="relative mb-6">
              <Trophy className="h-32 w-32 text-yellow-300 mx-auto" />
              <div className="absolute inset-0 h-32 w-32 text-yellow-300 opacity-30 mx-auto">
                <Trophy className="h-32 w-32" />
              </div>
            </div>
            <h1 className="text-7xl font-black text-white mb-4 drop-shadow-lg">LEGENDARY!</h1>
            <h2 className="text-5xl font-bold text-yellow-100 mb-6 drop-shadow-md">
              🎉 {gameState.winner.name} Mastered Time! 🎉
            </h2>
            <p className="text-2xl text-white/90 font-medium">
              Perfect chronological harmony achieved ✨
            </p>
          </div>

          <Card className="p-8 bg-black/30 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">
            <h3 className="text-3xl font-bold mb-6 text-white">Final Harmony</h3>
            <div className="space-y-4">
              {gameState.players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black text-white/60">#{index + 1}</span>
                      <div 
                        className="w-8 h-8 rounded-full shadow-lg ring-2 ring-white/50" 
                        style={{ backgroundColor: player.timelineColor }}
                      />
                      <span className="text-xl font-bold text-white">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Trophy className="h-6 w-6 text-yellow-400" />
                      <span className="text-2xl font-black text-white">{player.score}/10</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        <style jsx>{`
          @keyframes celebration {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
        `}</style>
      </div>
    );
  }

  if (gameState.phase === "playing") {
    const currentPlayer = getCurrentPlayer();
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Enhanced 3D Environmental Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute bottom-0 left-0 right-0 h-3/4 opacity-20"
            style={{
              background: `
                radial-gradient(ellipse at center bottom, rgba(147,51,234,0.4) 0%, transparent 70%),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
              transform: 'perspective(1000px) rotateX(60deg)',
              transformOrigin: 'bottom',
              transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          
          {/* Ambient particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-300 rounded-full opacity-30"
              style={{
                left: `${20 + (i * 7)}%`,
                top: `${30 + Math.sin(i) * 20}%`,
                animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>

        {/* Game HUD - Top bar */}
        <div className="absolute top-6 left-6 right-6 z-40">
          <div className="flex justify-between items-center">
            {/* Timer and Controls */}
            <div className="flex items-center gap-4">
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <div className="flex items-center gap-3 text-white">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono text-lg font-bold">{gameState.timeLeft}s</span>
                </div>
              </div>
              <Button
                onClick={gameState.isPlaying ? pausePreview : playPreview}
                className="rounded-full bg-purple-600 hover:bg-purple-700 w-12 h-12 shadow-lg transition-all duration-300 hover:scale-110"
              >
                {gameState.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              {audioRetryCount > 0 && (
                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                  <span className="text-xs text-yellow-300">
                    Retrying audio... ({audioRetryCount}/10)
                  </span>
                </div>
              )}
            </div>

            {/* Current Player Info */}
            <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
              <div className="flex items-center gap-3 text-white">
                <div 
                  className="w-4 h-4 rounded-full ring-2 ring-white/50" 
                  style={{ backgroundColor: currentPlayer?.color }}
                />
                <span className="font-semibold">{currentPlayer?.name}'s Turn</span>
                <Badge className="bg-purple-600 text-white">
                  {currentPlayer?.score}/10
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Mystery Card */}
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
          {gameState.currentSong && (
            <div 
              className="w-40 h-40 rounded-xl shadow-2xl cursor-move flex flex-col items-center justify-center p-4 text-white relative transition-all duration-500 group"
              style={{
                backgroundColor: gameState.currentSong.cardColor || '#6366f1',
                transform: draggedSong ? 'scale(0.8) rotate(5deg)' : 'scale(1) rotate(0deg)',
                animation: 'mysteryFloat 4s ease-in-out infinite',
                opacity: gameState.transitioningTurn ? 0.7 : 1,
                filter: gameState.transitioningTurn ? 'blur(2px)' : 'blur(0px)'
              }}
              draggable
              onDragStart={() => handleDragStart(gameState.currentSong!)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
              <Music className="h-16 w-16 mb-3 opacity-80" />
              <div className="text-center">
                <div className="text-sm font-bold opacity-90 mb-1">Mystery Song</div>
                <div className="text-5xl font-black mb-2">?</div>
                <div className="text-xs italic opacity-75">Drag to timeline</div>
              </div>
              
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          )}
        </div>

        {/* Current Player's Timeline */}
        <PlayerTimeline
          player={currentPlayer}
          isCurrent={true}
          isDarkMode={true}
          draggedSong={draggedSong}
          activeDrag={activeDrag}
          hoveredCard={hoveredCard}
          throwingCard={gameState.throwingCard}
          confirmingPlacement={gameState.confirmingPlacement}
          placedCardPosition={placedCardPosition}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          setHoveredCard={setHoveredCard}
          currentPlayerId={currentPlayer?.id}
          confirmPlacement={confirmPlacement}
          cancelPlacement={cancelPlacement}
        />

        {/* Other players */}
        <CircularPlayersLayout 
          players={gameState.players}
          currentPlayerId={currentPlayer?.id}
          isDarkMode={true}
        />

        {/* Placement Confirmation */}
        {gameState.confirmingPlacement && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30">
            <div className="flex gap-3 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-2xl">
              <Button
                onClick={confirmPlacement}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 py-2 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm
              </Button>
              <Button
                onClick={cancelPlacement}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 rounded-xl px-6 py-2 transition-all duration-300 hover:scale-105"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Result Animation */}
        {gameState.cardResult && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50">
            <div 
              className="text-center transform transition-all duration-1000"
              style={{
                animation: 'resultPop 2s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
              }}
            >
              <div className={`text-9xl mb-6 ${gameState.cardResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                {gameState.cardResult.correct ? '✓' : '✗'}
              </div>
              <div className="text-5xl font-bold text-white mb-4">
                {gameState.cardResult.correct ? 'PERFECT!' : 'NOT QUITE!'}
              </div>
              <div className="text-xl text-white/80">
                {gameState.cardResult.song.deezer_title} • {gameState.cardResult.song.release_year}
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes mysteryFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-10px) rotate(2deg); }
            50% { transform: translateY(-5px) rotate(-1deg); }
            75% { transform: translateY(-15px) rotate(1deg); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes resultPop {
            0% { 
              transform: scale(0) rotate(180deg); 
              opacity: 0; 
              filter: blur(10px);
            }
            50% { 
              transform: scale(1.2) rotate(0deg); 
              opacity: 1; 
              filter: blur(2px);
            }
            100% { 
              transform: scale(1) rotate(0deg); 
              opacity: 1; 
              filter: blur(0px);
            }
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default Index;
