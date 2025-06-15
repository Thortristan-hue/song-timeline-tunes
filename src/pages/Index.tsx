
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Users, Clock, Trophy, Music, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock song data structure
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
}

// Mock song data
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
    pendingPlacement: null
  });

  const [playerName, setPlayerName] = useState('');
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Timer effect
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

  const joinLobby = () => {
    if (!playerName.trim()) return;
    
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: playerName,
      color: playerColors[gameState.players.length % playerColors.length],
      score: 0,
      timeline: []
    };

    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));
    setPlayerName('');
  };

  const startGame = () => {
    if (gameState.players.length < 2) return;
    
    // Give each player a starting song
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
  };

  const handleDrop = (playerId: string, position: number) => {
    if (!draggedSong) return;

    setGameState(prev => ({
      ...prev,
      pendingPlacement: { playerId, song: draggedSong, position }
    }));

    setDraggedSong(null);
  };

  const confirmPlacement = () => {
    if (!gameState.pendingPlacement) return;

    const { playerId, song, position } = gameState.pendingPlacement;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    // Check if placement is correct (simplified logic)
    const isCorrect = checkPlacementCorrectness(player.timeline, song, position);

    setGameState(prev => {
      const updatedPlayers = prev.players.map(p => {
        if (p.id === playerId && isCorrect) {
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

      // Check for winner
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
  };

  const rejectPlacement = () => {
    setGameState(prev => ({
      ...prev,
      currentTurn: (prev.currentTurn + 1) % prev.players.length,
      currentSong: mockSongs[Math.floor(Math.random() * mockSongs.length)],
      pendingPlacement: null
    }));
  };

  const checkPlacementCorrectness = (timeline: Song[], newSong: Song, position: number): boolean => {
    const newYear = parseInt(newSong.release_year);
    
    // Check if the placement maintains chronological order
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

  if (gameState.phase === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Music className="h-12 w-12 text-purple-600" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Timeline Tunes
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              Guess the release year and place songs on your timeline!
            </p>
          </div>

          <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Lobby</h2>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Users className="h-5 w-5" />
                <span>{gameState.players.length}/6 players</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Join Game</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && joinLobby()}
                  />
                  <Button onClick={joinLobby} className="px-6 py-3 rounded-xl">
                    Join
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Players</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {gameState.players.map((player, index) => (
                    <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="font-medium">{player.name}</span>
                      {index === 0 && <Badge variant="outline">Host</Badge>}
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
                  className="px-8 py-4 text-lg rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Start Game
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
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Music className="h-8 w-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-800">Timeline Tunes</h1>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Current Turn</div>
                  <div className="font-bold" style={{ color: currentPlayer?.color }}>
                    {currentPlayer?.name}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600">Time Left</div>
                  <div className="font-bold text-lg">{gameState.timeLeft}s</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Song Card */}
          {gameState.currentSong && (
            <Card className="p-6 mb-6 bg-white/90 backdrop-blur-sm shadow-lg">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div 
                    className="w-32 h-32 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-2xl shadow-xl cursor-move transform transition-all duration-200 hover:scale-105 hover:shadow-2xl flex flex-col items-center justify-center p-4 text-white relative"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}
                    draggable
                    onDragStart={() => handleDragStart(gameState.currentSong!)}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                    <Music className="h-8 w-8 mb-2 relative z-10" />
                    <div className="text-center relative z-10">
                      <div className="text-xs font-medium opacity-90">Mystery Song</div>
                      <div className="text-lg font-bold">?</div>
                      <div className="text-xs italic opacity-75">Drag to timeline</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    🎵 Mystery Song Playing...
                  </h3>
                  <p className="text-gray-600 mb-1">Listen carefully and guess when this song was released!</p>
                  <p className="text-sm text-gray-500">Place the card on your timeline in the correct chronological order</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Progress value={(30 - gameState.timeLeft) / 30 * 100} className="w-32" />
                  <Button
                    onClick={gameState.isPlaying ? pausePreview : playPreview}
                    size="lg"
                    className="rounded-full"
                  >
                    {gameState.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Confirmation Dialog */}
          {gameState.pendingPlacement && (
            <Card className="p-6 mb-6 bg-yellow-50 border-yellow-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-xl flex flex-col items-center justify-center text-white text-xs">
                    <div className="font-medium">{gameState.pendingPlacement.song.deezer_artist}</div>
                    <div className="text-lg font-bold">{gameState.pendingPlacement.song.release_year}</div>
                    <div className="italic">{gameState.pendingPlacement.song.deezer_title}</div>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Confirm Your Placement</h4>
                    <p className="text-gray-600">
                      You placed "{gameState.pendingPlacement.song.deezer_title}" by {gameState.pendingPlacement.song.deezer_artist} ({gameState.pendingPlacement.song.release_year})
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={confirmPlacement} className="bg-green-600 hover:bg-green-700">
                    <Check className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                  <Button onClick={rejectPlacement} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Player Timelines - Vertical layout with horizontal timelines */}
          <div className="space-y-6">
            {gameState.players.map((player) => (
              <Card key={player.id} className="p-6 bg-white/90 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md" 
                      style={{ backgroundColor: player.color }}
                    />
                    <h3 className="text-lg font-bold">{player.name}</h3>
                    {player.id === currentPlayer?.id && (
                      <Badge className="bg-yellow-100 text-yellow-800 animate-pulse">Current Turn</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold">{player.score}/10</span>
                  </div>
                </div>

                <div 
                  className="min-h-24 border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50 overflow-x-auto"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(player.id, player.timeline.length)}
                >
                  <div className="flex gap-3 min-w-fit">
                    {player.timeline.map((song, index) => (
                      <div 
                        key={index}
                        className="w-20 h-20 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border-2 border-gray-200 flex flex-col items-center justify-center p-2 text-center flex-shrink-0 transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
                        style={{
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)'
                        }}
                      >
                        <div className="text-xs font-medium text-gray-700 truncate w-full leading-tight">
                          {song.deezer_artist}
                        </div>
                        <div className="text-lg font-bold text-gray-900 my-1">
                          {song.release_year}
                        </div>
                        <div className="text-xs italic text-gray-600 truncate w-full leading-tight">
                          {song.deezer_title}
                        </div>
                      </div>
                    ))}
                    {player.timeline.length === 0 && (
                      <div className="text-gray-400 text-center py-6 px-8">
                        Drop song cards here to build your timeline
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
