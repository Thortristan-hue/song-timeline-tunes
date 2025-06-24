
import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Clock, Volume2, VolumeX, Trophy, ArrowLeft, Zap, Star, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlayerTimeline } from '@/components/PlayerTimeline';
import { MysteryCard } from '@/components/MysteryCard';
import { useToast } from '@/components/ui/use-toast';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';
import { useSoundEffects } from '@/lib/SoundEffects';

interface PlayerViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  roomCode: string;
  isMyTurn: boolean;
  gameState: {
    currentSong: Song | null;
    isPlaying: boolean;
    timeLeft: number;
    cardPlacementPending: boolean;
    mysteryCardRevealed: boolean;
    cardPlacementCorrect: boolean | null;
  };
  draggedSong: Song | null;
  onPlaceCard: (position: number) => Promise<{ success: boolean }>;
  onPlayPause: () => void;
  onDragStart: (song: Song) => void;
  onDragEnd: () => void;
  songLoadingError?: string | null;
  retryingSong?: boolean;
}

export function PlayerView({
  currentPlayer,
  currentTurnPlayer,
  roomCode,
  isMyTurn,
  gameState,
  draggedSong,
  onPlaceCard,
  onPlayPause,
  onDragStart,
  onDragEnd,
  songLoadingError,
  retryingSong
}: PlayerViewProps) {
  const { toast } = useToast();
  const soundEffects = useSoundEffects();
  
  const [localState, setLocalState] = useState({
    confirmingPlacement: null as { song: Song; position: number } | null,
    placedCardPosition: null as number | null,
    isMuted: false,
    cardResult: null as { correct: boolean; song: Song } | null,
  });

  const isValidTurn = 
    currentPlayer?.id === currentTurnPlayer?.id && 
    !gameState.cardPlacementPending &&
    gameState.currentSong !== null;

  const handleDragOver = (e: React.DragEvent, position: number) => {
    if (!isMyTurn || !draggedSong) return;
    e.preventDefault();
  };

  const handleDrop = async (position: number) => {
    if (!isMyTurn || !draggedSong) {
      console.warn('❌ Invalid drop - not my turn or no dragged song');
      return;
    }

    console.log('🎯 Confirming placement at position:', position);
    setLocalState(prev => ({
      ...prev,
      confirmingPlacement: { song: draggedSong, position },
      placedCardPosition: position
    }));
  };

  const confirmPlacement = async () => {
    if (!localState.confirmingPlacement) return;

    const { song, position } = localState.confirmingPlacement;
    console.log('🎯 Confirming card placement:', song.deezer_title, 'at position', position);

    try {
      const result = await onPlaceCard(position);
      
      setLocalState(prev => ({
        ...prev,
        confirmingPlacement: null,
        placedCardPosition: null,
        cardResult: { correct: result.success, song }
      }));

      if (result.success) {
        soundEffects.playCardSuccess();
        toast({
          title: "Perfect!",
          description: `${song.deezer_title} placed correctly!`,
        });
      } else {
        soundEffects.playCardError();
        toast({
          title: "Close!",
          description: `${song.deezer_title} - try a different position next time!`,
          variant: "destructive",
        });
      }

      // Show result for 2 seconds
      setTimeout(() => {
        setLocalState(prev => ({ ...prev, cardResult: null }));
      }, 2000);

    } catch (error) {
      console.error('❌ Card placement failed:', error);
      toast({
        title: "Error",
        description: "Failed to place card. Please try again.",
        variant: "destructive",
      });
      
      setLocalState(prev => ({
        ...prev,
        confirmingPlacement: null,
        placedCardPosition: null
      }));
    }
  };

  const cancelPlacement = () => {
    console.log('🎯 Canceling placement');
    setLocalState(prev => ({
      ...prev,
      confirmingPlacement: null,
      placedCardPosition: null
    }));
  };

  const getTimeColor = () => {
    if (gameState.timeLeft > 20) return "text-emerald-300";
    if (gameState.timeLeft > 10) return "text-amber-300";
    return "text-rose-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-400/8 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}} />
      
      {/* Header */}
      <div className="absolute top-6 left-4 right-4 z-40">
        <div className="flex justify-between items-start gap-6">
          {/* Timer section */}
          <div className="flex items-center gap-4 bg-slate-800/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-600/50 shadow-lg transform -rotate-1">
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
            
            <div className="w-px h-6 bg-slate-500" />
            
            <div className="flex gap-2">
              <Button
                onClick={onPlayPause}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 h-9 w-9 p-0 shadow-md transform transition-all hover:scale-110"
                disabled={!gameState.currentSong?.preview_url || !isMyTurn}
              >
                {gameState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={() => setLocalState(prev => ({ ...prev, isMuted: !prev.isMuted }))}
                size="sm"
                variant="outline"
                className="rounded-xl h-9 w-9 p-0 border-slate-600/50 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 transform transition-all hover:scale-110"
                disabled={!isMyTurn}
              >
                {localState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Current player section */}
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
                  <div className="text-xs text-indigo-200 -mt-1">
                    {isMyTurn ? "your turn" : "now playing"}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 px-3 py-1 rounded-full text-sm font-black">
                  {currentTurnPlayer?.score}/10
                </div>
              </div>
            </div>
          </div>

          {/* Room code */}
          <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-600/50 shadow-lg">
            <div className="relative">
              <Zap className="h-5 w-5 text-yellow-400" />
              <div className="absolute -inset-1 bg-yellow-400/20 rounded-full blur animate-pulse" />
            </div>
            <div className="text-white">
              <div className="text-xs text-slate-300">Room</div>
              <div className="font-mono font-bold text-lg -mt-1">{roomCode}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mystery card */}
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-3xl blur-xl scale-110" />
          
          <div className="relative">
            {songLoadingError ? (
              <Card className="w-48 h-60 bg-red-500/20 border-red-400/50 flex flex-col items-center justify-center text-white">
                <AlertTriangle className="h-12 w-12 mb-4 text-red-400" />
                <div className="text-sm text-center px-4 text-red-200 leading-tight mb-4">
                  {songLoadingError}
                </div>
                {retryingSong && (
                  <div className="text-xs text-red-300">Retrying...</div>
                )}
              </Card>
            ) : gameState.currentSong ? (
              <MysteryCard
                song={gameState.currentSong}
                isRevealed={gameState.mysteryCardRevealed}
                isInteractive={isMyTurn && isValidTurn}
                isDestroyed={gameState.cardPlacementCorrect === false}
                className="w-48 h-60"
                onDragStart={() => isMyTurn && gameState.currentSong && onDragStart(gameState.currentSong)}
                onDragEnd={onDragEnd}
              />
            ) : (
              <Card className="w-48 h-60 bg-slate-600/50 border-slate-500/50 flex flex-col items-center justify-center text-white animate-pulse">
                <Music className="h-12 w-12 mb-4 opacity-50" />
                <div className="text-lg text-center px-4 opacity-50">
                  {retryingSong ? 'Loading song...' : 'Waiting for mystery song...'}
                </div>
              </Card>
            )}
            
            {!gameState.mysteryCardRevealed && gameState.currentSong && !songLoadingError && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-sm text-purple-200 bg-purple-900/50 px-3 py-1 rounded-full">
                  {isMyTurn ? "Drag me to your timeline!" : `${currentTurnPlayer?.name} is thinking...`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Player timeline */}
      {currentPlayer && (
        <div className="absolute bottom-40 left-0 right-0 z-20 px-6">
          <PlayerTimeline
            player={currentPlayer}
            isCurrent={isMyTurn}
            isDarkMode={true}
            draggedSong={draggedSong}
            hoveredPosition={localState.placedCardPosition}
            confirmingPlacement={localState.confirmingPlacement}
            handleDragOver={handleDragOver}
            handleDragLeave={() => {}}
            handleDrop={handleDrop}
            confirmPlacement={confirmPlacement}
            cancelPlacement={cancelPlacement}
            transitioningTurn={false}
          />
        </div>
      )}

      {/* Confirmation buttons */}
      {localState.confirmingPlacement && (
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
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Result overlay */}
      {localState.cardResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="text-center space-y-6 p-8">
            <div className="relative">
              <div className={`text-9xl mb-4 transform transition-all duration-1000 ${
                localState.cardResult.correct ? 
                'text-emerald-400 animate-bounce' : 
                'text-rose-400 animate-pulse'
              }`}>
                {localState.cardResult.correct ? '🎯' : '💥'}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className={`text-5xl font-black ${
                localState.cardResult.correct ? 
                'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400' : 
                'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400'
              }`}>
                {localState.cardResult.correct ? 'PERFECT!' : 'CLOSE!'}
              </div>
              
              <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-600/30 max-w-md">
                <div className="text-xl font-bold text-white mb-2">
                  {localState.cardResult.song.deezer_title}
                </div>
                <div className="text-lg text-slate-300 mb-3">
                  by {localState.cardResult.song.deezer_artist}
                </div>
                <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                  {localState.cardResult.song.release_year}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
