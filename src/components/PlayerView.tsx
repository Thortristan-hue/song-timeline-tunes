
import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, Clock, Volume2, VolumeX, ArrowLeft, Zap, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlayerTimeline } from '@/components/PlayerTimeline';
import { MysteryCard } from '@/components/MysteryCard';
import { useToast } from '@/components/ui/use-toast';
import { Song, Player } from '@/types/game';
import { useSoundEffects } from '@/hooks/useSoundEffects';

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
  audioPlaybackError?: string | null;
  onRetryAudio?: () => void;
  onSkipSong?: () => void;
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
  retryingSong,
  audioPlaybackError,
  onRetryAudio,
  onSkipSong
}: PlayerViewProps) {
  const { toast } = useToast();
  const soundEffects = useSoundEffects();
  
  const [localState, setLocalState] = useState({
    confirmingPlacement: null as { song: Song; position: number } | null,
    placedCardPosition: null as number | null,
    isMuted: false,
    cardResult: null as { correct: boolean; song: Song } | null,
    isProcessingPlacement: false
  });

  const isValidTurn = 
    currentPlayer?.id === currentTurnPlayer?.id && 
    !gameState.cardPlacementPending &&
    gameState.currentSong !== null &&
    !localState.isProcessingPlacement;

  const handleDragOver = (e: React.DragEvent, position: number) => {
    if (!isMyTurn || !draggedSong || !isValidTurn) return;
    e.preventDefault();
  };

  const handleDrop = async (position: number) => {
    if (!isMyTurn || !draggedSong || !isValidTurn) {
      console.warn('❌ Invalid drop - not my turn or no dragged song');
      return;
    }

    console.log('🎯 Confirming placement at position:', position);
    soundEffects.playCardPlace();
    setLocalState(prev => ({
      ...prev,
      confirmingPlacement: { song: draggedSong, position },
      placedCardPosition: position
    }));
  };

  const confirmPlacement = async () => {
    if (!localState.confirmingPlacement || localState.isProcessingPlacement) return;

    const { song, position } = localState.confirmingPlacement;
    console.log('🎯 Confirming card placement:', song.deezer_title, 'at position', position);

    // Prevent spam clicking
    setLocalState(prev => ({ ...prev, isProcessingPlacement: true }));

    try {
      const result = await onPlaceCard(position);
      
      setLocalState(prev => ({
        ...prev,
        confirmingPlacement: null,
        placedCardPosition: null,
        cardResult: { correct: result.success, song },
        isProcessingPlacement: false
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
          description: `${song.deezer_title} - wrong position! Card destroyed.`,
          variant: "destructive",
        });
      }

      // Show result for 2 seconds, then trigger turn transition
      setTimeout(() => {
        setLocalState(prev => ({ ...prev, cardResult: null }));
        soundEffects.playTurnTransition();
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
        placedCardPosition: null,
        isProcessingPlacement: false
      }));
    }
  };

  const cancelPlacement = () => {
    console.log('🎯 Canceling placement');
    soundEffects.playButtonClick();
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
      
      {/* Header */}
      <div className="absolute top-6 left-4 right-4 z-40">
        <div className="flex justify-between items-start gap-6">
          {/* Timer section */}
          <div className="flex items-center gap-4 bg-slate-800/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-600/50 shadow-lg transform -rotate-1 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Clock className="h-5 w-5 text-blue-300" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-ping" 
                     style={{display: gameState.timeLeft <= 10 ? 'block' : 'none'}} />
              </div>
              <div className={`font-mono text-lg font-black ${getTimeColor()}`}>
                ∞
              </div>
            </div>
            
            <div className="w-px h-6 bg-slate-500" />
            
            {/* Only show audio controls to host */}
            <div className="text-xs text-slate-400">
              Host controls audio
            </div>
          </div>

          {/* Current player section */}
          <div className="flex-1 max-w-sm transform rotate-1 animate-fade-in">
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
          <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-600/50 shadow-lg animate-fade-in">
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

      {/* Mystery card section - only show if it's my turn and song exists */}
      {isMyTurn && gameState.currentSong && (
        <div className="absolute top-28 left-1/2 transform -translate-x-1/2 z-30">
          <div className="relative animate-bounce-in">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-3xl blur-2xl scale-150" />
            
            <div className="relative">
              {songLoadingError ? (
                <Card className="aspect-square w-48 bg-red-500/20 border-red-400/50 flex flex-col items-center justify-center text-white p-4">
                  <AlertTriangle className="h-12 w-12 mb-4 text-red-400" />
                  <div className="text-sm text-center px-2 text-red-200 leading-tight mb-4">
                    {songLoadingError}
                  </div>
                  {retryingSong ? (
                    <div className="text-xs text-red-300 animate-pulse">Retrying...</div>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-xs"
                      >
                        Retry Game
                      </Button>
                      {onSkipSong && isMyTurn && (
                        <Button 
                          size="sm" 
                          onClick={onSkipSong}
                          variant="outline"
                          className="text-xs border-red-400"
                        >
                          Skip Song
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              ) : (
                <MysteryCard
                  song={gameState.currentSong}
                  isRevealed={gameState.mysteryCardRevealed}
                  isInteractive={isMyTurn && isValidTurn}
                  isDestroyed={gameState.cardPlacementCorrect === false}
                  className="aspect-square w-48"
                  onDragStart={() => {
                    if (isMyTurn && gameState.currentSong && isValidTurn) {
                      soundEffects.playCardPlace();
                      onDragStart(gameState.currentSong);
                    }
                  }}
                  onDragEnd={onDragEnd}
                />
              )}
              
              {/* Instruction text */}
              {!gameState.mysteryCardRevealed && gameState.currentSong && !songLoadingError && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-sm text-purple-200 bg-purple-900/50 px-3 py-1 rounded-full animate-pulse">
                    Drag to timeline or tap drop zones!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Not my turn display */}
      {!isMyTurn && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="text-center space-y-4">
            <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 border border-slate-600/50">
              <Music className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-white mb-2">
                {currentTurnPlayer?.name} is playing
              </div>
              <div className="text-slate-300">
                Wait for your turn to place cards
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audio error overlay */}
      {audioPlaybackError && isMyTurn && (
        <div className="absolute top-80 left-1/2 transform -translate-x-1/2 z-40 animate-fade-in">
          <div className="bg-amber-900/90 backdrop-blur-lg rounded-2xl p-4 border border-amber-600/50 max-w-xs text-center">
            <div className="text-2xl mb-2">🔊</div>
            <div className="text-sm text-amber-200 mb-3">
              {audioPlaybackError}
            </div>
            <div className="space-y-2">
              {onRetryAudio && (
                <Button 
                  size="sm" 
                  onClick={onRetryAudio}
                  className="bg-amber-600 hover:bg-amber-700 text-xs w-full"
                >
                  Try Play Again
                </Button>
              )}
              {onSkipSong && (
                <Button 
                  size="sm" 
                  onClick={onSkipSong}
                  variant="outline"
                  className="text-xs w-full border-amber-400"
                >
                  Skip This Song
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Player timeline */}
      {currentPlayer && (
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
          transitioningTurn={localState.isProcessingPlacement}
        />
      )}

      {/* Confirmation buttons - only one set at bottom */}
      {localState.confirmingPlacement && !localState.isProcessingPlacement && (
        <div className="fixed bottom-48 left-1/2 transform -translate-x-1/2 z-40 animate-scale-in">
          <div className="flex gap-3 bg-slate-800/90 backdrop-blur-lg p-4 rounded-2xl border border-slate-600/30 shadow-xl">
            <Button
              onClick={confirmPlacement}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl px-6 h-12 font-bold shadow-lg transform transition-all hover:scale-105"
              disabled={localState.isProcessingPlacement}
            >
              <Check className="h-5 w-5 mr-2" />
              Lock it in!
            </Button>
            <Button
              onClick={cancelPlacement}
              size="lg"
              className="bg-slate-600/80 hover:bg-slate-500/80 text-white rounded-xl px-6 h-12 font-bold border border-slate-500/50 shadow-lg transform transition-all hover:scale-105"
              disabled={localState.isProcessingPlacement}
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Result overlay */}
      {localState.cardResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in">
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
              <div className={`text-5xl font-black animate-glow-pulse ${
                localState.cardResult.correct ? 
                'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400' : 
                'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400'
              }`}>
                {localState.cardResult.correct ? 'PERFECT!' : 'DESTROYED!'}
              </div>
              
              <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-600/30 max-w-md animate-scale-in">
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
              
              <div className={`text-lg font-medium ${
                localState.cardResult.correct ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {localState.cardResult.correct ? 
                  'Card added to your timeline! 🔥' : 
                  'Wrong position - card destroyed! 💥'
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing overlay */}
      {localState.isProcessingPlacement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-600/30 text-center">
            <div className="text-2xl mb-3 animate-spin">🎵</div>
            <div className="text-white font-bold">Processing your move...</div>
          </div>
        </div>
      )}
    </div>
  );
}
