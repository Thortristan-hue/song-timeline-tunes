import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, Pause, Volume2, VolumeX, Crown, Clock, Trophy, Star, Zap, Check, X } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface MobilePlayerGameViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  currentSong: Song;
  roomCode: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  gameEnded: boolean;
}

export default function MobilePlayerGameView({
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
  gameEnded
}: MobilePlayerGameViewProps) {
  const [snappedPosition, setSnappedPosition] = useState<number>(0);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<HTMLDivElement>(null);

  // Create timeline from player's existing songs
  const timelineCards = currentPlayer.timeline
    .filter(song => song !== null)
    .sort((a, b) => a.release_year - b.release_year);

  // Handle scroll with snapping to gaps
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const cardWidth = 120; // Width of each card + gap
    const snapIndex = Math.round(scrollLeft / cardWidth);
    
    // Debounced snapping
    setTimeout(() => {
      if (scrollViewRef.current) {
        const targetScroll = snapIndex * cardWidth;
        scrollViewRef.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
        setSnappedPosition(snapIndex);
      }
    }, 150);
  };

  // Handle confirm placement
  const handleConfirmPlacement = async () => {
    if (hasConfirmed || isSubmitting || !isMyTurn || gameEnded) return;

    setIsSubmitting(true);
    setHasConfirmed(true);

    try {
      await onPlaceCard(currentSong, snappedPosition);
    } catch (error) {
      console.error('Failed to place card:', error);
      setHasConfirmed(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when turn changes
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      setHasConfirmed(false);
      setSnappedPosition(0);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  }, [isMyTurn, gameEnded]);

  // Show result overlay
  if (cardPlacementResult) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
        <div className="text-center space-y-8 p-8 max-w-sm">
          <div className={`text-8xl mb-6 ${
            cardPlacementResult.correct ? 'animate-bounce' : 'animate-pulse'
          }`}>
            {cardPlacementResult.correct ? '🎯' : '💥'}
          </div>
          
          <div className={`text-4xl font-black ${
            cardPlacementResult.correct ? 
            'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400' : 
            'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400'
          }`}>
            {cardPlacementResult.correct ? 'PERFECT!' : 'CLOSE!'}
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
            <div className="text-xl font-bold text-white mb-2">
              {cardPlacementResult.song.deezer_title}
            </div>
            <div className="text-lg text-white/70 mb-4">
              by {cardPlacementResult.song.deezer_artist}
            </div>
            <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold text-xl">
              {cardPlacementResult.song.release_year}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-black flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* 1. Player Header */}
      <div className="relative z-10 pt-16 pb-8">
        <div className="text-center">
          <div className="text-3xl font-black text-white tracking-wider mb-2">
            {currentPlayer.name.toUpperCase()}
          </div>
          <div className="text-white/60 text-sm">
            {gameEnded ? 'Game Over' : 
             isMyTurn ? 'Your Turn' : `${currentTurnPlayer.name}'s Turn`}
          </div>
        </div>
      </div>

      {/* 2. Mystery Song Preview Button (only when it's my turn) */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-8">
          <div className="text-center space-y-6">
            <div className="relative">
              {/* Vinyl Record */}
              <div className={`relative w-32 h-32 mx-auto ${isPlaying ? 'animate-spin' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black rounded-full shadow-2xl border-4 border-white/20">
                  {/* Vinyl grooves */}
                  <div className="absolute inset-2 border border-white/10 rounded-full"></div>
                  <div className="absolute inset-4 border border-white/10 rounded-full"></div>
                  <div className="absolute inset-6 border border-white/10 rounded-full"></div>
                  
                  {/* Center label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-red-600 rounded-full border-2 border-white/30"></div>
                  </div>
                </div>
                
                {/* Play button overlay */}
                <Button
                  onClick={onPlayPause}
                  className="absolute inset-0 w-full h-full bg-black/20 hover:bg-black/40 border-0 rounded-full transition-all duration-300"
                  disabled={!currentSong?.preview_url}
                >
                  <div className="text-white text-3xl">
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </div>
                </Button>
              </div>
            </div>

            <div className="text-white/80 text-sm">
              Tap to preview • Place on timeline below
            </div>
          </div>
        </div>
      )}

      {/* Waiting screen when not my turn */}
      {!isMyTurn && !gameEnded && (
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Music className="w-12 h-12 text-white/60" />
            </div>
            <div className="text-2xl font-bold text-white mb-2">
              {currentTurnPlayer.name} is playing
            </div>
            <div className="text-white/60">
              Wait for your turn to place cards
            </div>
          </div>
        </div>
      )}

      {/* 3. Timeline Placement Interface (only when it's my turn) */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-4 pb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <div className="text-center text-white/80 text-sm mb-4">
              Scroll to place between years
            </div>
            
            {/* Timeline Ruler */}
            <div className="relative mb-4">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <div className="absolute inset-0 flex justify-between items-center">
                {Array.from({ length: timelineCards.length + 1 }, (_, i) => (
                  <div key={i} className="w-0.5 h-4 bg-white/40 rounded-full"></div>
                ))}
              </div>
            </div>

            {/* Scrollable Timeline */}
            <div 
              ref={scrollViewRef}
              className="overflow-x-auto scrollbar-hide"
              onScroll={handleScroll}
              style={{ 
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth'
              }}
            >
              <div className="flex gap-6 pb-4" style={{ width: `${(timelineCards.length + 1) * 120}px` }}>
                {/* Gap indicators and cards */}
                {timelineCards.map((song, index) => (
                  <React.Fragment key={song.id || index}>
                    {/* Gap indicator */}
                    <div 
                      className={cn(
                        "flex-shrink-0 w-4 h-24 rounded-full border-2 border-dashed transition-all duration-200",
                        snappedPosition === index ? 
                        "border-green-400 bg-green-400/20 scale-110" : 
                        "border-white/30"
                      )}
                      style={{ scrollSnapAlign: 'center' }}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Year card */}
                    <div className="flex-shrink-0 w-20 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border border-white/20 flex flex-col items-center justify-center shadow-lg">
                      <div className="text-white font-bold text-lg">
                        {song.release_year}
                      </div>
                      <div className="text-white/60 text-xs mt-1 text-center px-1">
                        {song.deezer_title.substring(0, 8)}...
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                
                {/* Final gap */}
                <div 
                  className={cn(
                    "flex-shrink-0 w-4 h-24 rounded-full border-2 border-dashed transition-all duration-200",
                    snappedPosition === timelineCards.length ? 
                    "border-green-400 bg-green-400/20 scale-110" : 
                    "border-white/30"
                  )}
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Confirm Placement Button */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-8 pb-8">
          <Button
            onClick={handleConfirmPlacement}
            disabled={hasConfirmed || isSubmitting}
            className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-black text-xl rounded-2xl border-0 shadow-2xl"
          >
            {isSubmitting ? 'PLACING...' : hasConfirmed ? 'PLACED!' : 'CONFIRM'}
          </Button>
        </div>
      )}

      {/* 5. Footer Branding */}
      <div className="relative z-10 pb-8">
        <div className="text-center">
          <div className="text-2xl font-black text-white/80 tracking-[0.2em]">
            TIMELINER
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
