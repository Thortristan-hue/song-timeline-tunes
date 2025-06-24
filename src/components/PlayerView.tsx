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
    color: "#8B5CF6",
    timeline: [
      { id: "1", deezer_title: "Bohemian Rhapsody", deezer_artist: "Queen", release_year: "1975", cardColor: "#F59E0B" },
      { id: "2", deezer_title: "Thriller", deezer_artist: "Michael Jackson", release_year: "1982", cardColor: "#EF4444" },
      { id: "3", deezer_title: "Smells Like Teen Spirit", deezer_artist: "Nirvana", release_year: "1991", cardColor: "#22C55E" }
    ],
    score: 3
  },
  currentTurnPlayer = { id: "demo-player", name: "You", color: "#8B5CF6", timeline: [], score: 3 },
  roomCode = "ABC123",
  isMyTurn = true,
  gameState = {
    currentSong: {
      id: "mystery",
      deezer_title: "Mystery Song",
      deezer_artist: "Unknown Artist",
      release_year: "1987",
      cardColor: "#EC4899"
    },
    isPlaying: false,
    timeLeft: 25,
    cardPlacementPending: false,
    mysteryCardRevealed: false,
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
    { id: "1", name: "Julia", color: "#F97316", timeline: [], score: 0 },
    { id: "2", name: "Adam", color: "#A16207", timeline: [], score: 0 },
    currentPlayer,
    { id: "4", name: "Chloe", color: "#FB923C", timeline: [], score: 0 },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header with Room Code and Turn Info */}
        <div className="flex justify-between items-center">
          <Badge className="bg-slate-800/80 text-slate-200 border-slate-600 px-4 py-2 text-lg font-mono">
            Room {roomCode}
          </Badge>
          
          <Card className="bg-slate-800/80 border-slate-600 px-6 py-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white" 
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <div className="text-white">
                <div className="font-bold">
                  {isMyTurn ? "Your Turn!" : `${currentTurnPlayer.name}'s Turn`}
                </div>
                {isMyTurn && (
                  <div className="text-xs text-emerald-400 font-medium">
                    Listen & place the mystery card
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Player Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allPlayers.map((player) => (
            <Card 
              key={player.id} 
              className={`p-6 text-center transition-all duration-300 ${
                player.id === currentPlayer.id 
                  ? 'bg-yellow-500/20 border-yellow-400 shadow-lg' 
                  : 'bg-slate-800/60 border-slate-600'
              }`}
            >
              <div 
                className="w-8 h-8 rounded-full mx-auto mb-3 border-2 border-white"
                style={{ backgroundColor: player.color }}
              />
              <div className="text-white font-bold text-lg mb-1">{player.name}</div>
              <div className="text-2xl font-black text-white">{player.score}</div>
            </Card>
          ))}
        </div>

        {/* Mystery Card and Audio Controls */}
        {isMyTurn && gameState.currentSong && (
          <div className="flex flex-col items-center gap-6">
            
            {/* Audio Controls */}
            <Card className="bg-slate-800/80 border-slate-600 p-6">
              <div className="flex items-center gap-6">
                <Button
                  onClick={onPlayPause}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-16 h-16"
                >
                  {gameState.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                
                <div className="flex items-center gap-4">
                  <Timer className="h-5 w-5 text-blue-400" />
                  <div className={`font-mono text-2xl font-bold bg-gradient-to-r ${getTimeColor()} bg-clip-text text-transparent`}>
                    {gameState.timeLeft}s
                  </div>
                  
                  <Button
                    onClick={() => setIsMuted(!isMuted)}
                    size="sm"
                    variant="outline"
                    className="text-slate-300 border-slate-600 hover:bg-slate-700"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4 w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getTimeColor()} transition-all duration-1000`}
                  style={{ width: `${(gameState.timeLeft / 30) * 100}%` }}
                />
              </div>
            </Card>

            {/* Mystery Card */}
            <div className="relative">
              <Card 
                className="w-48 h-64 cursor-grab active:cursor-grabbing transition-all duration-300 hover:scale-105 overflow-hidden border-0"
                style={{
                  background: `linear-gradient(135deg, ${gameState.currentSong.cardColor || '#EC4899'} 0%, ${gameState.currentSong.cardColor || '#EC4899'}dd 70%)`,
                  transform: draggedCard ? 'scale(0.95) rotate(-5deg)' : 'rotate(-2deg)',
                  opacity: draggedCard ? 0.8 : 1
                }}
                draggable={!gameState.cardPlacementPending}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="h-full flex flex-col items-center justify-center p-6 text-white relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20" />
                  
                  <div className="relative z-10 text-center">
                    <div className="mb-4 relative">
                      <Music className="h-20 w-20 opacity-90" />
                      <div className="absolute -top-2 -right-2 w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
                        <span className="text-xl font-bold">?</span>
                      </div>
                    </div>
                    
                    <div className="text-sm font-bold tracking-wider opacity-90 mb-2">MYSTERY TRACK</div>
                    <div className="text-6xl font-black mb-3">?</div>
                    <div className="text-xs italic opacity-80">
                      Drag to timeline
                    </div>
                  </div>

                  <Sparkles className="absolute top-4 right-6 h-4 w-4 text-white/70 animate-pulse" />
                  <Star className="absolute bottom-6 left-4 h-3 w-3 text-white/60 animate-pulse" />
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Timeline Section */}
        <div className="space-y-6">
          <Card className="bg-slate-800/80 border-slate-600 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white" 
                style={{ backgroundColor: currentPlayer.color }}
              />
              <h2 className="text-2xl font-bold text-white">{currentPlayer.name}'s Timeline</h2>
              <Badge className="bg-yellow-500 text-black font-bold px-3 py-1">
                {currentPlayer.score}/10
              </Badge>
            </div>
            <p className="text-slate-300">
              {currentPlayer.timeline.length === 0 
                ? "Drop your first song below!" 
                : `${currentPlayer.timeline.length} songs placed in chronological order`
              }
            </p>
          </Card>

          {/* Timeline Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentPlayer.timeline.length === 0 ? (
              <Card className="col-span-full">
                {isMyTurn && gameState.currentSong ? (
                  <div 
                    className={`min-h-[200px] border-4 border-dashed rounded-lg flex items-center justify-center transition-all ${
                      dropHint === 0 ? 'border-emerald-400 bg-emerald-500/20' : 'border-purple-400/50 bg-purple-500/10'
                    }`}
                    onDragOver={(e) => handleDragOver(e, 0)}
                    onDrop={(e) => handleDrop(e, 0)}
                  >
                    <div className="text-center">
                      <Music className="h-16 w-16 text-purple-300 mx-auto mb-4 opacity-60" />
                      <div className="text-purple-200 font-bold text-xl mb-2">Drop Mystery Card Here</div>
                      <div className="text-purple-300 text-sm">This will be your first song!</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Music className="h-20 w-20 text-purple-300 mx-auto mb-4 opacity-60" />
                    <p className="text-purple-200 text-xl mb-2">Timeline is empty</p>
                    <p className="text-purple-300 text-sm">
                      {isMyTurn ? "Listen to the mystery song and place it!" : "Waiting for songs..."}
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <>
                {/* Drop zone before first card */}
                {isMyTurn && gameState.currentSong && !gameState.cardPlacementPending && (
                  <Card 
                    className={`min-h-[160px] border-2 border-dashed flex items-center justify-center transition-all cursor-pointer ${
                      dropHint === 0 ? 'border-emerald-400 bg-emerald-500/20' : 'border-green-400/50 bg-green-500/10'
                    }`}
                    onDragOver={(e) => handleDragOver(e, 0)}
                    onDrop={(e) => handleDrop(e, 0)}
                  >
                    <div className="text-green-300 text-center font-medium">
                      <div className="text-lg">Drop here</div>
                      <div className="text-xs opacity-75 mt-1">{getDropZoneLabel(0)}</div>
                    </div>
                  </Card>
                )}
                
                {/* Timeline cards with drop zones */}
                {currentPlayer.timeline.map((song, index) => (
                  <React.Fragment key={index}>
                    {/* Song card */}
                    <Card 
                      className="h-48 cursor-pointer transition-all hover:scale-105 overflow-hidden border-0 relative"
                      style={{ backgroundColor: song.cardColor || currentPlayer.color }}
                      onClick={() => song.preview_url && playTimelinePreview(song.id)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20" />
                      
                      {/* Play button */}
                      <Button
                        size="sm"
                        className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 border-white/30 text-white h-8 w-8 p-0"
                        disabled={!song.preview_url}
                      >
                        {playingPreview === song.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 text-white text-center">
                        <Music className="h-8 w-8 mb-3 opacity-80" />
                        <div className="text-3xl font-black mb-2">
                          '{song.release_year.slice(-2)}
                        </div>
                        <div className="text-sm font-bold mb-1 leading-tight">
                          {song.deezer_title.length > 20 
                            ? `${song.deezer_title.slice(0, 20)}...` 
                            : song.deezer_title
                          }
                        </div>
                        <div className="text-xs opacity-75 leading-tight">
                          {song.deezer_artist.length > 15 
                            ? `${song.deezer_artist.slice(0, 15)}...` 
                            : song.deezer_artist
                          }
                        </div>
                      </div>
                    </Card>
                    
                    {/* Drop zone after each card */}
                    {isMyTurn && gameState.currentSong && !gameState.cardPlacementPending && (
                      <Card 
                        className={`min-h-[160px] border-2 border-dashed flex items-center justify-center transition-all cursor-pointer ${
                          dropHint === index + 1 ? 'border-emerald-400 bg-emerald-500/20' : 'border-green-400/50 bg-green-500/10'
                        }`}
                        onDragOver={(e) => handleDragOver(e, index + 1)}
                        onDrop={(e) => handleDrop(e, index + 1)}
                      >
                        <div className="text-green-300 text-center font-medium">
                          <div className="text-lg">Drop here</div>
                          <div className="text-xs opacity-75 mt-1">{getDropZoneLabel(index + 1)}</div>
                        </div>
                      </Card>
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Submit Button */}
        {isMyTurn && currentPlayer.timeline.length > 0 && (
          <div className="flex justify-center">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xl px-12 py-4 rounded-xl">
              SUBMIT
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-slate-800/90 border-slate-600 p-8 max-w-md w-full mx-4">
            <div className="text-center space-y-6">
              <div className="text-2xl font-bold text-white mb-4">Confirm Placement</div>
              
              <Card className="bg-slate-700/50 border-slate-600 p-4">
                <div className="text-slate-300 text-sm mb-2">Placing mystery card:</div>
                <div className="text-white font-medium">
                  {pendingPos !== null && getDropZoneLabel(pendingPos)}
                </div>
              </Card>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowConfirm(false)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-white hover:bg-slate-700"
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
          <Card className="bg-slate-800/90 border-slate-600 px-6 py-3">
            <div className="text-center text-slate-300">
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
