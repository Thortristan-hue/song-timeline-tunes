import React, { useRef, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Organic background elements */}
      <div className="absolute top-10 left-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-16 w-96 h-96 bg-blue-400/8 rounded-full blur-2xl animate-pulse" style={{animationDelay: '3s'}} />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-purple-400/12 rounded-full blur-xl animate-pulse" style={{animationDelay: '6s'}} />
      
      {/* Slightly tilted header */}
      <div className="relative z-10 p-4">
        <div className="flex justify-between items-start transform -rotate-1">
          <div className="bg-slate-800/70 backdrop-blur-lg px-4 py-2 rounded-2xl border border-slate-600/40 shadow-lg">
            <Badge className="bg-purple-500/20 text-purple-200 border-purple-400/50 font-mono text-sm">
              Room {roomCode}
            </Badge>
          </div>
          
          <div className="bg-gradient-to-r from-slate-800/80 to-indigo-800/70 backdrop-blur-lg px-6 py-3 rounded-2xl border border-indigo-400/30 shadow-lg transform rotate-1">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <div className="text-white">
                <div className="font-bold text-lg">
                  {isMyTurn ? "Your Turn!" : `${currentTurnPlayer.name}'s Turn`}
                </div>
                <div className="text-xs text-slate-300 -mt-1">
                  {isMyTurn ? "Listen & place the mystery card" : "Waiting for their move..."}
                </div>
              </div>
              {isMyTurn && (
                <div className="bg-emerald-400 text-emerald-900 px-2 py-1 rounded-full text-xs font-black animate-pulse">
                  GO!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mystery Card Section - Always show when it's my turn */}
      {isMyTurn && gameState.currentSong && (
        <div className="relative z-20 flex justify-center mt-8">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-3xl blur-2xl scale-110 animate-pulse" />
            
            {/* Main mystery card */}
            <div 
              className="relative w-40 h-52 rounded-3xl shadow-2xl cursor-grab active:cursor-grabbing transform transition-all duration-300 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${gameState.currentSong.cardColor || '#EC4899'} 0%, ${gameState.currentSong.cardColor || '#EC4899'}dd 70%, ${gameState.currentSong.cardColor || '#EC4899'}aa 100%)`,
                transform: draggedCard ? 'scale(0.9) rotate(-8deg)' : 'rotate(-3deg)',
                opacity: draggedCard ? 0.8 : 1
              }}
              draggable={!gameState.cardPlacementPending}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {/* Card texture */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/30 rounded-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)] rounded-3xl" />
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-white">
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
              </div>

              {/* Decorative corners */}
              <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-white/60 rounded-tl-xl" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-white/60 rounded-br-xl" />
              
              {/* Sparkle effects */}
              <Sparkles className="absolute top-2 right-8 h-4 w-4 text-white/70 animate-pulse" style={{animationDelay: '1s'}} />
              <Star className="absolute bottom-8 left-2 h-3 w-3 text-white/60 animate-pulse" style={{animationDelay: '2s'}} />
            </div>

            {/* Audio controls below card */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                onClick={onPlayPause}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full w-14 h-14 shadow-xl transform transition-all hover:scale-110"
              >
                {gameState.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
              
              <div className="bg-slate-800/70 backdrop-blur-lg px-4 py-2 rounded-2xl border border-slate-600/40 flex items-center gap-3">
                <Timer className="h-4 w-4 text-blue-300" />
                <div className={`font-mono text-lg font-bold bg-gradient-to-r ${getTimeColor()} bg-clip-text text-transparent`}>
                  {gameState.timeLeft}s
                </div>
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  size="sm"
                  variant="ghost"
                  className="text-slate-300 hover:text-white h-8 w-8 p-0"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 w-48 h-2 bg-slate-700/50 rounded-full overflow-hidden mx-auto border border-slate-600/50">
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
          <div className="text-center mb-8 transform rotate-1">
            <div className="bg-slate-800/60 backdrop-blur-lg px-6 py-4 rounded-2xl border border-slate-600/30 shadow-lg inline-block">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                  style={{ backgroundColor: currentPlayer.color }}
                />
                <h2 className="text-2xl font-bold text-white">{currentPlayer.name}'s Timeline</h2>
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 px-3 py-1 rounded-full text-sm font-black">
                  {currentPlayer.score}/10
                </div>
              </div>
              <p className="text-slate-300 text-sm">
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
                  <div 
                    className={`min-h-[120px] border-3 border-dashed rounded-2xl flex items-center justify-center transition-all transform ${
                      dropHint === 0 ? 'border-emerald-400 bg-emerald-500/20 scale-105' : 'border-purple-400/50 bg-purple-500/10'
                    }`}
                    onDragOver={(e) => handleDragOver(e, 0)}
                    onDrop={(e) => handleDrop(e, 0)}
                  >
                    <div className="text-center">
                      <Music className="h-12 w-12 text-purple-300 mx-auto mb-3 opacity-60" />
                      <div className="text-purple-200 font-medium text-lg mb-1">Drop Mystery Card Here</div>
                      <div className="text-purple-300/80 text-sm">This will be your first song!</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Music className="h-20 w-20 text-purple-300 mx-auto mb-4 opacity-60" />
                    <p className="text-purple-200 text-xl mb-2">Your timeline is empty</p>
                    <p className="text-purple-300 text-sm">
                      {isMyTurn ? "Listen to the mystery song and place it!" : "Waiting for songs..."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Drop zone before first card */}
                {isMyTurn && gameState.currentSong && !gameState.cardPlacementPending && (
                  <div 
                    className={`min-h-[80px] border-2 border-dashed rounded-xl flex items-center justify-center transition-all ${
                      dropHint === 0 ? 'border-emerald-400 bg-emerald-500/20 scale-105' : 'border-green-400/50 bg-green-500/10'
                    }`}
                    onDragOver={(e) => handleDragOver(e, 0)}
                    onDrop={(e) => handleDrop(e, 0)}
                  >
                    <div className="text-green-300 text-center font-medium">
                      <div>Drop here</div>
                      <div className="text-xs opacity-75">{getDropZoneLabel(0)}</div>
                    </div>
                  </div>
                )}
                
                {/* Timeline cards */}
                {currentPlayer.timeline.map((song, index) => (
                  <div key={index} className="space-y-6">
                    {/* Song card */}
                    <div className="flex justify-center">
                      <div 
                        className="w-32 h-36 rounded-2xl shadow-xl transform transition-all hover:scale-105 cursor-pointer relative"
                        style={{ 
                          backgroundColor: song.cardColor || currentPlayer.color,
                          transform: `rotate(${(index % 2 === 0 ? 1 : -1) * 2}deg)`
                        }}
                        onClick={() => song.preview_url && playTimelinePreview(song.id)}
                      >
                        {/* Card gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-black/20 rounded-2xl" />
                        
                        {/* Play button */}
                        <Button
                          size="sm"
                          className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 border-white/30 text-white h-6 w-6 p-0 rounded-lg"
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
                        </div>
                      </div>
                    </div>
                    
                    {/* Drop zone after each card (except the last one gets it outside the loop) */}
                    {isMyTurn && gameState.currentSong && !gameState.cardPlacementPending && (
                      <div 
                        className={`min-h-[80px] border-2 border-dashed rounded-xl flex items-center justify-center transition-all ${
                          dropHint === index + 1 ? 'border-emerald-400 bg-emerald-500/20 scale-105' : 'border-green-400/50 bg-green-500/10'
                        }`}
                        onDragOver={(e) => handleDragOver(e, index + 1)}
                        onDrop={(e) => handleDrop(e, index + 1)}
                      >
                        <div className="text-green-300 text-center font-medium">
                          <div>Drop here</div>
                          <div className="text-xs opacity-75">{getDropZoneLabel(index + 1)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/90 backdrop-blur-lg p-8 rounded-3xl border border-slate-600/50 shadow-2xl max-w-md w-full mx-4 transform transition-all">
            <div className="text-center space-y-6">
              <div className="text-2xl font-bold text-white mb-4">Confirm Placement</div>
              
              <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600/30">
                <div className="text-slate-300 text-sm mb-2">Placing mystery card:</div>
                <div className="text-white font-medium">
                  {pendingPos !== null && getDropZoneLabel(pendingPos)}
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowConfirm(false)}
                  variant="outline"
                  className="flex-1 bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPlacement}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold"
                >
                  Lock It In!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Non-turn state */}
      {!isMyTurn && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-slate-800/80 backdrop-blur-lg px-6 py-3 rounded-2xl border border-slate-600/40 shadow-lg">
            <div className="text-center text-slate-300">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="font-medium">Waiting for {currentTurnPlayer.name}</span>
              </div>
              <div className="text-xs opacity-75">They're placing their mystery card...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
