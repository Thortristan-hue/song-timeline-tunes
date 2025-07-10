
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface MobilePlayerGameViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  gameEnded?: boolean;
}

export function MobilePlayerGameView({
  currentPlayer,
  currentTurnPlayer,
  currentSong,
  roomCode,
  isMyTurn,
  isPlaying,
  onPlayPause,
  onPlaceCard,
  mysteryCardRevealed,
  cardPlacementResult,
  gameEnded = false
}: MobilePlayerGameViewProps) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Track audio playback
  useEffect(() => {
    if (isPlaying) {
      setHasPlayedAudio(true);
    }
  }, [isPlaying]);

  // Handle vinyl record play/pause
  const handleVinylPress = () => {
    if (!isMyTurn || !currentSong || gameEnded) return;
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    onPlayPause();
  };

  // Handle timeline card selection with snap behavior
  const handleCardSelect = (position: number) => {
    if (!isMyTurn || gameEnded) return;
    
    setSelectedPosition(position);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    // Smooth scroll to center the selected position
    if (timelineRef.current) {
      const cardWidth = 80;
      const scrollLeft = position * cardWidth - (timelineRef.current.clientWidth / 2) + (cardWidth / 2);
      timelineRef.current.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  };

  // Handle confirmation
  const handleConfirm = async () => {
    if (!currentSong || selectedPosition === null || !isMyTurn || isConfirming || gameEnded) return;
    
    setIsConfirming(true);
    
    // Strong haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    try {
      await onPlaceCard(currentSong, selectedPosition);
    } finally {
      setTimeout(() => {
        setIsConfirming(false);
        setSelectedPosition(null);
        setHasPlayedAudio(false);
      }, 2000);
    }
  };

  // Render timeline cards
  const renderTimelineCards = () => {
    const maxCards = 15;
    const cards = [];
    
    for (let i = 0; i <= maxCards; i++) {
      const isSelected = selectedPosition === i;
      const isPlaced = currentPlayer.timeline[i];
      
      cards.push(
        <div key={i} className="flex flex-col items-center">
          {/* Timeline position card */}
          <button
            onClick={() => handleCardSelect(i)}
            disabled={!isMyTurn || gameEnded}
            className={cn(
              "flex-shrink-0 w-20 h-20 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center font-bold text-lg",
              isSelected 
                ? "bg-blue-500 border-blue-300 text-white scale-110 shadow-lg" 
                : "bg-white/10 border-white/30 text-white/70 hover:bg-white/20 active:scale-95",
              (!isMyTurn || gameEnded) && "opacity-50"
            )}
            style={{ 
              touchAction: 'manipulation',
              scrollSnapAlign: 'center'
            }}
          >
            {isPlaced ? (
              <div className="text-center">
                <Music className="h-4 w-4 mx-auto mb-1" />
                <div className="text-xs">{isPlaced.release_year}</div>
              </div>
            ) : (
              <div className="text-2xl font-black">{i + 1}</div>
            )}
          </button>
          
          {/* Timeline ruler tick */}
          <div className="w-px h-4 bg-white/30 mt-2"></div>
        </div>
      );
    }
    
    return cards;
  };

  if (gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🏆</div>
          <div className="text-2xl font-bold mb-2">Game Complete!</div>
          <div className="text-white/60">Thanks for playing Timeline Tunes!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
      {/* Safe area padding */}
      <div className="pt-safe-top pb-safe-bottom h-full flex flex-col">
        
        {/* 1. Top Header: Player Name */}
        <div className="px-6 py-4 text-center">
          <div className="text-white/60 text-sm font-medium mb-1">
            {isMyTurn ? "YOUR TURN" : `${currentTurnPlayer.name}'s Turn`}
          </div>
          <div className="text-white text-2xl font-bold tracking-wide">
            {currentPlayer.name.toUpperCase()}
          </div>
          <div className="text-white/40 text-sm mt-1">
            Room {roomCode} • {currentPlayer.score}/10 cards
          </div>
        </div>

        {/* 2. Mystery Song Player Button */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <button
              onClick={handleVinylPress}
              disabled={!isMyTurn || !currentSong || gameEnded}
              className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative",
                "bg-gradient-to-br from-red-800 to-red-900 border-4 border-red-600/50 shadow-2xl",
                isMyTurn && currentSong && !gameEnded
                  ? "hover:scale-105 active:scale-95 shadow-red-500/25"
                  : "opacity-50",
                isPlaying && "animate-spin"
              )}
              style={{ 
                touchAction: 'manipulation',
                minWidth: '128px',
                minHeight: '128px'
              }}
              aria-label={isPlaying ? 'Pause mystery song' : 'Play mystery song'}
            >
              {/* Vinyl record rings */}
              <div className="absolute inset-4 rounded-full border border-red-500/30"></div>
              <div className="absolute inset-8 rounded-full border border-red-400/20"></div>
              <div className="absolute inset-12 rounded-full bg-red-950/50"></div>
              
              {/* Play/Pause icon */}
              {isPlaying ? (
                <Pause className="h-8 w-8 text-white relative z-10" />
              ) : (
                <Play className="h-8 w-8 text-white relative z-10 ml-1" />
              )}
            </button>
            
            {/* Audio status indicator */}
            <div className="mt-4">
              <div className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
                hasPlayedAudio 
                  ? "bg-green-500/20 border-green-400 text-green-200" 
                  : "bg-white/10 border-white/30 text-white/60"
              )}>
                {hasPlayedAudio ? '✅ Preview played' : '🎵 Tap to preview'}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Scrollable Timeline Menu */}
        <div className="px-6 pb-6">
          <div className="mb-4">
            <h3 className="text-white text-lg font-bold text-center mb-2">
              Choose Timeline Position
            </h3>
            <p className="text-white/60 text-sm text-center">
              Scroll and tap where this song belongs chronologically
            </p>
          </div>
          
          <div 
            ref={timelineRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
            style={{
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {renderTimelineCards()}
          </div>
          
          {/* Timeline ruler */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-2"></div>
        </div>

        {/* 4. Confirmation Button */}
        <div className="px-6 pb-6">
          <Button
            onClick={handleConfirm}
            disabled={!isMyTurn || selectedPosition === null || !currentSong || isConfirming || gameEnded}
            className={cn(
              "w-full h-14 text-lg font-bold rounded-2xl transition-all duration-300",
              "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
              "text-white shadow-lg active:scale-95",
              (!isMyTurn || selectedPosition === null || !currentSong || gameEnded) && "opacity-50"
            )}
            style={{ 
              touchAction: 'manipulation',
              minHeight: '56px'
            }}
          >
            {isConfirming ? 'CONFIRMING...' : 'CONFIRM'}
          </Button>
        </div>

        {/* 5. Game Footer: Brand / Title */}
        <div className="text-center pb-4">
          <div className="text-white/40 text-sm font-bold tracking-widest">
            TIMELINER
          </div>
        </div>
      </div>

      {/* Results overlay */}
      {cardPlacementResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/20">
            <div className="text-6xl mb-4">
              {cardPlacementResult.correct ? '🎉' : '❌'}
            </div>
            <div className="text-white text-2xl font-bold mb-2">
              {cardPlacementResult.correct ? 'Correct!' : 'Not quite!'}
            </div>
            <div className="text-white/60">
              {cardPlacementResult.song.deezer_title} ({cardPlacementResult.song.release_year})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
