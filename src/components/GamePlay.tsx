import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Clock, Volume2, VolumeX, Trophy, ArrowLeft, Zap, Star, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlayerTimeline } from '@/components/PlayerTimeline';
import { useToast } from '@/components/ui/use-toast';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface GamePlayProps {
  room: any;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  songs: Song[];
  onEndGame: () => void;
  onKickPlayer: (playerId: string) => void;
}

export function GamePlay({ room, players, currentPlayer, isHost, songs, onEndGame, onKickPlayer }: GamePlayProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [gameState, setGameState] = useState({
    currentTurn: 0,
    currentSong: null as Song | null,
    timeLeft: 30,
    isPlaying: false,
    draggedSong: null as Song | null,
    activeDrag: null as { playerId: string; position: number; song: Song | null } | null,
    hoveredCard: null as string | null,
    confirmingPlacement: null as { song: Song; position: number } | null,
    placedCardPosition: null as number | null,
    winner: null as Player | null,
    isMuted: false,
    availableSongs: [...songs],
    usedSongs: [] as Song[],
    transitioningTurn: false,
    cardResult: null as { correct: boolean; song: Song } | null,
    showKickOptions: null as string | null
  });

  const [transitionProgress, setTransitionProgress] = useState(0);
  const currentTurnPlayer = players[gameState.currentTurn % players.length];
  const isMyTurn = currentPlayer?.id === currentTurnPlayer?.id;

  // Timer effect
  useEffect(() => {
    if (gameState.timeLeft > 0 && gameState.currentSong && !gameState.confirmingPlacement) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.timeLeft === 0) {
      handleTimeUp();
    }
  }, [gameState.timeLeft, gameState.currentSong, gameState.confirmingPlacement]);

  // Initialize first song
  useEffect(() => {
    if (!gameState.currentSong && gameState.availableSongs.length > 0) {
      startNewTurn();
    }
  }, [gameState.availableSongs]);

  const startNewTurn = () => {
    if (gameState.availableSongs.length === 0) {
      endGame();
      return;
    }

    const randomIndex = Math.floor(Math.random() * gameState.availableSongs.length);
    const newSong = gameState.availableSongs[randomIndex];
    
    setGameState(prev => ({
      ...prev,
      currentSong: newSong,
      timeLeft: 30,
      isPlaying: false,
      confirmingPlacement: null,
      placedCardPosition: null,
      transitioningTurn: false
    }));

    toast({
      title: `${currentTurnPlayer?.name}'s Turn`,
      description: "Listen to the song and place it on the timeline!",
    });
  };

  const handleTimeUp = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setGameState(prev => ({ ...prev, isPlaying: false }));
    toast({
      title: "Time's up!",
      description: "Audio stopped, but you can still place the card",
      variant: "destructive",
    });
  };

  const nextTurn = () => {
    setGameState(prev => ({
      ...prev,
      transitioningTurn: true
    }));

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        currentTurn: prev.currentTurn + 1,
        confirmingPlacement: null,
        placedCardPosition: null
      }));
      
      setTimeout(() => {
        startNewTurn();
      }, 1000);
    }, 1200);
  };

  const playPauseAudio = () => {
    if (!audioRef.current || !gameState.currentSong?.preview_url) return;

    if (gameState.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !gameState.isMuted;
    }
    setGameState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const handleDragStart = (song: Song) => {
    if (!isMyTurn) return;
    setGameState(prev => ({ ...prev, draggedSong: song }));
  };

  const handleDragOver = (e: React.DragEvent, playerId: string, position: number) => {
    if (!isMyTurn || playerId !== currentPlayer?.id) return;
    
    e.preventDefault();
    setGameState(prev => ({
      ...prev,
      activeDrag: { playerId, position, song: prev.draggedSong }
    }));
  };

  const handleDragLeave = () => {
    setGameState(prev => ({ ...prev, activeDrag: null }));
  };

  const handleDrop = (playerId: string, position: number) => {
    if (!isMyTurn || !gameState.draggedSong || playerId !== currentPlayer?.id) return;

    setGameState(prev => ({
      ...prev,
      confirmingPlacement: { song: prev.draggedSong!, position },
      placedCardPosition: position,
      activeDrag: null,
      draggedSong: null
    }));
  };

  const confirmPlacement = () => {
    if (!gameState.confirmingPlacement || !currentPlayer) return;

    const { song, position } = gameState.confirmingPlacement;
    const player = players.find(p => p.id === currentPlayer.id);
    if (!player) return;

    const newTimeline = [...player.timeline];
    newTimeline.splice(position, 0, song);
    
    const isCorrect = checkTimelineOrder(newTimeline);
    
    const updatedPlayers = players.map(p => {
      if (p.id === currentPlayer.id) {
        return {
          ...p,
          timeline: newTimeline,
          score: isCorrect ? p.score + 1 : p.score
        };
      }
      return p;
    });

    setGameState(prev => ({
      ...prev,
      availableSongs: prev.availableSongs.filter(s => s.id !== song.id),
      usedSongs: [...prev.usedSongs, song],
      confirmingPlacement: null,
      placedCardPosition: null,
      cardResult: { correct: isCorrect, song }
    }));

    toast({
      title: isCorrect ? "Correct!" : "Incorrect!",
      description: isCorrect ? 
        `${song.deezer_title} by ${song.deezer_artist} (${song.release_year}) placed correctly!` :
        `${song.deezer_title} by ${song.deezer_artist} (${song.release_year}) - wrong position!`,
      variant: isCorrect ? "default" : "destructive",
    });

    const winner = updatedPlayers.find(p => p.score >= 10);
    if (winner) {
      setGameState(prev => ({ ...prev, winner }));
      toast({
        title: "Game Over!",
        description: `${winner.name} wins with ${winner.score} points!`,
      });
      return;
    }

    nextTurn();
  };

  const cancelPlacement = () => {
    setGameState(prev => ({
      ...prev,
      confirmingPlacement: null,
      placedCardPosition: null,
      draggedSong: prev.currentSong
    }));
  };

  const checkTimelineOrder = (timeline: Song[]): boolean => {
    for (let i = 0; i < timeline.length - 1; i++) {
      const current = parseInt(timeline[i].release_year);
      const next = parseInt(timeline[i + 1].release_year);
      if (current > next) return false;
    }
    return true;
  };

  const endGame = () => {
    toast({
      title: "Game Finished!",
      description: "Thanks for playing!",
    });
    onEndGame();
  };

  const getTimeColor = () => {
    if (gameState.timeLeft > 20) return "text-emerald-300";
    if (gameState.timeLeft > 10) return "text-amber-300";
    return "text-rose-300";
  };

  const toggleKickOptions = (playerId: string) => {
    if (!isHost || playerId === currentPlayer?.id) return;
    setGameState(prev => ({
      ...prev,
      showKickOptions: prev.showKickOptions === playerId ? null : playerId
    }));
  };

  if (gameState.winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-800 to-violet-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.2),transparent_50%)]" />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="text-center space-y-8 max-w-2xl">
            <div className="relative">
              <Trophy className="w-32 h-32 mx-auto text-yellow-400 mb-6 animate-bounce" style={{
                filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.5))',
                animationDuration: '2s'
              }} />
              <div className="absolute -top-4 -right-4 text-6xl animate-spin" style={{animationDuration: '8s'}}>🎉</div>
              <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce" style={{animationDelay: '0.5s'}}>✨</div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 animate-pulse">
                VICTORY!
              </h1>
              <div className="text-3xl font-bold text-white">
                🏆 {gameState.winner.name} Takes the Crown! 🏆
              </div>
              <div className="text-xl text-gray-300 font-medium">
                Final Score: <span className="text-yellow-400 font-bold text-2xl">{gameState.winner.score}</span> points
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 text-white">Final Leaderboard</h3>
              <div className="space-y-3">
                {players
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div 
                      key={player.id}
                      className={`flex items-center justify-between p-4 rounded-xl ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30' :
                        index === 2 ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-600/30' :
                        'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-black">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: player.color }}
                          />
                          <span className="font-semibold text-white text-lg">{player.name}</span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {player.score}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <Button
              onClick={onEndGame}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition-all hover:scale-105"
            >
              Back to Lobby
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Custom decorative elements - more organic */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-400/8 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}} />
      
      {/* Noise texture overlay for organic feel */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxmaWx0ZXIgaWQ9Im5vaXNlIiB4PSIwJSIgeT0iMCUiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogICAgICA8ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgcmVzdWx0PSJub2lzZSIgc2VlZD0iMSIvPgogICAgICA8ZmVDb2xvck1hdHJpeCBpbj0ibm9pc2UiIHR5cGU9InNhdHVyYXRlIiB2YWx1ZXM9IjAiLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjQiLz4KPC9zdmc+')] pointer-events-none" />

      {gameState.currentSong?.preview_url && (
        <audio
          ref={audioRef}
          src={gameState.currentSong.preview_url}
          onEnded={() => setGameState(prev => ({ ...prev, isPlaying: false }))}
          onPlay={() => setGameState(prev => ({ ...prev, isPlaying: true }))}
          onPause={() => setGameState(prev => ({ ...prev, isPlaying: false }))}
        />
      )}

      {/* Header with asymmetric design */}
      <div className="absolute top-6 left-4 right-4 z-40">
        <div className="flex justify-between items-start gap-6">
          {/* Timer section - left aligned, slightly tilted */}
          <div className="flex items-center gap-4 bg-slate-800/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-600/30 shadow-lg transform -rotate-1">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Clock className="h-5 w-5 text-blue-300" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-ping" 
                     style={{display: gameState.timeLeft <= 10 ? 'block' : 'none'}} />
              </div>
              <div className={`font-mono text-lg font-black ${getTimeColor()}`}>
                {gameState.timeLeft}s
              </div>
            </div>
            
            <div className="w-px h-6 bg-slate-600" />
            
            <div className="flex gap-2">
              <Button
                onClick={playPauseAudio}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 h-9 w-9 p-0 shadow-md transform transition-all hover:scale-110"
                disabled={!gameState.currentSong?.preview_url}
              >
                {gameState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={toggleMute}
                size="sm"
                variant="outline"
                className="rounded-xl h-9 w-9 p-0 border-slate-600/50 bg-slate-700/50 hover:bg-slate-600/50 transform transition-all hover:scale-110"
              >
                {gameState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Current player section - center, slight tilt opposite direction */}
          <div className="flex-1 max-w-sm transform rotate-1">
            <div className="bg-gradient-to-r from-slate-800/60 to-indigo-800/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-indigo-400/20 shadow-lg">
              <div className="flex items-center justify-center gap-3 text-white">
                <div className="relative">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-lg" 
                    style={{ backgroundColor: currentTurnPlayer?.color }}
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{currentTurnPlayer?.name}</div>
                  <div className="text-xs text-indigo-200 -mt-1">now playing</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 px-3 py-1 rounded-full text-sm font-black">
                  {currentTurnPlayer?.score}/10
                </div>
              </div>
            </div>
          </div>

          {/* Room code - right aligned, no tilt for balance */}
          <div className="flex items-center gap-3 bg-slate-800/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-600/30 shadow-lg">
            <div className="relative">
              <Zap className="h-5 w-5 text-yellow-400" />
              <div className="absolute -inset-1 bg-yellow-400/20 rounded-full blur animate-pulse" />
            </div>
            <div className="text-white">
              <div className="text-xs text-slate-300">Room</div>
              <div className="font-mono font-bold text-lg -mt-1">{room?.lobby_code}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mystery card - more playful design */}
      {gameState.currentSong && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
          <div className="relative">
            {/* Card shadow/glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-3xl blur-xl scale-110" />
            
            <div 
              className="relative w-36 h-44 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-4 text-white border-2 border-white/20 transition-all duration-500 cursor-grab active:cursor-grabbing"
              style={{
                background: `linear-gradient(135deg, ${gameState.currentSong.cardColor || '#6366f1'} 0%, ${gameState.currentSong.cardColor || '#6366f1'}dd 50%, ${gameState.currentSong.cardColor || '#6366f1'}aa 100%)`,
                transform: gameState.draggedSong ? 
                  'scale(0.95) rotate(-8deg) translateY(8px)' : 
                  'scale(1) rotate(-2deg) translateY(0px)',
                opacity: gameState.transitioningTurn ? 0.7 : 1,
              }}
              draggable={isMyTurn}
              onDragStart={() => handleDragStart(gameState.currentSong!)}
            >
              {/* Card texture overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 rounded-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.3),transparent_70%)] rounded-3xl" />
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="relative mb-3">
                  <Music className="h-12 w-12 mx-auto opacity-90" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                    <span className="text-xs">?</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-bold opacity-90 tracking-wide">MYSTERY TRACK</div>
                  <div className="text-5xl font-black mb-2 drop-shadow-lg">?</div>
                  <div className="text-xs italic opacity-80 leading-tight">
                    {isMyTurn ? "Drag me to your timeline!" : `${currentTurnPlayer?.name} is thinking...`}
                  </div>
                </div>
              </div>

              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-white/50 rounded-tl-lg" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-white/50 rounded-br-lg" />
            </div>

            {/* Progress bar - more organic shape */}
            <div className="mt-4 flex items-center justify-center">
              <div className="relative w-36 h-3 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50">
                <div 
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 shadow-lg"
                  style={{ 
                    width: `${(gameState.timeLeft / 30) * 100}%`,
                    background: gameState.timeLeft > 20 ? 
                      'linear-gradient(90deg, #10b981, #34d399)' :
                      gameState.timeLeft > 10 ?
                      'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                      'linear-gradient(90deg, #ef4444, #f87171)'
                  }}
                />
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player timeline section */}
      {currentPlayer && (
        <div className="absolute bottom-40 left-0 right-0 z-20 px-6">
          <PlayerTimeline
            player={currentPlayer}
            isCurrent={isMyTurn}
            isDarkMode={true}
            draggedSong={gameState.draggedSong}
            hoveredPosition={gameState.placedCardPosition}
            confirmingPlacement={gameState.confirmingPlacement}
            handleDragOver={(e, position) => handleDragOver(e, currentPlayer.id, position)}
            handleDragLeave={handleDragLeave}
            handleDrop={(position) => handleDrop(currentPlayer.id, position)}
            confirmPlacement={confirmPlacement}
            cancelPlacement={cancelPlacement}
            transitioningTurn={gameState.transitioningTurn}
          />
        </div>
      )}

      {/* Other players - more scattered, natural layout */}
      <div className="absolute bottom-4 left-0 right-0 z-10 px-6">
        <div className="flex justify-center items-end gap-6 flex-wrap">
          {players.map((player, index) => {
            if (player.id === currentPlayer?.id) return null;
            
            const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'];
            const yOffsets = ['translate-y-1', '-translate-y-1', 'translate-y-0', '-translate-y-2'];
            
            return (
              <div 
                key={player.id} 
                className={`relative text-center transform transition-all hover:scale-105 ${rotations[index % rotations.length]} ${yOffsets[index % yOffsets.length]}`}
                onMouseEnter={() => isHost && setGameState(prev => ({ ...prev, showKickOptions: null }))}
              >
                <div 
                  className="flex items-center justify-center gap-3 bg-slate-800/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-600/30 mb-3 cursor-pointer shadow-lg transform transition-all hover:bg-slate-700/60"
                  onClick={() => toggleKickOptions(player.id)}
                >
                  <div className="relative">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: player.color }}
                    />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                      {player.score}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-white">{player.name}</span>
                </div>
                
                {isHost && gameState.showKickOptions === player.id && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                    <Button
                      onClick={() => onKickPlayer(player.id)}
                      size="sm"
                      className="text-xs h-8 px-3 bg-red-500 hover:bg-red-600 rounded-xl shadow-lg"
                    >
                      Kick Player
                    </Button>
                  </div>
                )}

                {/* Timeline preview - more organic */}
                <div className="flex justify-center gap-1">
                  {player.timeline.slice(0, 5).map((song, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-lg text-xs flex items-center justify-center font-bold shadow-md border border-white/20 transform transition-all hover:scale-110"
                      style={{ 
                        backgroundColor: song.cardColor,
                        transform: `rotate(${(i - 2) * 3}deg)`
                      }}
                    >
                      '{song.release_year.slice(-2)}
                    </div>
                  ))}
                  {player.timeline.length > 5 && (
                    <div className="w-7 h-7 rounded-lg bg-slate-600/80 text-xs flex items-center justify-center font-bold shadow-md border border-white/20 text-white transform rotate-12">
                      +{player.timeline.length - 5}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation buttons - more playful design */}
      {gameState.confirmingPlacement && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex gap-3 bg-slate-800/80 backdrop-blur-lg p-4 rounded-2xl border border-slate-600/30 shadow-xl">
            <Button
              onClick={confirmPlacement}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl px-4 h-10 font-bold shadow-lg transform transition-all hover:scale-105"
            >
              <Check className="h-4 w-4 mr-2" />
              Lock it in!
            </Button>
            <Button
              onClick={cancelPlacement}
              size="sm"
              className="bg-slate-600/80 hover:bg-slate-500/80 text-white rounded-xl px-4 h-10 font-bold border border-slate-500/50 shadow-lg transform transition-all hover:scale-105"
            >
              <X className="h-4 w-4 mr-2" />
              Nah, move it
            </Button>
          </div>
        </div>
      )}

      {/* Result overlay - more dramatic */}
      {gameState.cardResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="text-center space-y-6 p-8">
            {/* Animated result icon */}
            <div className="relative">
              <div className={`text-9xl mb-4 transform transition-all duration-1000 ${
                gameState.cardResult.correct ? 
                'text-emerald-400 animate-bounce' : 
                'text-rose-400 animate-pulse'
              }`}>
                {gameState.cardResult.correct ? '🎯' : '💥'}
              </div>
              
              {/* Particle effects */}
              {gameState.cardResult.correct && (
                <>
                  <div className="absolute top-0 left-0 text-3xl animate-ping" style={{animationDelay: '0.5s'}}>✨</div>
                  <div className="absolute top-0 right-0 text-2xl animate-ping" style={{animationDelay: '1s'}}>🎉</div>
                  <div className="absolute bottom-0 left-0 text-4xl animate-ping" style={{animationDelay: '1.5s'}}>⭐</div>
                  <div className="absolute bottom-0 right-0 text-2xl animate-ping" style={{animationDelay: '2s'}}>🎊</div>
                </>
              )}
            </div>
            
            {/* Result text */}
            <div className="space-y-4">
              <div className={`text-5xl font-black ${
                gameState.cardResult.correct ? 
                'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400' : 
                'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400'
              }`}>
                {gameState.cardResult.correct ? 'SPOT ON!' : 'WHOOPS!'}
              </div>
              
              <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-600/30 max-w-md">
                <div className="text-xl font-bold text-white mb-2">
                  {gameState.cardResult.song.deezer_title}
                </div>
                <div className="text-lg text-slate-300 mb-3">
                  by {gameState.cardResult.song.deezer_artist}
                </div>
                <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                  {gameState.cardResult.song.release_year}
                </div>
              </div>
              
              <div className={`text-lg font-medium ${
                gameState.cardResult.correct ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {gameState.cardResult.correct ? 
                  'Your music timeline skills are on fire! 🔥' : 
                  'Close one! Keep building that timeline! 🎵'
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
