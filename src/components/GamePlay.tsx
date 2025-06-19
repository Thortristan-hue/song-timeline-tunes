import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Clock, Volume2, VolumeX, Trophy, ArrowLeft, Zap, Star, Timer, Check, X, Users } from 'lucide-react';
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
}

export function GamePlay({ room, players, currentPlayer, isHost, songs, onEndGame }: GamePlayProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [gameState, setGameState] = useState({
    currentTurn: 0,
    currentSong: null as Song | null,
    timeLeft: 30,
    isPlaying: false,
    draggedSong: null as Song | null,
    hoveredPosition: null as number | null,
    confirmingPlacement: null as { song: Song; position: number } | null,
    cardResult: null as { correct: boolean; song: Song } | null,
    animatingCard: null as { song: Song; fromPos: [number, number]; toPos: [number, number] } | null,
    transitioningTurn: false,
    winner: null as Player | null,
    isMuted: false,
    availableSongs: [...songs],
    usedSongs: [] as Song[]
  });

  const currentTurnPlayer = players[gameState.currentTurn % players.length];
  const isMyTurn = currentPlayer?.id === currentTurnPlayer?.id;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.isPlaying && gameState.timeLeft > 0) {
      interval = setInterval(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.timeLeft]);

  // Card result auto-clear
  useEffect(() => {
    if (gameState.cardResult) {
      const timeout = setTimeout(() => {
        setGameState(prev => ({ ...prev, cardResult: null }));
        nextTurn();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [gameState.cardResult]);

  // Smooth transition progress tracking
  useEffect(() => {
    if (gameState.transitioningTurn) {
      const startTime = Date.now();
      const duration = 1200;
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress < 1) {
          requestAnimationFrame(updateProgress);
        }
      };
      
      requestAnimationFrame(updateProgress);
    }
  }, [gameState.transitioningTurn]);

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
      placedCardPosition: null
    }));

    toast({
      title: `${currentTurnPlayer?.name}'s Turn`,
      description: "Listen to the song and place it on the timeline!",
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
        currentTurn: (prev.currentTurn + 1) % prev.players.length,
        timeLeft: 30,
        transitioningTurn: false
      }));
      startNewTurn();
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

  const handleDragOver = (e: React.DragEvent, position: number) => {
    if (!isMyTurn) return;
    e.preventDefault();
    setGameState(prev => ({ ...prev, hoveredPosition: position }));
  };

  const handleDragLeave = () => {
    setGameState(prev => ({ ...prev, hoveredPosition: null }));
  };

  const handleDrop = (position: number) => {
    if (!isMyTurn || !gameState.draggedSong || !currentPlayer) return;

    setGameState(prev => ({
      ...prev,
      confirmingPlacement: { song: prev.draggedSong!, position },
      hoveredPosition: null,
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
      cardResult: { correct: isCorrect, song }
    }));

    const winner = updatedPlayers.find(p => p.score >= 10);
    if (winner) {
      setGameState(prev => ({ ...prev, winner }));
    }
  };

  const cancelPlacement = () => {
    setGameState(prev => ({
      ...prev,
      confirmingPlacement: null
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
    onEndGame();
  };

  const getTimeColor = () => {
    if (gameState.timeLeft > 20) return "text-green-400";
    if (gameState.timeLeft > 10) return "text-yellow-400";
    return "text-red-400";
  };

  const getProgressColor = () => {
    const percentage = (gameState.timeLeft / 30) * 100;
    if (percentage > 66) return "bg-gradient-to-r from-green-500 to-emerald-500";
    if (percentage > 33) return "bg-gradient-to-r from-yellow-500 to-orange-500";
    return "bg-gradient-to-r from-red-500 to-rose-500";
  };

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  if (gameState.winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        
        <Card className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent border-2 border-white/30 p-12 text-center backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-4 left-4 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
            <div className="absolute top-8 right-8 w-2 h-2 bg-pink-400 rounded-full animate-ping delay-300" />
            <div className="absolute bottom-6 left-8 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping delay-700" />
            <div className="absolute bottom-4 right-4 w-2 h-2 bg-purple-400 rounded-full animate-ping delay-1000" />
          </div>
          
          <div className="relative z-10">
            <div className="relative mb-6">
              <Trophy className="h-20 w-20 text-yellow-400 mx-auto animate-bounce drop-shadow-2xl" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-spin" />
            </div>
            
            <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
              🎉 {gameState.winner.name} Wins! 🎉
            </h1>
            
            <div className="flex items-center justify-center gap-3 mb-8">
              <Star className="h-6 w-6 text-yellow-400 animate-spin" />
              <p className="text-2xl text-purple-200 font-bold">
                Final Score: <span className="text-yellow-400">{gameState.winner.score}/10</span>
              </p>
              <Star className="h-6 w-6 text-yellow-400 animate-spin" />
            </div>
            
            <Button 
              onClick={onEndGame} 
              className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-bold px-8 py-4 text-lg rounded-2xl shadow-2xl border-2 border-white/20 transition-all duration-300 hover:scale-105"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Back to Menu
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* 3D Environmental Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute bottom-0 left-0 right-0 h-3/4 opacity-20"
          style={{
            background: `
              radial-gradient(ellipse at center bottom, rgba(147,51,234,0.4) 0%, transparent 70%),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            transform: 'perspective(1000px) rotateX(60deg)',
            transformOrigin: 'bottom',
            transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
        
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-300 rounded-full opacity-30"
            style={{
              left: `${20 + (i * 7)}%`,
              top: `${30 + Math.sin(i) * 20}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Audio element */}
      {gameState.currentSong?.preview_url && (
        <audio
          ref={audioRef}
          src={gameState.currentSong.preview_url}
          onEnded={() => setGameState(prev => ({ ...prev, isPlaying: false }))}
          onPlay={() => setGameState(prev => ({ ...prev, isPlaying: true }))}
          onPause={() => setGameState(prev => ({ ...prev, isPlaying: false }))}
        />
      )}

      {/* Game HUD */}
      <div className="absolute top-6 left-6 right-6 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <div className="flex items-center gap-3 text-white">
                <Clock className="h-4 w-4" />
                <span className={`font-mono text-lg font-bold ${getTimeColor()}`}>{gameState.timeLeft}s</span>
              </div>
            </div>
            
            <Button
              onClick={playPauseAudio}
              className="rounded-full bg-purple-600 hover:bg-purple-700 w-12 h-12 shadow-lg transition-all duration-300 hover:scale-110"
              disabled={!gameState.currentSong?.preview_url}
            >
              {gameState.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button
              onClick={toggleMute}
              variant="outline"
              className="rounded-full border-white/20 text-white hover:bg-white/10 w-12 h-12"
            >
              {gameState.isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>

          <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
            <div className="flex items-center gap-3 text-white">
              <div 
                className="w-4 h-4 rounded-full ring-2 ring-white/50" 
                style={{ backgroundColor: currentTurnPlayer?.color }}
              />
              <span className="font-semibold">{currentTurnPlayer?.name}'s Turn</span>
              <Badge className="bg-purple-600 text-white">
                {currentTurnPlayer?.score}/10
              </Badge>
            </div>
          </div>
          
          <Button
            onClick={onEndGame}
            variant="outline"
            className="bg-black/40 backdrop-blur-md border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            End Game
          </Button>
        </div>
      </div>

      {/* Mystery Card */}
      {gameState.currentSong && (
        <div 
          className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30"
          style={{
            opacity: gameState.transitioningTurn ? 0.7 : 1,
            filter: gameState.transitioningTurn ? 'blur(2px)' : 'blur(0px)',
            transition: 'all 0.5s ease'
          }}
        >
          <div 
            className="w-40 h-40 rounded-xl shadow-2xl cursor-move flex flex-col items-center justify-center p-4 text-white relative transition-all duration-500 group"
            style={{
              backgroundColor: gameState.currentSong.cardColor || '#6366f1',
              transform: gameState.draggedSong ? 'scale(0.8) rotate(5deg)' : 'scale(1) rotate(0deg)',
              animation: 'mysteryFloat 4s ease-in-out infinite'
            }}
            draggable={isMyTurn}
            onDragStart={() => handleDragStart(gameState.currentSong!)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
            <Music className="h-16 w-16 mb-3 opacity-80" />
            <div className="text-center">
              <div className="text-sm font-bold opacity-90 mb-1">Mystery Song</div>
              <div className="text-5xl font-black mb-2">?</div>
              <div className="text-xs italic opacity-75">{isMyTurn ? "Drag to timeline" : "Wait for your turn"}</div>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
      )}

      {/* Current Player's Timeline */}
      {currentPlayer && (
        <PlayerTimeline
          player={currentPlayer}
          isCurrent={isMyTurn}
          isDarkMode={true}
          draggedSong={gameState.draggedSong}
          hoveredPosition={gameState.hoveredPosition}
          confirmingPlacement={gameState.confirmingPlacement}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          confirmPlacement={confirmPlacement}
          cancelPlacement={cancelPlacement}
          transitioningTurn={gameState.transitioningTurn}
        />
      )}

      {/* Other Players Display */}
      <div className="absolute bottom-4 left-0 right-0 z-20">
        <div className="flex justify-center items-center gap-8 px-8">
          {players.map((player, index) => {
            if (player.id === currentPlayer?.id) return null;
            
            const slideOffset = gameState.transitioningTurn 
              ? Math.sin(easeInOutCubic(transitionProgress) * 20 
              : 0;
            
            return (
              <div
                key={player.id}
                className="transition-all duration-1200 ease-out"
                style={{
                  transform: `translateY(${slideOffset}px) scale(${gameState.transitioningTurn ? 0.95 : 1})`,
                  opacity: gameState.transitioningTurn ? 0.7 : 1
                }}
              >
                <div className="text-center">
                  <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 mb-3 shadow-xl">
                    <div className="flex items-center gap-3 text-white text-base">
                      <div 
                        className="w-4 h-4 rounded-full ring-2 ring-white/50" 
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="font-semibold">{player.name}</span>
                      <Badge className="bg-purple-600 text-white text-sm">
                        {player.score}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-center" style={{ gap: '-8px' }}>
                    {player.timeline.slice(0, 5).map((song, songIndex) => (
                      <div
                        key={songIndex}
                        className="w-7 h-7 rounded text-xs flex items-center justify-center text-white font-bold shadow-lg border border-white/20 transition-all duration-300 hover:scale-110"
                        style={{ 
                          backgroundColor: song.cardColor,
                          marginLeft: songIndex > 0 ? '-4px' : '0',
                          zIndex: player.timeline.length - songIndex
                        }}
                      >
                        {song.release_year.slice(-2)}
                      </div>
                    ))}
                    {player.timeline.length > 5 && (
                      <div 
                        className="w-7 h-7 rounded bg-white/30 text-xs flex items-center justify-center text-white font-bold border border-white/20"
                        style={{ 
                          marginLeft: '-4px',
                          zIndex: 1
                        }}
                      >
                        +{player.timeline.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Result Animation */}
      {gameState.cardResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50">
          <div 
            className="text-center transform transition-all duration-1000"
            style={{
              animation: 'resultPop 2s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }}
          >
            <div className={`text-9xl mb-6 ${gameState.cardResult.correct ? 'text-green-400' : 'text-red-400'}`}>
              {gameState.cardResult.correct ? '✓' : '✗'}
            </div>
            <div className="text-5xl font-bold text-white mb-4">
              {gameState.cardResult.correct ? 'PERFECT!' : 'NOT QUITE!'}
            </div>
            <div className="text-xl text-white/80">
              {gameState.cardResult.song.deezer_title} • {gameState.cardResult.song.release_year}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes mysteryFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(2deg); }
          50% { transform: translateY(-5px) rotate(-1deg); }
          75% { transform: translateY(-15px) rotate(1deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes resultPop {
          0% { 
            transform: scale(0) rotate(180deg); 
            opacity: 0; 
            filter: blur(10px);
          }
          50% { 
            transform: scale(1.2) rotate(0deg); 
            opacity: 1; 
            filter: blur(2px);
          }
          100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 1; 
            filter: blur(0px);
          }
        }
      `}</style>
    </div>
  );
}
