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
    if (gameState.timeLeft > 20) return "text-green-400";
    if (gameState.timeLeft > 10) return "text-yellow-400";
    return "text-red-400";
  };

  const getProgressColor = () => {
    const percentage = (gameState.timeLeft / 30) * 100;
    if (percentage > 66) return "bg-green-500";
    if (percentage > 33) return "bg-yellow-500";
    return "bg-red-500";
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Winner screen remains unchanged */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-purple-900/50 to-indigo-900/30" />

      {gameState.currentSong?.preview_url && (
        <audio
          ref={audioRef}
          src={gameState.currentSong.preview_url}
          onEnded={() => setGameState(prev => ({ ...prev, isPlaying: false }))}
          onPlay={() => setGameState(prev => ({ ...prev, isPlaying: true }))}
          onPause={() => setGameState(prev => ({ ...prev, isPlaying: false }))}
        />
      )}

      <div className="absolute top-4 left-4 right-4 z-40">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <Clock className="h-4 w-4 text-purple-300" />
            <span className={`font-mono font-bold ${getTimeColor()}`}>
              {gameState.timeLeft}s
            </span>
            
            <Button
              onClick={playPauseAudio}
              size="sm"
              className="rounded-full bg-purple-600 hover:bg-purple-700 h-8 w-8 p-0"
              disabled={!gameState.currentSong?.preview_url}
            >
              {gameState.isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            
            <Button
              onClick={toggleMute}
              size="sm"
              variant="outline"
              className="rounded-full h-8 w-8 p-0 border-white/20"
            >
              {gameState.isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>
          </div>

          <div className="flex-1 max-w-md">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-white">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: currentTurnPlayer?.color }}
                />
                <span className="font-medium">{currentTurnPlayer?.name}'s Turn</span>
                <Badge className="bg-purple-600 text-white text-xs h-5 px-2">
                  {currentTurnPlayer?.score}/10
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <Zap className="h-4 w-4 text-purple-300" />
            <span className="text-sm font-medium">Room: {room?.lobby_code}</span>
          </div>
        </div>
      </div>

      {gameState.currentSong && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30">
          <div 
            className="w-32 h-32 rounded-lg shadow-xl flex flex-col items-center justify-center p-3 text-white relative group transition-all duration-300"
            style={{
              backgroundColor: gameState.currentSong.cardColor || '#6366f1',
              transform: gameState.draggedSong ? 'scale(0.9) rotate(3deg)' : 'scale(1) rotate(0deg)',
              opacity: gameState.transitioningTurn ? 0.7 : 1,
            }}
            draggable={isMyTurn}
            onDragStart={() => handleDragStart(gameState.currentSong!)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg" />
            <Music className="h-10 w-10 mb-2 opacity-80" />
            <div className="text-center relative z-10">
              <div className="text-xs font-bold opacity-90 mb-1">Mystery Song</div>
              <div className="text-4xl font-black mb-1">?</div>
              <div className="text-[10px] italic opacity-75">
                {isMyTurn ? "Drag to timeline" : "Waiting..."}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <Progress 
              value={(gameState.timeLeft / 30) * 100} 
              className="w-32 h-2 bg-black/30 rounded-full overflow-hidden"
            >
              <div 
                className={cn("h-full rounded-full transition-all duration-1000", getProgressColor())}
                style={{ width: `${(gameState.timeLeft / 30) * 100}%` }}
              />
            </Progress>
          </div>
        </div>
      )}

      {currentPlayer && (
        <div className="absolute bottom-40 left-0 right-0 z-20 px-4">
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

      <div className="absolute bottom-4 left-0 right-0 z-10 px-4">
        <div className="flex justify-center items-center gap-4 flex-wrap">
          {players.map((player) => {
            if (player.id === currentPlayer?.id) return null;
            
            return (
              <div 
                key={player.id} 
                className="relative text-center"
                onMouseEnter={() => isHost && setGameState(prev => ({ ...prev, showKickOptions: null }))}
              >
                <div 
                  className="flex items-center justify-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 mb-2 cursor-pointer"
                  onClick={() => toggleKickOptions(player.id)}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="text-xs font-medium">{player.name}</span>
                  <span className="text-xs font-bold text-purple-300">{player.score}</span>
                </div>
                
                {isHost && gameState.showKickOptions === player.id && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                    <Button
                      onClick={() => onKickPlayer(player.id)}
                      size="sm"
                      variant="destructive"
                      className="text-xs h-7 px-2"
                    >
                      Kick Player
                    </Button>
                  </div>
                )}

                <div className="flex justify-center -space-x-2">
                  {player.timeline.slice(0, 4).map((song, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-bold shadow border border-white/20"
                      style={{ backgroundColor: song.cardColor }}
                    >
                      {song.release_year.slice(-2)}
                    </div>
                  ))}
                  {player.timeline.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold shadow border border-white/20">
                      +{player.timeline.length - 4}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {gameState.confirmingPlacement && (
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex gap-2 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-lg">
            <Button
              onClick={confirmPlacement}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 h-8"
            >
              <Check className="h-3 w-3 mr-1" />
              Confirm
            </Button>
            <Button
              onClick={cancelPlacement}
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 rounded-lg px-3 h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {gameState.cardResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="text-center">
            <div className={`text-8xl mb-4 ${gameState.cardResult.correct ? 'text-green-400' : 'text-red-400'}`}>
              {gameState.cardResult.correct ? '✓' : '✗'}
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {gameState.cardResult.correct ? 'CORRECT!' : 'WRONG!'}
            </div>
            <div className="text-sm text-white/80">
              {gameState.cardResult.song.deezer_title} • {gameState.cardResult.song.release_year}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
