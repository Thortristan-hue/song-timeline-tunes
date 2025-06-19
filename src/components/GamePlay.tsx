
import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Clock, Volume2, VolumeX, Trophy, ArrowLeft } from 'lucide-react';
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

  if (gameState.winner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <Card className="bg-white/10 border-white/20 p-8 text-center">
          <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">🎉 {gameState.winner.name} Wins! 🎉</h1>
          <p className="text-xl text-purple-200 mb-6">Final Score: {gameState.winner.score}/10</p>
          <Button onClick={onEndGame} className="bg-gradient-to-r from-green-500 to-emerald-500">
            Back to Menu
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
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

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-50">
        <div className="flex items-center justify-between">
          <Button
            onClick={onEndGame}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            End Game
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400">
              Room: {room?.lobby_code}
            </Badge>
            <Button
              onClick={toggleMute}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {gameState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Current Song Card */}
      {gameState.currentSong && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <Card className="bg-white/10 border-white/20 p-6 backdrop-blur-xl">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Music className="h-8 w-8 text-purple-400" />
                <div>
                  <h3 className="text-2xl font-bold text-white">Mystery Song</h3>
                  <p className="text-purple-200">Drag to {currentTurnPlayer?.name}'s timeline</p>
                </div>
              </div>

              <div
                className="w-32 h-32 rounded-xl shadow-2xl flex flex-col items-center justify-center p-4 text-white text-sm mb-4 cursor-grab active:cursor-grabbing mx-auto"
                style={{ backgroundColor: gameState.currentSong.cardColor }}
                draggable={isMyTurn}
                onDragStart={() => handleDragStart(gameState.currentSong!)}
              >
                <div className="text-3xl font-black">{gameState.currentSong.release_year}</div>
                <div className="text-xs mt-2 text-center font-semibold">
                  Drag me!
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  onClick={playPauseAudio}
                  disabled={!gameState.currentSong.preview_url}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {gameState.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <div className="flex items-center gap-2 text-white">
                  <Clock className="h-4 w-4" />
                  <span className="font-bold text-lg">{gameState.timeLeft}s</span>
                </div>
              </div>

              <Progress value={(gameState.timeLeft / 30) * 100} className="w-64" />
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

      {/* Players Scores */}
      <div className="absolute top-20 right-4 space-y-2 z-40">
        {players.map((player, index) => (
          <Card
            key={player.id}
            className={cn(
              "bg-white/10 border-white/20 p-3 backdrop-blur-md",
              currentTurnPlayer?.id === player.id && "ring-2 ring-purple-400"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <div>
                <div className="text-white font-medium">{player.name}</div>
                <div className="text-purple-200 text-sm">{player.score}/10 points</div>
              </div>
              {currentTurnPlayer?.id === player.id && (
                <Badge className="bg-purple-500 text-white text-xs">
                  Turn
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Turn indicator */}
      {!isMyTurn && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40">
          <Card className="bg-white/10 border-white/20 p-4 backdrop-blur-md">
            <p className="text-white text-center">
              <span className="font-bold text-purple-300">{currentTurnPlayer?.name}</span> is playing...
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
