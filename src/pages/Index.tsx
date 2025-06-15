
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

const timelineColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#FFB6C1', '#87CEEB', '#DDA0DD', '#F0E68C'
];

export type { Song, Player };
export { timelineColors };

import PlayerJoinForm from "@/components/PlayerJoinForm";
import PlayerTimeline from "@/components/PlayerTimeline";
import SidePlayersStack from "@/components/SidePlayersStack";

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
    throwingCard: null
  });

  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<{ playerId: string; position: number } | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // New state to track actual insertion position for ghost rendering
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

  const joinLobby = (name: string, timelineColor: string) => {
    if (!name.trim()) return;
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name,
      color: playerColors[gameState.players.length % playerColors.length],
      timelineColor,
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

    // Create pending placement for confirmation
    setGameState((prev) => ({
      ...prev,
      pendingPlacement: { playerId, song: draggedSong, position },
    }));

    setDraggedSong(null);
    setDragOverPosition(null);
    setActiveDrag(null);
  };

  const confirmPlacement = () => {
    if (!gameState.pendingPlacement) return;

    const { playerId, song, position } = gameState.pendingPlacement;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    const isCorrect = checkPlacementCorrectness(player.timeline, song, position);

    setGameState(prev => {
      const updatedPlayers = prev.players.map(p => {
        if (p.id === playerId) {
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

      if (isCorrect) {
        return {
          ...prev,
          players: updatedPlayers,
          currentTurn: (prev.currentTurn + 1) % prev.players.length,
          currentSong: mockSongs[Math.floor(Math.random() * mockSongs.length)],
          pendingPlacement: null,
          phase: winner ? 'finished' : 'playing',
          winner
        };
      } else {
        return {
          ...prev,
          players: updatedPlayers,
          throwingCard: { playerId, song, position },
          pendingPlacement: null,
          currentTurn: (prev.currentTurn + 1) % prev.players.length,
          currentSong: mockSongs[Math.floor(Math.random() * mockSongs.length)]
        };
      }
    });
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
      <div className={cn("min-h-screen w-full flex relative overflow-hidden", themeClasses)}>
        {/* Subtle animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
        </div>

        {/* Side stacks */}
        <div className="hidden md:flex w-32 relative z-10">
          <SidePlayersStack players={gameState.players} currentId={currentPlayer.id} isDarkMode={true}/>
        </div>
        
        {/* Main timeline */}
        <div className="flex-1 flex flex-col justify-center items-center relative z-10">
          {/* Modern header */}
          <div className="rounded-2xl p-4 mb-6 shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Music className="h-6 w-6 text-purple-400 animate-pulse" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Timeline Tunes</h1>
                <Button
                  onClick={toggleDarkMode}
                  variant="outline"
                  size="sm"
                  className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20"
                >
                  {gameState.isDarkMode ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-purple-400" />}
                </Button>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-sm text-purple-300">Now Playing</div>
                  <div className="font-bold text-white" style={{ color: currentPlayer?.timelineColor }}>
                    {currentPlayer?.name}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-purple-300">Time Left</div>
                  <div className="font-bold text-lg text-white">{gameState.timeLeft}s</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Current Song Card */}
          {gameState.currentSong && (
            <Card className="p-6 mb-6 shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div 
                    className={cn(
                      "w-32 h-32 bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-600 rounded-xl shadow-2xl cursor-move flex flex-col items-center justify-center p-4 text-white relative transition-all duration-300 group",
                      draggedSong ? "animate-pulse scale-110 rotate-3" : "hover:scale-105 hover:rotate-2"
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                    draggable
                    onDragStart={() => handleDragStart(gameState.currentSong!)}
                    onMouseEnter={() => setHoveredCard('mystery-song')}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent"></div>
                    <Music className={cn("h-8 w-8 mb-2 relative z-10 transition-transform duration-300", 
                      hoveredCard === 'mystery-song' ? "animate-bounce scale-110" : "",
                      draggedSong ? "animate-spin" : "")} />
                    <div className="text-center relative z-10">
                      <div className="text-sm font-bold opacity-90">Mystery Track</div>
                      <div className="text-3xl font-black">?</div>
                      <div className="text-xs italic opacity-75 animate-pulse">Drag to timeline</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-white">
                    🎵 Mystery Song is Playing...
                  </h3>
                  <p className="mb-2 text-purple-200">Listen carefully and guess when this song was released!</p>
                  <p className="text-sm text-purple-300">Drag the card to your timeline in chronological order</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <Progress value={(30 - gameState.timeLeft) / 30 * 100} className="w-24 mb-2" />
                    <Button
                      onClick={gameState.isPlaying ? pausePreview : playPreview}
                      size="lg"
                      className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-xl"
                    >
                      {gameState.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Timeline */}
          <PlayerTimeline
            player={currentPlayer}
            isCurrent={true}
            isDarkMode={true}
            draggedSong={draggedSong}
            activeDrag={activeDrag}
            hoveredCard={hoveredCard}
            pendingPlacement={gameState.pendingPlacement}
            throwingCard={gameState.throwingCard}
            confirmPlacement={confirmPlacement}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            setHoveredCard={setHoveredCard}
            currentPlayerId={currentPlayer.id}
          />
        </div>
        
        {/* Right stacks for mobile */}
        <div className="md:hidden w-full flex justify-center gap-1 mt-6 relative z-10">
          <SidePlayersStack players={gameState.players} currentId={currentPlayer.id} isDarkMode={true}/>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
