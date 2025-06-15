
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Users, Clock, Trophy, Music } from 'lucide-react';
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
    hostId: 'host-1'
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

    // Note: Using a placeholder sound since we can't access the actual Deezer URLs in this demo
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

    setGameState(prev => {
      const updatedPlayers = prev.players.map(player => {
        if (player.id === playerId) {
          const newTimeline = [...player.timeline];
          newTimeline.splice(position, 0, draggedSong);
          return { ...player, timeline: newTimeline };
        }
        return player;
      });

      return {
        ...prev,
        players: updatedPlayers,
        currentTurn: (prev.currentTurn + 1) % prev.players.length,
        currentSong: mockSongs[Math.floor(Math.random() * mockSongs.length)]
      };
    });

    setDraggedSong(null);
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
                <div 
                  className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center cursor-move"
                  draggable
                  onDragStart={() => handleDragStart(gameState.currentSong!)}
                >
                  <Music className="h-8 w-8 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">
                    {gameState.currentSong.deezer_title}
                  </h3>
                  <p className="text-gray-600">by {gameState.currentSong.deezer_artist}</p>
                  <p className="text-sm text-gray-500">{gameState.currentSong.deezer_album}</p>
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

          {/* Player Timelines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {gameState.players.map((player) => (
              <Card key={player.id} className="p-6 bg-white/90 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: player.color }}
                    />
                    <h3 className="text-lg font-bold">{player.name}</h3>
                    {player.id === currentPlayer?.id && (
                      <Badge className="bg-yellow-100 text-yellow-800">Current Turn</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold">{player.score}/10</span>
                  </div>
                </div>

                <div 
                  className="min-h-32 border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(player.id, player.timeline.length)}
                >
                  <div className="flex flex-wrap gap-2">
                    {player.timeline.map((song, index) => (
                      <div 
                        key={index}
                        className="bg-white rounded-lg p-3 shadow-sm border min-w-32"
                      >
                        <div className="text-sm font-medium truncate">{song.deezer_title}</div>
                        <div className="text-xs text-gray-500">{song.release_year}</div>
                      </div>
                    ))}
                    {player.timeline.length === 0 && (
                      <div className="text-gray-400 text-center w-full py-4">
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
