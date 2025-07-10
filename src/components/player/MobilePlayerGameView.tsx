import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, MoveRight, MoveLeft } from 'lucide-react';
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
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Card dimensions
  const CARD_WIDTH = 100; // Larger cards
  const GAP_WIDTH = 30;   // Smaller gaps
  const TOTAL_ITEM_WIDTH = CARD_WIDTH + GAP_WIDTH;
  const EXTRA_SPACE = 100; // Space to scroll beyond edges

  // Create timeline from player's existing songs
  const timelineCards = currentPlayer.timeline
    .filter(song => song !== null)
    .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));

  // Calculate total width needed for scrolling
  const totalWidth = (timelineCards.length + 1) * TOTAL_ITEM_WIDTH + 2 * EXTRA_SPACE;

  // Handle container resize
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // Handle scroll events
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    // Just track dragging state during scroll
  };

  // Handle touch start
  const handleTouchStart = () => {
    setIsDragging(true);
  };

  // Handle touch end with snap to center
  const handleTouchEnd = () => {
    setIsDragging(false);
    snapToNearestGap();
  };

  // Snap to the nearest gap center
  const snapToNearestGap = () => {
    if (!scrollViewRef.current || !containerRef.current) return;
    
    const scrollLeft = scrollViewRef.current.scrollLeft;
    const centerX = containerWidth / 2;
    const scrollCenter = scrollLeft + centerX - EXTRA_SPACE;
    
    // Calculate which gap we're closest to
    const gapIndex = Math.round((scrollCenter) / TOTAL_ITEM_WIDTH);
    const clampedGapIndex = Math.max(0, Math.min(gapIndex, timelineCards.length));
    
    // Calculate target scroll position to center this gap
    const targetScroll = clampedGapIndex * TOTAL_ITEM_WIDTH + EXTRA_SPACE - (containerWidth - GAP_WIDTH) / 2;
    
    scrollViewRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    
    setSnappedPosition(clampedGapIndex);
  };

  // Play song preview
  const playPreview = (url: string, songId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (playingPreviewId === songId) {
      setPlayingPreviewId(null);
      return;
    }
    
    const audio = new Audio(url);
    audio.play();
    audioRef.current = audio;
    setPlayingPreviewId(songId);
    
    audio.onended = () => setPlayingPreviewId(null);
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
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setHasConfirmed(false), 2000);
    }
  };

  // Reset state when turn changes
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      setHasConfirmed(false);
      setSnappedPosition(0);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ 
          left: EXTRA_SPACE - (containerWidth - GAP_WIDTH) / 2,
          behavior: 'smooth' 
        });
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isMyTurn, gameEnded, containerWidth]);

  // Show result overlay
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
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Player Header */}
      <div className="relative z-10 pt-10 pb-6 px-4">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-2 drop-shadow-lg truncate">
            {currentPlayer.name}
          </div>
          <div className="text-white/70 text-sm sm:text-base font-medium">
            {gameEnded ? 'Game Over' : 
             isMyTurn ? 'Your Turn' : `${currentTurnPlayer.name}'s Turn`}
          </div>
        </div>
      </div>

      {/* Mystery Song Preview */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
          <div className="text-center space-y-6 max-w-xs">
            <div className="relative">
              <div className={`relative w-32 h-32 mx-auto transition-transform duration-300 ${
                isPlaying ? 'animate-spin' : 'hover:scale-105'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-red-500/20 rounded-full blur-xl"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-4 border-white/30">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-4 border-white/40 shadow-lg"></div>
                  </div>
                </div>
                <Button
                  onClick={onPlayPause}
                  className="absolute inset-0 w-full h-full bg-black/30 hover:bg-black/50 border-0 rounded-full transition-all duration-300 group"
                  disabled={!currentSong?.preview_url}
                >
                  <div className="text-white text-3xl group-hover:scale-110 transition-transform duration-200">
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </div>
                </Button>
              </div>
            </div>
            <div className="text-white/90 text-base font-medium">
              Tap vinyl to preview
            </div>
          </div>
        </div>
      )}

      {/* Waiting screen */}
      {!isMyTurn && !gameEnded && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-lg border border-white/30 shadow-2xl">
              <Music className="w-12 h-12 text-white/80 animate-pulse" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {currentTurnPlayer.name} is playing
            </div>
            <div className="text-white/70 text-sm sm:text-base">
              Wait for your turn to place cards
            </div>
          </div>
        </div>
      )}

      {/* Timeline Placement Interface */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-2 pb-6" ref={containerRef}>
          <div className="bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/30 shadow-2xl">
            <div className="text-center text-white/90 text-base font-medium mb-4">
              Scroll to place between years
            </div>
            
            {/* Timeline Ruler with Center Line */}
            <div className="relative mb-4 h-8">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 flex justify-between items-center">
                {Array.from({ length: timelineCards.length + 1 }, (_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1 h-4 rounded-full transition-all duration-300",
                      snappedPosition === i ? "bg-green-400 shadow-lg scale-125" : "bg-white/50"
                    )}
                  ></div>
                ))}
              </div>
              {/* Center line indicator */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-yellow-400 shadow-lg z-10"></div>
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs font-bold">
                PLACE HERE
              </div>
            </div>

            {/* Enhanced Scrollable Timeline */}
            <div 
              ref={scrollViewRef}
              className="overflow-x-auto scrollbar-hide"
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              style={{
                WebkitOverflowScrolling: 'touch', // For momentum scrolling on iOS
                scrollBehavior: isDragging ? 'auto' : 'smooth'
              }}
            >
              <div 
                className="flex items-center pb-4" 
                style={{ 
                  width: `${totalWidth}px`,
                  paddingLeft: `${EXTRA_SPACE}px`,
                  paddingRight: `${EXTRA_SPACE}px`
                }}
              >
                {/* Left edge spacer */}
                <div style={{ width: `${(containerWidth - GAP_WIDTH) / 2 - EXTRA_SPACE}px` }}></div>
                
                {timelineCards.map((song, index) => (
                  <React.Fragment key={song.id || index}>
                    {/* Gap indicator */}
                    <div 
                      className={cn(
                        "flex-shrink-0 h-24 rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center",
                        snappedPosition === index ? 
                        "border-green-400 bg-green-400/20 scale-110 shadow-lg" : 
                        "border-white/40 bg-white/5",
                      )}
                      style={{ 
                        width: `${GAP_WIDTH}px`
                      }}
                    >
                      <div className={cn(
                        "w-3 h-3 rounded-full transition-all duration-300",
                        snappedPosition === index ? "bg-green-400 shadow-lg animate-pulse" : "bg-white/60"
                      )}></div>
                    </div>
                    
                    {/* Square Year card with preview */}
                    <div 
                      className="flex-shrink-0 relative cursor-pointer group"
                      style={{ 
                        width: `${CARD_WIDTH}px`,
                        height: `${CARD_WIDTH}px`
                      }}
                      onClick={() => song.preview_url && playPreview(song.preview_url, song.id)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl border-2 border-white/30 flex flex-col items-center justify-center shadow-xl transition-transform group-hover:scale-105">
                        <div className="text-white font-bold text-lg mb-1">
                          {song.release_year}
                        </div>
                        <div className="text-white/70 text-xs text-center px-1 font-medium truncate w-full">
                          {song.deezer_title.substring(0, 15)}...
                        </div>
                        {song.preview_url && (
                          <div className="absolute bottom-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                            {playingPreviewId === song.id ? (
                              <Pause className="w-3 h-3 text-white" />
                            ) : (
                              <Play className="w-3 h-3 text-white ml-0.5" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                
                {/* Final gap */}
                <div 
                  className={cn(
                    "flex-shrink-0 h-24 rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center",
                    snappedPosition === timelineCards.length ? 
                    "border-green-400 bg-green-400/20 scale-110 shadow-lg" : 
                    "border-white/40 bg-white/5",
                  )}
                  style={{ 
                    width: `${GAP_WIDTH}px`
                  }}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    snappedPosition === timelineCards.length ? "bg-green-400 shadow-lg animate-pulse" : "bg-white/60"
                  )}></div>
                </div>
                
                {/* Right edge spacer */}
                <div style={{ width: `${(containerWidth - GAP_WIDTH) / 2 - EXTRA_SPACE}px` }}></div>
              </div>
            </div>
            
            {/* Navigation hints */}
            <div className="flex justify-between items-center mt-2 text-white/60 text-xs">
              <div className="flex items-center">
                <MoveLeft className="w-4 h-4 mr-1" />
                <span>Scroll timeline</span>
              </div>
              <div className="flex items-center">
                <span>Lift finger to snap</span>
                <MoveRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Placement Button */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-4 pb-6">
          <Button
            onClick={handleConfirmPlacement}
            disabled={hasConfirmed || isSubmitting}
            className={cn(
              "w-full h-16 text-white font-bold text-xl rounded-2xl border-0 shadow-xl transition-all duration-300",
              hasConfirmed || isSubmitting ? 
              "bg-gradient-to-r from-gray-600 to-gray-700" :
              "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 hover:scale-105 active:scale-95"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>PLACING...</span>
              </div>
            ) : hasConfirmed ? (
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5" />
                <span>PLACED!</span>
              </div>
            ) : (
              'CONFIRM PLACEMENT'
            )}
          </Button>
        </div>
      )}

      {/* Footer Branding */}
      <div className="relative z-10 pb-6">
        <div className="text-center">
          <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-purple-200 tracking-wide drop-shadow-lg">
            TIMELINER
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
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
