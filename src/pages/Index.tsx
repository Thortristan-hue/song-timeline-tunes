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
  phase: 'lobby' | 'customization' | 'playing' | 'finished';
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

  const [playerName, setPlayerName] = useState('');
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

  const joinLobby = () => {
    if (!playerName.trim()) return;
    
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: playerName,
      color: playerColors[gameState.players.length % playerColors.length],
      timelineColor: timelineColors[gameState.players.length % timelineColors.length],
      score: 0,
      timeline: []
    };

    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));
    setPlayerName('');
  };

  const updatePlayerTimelineColor = (playerId: string, color: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === playerId ? { ...p, timelineColor: color } : p
      )
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
    setActiveDrag(null); // start fresh, will be set on drag over
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

    if (isCorrect) {
      setGameState(prev => {
        const updatedPlayers = prev.players.map(p => {
          if (p.id === playerId) {
            const newTimeline = [...p.timeline];
            newTimeline.splice(position, 0, song);
            return { 
              ...p, 
              timeline: newTimeline,
              score: p.score + 1
            };
          }
          return p;
        });

        const winner = updatedPlayers.find(p => p.score >= 10);

        return {
          ...prev,
          players: updatedPlayers,
          currentTurn: (prev.currentTurn + 1) % prev.players.length,
          currentSong: mockSongs[Math.floor(Math.random() * mockSongs.length)],
          pendingPlacement: null,
          phase: winner ? 'finished' : 'playing',
          winner
        };
      });
    } else {
      // Show the card with details then throw it off screen
      setGameState(prev => ({
        ...prev,
        throwingCard: { playerId, song, position },
        pendingPlacement: null,
        currentTurn: (prev.currentTurn + 1) % prev.players.length,
        currentSong: mockSongs[Math.floor(Math.random() * mockSongs.length)]
      }));
    }
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

  const getResponsivePlayerHeight = () => {
    const playerCount = gameState.players.length;
    if (playerCount <= 2) return 'h-auto';
    if (playerCount <= 4) return 'max-h-[calc(100vh-400px)]';
    return 'max-h-[calc(100vh-350px)]';
  };

  const themeClasses = gameState.isDarkMode 
    ? 'bg-gray-900 text-white' 
    : 'bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100';

  if (gameState.phase === 'lobby') {
    return (
      <div className={cn("min-h-screen p-8", gameState.isDarkMode ? "bg-gray-900" : "bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100")}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Music className={cn("h-12 w-12", gameState.isDarkMode ? "text-purple-400" : "text-purple-600")} />
              <h1 className={cn("text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent", 
                gameState.isDarkMode ? "from-purple-400 to-pink-400" : "from-purple-600 to-pink-600")}>
                Timeline Tunes
              </h1>
              <Button
                onClick={toggleDarkMode}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                {gameState.isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
            <p className={cn("text-xl mb-8", gameState.isDarkMode ? "text-gray-300" : "text-gray-600")}>
              Guess the release year and place songs on your timeline!
            </p>
          </div>

          <Card className={cn("p-8 shadow-xl rounded-3xl", 
            gameState.isDarkMode ? "bg-gray-800/90 border-gray-700" : "bg-white/80 backdrop-blur-sm")}>
            <div className="text-center mb-8">
              <h2 className={cn("text-3xl font-bold mb-4", gameState.isDarkMode ? "text-white" : "text-gray-800")}>Game Lobby</h2>
              <div className={cn("flex items-center justify-center gap-2", gameState.isDarkMode ? "text-gray-300" : "text-gray-600")}>
                <Users className="h-5 w-5" />
                <span>{gameState.players.length}/6 players</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className={cn("text-xl font-semibold mb-4", gameState.isDarkMode ? "text-white" : "text-gray-800")}>Join Game</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className={cn("flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
                      gameState.isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200")}
                    onKeyPress={(e) => e.key === 'Enter' && joinLobby()}
                  />
                  <Button onClick={joinLobby} className="px-6 py-3 rounded-xl">
                    Join
                  </Button>
                </div>
              </div>

              <div>
                <h3 className={cn("text-xl font-semibold mb-4", gameState.isDarkMode ? "text-white" : "text-gray-800")}>Players</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {gameState.players.map((player, index) => (
                    <div key={player.id} className={cn("flex items-center gap-3 p-2 rounded-lg", 
                      gameState.isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: player.color }}
                      />
                      <span className={cn("font-medium", gameState.isDarkMode ? "text-white" : "text-gray-800")}>{player.name}</span>
                      {index === 0 && <Badge variant="outline">Host</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {gameState.players.length >= 2 && (
              <div className="text-center mt-8">
                <Button 
                  onClick={() => setGameState(prev => ({ ...prev, phase: 'customization' }))} 
                  size="lg" 
                  className="px-8 py-4 text-lg rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Customize Players
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'customization') {
    return (
      <div className={cn("min-h-screen p-8", gameState.isDarkMode ? "bg-gray-900" : "bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100")}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className={cn("text-4xl font-bold mb-4", gameState.isDarkMode ? "text-white" : "text-gray-800")}>Customize Your Timeline</h1>
            <Button
              onClick={toggleDarkMode}
              variant="outline"
              size="sm"
              className="mb-4"
            >
              {gameState.isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-6">
            {gameState.players.map((player) => (
              <Card key={player.id} className={cn("p-6 shadow-lg", 
                gameState.isDarkMode ? "bg-gray-800/90 border-gray-700" : "bg-white/90 backdrop-blur-sm")}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md" 
                      style={{ backgroundColor: player.color }}
                    />
                    <h3 className={cn("text-xl font-bold", gameState.isDarkMode ? "text-white" : "text-gray-800")}>{player.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className={cn("h-4 w-4", gameState.isDarkMode ? "text-gray-300" : "text-gray-600")} />
                    <span className={cn("text-sm", gameState.isDarkMode ? "text-gray-300" : "text-gray-600")}>Timeline Color</span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {timelineColors.map((color) => (
                    <div
                      key={color}
                      className={cn("w-12 h-12 rounded-lg cursor-pointer border-2 transition-all hover:scale-105",
                        player.timelineColor === color ? "border-white shadow-lg scale-105" : "border-transparent")}
                      style={{ backgroundColor: color }}
                      onClick={() => updatePlayerTimelineColor(player.id, color)}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button 
              onClick={startGame} 
              size="lg" 
              className="px-8 py-4 text-lg rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Start Game
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'finished' && gameState.winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-red-100 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <Trophy className="h-24 w-24 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-6xl font-bold text-yellow-600 mb-4">Game Over!</h1>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              🎉 {gameState.winner.name} Wins! 🎉
            </h2>
            <p className="text-xl text-gray-600">
              Congratulations on completing your timeline!
            </p>
          </div>

          <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl">
            <h3 className="text-2xl font-bold mb-6">Final Scores</h3>
            <div className="space-y-4">
              {gameState.players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                      <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="text-lg font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="text-xl font-bold">{player.score}/10</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'playing') {
    const currentPlayer = getCurrentPlayer();

    return (
      <div className={cn("min-h-screen p-4", themeClasses)}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className={cn("rounded-2xl p-4 mb-4 shadow-lg", 
            gameState.isDarkMode ? "bg-gray-800/90 backdrop-blur-sm" : "bg-white/90 backdrop-blur-sm")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Music className={cn("h-6 w-6", gameState.isDarkMode ? "text-purple-400" : "text-purple-600")} />
                <h1 className={cn("text-xl font-bold", gameState.isDarkMode ? "text-white" : "text-gray-800")}>Timeline Tunes</h1>
                <Button
                  onClick={toggleDarkMode}
                  variant="outline"
                  size="sm"
                >
                  {gameState.isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={cn("text-sm", gameState.isDarkMode ? "text-gray-300" : "text-gray-600")}>Current Turn</div>
                  <div className="font-bold" style={{ color: currentPlayer?.color }}>
                    {currentPlayer?.name}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={cn("text-sm", gameState.isDarkMode ? "text-gray-300" : "text-gray-600")}>Time Left</div>
                  <div className="font-bold text-lg">{gameState.timeLeft}s</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Song Card */}
          {gameState.currentSong && (
            <Card className={cn("p-4 mb-4 shadow-lg", 
              gameState.isDarkMode ? "bg-gray-800/90 backdrop-blur-sm border-gray-700" : "bg-white/90 backdrop-blur-sm")}>
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div 
                    className={cn(
                      "w-28 h-28 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-sm shadow-xl cursor-move flex flex-col items-center justify-center p-3 text-white relative transition-all duration-200",
                      draggedSong ? "animate-pulse scale-105" : "hover:scale-105 hover:animate-bounce"
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}
                    draggable
                    onDragStart={() => handleDragStart(gameState.currentSong!)}
                    onMouseEnter={() => setHoveredCard('mystery-song')}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-white/20 to-transparent"></div>
                    <Music className={cn("h-6 w-6 mb-1 relative z-10 transition-transform duration-200", 
                      hoveredCard === 'mystery-song' ? "animate-bounce" : "",
                      draggedSong ? "animate-[pulse_1s_ease-in-out_infinite]" : "")} />
                    <div className="text-center relative z-10">
                      <div className="text-xs font-medium opacity-90">Mystery</div>
                      <div className="text-lg font-bold">?</div>
                      <div className="text-xs italic opacity-75">Drag me</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className={cn("text-lg font-bold mb-2", gameState.isDarkMode ? "text-white" : "text-gray-800")}>
                    🎵 Mystery Song Playing...
                  </h3>
                  <p className={cn("mb-1 text-sm", gameState.isDarkMode ? "text-gray-300" : "text-gray-600")}>Listen carefully and guess when this song was released!</p>
                  <p className={cn("text-xs", gameState.isDarkMode ? "text-gray-400" : "text-gray-500")}>Place the card on your timeline in the correct chronological order</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Progress value={(30 - gameState.timeLeft) / 30 * 100} className="w-24" />
                  <Button
                    onClick={gameState.isPlaying ? pausePreview : playPreview}
                    size="sm"
                    className="rounded-full"
                  >
                    {gameState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Player Timelines */}
          <div
            className={cn(
              "space-y-3",
              // Responsive height so all players fit with no scrolling if 2+ players
              gameState.players.length > 2
                ? "grid grid-cols-1 md:grid-cols-2 gap-3"
                : ""
            )}
            style={
              gameState.players.length > 2
                ? { maxHeight: "calc(100vh - 240px)", overflowY: "auto" }
                : undefined
            }
          >
            {gameState.players.map((player) => {
              // If dragging over this timeline, insert the ghost card at the slot
              let ghostIndex: number | null = null;
              if (
                activeDrag &&
                activeDrag.playerId === player.id &&
                draggedSong
              ) {
                ghostIndex = activeDrag.position;
              }

              return (
                <Card
                  key={player.id}
                  className={cn(
                    "p-4 shadow-lg transition-all duration-300",
                    gameState.isDarkMode
                      ? "bg-gray-800/90 backdrop-blur-sm border-gray-700"
                      : "bg-white/90 backdrop-blur-sm"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-5 h-5 rounded-full border-2 border-white shadow-md" 
                        style={{ backgroundColor: player.color }}
                      />
                      <h3 className={cn("text-base font-bold", gameState.isDarkMode ? "text-white" : "text-gray-800")}>{player.name}</h3>
                      {player.id === currentPlayer?.id && (
                        <Badge className="bg-yellow-100 text-yellow-800 animate-pulse text-xs">Current Turn</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className={cn("font-bold text-sm", gameState.isDarkMode ? "text-white" : "text-gray-800")}>{player.score}/10</span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "min-h-20 border-2 border-dashed rounded-lg p-3 overflow-x-auto transition-all duration-300 flex items-center",
                      gameState.isDarkMode
                        ? "border-gray-600 bg-gray-700/30"
                        : "border-gray-300 bg-gray-50/50"
                    )}
                    onDragOver={(e) =>
                      handleDragOver(e, player.id, player.timeline.length)
                    }
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(player.id, player.timeline.length)}
                  >
                    <div className="flex gap-2 min-w-fit transition-all duration-300">
                      {/* Timeline cards with possible ghost */}
                      {player.timeline.map((song, index) => {
                        // If inserting ghost card here, render it before this card
                        const ghostHere =
                          ghostIndex === index &&
                          draggedSong &&
                          player.id === currentPlayer?.id;

                        return (
                          <div key={`${player.id}-slot-${index}`} className="relative flex items-center">
                            {/* GHOST CARD (appears as space when dragging) */}
                            {ghostHere && (
                              <div
                                className={cn(
                                  "w-16 h-16 rounded-sm border-2 border-dashed flex flex-col items-center justify-center p-2 text-center flex-shrink-0",
                                  "bg-gray-200/50 dark:bg-gray-900/30",
                                  "scale-105 animate-pulse opacity-70 transition-all duration-300"
                                )}
                                style={{
                                  borderColor: player.timelineColor,
                                  borderStyle: "dashed",
                                }}
                              >
                                <span className="text-xs text-gray-400">Place here</span>
                              </div>
                            )}
                            {/* ACTUAL CARD */}
                            <div
                              className={cn(
                                "w-16 h-16 rounded-sm shadow-md border-2 flex flex-col items-center justify-center p-2 text-center flex-shrink-0 transition-all duration-300 cursor-pointer group",
                                "hover:scale-110 hover:animate-wiggle",
                                // animate wiggle when dragging
                                draggedSong &&
                                currentPlayer?.id === player.id
                                  ? "animate-wiggle"
                                  : "",
                              )}
                              style={{
                                backgroundColor: player.timelineColor,
                                borderColor: "rgba(255,255,255,0.2)",
                                boxShadow:
                                  "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)",
                                transition: "transform 0.3s cubic-bezier(.25,1.7,.5,1.5), box-shadow 0.3s cubic-bezier(.25,1.7,.5,1.5)"
                              }}
                              onDragOver={(e) =>
                                handleDragOver(e, player.id, index)
                              }
                              onDrop={() => handleDrop(player.id, index)}
                              onClick={gameState.pendingPlacement?.playerId === player.id && gameState.pendingPlacement?.position === index ? confirmPlacement : undefined}
                              onMouseEnter={() => setHoveredCard(`${player.id}-${index}`)}
                              onMouseLeave={() => setHoveredCard(null)}
                            >
                              {gameState.pendingPlacement?.playerId === player.id && 
                               gameState.pendingPlacement?.position === index ? (
                                <>
                                  <div className="text-xs font-medium text-white/90 leading-tight mb-1">
                                    Click to
                                  </div>
                                  <div className="text-sm font-bold text-white mb-1">
                                    ?
                                  </div>
                                  <div className="text-xs italic text-white/75 leading-tight">
                                    Confirm
                                  </div>
                                </>
                              ) : gameState.throwingCard?.playerId === player.id && 
                                gameState.throwingCard?.position === index ? (
                                <>
                                  <div className="text-xs font-medium text-white/90 truncate w-full leading-tight">
                                    {gameState.throwingCard?.song?.deezer_artist}
                                  </div>
                                  <div className="text-sm font-bold text-white my-1">
                                    {gameState.throwingCard?.song?.release_year}
                                  </div>
                                  <div className="text-xs italic text-white/75 truncate w-full leading-tight">
                                    {gameState.throwingCard?.song?.deezer_title}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className={cn("text-xs font-medium text-white/90 truncate w-full leading-tight transition-all duration-200",
                                    hoveredCard === `${player.id}-${index}` ? "animate-pulse" : "")}>
                                    {song.deezer_artist}
                                  </div>
                                  <div className="text-sm font-bold text-white my-1">
                                    {song.release_year}
                                  </div>
                                  <div className="text-xs italic text-white/75 truncate w-full leading-tight">
                                    {song.deezer_title}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* If ghost card slot is at end of list */}
                      {ghostIndex === player.timeline.length &&
                        draggedSong &&
                        player.id === currentPlayer?.id && (
                          <div
                            className={cn(
                              "w-16 h-16 rounded-sm border-2 border-dashed flex flex-col items-center justify-center p-2 text-center flex-shrink-0 scale-105 animate-pulse opacity-70 transition-all duration-300",
                              "bg-gray-200/50 dark:bg-gray-900/30"
                            )}
                            style={{
                              borderColor: player.timelineColor,
                              borderStyle: "dashed",
                            }}
                          >
                            <span className="text-xs text-gray-400">
                              Place here
                            </span>
                          </div>
                        )}
                      {/* If timeline empty */}
                      {player.timeline.length === 0 &&
                        !gameState.pendingPlacement && (
                          <div
                            className={cn(
                              "text-center py-4 px-6 transition-all duration-300 text-sm",
                              gameState.isDarkMode
                                ? "text-gray-400"
                                : "text-gray-400"
                            )}
                          >
                            {currentPlayer?.id === player.id
                              ? "Drop song cards here"
                              : "Timeline empty"}
                          </div>
                        )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        <style>{`
          @keyframes wiggle {
            0%, 100% { transform: rotate(0deg) scale(1.05); }
            20% { transform: rotate(-2deg) scale(1.08); }
            50% { transform: rotate(2deg) scale(1.08); }
            80% { transform: rotate(-2deg) scale(1.05); }
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default Index;
