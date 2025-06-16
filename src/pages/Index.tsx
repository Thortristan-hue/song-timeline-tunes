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
  cardColor?: string; // Add persistent color
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
    cardResult: null
  });

  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<{ playerId: string; position: number } | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [customSongs, setCustomSongs] = useState<Song[]>(mockSongs);

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

  const toggleDarkMode = () => {
    setGameState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const joinLobby = (name: string) => {
    if (!name.trim()) return;
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
        // Assign colors to all songs
        const songsWithColors = songs.map(assignCardColor);
        setCustomSongs(songsWithColors);
        console.log(`Loaded ${songs.length} songs from JSON file`);
      } catch (error) {
        console.error("Error loading songs:", error);
      }
    }
  };

  const startGame = () => {
    if (gameState.players.length < 2) return;
    
    const playersWithStartingSongs = gameState.players.map(player => ({
      ...player,
      timeline: [assignCardColor(customSongs[Math.floor(Math.random() * customSongs.length)])]
    }));

    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      players: playersWithStartingSongs,
      currentSong: assignCardColor(customSongs[Math.floor(Math.random() * customSongs.length)])
    }));
  };

  const playPreview = () => {
    if (!gameState.currentSong?.preview_url) return;
    
    if (audio) {
      audio.pause();
    }

    const newAudio = new Audio(gameState.currentSong.preview_url);
    newAudio.volume = 0.5;
    
    newAudio.play().catch(console.error);
    setAudio(newAudio);
    
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      timeLeft: 30 
    }));
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

    const isCorrect = checkPlacementCorrectness(currentPlayer.timeline, song, position);

    setGameState(prev => ({
      ...prev,
      cardResult: { correct: isCorrect, song },
      confirmingPlacement: null
    }));

    setTimeout(() => {
      setGameState(prev => {
        const updatedPlayers = prev.players.map(p => {
          if (p.id === currentPlayer.id) {
            if (isCorrect) {
              const newTimeline = [...p.timeline];
              newTimeline.splice(position, 0, song);
              return { 
                ...p, 
                timeline: newTimeline,
                score: p.score + 1
              };
            }
            return p;
          }
          return p;
        });

        const winner = updatedPlayers.find(p => p.score >= 10);

        return {
          ...prev,
          players: updatedPlayers,
          currentTurn: (prev.currentTurn + 1) % prev.players.length,
          currentSong: assignCardColor(customSongs[Math.floor(Math.random() * customSongs.length)]),
          phase: winner ? 'finished' : 'playing',
          winner,
          cardResult: null
        };
      });
    }, 2000);
  };

  const cancelPlacement = () => {
    setGameState(prev => ({
      ...prev,
      confirmingPlacement: null
    }));
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

  const themeClasses = gameState.isDarkMode 
    ? 'bg-gray-900 text-white' 
    : 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900';

  if (gameState.phase === 'lobby') {
    return (
      <div className={cn("min-h-screen p-8 relative overflow-hidden", gameState.isDarkMode ? "bg-gray-900" : "bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900")}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Music className="h-16 w-16 text-purple-400 animate-bounce" />
                <div className="absolute inset-0 h-16 w-16 text-purple-400 animate-ping opacity-20">
                  <Music className="h-16 w-16" />
                </div>
              </div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-pulse">
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

          <Card className="p-8 shadow-2xl rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
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
                    Loaded {customSongs.length} songs
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
      </div>
    );
  }

  if (gameState.phase === 'finished' && gameState.winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-bounce opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mb-12">
            <div className="relative mb-6">
              <Trophy className="h-32 w-32 text-yellow-300 mx-auto animate-bounce" />
              <div className="absolute inset-0 h-32 w-32 text-yellow-300 animate-ping opacity-30 mx-auto">
                <Trophy className="h-32 w-32" />
              </div>
            </div>
            <h1 className="text-7xl font-black text-white mb-4 animate-pulse drop-shadow-lg">LEGENDARY!</h1>
            <h2 className="text-5xl font-bold text-yellow-100 mb-6 drop-shadow-md">
              🎉 {gameState.winner.name} Mastered Time! 🎉
            </h2>
            <p className="text-2xl text-white/90 font-medium">
              Perfect chronological harmony achieved ✨
            </p>
          </div>

          <Card className="p-8 bg-white/20 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/30">
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
      </div>
    );
  }

  if (gameState.phase === "playing") {
    const currentPlayer = getCurrentPlayer();
    return (
      <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        {/* 3D Floor Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floor grid */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-2/3 opacity-20"
            style={{
              background: `
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              transform: 'perspective(500px) rotateX(60deg)',
              transformOrigin: 'bottom'
            }}
          />
          
          {/* Horizon glow */}
          <div className="absolute bottom-1/3 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/30 to-transparent blur-xl" />
          
          {/* Floating particles */}
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Central floating timeline area */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="text-center">
            {/* Current Song Card */}
            {gameState.currentSong && (
              <div className="mb-8">
                <div 
                  className={cn(
                    "w-40 h-40 rounded-xl shadow-2xl cursor-move flex flex-col items-center justify-center p-4 text-white relative transition-all duration-300 mx-auto group border-2 border-white/20",
                    draggedSong ? "scale-75 opacity-50" : "hover:scale-105 hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:-translate-y-2"
                  )}
                  style={{
                    backgroundColor: gameState.currentSong.cardColor || getRandomCardColor(),
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                  draggable
                  onDragStart={() => handleDragStart(gameState.currentSong!)}
                >
                  <Music className="h-12 w-12 mb-3 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold opacity-90">Mystery Track</div>
                    <div className="text-4xl font-black">?</div>
                    <div className="text-xs italic opacity-75">Drag to place</div>
                  </div>
                </div>
              </div>
            )}

            {/* Play Controls */}
            <div className="flex items-center justify-center gap-6 mb-12">
              <div className="text-white text-lg font-bold bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                {gameState.timeLeft}s
              </div>
              <Button
                onClick={gameState.isPlaying ? pausePreview : playPreview}
                size="lg"
                className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-xl w-20 h-20 hover:scale-110 transition-all duration-200"
              >
                {gameState.isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </Button>
              <div className="text-white text-lg font-bold bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                {currentPlayer?.name}
              </div>
            </div>

            {/* Current Player's Floating Timeline */}
            <div className="max-w-7xl transform perspective-1000" style={{ transform: 'translateZ(50px)' }}>
              <PlayerTimeline
                player={currentPlayer}
                isCurrent={true}
                isDarkMode={true}
                draggedSong={draggedSong}
                activeDrag={activeDrag}
                hoveredCard={hoveredCard}
                throwingCard={gameState.throwingCard}
                confirmingPlacement={gameState.confirmingPlacement}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                setHoveredCard={setHoveredCard}
                currentPlayerId={currentPlayer?.id}
                confirmPlacement={confirmPlacement}
                cancelPlacement={cancelPlacement}
              />
            </div>
          </div>
        </div>

        {/* Other players on the ground in circle */}
        <CircularPlayersLayout 
          players={gameState.players}
          currentPlayerId={currentPlayer?.id}
          isDarkMode={true}
        />

        {/* Result Animation */}
        {gameState.cardResult && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={cn(
              "text-center animate-bounce",
              gameState.cardResult.correct ? "text-green-400" : "text-red-400"
            )}>
              <div className="text-8xl mb-4 animate-pulse">
                {gameState.cardResult.correct ? "✓" : "✗"}
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {gameState.cardResult.correct ? "CORRECT!" : "WRONG!"}
              </div>
              <div className="text-xl text-white/80">
                {gameState.cardResult.song.deezer_title} ({gameState.cardResult.song.release_year})
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default Index;
