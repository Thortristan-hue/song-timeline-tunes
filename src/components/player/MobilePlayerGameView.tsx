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
    .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));

  // Calculate scroll positions for gap snapping
  const CARD_WIDTH = 80; // Width of each year card
  const GAP_WIDTH = 60; // Width of each gap
  const TOTAL_ITEM_WIDTH = CARD_WIDTH + GAP_WIDTH;

  // Handle scroll with enhanced snapping to gaps
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    
    // Calculate which gap we're closest to
    const rawPosition = scrollLeft / TOTAL_ITEM_WIDTH;
    const gapPosition = Math.round(rawPosition);
    
    // Debounced snapping with smooth animation
    setTimeout(() => {
      if (scrollViewRef.current && gapPosition !== snappedPosition) {
        const targetScroll = gapPosition * TOTAL_ITEM_WIDTH;
        scrollViewRef.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
        setSnappedPosition(gapPosition);
      }
    }, 100);
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

  // Show result overlay with enhanced animations
  if (cardPlacementResult) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50">
        <div className="text-center space-y-8 p-8 max-w-sm">
          <div className={`text-9xl mb-8 ${
            cardPlacementResult.correct ? 'animate-bounce' : 'animate-pulse'
          }`}>
            {cardPlacementResult.correct ? '🎯' : '💥'}
          </div>
          
          <div className={`text-5xl font-black mb-6 ${
            cardPlacementResult.correct ? 
            'text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500' : 
            'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-500'
          }`}>
            {cardPlacementResult.correct ? 'PERFECT!' : 'CLOSE!'}
          </div>
          
          <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/30 shadow-2xl">
            <div className="text-2xl font-bold text-white mb-3">
              {cardPlacementResult.song.deezer_title}
            </div>
            <div className="text-lg text-white/80 mb-6">
              by {cardPlacementResult.song.deezer_artist}
            </div>
            <div className="inline-block bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white px-8 py-4 rounded-full font-black text-2xl shadow-xl">
              {cardPlacementResult.song.release_year}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex flex-col relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* 1. Player Header - Enhanced */}
      <div className="relative z-10 pt-16 pb-8">
        <div className="text-center">
          <div className="text-4xl font-black text-white tracking-[0.15em] mb-3 drop-shadow-lg">
            {currentPlayer.name.toUpperCase()}
          </div>
          <div className="text-white/70 text-lg font-medium">
            {gameEnded ? 'Game Over' : 
             isMyTurn ? 'Your Turn' : `${currentTurnPlayer.name}'s Turn`}
          </div>
        </div>
      </div>

      {/* 2. Mystery Song Preview Button - Enhanced Vinyl */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-12">
          <div className="text-center space-y-8">
            <div className="relative">
              {/* Enhanced Vinyl Record */}
              <div className={`relative w-40 h-40 mx-auto transition-transform duration-300 ${
                isPlaying ? 'animate-spin' : 'hover:scale-105'
              }`}>
                {/* Outer glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-red-500/20 rounded-full blur-xl"></div>
                
                {/* Main vinyl disc */}
                <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-4 border-white/30">
                  {/* Vinyl grooves - more detailed */}
                  <div className="absolute inset-2 border border-white/15 rounded-full"></div>
                  <div className="absolute inset-4 border border-white/15 rounded-full"></div>
                  <div className="absolute inset-6 border border-white/15 rounded-full"></div>
                  <div className="absolute inset-8 border border-white/15 rounded-full"></div>
                  
                  {/* Center label with gradient */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-4 border-white/40 shadow-lg"></div>
                  </div>
                </div>
                
                {/* Play button overlay with better interaction */}
                <Button
                  onClick={onPlayPause}
                  className="absolute inset-0 w-full h-full bg-black/30 hover:bg-black/50 border-0 rounded-full transition-all duration-300 group"
                  disabled={!currentSong?.preview_url}
                >
                  <div className="text-white text-4xl group-hover:scale-110 transition-transform duration-200">
                    {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                  </div>
                </Button>
              </div>
            </div>

            <div className="text-white/90 text-lg font-medium">
              Tap vinyl to preview
            </div>
            <div className="text-white/60 text-sm">
              Place on timeline below
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Waiting screen */}
      {!isMyTurn && !gameEnded && (
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="text-center space-y-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-lg border border-white/30 shadow-2xl">
              <Music className="w-16 h-16 text-white/80 animate-pulse" />
            </div>
            <div className="text-3xl font-bold text-white mb-4">
              {currentTurnPlayer.name} is playing
            </div>
            <div className="text-white/70 text-lg">
              Wait for your turn to place cards
            </div>
          </div>
        </div>
      )}

      {/* 3. Timeline Placement Interface - Completely Enhanced */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-4 pb-8">
          <div className="bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl">
            <div className="text-center text-white/90 text-lg font-medium mb-6">
              Scroll to place between years
            </div>
            
            {/* Enhanced Timeline Ruler */}
            <div className="relative mb-6">
              <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 flex justify-between items-center">
                {Array.from({ length: timelineCards.length + 1 }, (_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1 h-6 rounded-full transition-all duration-300",
                      snappedPosition === i ? "bg-green-400 shadow-lg scale-125" : "bg-white/50"
                    )}
                  ></div>
                ))}
              </div>
            </div>

            {/* Enhanced Scrollable Timeline */}
            <div 
              ref={scrollViewRef}
              className="overflow-x-auto scrollbar-hide"
              onScroll={handleScroll}
              style={{ 
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth'
              }}
            >
              <div 
                className="flex items-center pb-4" 
                style={{ width: `${(timelineCards.length + 1) * TOTAL_ITEM_WIDTH}px` }}
              >
                {/* Enhanced Gap indicators and cards */}
                {timelineCards.map((song, index) => (
                  <React.Fragment key={song.id || index}>
                    {/* Enhanced Gap indicator */}
                    <div 
                      className={cn(
                        "flex-shrink-0 h-32 rounded-2xl border-3 border-dashed transition-all duration-300 flex items-center justify-center",
                        snappedPosition === index ? 
                        "border-green-400 bg-green-400/20 scale-110 shadow-lg" : 
                        "border-white/40 bg-white/5",
                        `w-[${GAP_WIDTH}px]`
                      )}
                      style={{ 
                        scrollSnapAlign: 'center',
                        width: `${GAP_WIDTH}px`
                      }}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full transition-all duration-300",
                        snappedPosition === index ? "bg-green-400 shadow-lg animate-pulse" : "bg-white/60"
                      )}></div>
                    </div>
                    
                    {/* Enhanced Year card */}
                    <div 
                      className="flex-shrink-0 h-32 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl border-2 border-white/30 flex flex-col items-center justify-center shadow-xl"
                      style={{ width: `${CARD_WIDTH}px` }}
                    >
                      <div className="text-white font-black text-xl mb-2">
                        {song.release_year}
                      </div>
                      <div className="text-white/70 text-xs text-center px-2 font-medium">
                        {song.deezer_title.substring(0, 10)}...
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                
                {/* Final enhanced gap */}
                <div 
                  className={cn(
                    "flex-shrink-0 h-32 rounded-2xl border-3 border-dashed transition-all duration-300 flex items-center justify-center",
                    snappedPosition === timelineCards.length ? 
                    "border-green-400 bg-green-400/20 scale-110 shadow-lg" : 
                    "border-white/40 bg-white/5",
                    `w-[${GAP_WIDTH}px]`
                  )}
                  style={{ 
                    scrollSnapAlign: 'center',
                    width: `${GAP_WIDTH}px`
                  }}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full transition-all duration-300",
                    snappedPosition === timelineCards.length ? "bg-green-400 shadow-lg animate-pulse" : "bg-white/60"
                  )}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Enhanced Confirm Placement Button */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-8 pb-8">
          <Button
            onClick={handleConfirmPlacement}
            disabled={hasConfirmed || isSubmitting}
            className={cn(
              "w-full h-20 text-white font-black text-2xl rounded-3xl border-0 shadow-2xl transition-all duration-300",
              hasConfirmed || isSubmitting ? 
              "bg-gradient-to-r from-gray-600 to-gray-700" :
              "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 hover:scale-105 active:scale-95"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>PLACING...</span>
              </div>
            ) : hasConfirmed ? (
              <div className="flex items-center justify-center space-x-3">
                <Check className="w-6 h-6" />
                <span>PLACED!</span>
              </div>
            ) : (
              'CONFIRM'
            )}
          </Button>
        </div>
      )}

      {/* 5. Enhanced Footer Branding */}
      <div className="relative z-10 pb-8">
        <div className="text-center">
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-purple-200 tracking-[0.25em] drop-shadow-lg">
            TIMELINER
          </div>
        </div>
      </div>

      {/* Enhanced Custom scrollbar styles */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}
