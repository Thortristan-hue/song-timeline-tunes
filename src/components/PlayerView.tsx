import React, { useRef, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, Music, Timer, Volume2, VolumeX, Star, Sparkles } from 'lucide-react';

// Mock types for demo
interface Song {
  id: string;
  deezer_title: string;
  deezer_artist: string;
  release_year: string;
  preview_url?: string;
  cardColor?: string;
}

interface Player {
  id: string;
  name: string;
  color: string;
  timeline: Song[];
  score: number;
}

interface PlayerViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  roomCode: string;
  isMyTurn: boolean;
  gameState: {
    currentSong: Song | null;
    isPlaying: boolean;
    timeLeft: number;
    cardPlacementPending?: boolean;
    mysteryCardRevealed?: boolean;
    cardPlacementCorrect?: boolean | null;
  };
  onPlaceCard: (position: number) => void;
  onPlayPause: () => void;
}

export function PlayerView({
  currentPlayer = {
    id: "demo-player",
    name: "You",
    color: "#C4A661",
    timeline: [
      { id: "1", deezer_title: "Bohemian Rhapsody", deezer_artist: "Queen", release_year: "1975", cardColor: "#8B5A8C" },
      { id: "2", deezer_title: "Thriller", deezer_artist: "Michael Jackson", release_year: "1982", cardColor: "#8B5A8C" },
      { id: "3", deezer_title: "Smells Like Teen Spirit", deezer_artist: "Nirvana", release_year: "1991", cardColor: "#8B5A8C" }
    ],
    score: 2
  },
  currentTurnPlayer = { id: "demo-player", name: "You", color: "#C4A661", timeline: [], score: 2 },
  roomCode = "ABC123",
  isMyTurn = true,
  gameState = {
    currentSong: {
      id: "mystery",
      deezer_title: "Call Me Maybe",
      deezer_artist: "Carly Rae Jepsen",
      release_year: "2011",
      cardColor: "#8B5A8C"
    },
    isPlaying: false,
    timeLeft: 25,
    cardPlacementPending: false,
    mysteryCardRevealed: true,
    cardPlacementCorrect: null
  },
  onPlaceCard = (pos) => console.log('Place card at position:', pos),
  onPlayPause = () => console.log('Play/pause clicked')
}: Partial<PlayerViewProps>) {
  const [draggedCard, setDraggedCard] = useState(false);
  const [dropHint, setDropHint] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPos, setPendingPos] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  // Mock other players for demo
  const allPlayers: Player[] = [
    { id: "1", name: "Julia", color: "#8B5A8C", timeline: [], score: 0 },
    { id: "2", name: "Adam", color: "#6B5B73", timeline: [], score: 0 },
    currentPlayer,
    { id: "4", name: "Chloe", color: "#5D5A6B", timeline: [], score: 0 },
  ];

  // Simulate audio for timeline cards
  const playTimelinePreview = (songId: string) => {
    if (playingPreview === songId) {
      setPlayingPreview(null);
    } else {
      setPlayingPreview(songId);
      // Auto-stop after 3 seconds
      setTimeout(() => setPlayingPreview(null), 3000);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setDraggedCard(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCard(false);
    setDropHint(null);
  };

  const handleDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    setDropHint(position);
  };

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    setDraggedCard(false);
    setDropHint(null);
    setPendingPos(position);
    setShowConfirm(true);
  };

  const confirmPlacement = () => {
    if (pendingPos !== null) {
      onPlaceCard(pendingPos);
      setShowConfirm(false);
      setPendingPos(null);
    }
  };

  const getTimeColor = () => {
    if (gameState.timeLeft > 20) return "from-emerald-400 to-green-300";
    if (gameState.timeLeft > 10) return "from-amber-400 to-yellow-300";
    return "from-rose-400 to-red-300";
  };

  const getDropZoneLabel = (position: number) => {
    if (currentPlayer.timeline.length === 0) return "Place as your first song";
    if (position === 0) return `Before ${currentPlayer.timeline[0]?.release_year}`;
    if (position === currentPlayer.timeline.length) return `After ${currentPlayer.timeline[currentPlayer.timeline.length - 1]?.release_year}`;
    return `Between ${currentPlayer.timeline[position - 1]?.release_year} and ${currentPlayer.timeline[position]?.release_year}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 relative overflow-hidden">
      
      {/* Header */}
      <div className="relative z-10 p-4">
        <div className="flex justify-between items-start">
          <Badge className="bg-purple-700/70 text-purple-100 border-purple-600 font-mono text-sm px-4 py-2 rounded-lg">
            Room {roomCode}
          </Badge>
          
          <div className="bg-purple-700/70 backdrop-blur-sm px-6 py-3 rounded-lg border border-purple-600/50">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <div className="text-white">
                <div className="font-bold text-lg">
                  {isMyTurn ? "Your Turn!" : `${currentTurnPlayer.name}'s Turn`}
                </div>
                <div className="text-xs text-purple-200 -mt-1">
                  {isMyTurn ? "Listen & place the mystery card" : "Waiting for their move..."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Cards Row */}
      <div className="relative z-10 px-6 mt-4">
        <div className="flex justify-center gap-4 mb-8">
          {allPlayers.map((player) => (
            <Card 
              key={player.id} 
              className={`w-24 h-20 flex flex-col items-center justify-center text-center border-2 shadow-lg transition-all duration-300 ${
                player.id === currentPlayer.id 
                  ? 'border-yellow-400 shadow-yellow-400/50' 
                  : 'border-gray-400/50'
              }`}
              style={{ 
                backgroundColor: player.color,
                boxShadow: player.id === currentPlayer.id ? '0 0 20px rgba(251, 191, 36, 0.5)' : '0 4px 8px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="text-white font-bold text-sm mb-1">{player.name}</div>
              <div className="text-white text-2xl font-black">{player.score}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Mystery Card Section */}
      {isMyTurn && gameState.currentSong && (
        <div className="relative z-20 flex justify-center mt-8">
          <div className="relative">
            {/* Main mystery card */}
            <Card 
              className="w-48 h-64 shadow-2xl cursor-grab active:cursor-grabbing transform transition-all duration-300 hover:scale-105 border-2 border-gray-400/50 overflow-hidden"
              style={{
                backgroundColor: gameState.currentSong.cardColor || '#8B5A8C',
                transform: draggedCard ? 'scale(0.9) rotate(-8deg)' : 'rotate(-3deg)',
                opacity: draggedCard ? 0.8 : 1,
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)'
              }}
              draggable={!gameState.cardPlacementPending}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-white">
                {gameState.mysteryCardRevealed ? (
                  <>
                    {/* Vinyl record design */}
                    <div className="relative mb-4">
                      <div className="w-20 h-20 bg-black rounded-full shadow-lg flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-800 to-purple-900 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 bg-purple-600 rounded-full"></div>
                        </div>
                        {/* Vinyl grooves */}
                        <div className="absolute inset-2 border border-purple-400/30 rounded-full"></div>
                        <div className="absolute inset-4 border border-purple-400/20 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="text-lg font-bold leading-tight">
                        {gameState.currentSong.deezer_title}
                      </div>
                      <div className="text-sm opacity-90">
                        {gameState.currentSong.deezer_artist}
                      </div>
                      <div className="text-2xl font-black bg-purple-600 px-3 py-1 rounded-lg">
                        {gameState.currentSong.release_year}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative mb-4">
                      <Music className="h-16 w-16 opacity-90" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
                        <span className="text-lg">?</span>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="text-sm font-bold tracking-wider opacity-90">MYSTERY TRACK</div>
                      <div className="text-6xl font-black drop-shadow-lg animate-pulse">?</div>
                      <div className="text-xs italic opacity-80 leading-relaxed px-2">
                        Drag me to your timeline!
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Audio controls below card */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                onClick={onPlayPause}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-14 h-14 shadow-xl transform transition-all hover:scale-110"
              >
                {gameState.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
              
              <div className="bg-purple-700/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-600/50 flex items-center gap-3">
                <Timer className="h-4 w-4 text-purple-200" />
                <div className={`font-mono text-lg font-bold bg-gradient-to-r ${getTimeColor()} bg-clip-text text-transparent`}>
                  {gameState.timeLeft}s
                </div>
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  size="sm"
                  variant="ghost"
                  className="text-purple-200 hover:text-white h-8 w-8 p-0"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 w-48 h-2 bg-purple-800/50 rounded-full overflow-hidden mx-auto border border-purple-600/50">
              <div 
                className={`h-full bg-gradient-to-r ${getTimeColor()} transition-all duration-1000 rounded-full shadow-lg`}
                style={{ width: `${(gameState.timeLeft / 30) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      <div className="relative z-10 mt-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Timeline header */}
          <div className="text-center mb-8">
            <div className="bg-purple-700/70 backdrop-blur-sm px-6 py-4 rounded-lg border border-purple-600/50 shadow-lg inline-block">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                  style={{ backgroundColor: currentPlayer.color }}
                />
                <h2 className="text-2xl font-bold text-white">{currentPlayer.name}'s Timeline</h2>
                <div className="bg-yellow-500 text-black px-3 py-1 rounded-lg text-sm font-black">
                  {currentPlayer.score}/10
                </div>
              </div>
              <p className="text-purple-200 text-sm">
                {currentPlayer.timeline.length === 0 
                  ? "Drop your first song below!" 
                  : `${currentPlayer.timeline.length} songs placed in chronological order`
                }
              </p>
            </div>
          </div>

          {/* Timeline content */}
          <div className="space-y-6">
            {currentPlayer.timeline.length === 0 ? (
              <div className="text-center py-16">
                {isMyTurn && gameState.currentSong ? (
                  <Card 
                    className={`min-h-[180px] border-3 border-dashed flex items-center justify-center transition-all transform shadow-lg ${
                      dropHint === 0 ? 'border-emerald-400 bg-emerald-500/20 scale-105' : 'border-purple-300/50 bg-purple-500/10'
                    }`}
                    onDragOver={(e) => handleDragOver(e, 0)}
                    onDrop={(e) => handleDrop(e, 0)}
                  >
                    <div className="text-center">
                      <Music className="h-12 w-12 text-purple-200 mx-auto mb-3 opacity-60" />
                      <div className="text-purple-100 font-medium text-lg mb-1">Drop Mystery Card Here</div>
                      <div className="text-purple-200 text-sm">This will be your first song!</div>
                    </div>
                  </Card>
                ) : (
                  <div>
                    <Music className="h-20 w-20 text-purple-200 mx-auto mb-4 opacity-60" />
                    <p className="text-purple-100 text-xl mb-2">Your timeline is empty</p>
                    <p className="text-purple-200 text-sm">
                      {isMyTurn ? "Listen to the mystery song and place it!" : "Waiting for songs..."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {/* Drop zone before first card */}
                {isMyTurn && gameState.currentSong && !gameState.cardPlacementPending && (
                  <Card 
                    className={`w-36 h-48 border-2 border-dashed flex items-center justify-center transition-all ${
                      dropHint === 0 ? 'border-emerald-400 bg-emerald-500/20 scale-105' : 'border-purple-300/50 bg-purple-500/10'
                    }`}
                    onDragOver={(e) => handleDragOver(e, 0)}
                    onDrop={(e) => handleDrop(e, 0)}
                  >
                    <div className="text-purple-100 text-center font-medium text-sm">
                      <div>Drop here</div>
                      <div className="text-xs opacity-75 mt-1">{getDropZoneLabel(0)}</div>
                    </div>
                  </Card>
                )}
                
                {/* Timeline cards with drop zones */}
                {currentPlayer.timeline.map((song, index) => (
                  <React.Fragment key={index}>
                    {/* Song card */}
                    <Card 
                      className="w-36 h-48 shadow-xl transform transition-all hover:scale-105 cursor-pointer border-2 border-gray-400/50 overflow-hidden"
                      style={{ 
                        backgroundColor: song.cardColor || '#8B5A8C',
                        transform: `rotate(${(index % 2 === 0 ? 1 : -1) * 2}deg)`,
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)'
                      }}
                      onClick={() => song.preview_url && playTimelinePreview(song.id)}
                    >
                      {/* Play button */}
                      <Button
                        size="sm"
                        className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 border-white/30 text-white h-6 w-6 p-0 rounded-lg z-10"
                        disabled={!song.preview_url}
                      >
                        {playingPreview === song.id ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>

                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col items-center justify-center p-3 text-white text-center">
                        {gameState.mysteryCardRevealed ? (
                          <>
                            {/* Small vinyl for timeline cards */}
                            <div className="relative mb-3">
                              <div className="w-12 h-12 bg-black rounded-full shadow-md flex items-center justify-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-700 to-purple-800 rounded-full flex items-center justify-center">
                                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-bold mb-1 leading-tight">
                              {song.deezer_title.length > 12 
                                ? `${song.deezer_title.slice(0, 12)}...` 
                                : song.deezer_title
                              }
                            </div>
                            <div className="text-xs opacity-90 mb-2">
                              {song.deezer_artist.length > 12 
                                ? `${song.deezer_artist.slice(0, 12)}...` 
                                : song.deezer_artist
                              }
                            </div>
                            <div className="text-xl font-black bg-purple-600 px-2 py-1 rounded">
                              {song.release_year}
                            </div>
                          </>
                        ) : (
                          <>
                            <Music className="h-6 w-6 mb-2 opacity-80" />
                            <div className="text-2xl font-black mb-2">
                              '{song.release_year.slice(-2)}
                            </div>
                            <div className="text-xs leading-tight opacity-90">
                              {song.deezer_title.length > 15 
                                ? `${song.deezer_title.slice(0, 15)}...` 
                                : song.deezer_title
                              }
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                    
                    {/* Drop zone after each card */}
                    {isMyTurn && gameState.currentSong && !gameState.cardPlacementPending && (
                      <Card 
                        className={`w-36 h-48 border-2 border-dashed flex items-center justify-center transition-all ${
                          dropHint === index + 1 ? 'border-emerald-400 bg-emerald-500/20 scale-105' : 'border-purple-300/50 bg-purple-500/10'
                        }`}
                        onDragOver={(e) => handleDragOver(e, index + 1)}
                        onDrop={(e) => handleDrop(e, index + 1)}
                      >
                        <div className="text-purple-100 text-center font-medium text-sm">
                          <div>Drop here</div>
                          <div className="text-xs opacity-75 mt-1">{getDropZoneLabel(index + 1)}</div>
                        </div>
                      </Card>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      {isMyTurn && (
        <div className="relative z-10 flex justify-center mt-8 pb-8">
          <Button 
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-3 rounded-lg shadow-lg border-2 border-gray-400/50"
            style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' }}
          >
            SUBMIT
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-purple-700/90 border-purple-600 p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="text-2xl font-bold text-white mb-4">Confirm Placement</div>
              
              <Card className="bg-purple-800/50 border-purple-600/50 p-4">
                <div className="text-purple-200 text-sm mb-2">Placing mystery card:</div>
                <div className="text-white font-medium">
                  {pendingPos !== null && getDropZoneLabel(pendingPos)}
                </div>
              </Card>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowConfirm(false)}
                  variant="outline"
                  className="flex-1 border-purple-400 text-white hover:bg-purple-600/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPlacement}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Lock It In!
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Non-turn state */}
      {!isMyTurn && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30">
          <Card className="bg-purple-700/90 border-purple-600/50 px-6 py-3 shadow-lg">
            <div className="text-center text-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="font-medium">Waiting for {currentTurnPlayer.name}</span>
              </div>
              <div className="text-xs opacity-75">They're placing their mystery card...</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
