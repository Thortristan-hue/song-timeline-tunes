import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Clock, Volume2, VolumeX, Trophy, ArrowLeft, Zap, Star, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlayerTimeline } from '@/components/PlayerTimeline';
import { MysteryCard } from '@/components/MysteryCard';
import { useToast } from '@/components/ui/use-toast';
import { Song, Player, GameState } from '@/types/game';
import { cn } from '@/lib/utils';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameLogic } from '@/hooks/useGameLogic';

interface GamePlayProps {
  room: any;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  onSetCurrentSong: (song: Song) => Promise<void>;
  customSongs: Song[];
}

export function GamePlay({ 
  room, 
  players, 
  currentPlayer, 
  isHost, 
  onPlaceCard,
  onSetCurrentSong,
  customSongs 
}: GamePlayProps) {
  const { toast } = useToast();
  const soundEffects = useSoundEffects();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use the game logic hook with room data
  const { gameState, setIsPlaying, getCurrentPlayer, initializeGame, startNewTurn } = useGameLogic(
    room?.id,
    players,
    room,
    onSetCurrentSong,
    async (songs: Song[]) => {
      // This callback will be called to assign starting cards
      if (room?.id) {
        try {
          // Import gameService here to avoid circular dependencies
          const { gameService } = await import('@/services/gameService');
          await gameService.assignStartingCards(room.id, songs);
        } catch (error) {
          console.error('Failed to assign starting cards:', error);
        }
      }
    }
  );
  
  const [localGameState, setLocalGameState] = useState({
    draggedSong: null as Song | null,
    activeDrag: null as { playerId: string; position: number; song: Song | null } | null,
    hoveredCard: null as string | null,
    confirmingPlacement: null as { song: Song; position: number } | null,
    placedCardPosition: null as number | null,
    isMuted: false,
    cardResult: null as { correct: boolean; song: Song } | null,
    showKickOptions: null as string | null,
    mysteryCardRevealed: false
  });

  // Initialize game when component mounts
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Filter out host from players when determining current turn
  const activePlayers = players.filter(player => player.id !== room?.host_id);
  const currentTurnPlayer = getCurrentPlayer();
  const isMyTurn = currentPlayer?.id === currentTurnPlayer?.id;

  // Timer effect
  useEffect(() => {
    if (gameState.timeLeft > 0 && gameState.currentSong && !localGameState.confirmingPlacement) {
      const timer = setTimeout(() => {
        // Handle timer in gameState if needed
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.timeLeft, gameState.currentSong, localGameState.confirmingPlacement]);

  const playPauseAudio = () => {
    if (!audioRef.current || !gameState.currentSong?.preview_url) {
      toast({
        title: "Audio Error",
        description: "No audio available for this song",
        variant: "destructive",
      });
      return;
    }

    try {
      if (gameState.isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              console.error('Error playing audio:', error);
              toast({
                title: "Audio Error",
                description: "Could not play the song preview. Try a different browser or check your audio settings.",
                variant: "destructive",
              });
            });
        }
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      toast({
        title: "Audio Error",
        description: "Failed to control audio playback",
        variant: "destructive",
      });
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !localGameState.isMuted;
    }
    setLocalGameState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const handleDragStart = (song: Song) => {
    if (!isMyTurn) return;
    setLocalGameState(prev => ({ ...prev, draggedSong: song }));
  };

  const handleDragOver = (e: React.DragEvent, playerId: string, position: number) => {
    if (!isMyTurn || playerId !== currentPlayer?.id) return;
    
    e.preventDefault();
    setLocalGameState(prev => ({
      ...prev,
      activeDrag: { playerId, position, song: prev.draggedSong }
    }));
  };

  const handleDragLeave = () => {
    setLocalGameState(prev => ({ ...prev, activeDrag: null }));
  };

  const handleDrop = (playerId: string, position: number) => {
    if (!isMyTurn || !localGameState.draggedSong || playerId !== currentPlayer?.id) return;

    setLocalGameState(prev => ({
      ...prev,
      confirmingPlacement: { song: prev.draggedSong!, position },
      placedCardPosition: position,
      activeDrag: null,
      draggedSong: null
    }));
  };

  const confirmPlacement = async () => {
    if (!localGameState.confirmingPlacement || !currentPlayer) return;

    const { song, position } = localGameState.confirmingPlacement;

    // First reveal the mystery card
    setLocalGameState(prev => ({ ...prev, mysteryCardRevealed: true }));

    try {
      const result = await onPlaceCard(song, position);
      
      setLocalGameState(prev => ({
        ...prev,
        confirmingPlacement: null,
        placedCardPosition: null,
        cardResult: { correct: result.success, song }
      }));

      if (result.success) {
        soundEffects.playCardSuccess();
      } else {
        soundEffects.playCardError();
      }

      toast({
        title: result.success ? "Correct!" : "Incorrect!",
        description: result.success ? 
          `${song.deezer_title} by ${song.deezer_artist} (${song.release_year}) placed correctly!` :
          `${song.deezer_title} by ${song.deezer_artist} (${song.release_year}) - wrong position!`,
        variant: result.success ? "default" : "destructive",
      });

      // Show result for 2 seconds, then start new turn
      setTimeout(() => {
        setLocalGameState(prev => ({ ...prev, cardResult: null, mysteryCardRevealed: false }));
        startNewTurn();
      }, 2000);

    } catch (error) {
      console.error('Error placing card:', error);
      toast({
        title: "Error",
        description: "Failed to place card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelPlacement = () => {
    setLocalGameState(prev => ({
      ...prev,
      confirmingPlacement: null,
      placedCardPosition: null,
      draggedSong: gameState.currentSong
    }));
  };

  const getTimeColor = () => {
    if (gameState.timeLeft > 20) return "text-emerald-300";
    if (gameState.timeLeft > 10) return "text-amber-300";
    return "text-rose-300";
  };

  const toggleKickOptions = (playerId: string) => {
    if (!isHost || playerId === currentPlayer?.id) return;
    setLocalGameState(prev => ({
      ...prev,
      showKickOptions: prev.showKickOptions === playerId ? null : playerId
    }));
  };

  // Check for winner
  const winner = players.find(player => player.score >= 10);
  if (winner) {
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
                🏆 {winner.name} Takes the Crown! 🏆
              </div>
              <div className="text-xl text-gray-300 font-medium">
                Final Score: <span className="text-yellow-400 font-bold text-2xl">{winner.score}</span> points
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
      
      {/* Audio element - with better error handling */}
      {gameState.currentSong?.preview_url && (
        <audio
          ref={audioRef}
          src={gameState.currentSong.preview_url}
          crossOrigin="anonymous"
          preload="metadata"
          onError={(e) => {
            console.error('Audio error:', e);
            console.log('Failed to load:', gameState.currentSong?.preview_url);
            toast({
              title: "Audio Error", 
              description: "Could not load song preview",
              variant: "destructive"
            });
          }}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onCanPlay={() => console.log('Audio ready to play')}
        />
      )}

      {/* Header with better contrast */}
      <div className="absolute top-6 left-4 right-4 z-40">
        <div className="flex justify-between items-start gap-6">
          {/* Timer section - left aligned, slightly tilted */}
          <div className="flex items-center gap-4 bg-slate-800/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-600/50 shadow-lg transform -rotate-1">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Clock className="h-5 w-5 text-blue-300" />
              </div>
              <div className="font-mono text-lg font-black text-emerald-300">
                ∞
              </div>
            </div>
            
            <div className="w-px h-6 bg-slate-500" />
            
            <div className="flex gap-2">
              <Button
                onClick={playPauseAudio}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 h-9 w-9 p-0 shadow-md transform transition-all hover:scale-110"
                disabled={!gameState.currentSong?.preview_url || !isMyTurn}
              >
                {gameState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={toggleMute}
                size="sm"
                variant="outline"
                className="rounded-xl h-9 w-9 p-0 border-slate-600/50 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 transform transition-all hover:scale-110"
                disabled={!isMyTurn}
              >
                {localGameState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Current player section - better contrast */}
          <div className="flex-1 max-w-sm transform rotate-1">
            <div className="bg-gradient-to-r from-slate-800/80 to-indigo-800/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-indigo-400/30 shadow-lg">
              <div className="flex items-center justify-center gap-3 text-white">
                <div className="relative">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-lg" 
                    style={{ backgroundColor: currentTurnPlayer?.color }}
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-white">{currentTurnPlayer?.name}</div>
                  <div className="text-xs text-indigo-200 -mt-1">now playing</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 px-3 py-1 rounded-full text-sm font-black">
                  {currentTurnPlayer?.score}/10
                </div>
              </div>
            </div>
          </div>

          {/* Room code - right aligned, no tilt for balance */}
          <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-600/50 shadow-lg">
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

      {/* Mystery card - always show if song exists, properly handle revealed state */}
      {gameState.currentSong && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
          <div className="relative">
            {/* Card shadow/glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-3xl blur-xl scale-110" />
            
            <MysteryCard
              song={gameState.currentSong}
              isRevealed={localGameState.mysteryCardRevealed}
              isInteractive={isMyTurn}
              isDestroyed={false}
              className="w-36 h-44"
              onDragStart={() => handleDragStart(gameState.currentSong!)}
              onDragEnd={() => setLocalGameState(prev => ({ ...prev, draggedSong: null }))}
            />

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
            draggedSong={localGameState.draggedSong}
            hoveredPosition={localGameState.placedCardPosition}
            confirmingPlacement={localGameState.confirmingPlacement}
            handleDragOver={(e, position) => handleDragOver(e, currentPlayer.id, position)}
            handleDragLeave={handleDragLeave}
            handleDrop={(position) => handleDrop(currentPlayer.id, position)}
            confirmPlacement={confirmPlacement}
            cancelPlacement={cancelPlacement}
            transitioningTurn={gameState.transitioningTurn}
          />
        </div>
      )}

      {/* Other players - better contrast */}
      <div className="absolute bottom-4 left-0 right-0 z-10 px-6">
        <div className="flex justify-center items-end gap-6 flex-wrap">
          {activePlayers.map((player, index) => {
            if (player.id === currentPlayer?.id) return null;
            
            const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'];
            const yOffsets = ['translate-y-1', '-translate-y-1', 'translate-y-0', '-translate-y-2'];
            
            return (
              <div 
                key={player.id} 
                className={`relative text-center transform transition-all hover:scale-105 ${rotations[index % rotations.length]} ${yOffsets[index % yOffsets.length]}`}
                onMouseEnter={() => isHost && setLocalGameState(prev => ({ ...prev, showKickOptions: null }))}
              >
                <div 
                  className="flex items-center justify-center gap-3 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-600/50 mb-3 cursor-pointer shadow-lg transform transition-all hover:bg-slate-700/80"
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
      {localGameState.confirmingPlacement && (
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
      {localGameState.cardResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="text-center space-y-6 p-8">
            {/* Animated result icon */}
            <div className="relative">
              <div className={`text-9xl mb-4 transform transition-all duration-1000 ${
                localGameState.cardResult.correct ? 
                'text-emerald-400 animate-bounce' : 
                'text-rose-400 animate-pulse'
              }`}>
                {localGameState.cardResult.correct ? '🎯' : '💥'}
              </div>
              
              {/* Particle effects */}
              {localGameState.cardResult.correct && (
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
                localGameState.cardResult.correct ? 
                'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400' : 
                'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400'
              }`}>
                {localGameState.cardResult.correct ? 'SPOT ON!' : 'WHOOPS!'}
              </div>
              
              <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-600/30 max-w-md">
                <div className="text-xl font-bold text-white mb-2">
                  {localGameState.cardResult.song.deezer_title}
                </div>
                <div className="text-lg text-slate-300 mb-3">
                  by {localGameState.cardResult.song.deezer_artist}
                </div>
                <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                  {localGameState.cardResult.song.release_year}
                </div>
              </div>
              
              <div className={`text-lg font-medium ${
                localGameState.cardResult.correct ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {localGameState.cardResult.correct ? 
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
