
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Users, Clock, Trophy, Music, Check, X, Moon, Sun, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Song {
  deezer_artist: string;
  deezer_title: string;
  deezer_album: string;
  preview_url: string;
  release_year: string;
  genre: string;
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

  // Auto-remove throwing card after animation
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

  const startGame = () => {
    if (gameState.players.length < 2) return;
    
    const playersWithStartingSongs = gameState.players.map(player => ({
      ...player,
      timeline: [mockSongs[Math.floor(Math.random() * mockSongs.length)]]
    }));

    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      players: playersWithStartingSongs,
      currentSong: mockSongs[Math.floor(Math.random() * mockSongs.length)]
    }));
  };

  const playPreview = () => {
    if (!gameState.currentSong) return;
    
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

    // Show confirmation
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

    // Show result animation
    setGameState(prev => ({
      ...prev,
      cardResult: { correct: isCorrect, song },
      confirmingPlacement: null
    }));

    // After animation, update timeline
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
          currentSong: mockSongs[Math.floor(Math.random() * mockSongs.length)],
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
        {/* Animated background elements */}
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
        {/* Celebration confetti effect */}
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
        
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%),
                             repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 10px)`
          }} />
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Header - Fixed at top */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl p-3 shadow-2xl">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-purple-400 animate-pulse" />
                <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Timeline Tunes
                </span>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-purple-300">Now Playing</div>
                <div className="font-bold text-white text-sm" style={{ color: currentPlayer?.timelineColor }}>
                  {currentPlayer?.name}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-purple-300">Time</div>
                <div className="font-bold text-white">{gameState.timeLeft}s</div>
              </div>
            </div>
          </div>
        </div>

        {/* Central Play Area */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="text-center">
            {/* Current Song Card */}
            {gameState.currentSong && (
              <div className="mb-4">
                <div 
                  className={cn(
                    "w-32 h-40 rounded-2xl shadow-2xl cursor-move flex flex-col items-center justify-center p-4 text-white relative transition-all duration-300 mx-auto",
                    draggedSong ? "animate-pulse scale-110 rotate-3" : "hover:scale-105 hover:rotate-2"
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${getRandomCardColor()}, ${getRandomCardColor()}dd)`,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                  draggable
                  onDragStart={() => handleDragStart(gameState.currentSong!)}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent"></div>
                  <Music className={cn("h-8 w-8 mb-3 relative z-10 transition-transform duration-300", 
                    draggedSong ? "animate-spin" : "animate-bounce")} />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold opacity-90">Mystery Track</div>
                    <div className="text-3xl font-black">?</div>
                    <div className="text-xs italic opacity-75">Drag to place</div>
                  </div>
                </div>
              </div>
            )}

            {/* Play Controls */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <Progress value={(30 - gameState.timeLeft) / 30 * 100} className="w-24 h-2" />
              <Button
                onClick={gameState.isPlaying ? pausePreview : playPreview}
                size="sm"
                className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-xl w-12 h-12"
              >
                {gameState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>

            {/* Current Player's Timeline */}
            <div className="max-w-4xl">
              <PlayerTimeline
                player={currentPlayer}
                isCurrent={true}
                isDarkMode={true}
                draggedSong={draggedSong}
                activeDrag={activeDrag}
                hoveredCard={hoveredCard}
                throwingCard={gameState.throwingCard}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                setHoveredCard={setHoveredCard}
                currentPlayerId={currentPlayer.id}
              />
            </div>
          </div>
        </div>

        {/* Players arranged in circle */}
        <CircularPlayersLayout 
          players={gameState.players}
          currentPlayerId={currentPlayer.id}
          isDarkMode={true}
        />

        {/* Confirmation Modal */}
        {gameState.confirmingPlacement && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 text-center max-w-md mx-4 shadow-2xl">
              <div className="mb-6">
                <div 
                  className="w-24 h-32 mx-auto rounded-xl shadow-xl flex flex-col items-center justify-center p-3 text-white mb-4"
                  style={{
                    background: `linear-gradient(135deg, ${getRandomCardColor()}, ${getRandomCardColor()}dd)`
                  }}
                >
                  <div className="text-xs font-bold text-white/90 truncate w-full text-center">
                    {gameState.confirmingPlacement.song.deezer_artist}
                  </div>
                  <div className="text-xl font-black text-white my-1">
                    {gameState.confirmingPlacement.song.release_year}
                  </div>
                  <div className="text-xs italic text-white/75 truncate w-full text-center">
                    {gameState.confirmingPlacement.song.deezer_title}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Confirm Placement</h3>
                <p className="text-purple-200">Place this card at position {gameState.confirmingPlacement.position + 1}?</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={confirmPlacement}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-xl"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
                <Button 
                  onClick={cancelPlacement}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-bold px-6 py-2 rounded-xl"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Result Animation */}
        {gameState.cardResult && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={cn(
              "text-center animate-bounce",
              gameState.cardResult.correct ? "text-green-400" : "text-red-400"
            )}>
              <div className="text-8xl mb-4">
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
