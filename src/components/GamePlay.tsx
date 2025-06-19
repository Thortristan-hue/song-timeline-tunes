import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Clock, Volume2, VolumeX, Trophy, ArrowLeft, Zap, Star, Timer } from 'lucide-react';
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
    activeDrag: null as { playerId: string; position: number; song: Song | null } | null,
    hoveredCard: null as string | null,
    confirmingPlacement: null as { song: Song; position: number } | null,
    placedCardPosition: null as number | null,
    winner: null as Player | null,
    isMuted: false,
    availableSongs: [...songs],
    usedSongs: [] as Song[]
  });

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
      placedCardPosition: null
    }));

    toast({
      title: `${currentTurnPlayer?.name}'s Turn`,
      description: "Listen to the song and place it on the timeline!",
    });
  };

  const handleTimeUp = () => {
    toast({
      title: "Time's up!",
      description: "Moving to next player...",
      variant: "destructive",
    });
    
    nextTurn();
  };

  const nextTurn = () => {
    setGameState(prev => ({
      ...prev,
      currentTurn: prev.currentTurn + 1,
      confirmingPlacement: null,
      placedCardPosition: null
    }));
    
    setTimeout(() => {
      startNewTurn();
    }, 1000);
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

    // Check if placement is correct
    const newTimeline = [...player.timeline];
    newTimeline.splice(position, 0, song);
    
    const isCorrect = checkTimelineOrder(newTimeline);
    
    // Update player's timeline and score
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

    // Remove song from available songs
    setGameState(prev => ({
      ...prev,
      availableSongs: prev.availableSongs.filter(s => s.id !== song.id),
      usedSongs: [...prev.usedSongs, song],
      confirmingPlacement: null,
      placedCardPosition: null
    }));

    toast({
      title: isCorrect ? "Correct!" : "Incorrect!",
      description: isCorrect ? 
        `${song.deezer_title} by ${song.deezer_artist} (${song.release_year}) placed correctly!` :
        `${song.deezer_title} by ${song.deezer_artist} (${song.release_year}) - wrong position!`,
      variant: isCorrect ? "default" : "destructive",
    });

    // Check for winner
    const winner = updatedPlayers.find(p => p.score >= 10);
    if (winner) {
      setGameState(prev => ({ ...prev, winner }));
      toast({
        title: "Game Over!",
        description: `${winner.name} wins with ${winner.score} points!`,
      });
      return;
    }

    // Continue to next turn
    setTimeout(() => {
      nextTurn();
    }, 2000);
  };

  const cancelPlacement = () => {
    setGameState(prev => ({
      ...prev,
      confirmingPlacement: null,
      placedCardPosition: null
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

  if (gameState.winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        
        <Card className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent border-2 border-white/30 p-12 text-center backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
          {/* Celebration effects */}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/30 via-transparent to-cyan-900/30" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
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

      {/* Enhanced Header */}
      <div className="absolute top-4 left-4 right-4 z-50">
        <div className="flex items-center justify-between">
          <Button
            onClick={onEndGame}
            variant="outline"
            className="bg-gradient-to-r from-black/60 to-black/40 border-white/30 text-white hover:bg-black/70 backdrop-blur-xl rounded-xl px-6 py-3 shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            End Game
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border-purple-400/50 backdrop-blur-xl px-4 py-2 font-bold shadow-lg"
            >
              <Zap className="h-3 w-3 mr-1" />
              Room: {room?.lobby_code}
            </Badge>
            <Button
              onClick={toggleMute}
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-black/60 to-black/40 border-white/30 text-white hover:bg-black/70 backdrop-blur-xl rounded-xl shadow-2xl transition-all duration-300 hover:scale-105"
            >
              {gameState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Current Song Card */}
      {gameState.currentSong && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <Card className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent border-2 border-white/30 p-8 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0">
              <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
              <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping delay-500" />
              <div className="absolute top-1/2 left-6 w-1 h-1 bg-pink-400 rounded-full animate-ping delay-1000" />
            </div>
            
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="relative">
                  <Music className="h-10 w-10 text-purple-400 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="text-3xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                    Mystery Song
                  </h3>
                  <p className="text-purple-200 font-medium">
                    Drag to <span className="text-cyan-300 font-bold">{currentTurnPlayer?.name}'s</span> timeline
                  </p>
                </div>
              </div>

              <div className="relative group mb-6">
                <div
                  className="w-40 h-40 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-6 text-white text-lg cursor-grab active:cursor-grabbing mx-auto transition-all duration-500 hover:scale-110 hover:rotate-3 overflow-hidden"
                  style={{ backgroundColor: gameState.currentSong.cardColor }}
                  draggable={isMyTurn}
                  onDragStart={() => handleDragStart(gameState.currentSong!)}
                >
                  {/* Card background effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  
                  <div className="relative z-10 text-center">
                    <div className="text-4xl font-black mb-2 bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
                      {gameState.currentSong.release_year}
                    </div>
                    <div className="text-sm font-bold bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1">
                      Drag & Drop!
                    </div>
                  </div>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
                </div>
                
                {/* Drag indicator */}
                {isMyTurn && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-bounce">
                    Drag Me!
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-6 mb-6">
                <Button
                  onClick={playPauseAudio}
                  disabled={!gameState.currentSong.preview_url}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl border-2 border-white/20 transition-all duration-300 hover:scale-110"
                >
                  {gameState.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
                  <Timer className="h-5 w-5 text-cyan-400" />
                  <span className={cn("font-black text-2xl transition-colors duration-300", getTimeColor())}>
                    {gameState.timeLeft}s
                  </span>
                </div>
              </div>

              <div className="relative">
                <Progress 
                  value={(gameState.timeLeft / 30) * 100} 
                  className="w-80 h-3 bg-black/30 rounded-full overflow-hidden border border-white/20"
                />
                <div 
                  className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-1000", getProgressColor())}
                  style={{ width: `${(gameState.timeLeft / 30) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Current Player's Timeline */}
      {currentPlayer && (
        <PlayerTimeline
          player={currentPlayer}
          isCurrent={isMyTurn}
          isDarkMode={true}
          draggedSong={gameState.draggedSong}
          activeDrag={gameState.activeDrag}
          hoveredCard={gameState.hoveredCard}
          throwingCard={null}
          confirmingPlacement={gameState.confirmingPlacement}
          placedCardPosition={gameState.placedCardPosition}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          setHoveredCard={(id) => setGameState(prev => ({ ...prev, hoveredCard: id }))}
          currentPlayerId={currentPlayer.id}
          confirmPlacement={confirmPlacement}
          cancelPlacement={cancelPlacement}
        />
      )}

      {/* Enhanced Players Scores */}
      <div className="absolute top-20 right-4 space-y-3 z-40">
        {players.map((player, index) => (
          <Card
            key={player.id}
            className={cn(
              "relative bg-gradient-to-r from-white/10 to-white/5 border border-white/30 p-4 backdrop-blur-xl rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden",
              currentTurnPlayer?.id === player.id && "ring-2 ring-purple-400 shadow-purple-400/30"
            )}
          >
            {currentTurnPlayer?.id === player.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse rounded-2xl" />
            )}
            
            <div className="relative flex items-center gap-4">
              <div
                className="w-5 h-5 rounded-full shadow-lg border-2 border-white/30"
                style={{ backgroundColor: player.color }}
              />
              <div className="flex-1">
                <div className="text-white font-bold text-lg">{player.name}</div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-purple-200 font-medium">
                    {player.score}/10 points
                  </span>
                </div>
              </div>
              {currentTurnPlayer?.id === player.id && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  Turn
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Enhanced Turn indicator */}
      {!isMyTurn && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40">
          <Card className="bg-gradient-to-r from-white/10 to-white/5 border-2 border-white/30 p-6 backdrop-blur-2xl rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Clock className="h-6 w-6 text-purple-400 animate-spin" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping" />
              </div>
              <p className="text-white text-lg font-medium">
                <span className="font-bold text-purple-300 text-xl">{currentTurnPlayer?.name}</span> is placing their song...
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
