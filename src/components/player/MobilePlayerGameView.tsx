import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, MoveRight, MoveLeft, Sparkles, Zap } from 'lucide-react';
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
  
  // Enhanced card dimensions for carousel effect
  const CARD_WIDTH = 160; // Larger cards
  const CARD_HEIGHT = 200; // Taller cards
  const GAP_WIDTH = 12;   // Smaller gaps
  const TOTAL_ITEM_WIDTH = CARD_WIDTH + GAP_WIDTH;
  const EXTRA_SPACE = 100;

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

  // Enhanced scroll handling with momentum
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const scrollElement = e.currentTarget;
    const scrollLeft = scrollElement.scrollLeft;
    const centerX = containerWidth / 2;
    const scrollCenter = scrollLeft + centerX - EXTRA_SPACE;
    
    // Calculate current position for real-time feedback
    const currentGapIndex = Math.round(scrollCenter / TOTAL_ITEM_WIDTH);
    const clampedGapIndex = Math.max(0, Math.min(currentGapIndex, timelineCards.length));
    
    // Update position if it changed
    if (clampedGapIndex !== snappedPosition) {
      setSnappedPosition(clampedGapIndex);
    }
  };

  // Handle touch start with haptic feedback
  const handleTouchStart = () => {
    setIsDragging(true);
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Enhanced touch end with smooth snapping
  const handleTouchEnd = () => {
    setIsDragging(false);
    setTimeout(() => snapToNearestGap(), 50); // Small delay for better UX
  };

  // Enhanced snap to nearest gap with easing
  const snapToNearestGap = () => {
    if (!scrollViewRef.current || !containerRef.current) return;
    
    const scrollLeft = scrollViewRef.current.scrollLeft;
    const centerX = containerWidth / 2;
    const scrollCenter = scrollLeft + centerX - EXTRA_SPACE;
    
    const gapIndex = Math.round(scrollCenter / TOTAL_ITEM_WIDTH);
    const clampedGapIndex = Math.max(0, Math.min(gapIndex, timelineCards.length));
    
    const targetScroll = clampedGapIndex * TOTAL_ITEM_WIDTH + EXTRA_SPACE - (containerWidth - GAP_WIDTH) / 2;
    
    scrollViewRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    
    setSnappedPosition(clampedGapIndex);
    
    // Haptic feedback on snap
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  // Enhanced preview play with visual feedback
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
      // Reset confirmation after submission
      setTimeout(() => setHasConfirmed(false), 2000);
    }
  };

  // Reset state when turn changes
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      setHasConfirmed(false);
      setSnappedPosition(0);
      if (scrollViewRef.current && containerWidth > 0) {
        scrollViewRef.current.scrollTo({ 
          left: EXTRA_SPACE - (containerWidth - GAP_WIDTH) / 2,
          behavior: 'smooth' 
        });
      }
    }
    
    // Clean up audio when component unmounts
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
        <div className="text-center space-y-8 p-8 max-w-sm relative">
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                <Sparkles className="w-4 h-4 text-yellow-400/60" />
              </div>
            ))}
          </div>
          
          <div className={`text-9xl mb-8 ${
            cardPlacementResult.correct ? 'animate-bounce' : 'animate-pulse'
          }`}>
            {cardPlacementResult.correct ? '🎯' : '💥'}
          </div>
          
          <div className={`text-5xl font-black mb-6 animate-pulse ${
            cardPlacementResult.correct ? 
            'text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500' : 
            'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-500'
          }`}>
            {cardPlacementResult.correct ? 'PERFECT!' : 'CLOSE!'}
          </div>
          
          <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/30 shadow-2xl transform hover:scale-105 transition-transform">
            <div className="text-2xl font-bold text-white mb-3">
              {cardPlacementResult.song.deezer_title}
            </div>
            <div className="text-lg text-white/80 mb-6">
              by {cardPlacementResult.song.deezer_artist}
            </div>
            <div className="inline-block bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white px-8 py-4 rounded-full font-black text-2xl shadow-xl animate-pulse">
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
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl animate-pulse delay-500" />
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:30px_30px] animate-pulse opacity-30" />
      </div>

      {/* Enhanced Player Header */}
      <div className="relative z-10 pt-12 pb-8 px-4">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl font-black text-white tracking-wide mb-3 drop-shadow-lg">
            <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              {currentPlayer.name}
            </span>
          </div>
          <div className="text-white/80 text-base sm:text-lg font-medium flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            {gameEnded ? 'Game Over' : 
             isMyTurn ? 'Your Turn' : `${currentTurnPlayer.name}'s Turn`}
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Enhanced Mystery Song Preview */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
          <div className="text-center space-y-8 max-w-xs">
            <div className="relative">
              {/* Glowing ring effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 animate-spin blur-xl opacity-60" style={{transform: 'scale(1.2)'}} />
              
              <div className={`relative w-40 h-40 mx-auto transition-all duration-500 ${
                isPlaying ? 'animate-spin' : 'hover:scale-110'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-red-500/30 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-4 border-white/40">
                  {/* Vinyl grooves */}
                  <div className="absolute inset-4 border border-white/20 rounded-full" />
                  <div className="absolute inset-8 border border-white/15 rounded-full" />
                  <div className="absolute inset-12 border border-white/10 rounded-full" />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-4 border-white/50 shadow-xl"></div>
                  </div>
                </div>
                <Button
                  onClick={onPlayPause}
                  className="absolute inset-0 w-full h-full bg-black/30 hover:bg-black/50 border-0 rounded-full transition-all duration-300 group"
                  disabled={!currentSong?.preview_url}
                >
                  <div className="text-white text-4xl group-hover:scale-125 transition-transform duration-300">
                    {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                  </div>
                </Button>
              </div>
            </div>
            <div className="text-white/90 text-lg font-medium animate-pulse">
              🎵 Tap vinyl to preview 🎵
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Timeline Carousel */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-4 pb-8" ref={containerRef}>
          <div className="bg-gradient-to-r from-white/20 to-white/15 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl">
            <div className="text-center text-white/90 text-lg font-semibold mb-6 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Scroll to place between years
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            
            {/* Enhanced Timeline Ruler */}
            <div className="relative mb-6 h-10">
              <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-xl animate-pulse"></div>
              <div className="absolute inset-0 flex justify-between items-center">
                {Array.from({ length: timelineCards.length + 1 }, (_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-6 rounded-full transition-all duration-500 ${
                      snappedPosition === i ? 
                      "bg-gradient-to-t from-green-400 to-green-300 shadow-xl scale-150 animate-pulse" : 
                      "bg-white/60 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
              
              {/* Enhanced center line indicator */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-10 bg-gradient-to-b from-yellow-400 to-yellow-300 shadow-xl z-10 animate-pulse rounded-full" />
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-xs font-black px-2 py-1 rounded-full shadow-lg animate-bounce">
                PLACE HERE
              </div>
            </div>

            {/* Enhanced Carousel Timeline */}
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
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: isDragging ? 'auto' : 'smooth'
              }}
            >
              <div 
                className="flex items-center pb-6" 
                style={{ 
                  width: `${totalWidth}px`,
                  paddingLeft: `${EXTRA_SPACE}px`,
                  paddingRight: `${EXTRA_SPACE}px`
                }}
              >
                {/* Left edge spacer */}
                <div style={{ width: `${(containerWidth - GAP_WIDTH) / 2 - EXTRA_SPACE}px` }} />
                
                {timelineCards.map((song, index) => (
                  <React.Fragment key={song.id || index}>
                    {/* Enhanced Gap indicator */}
                    <div 
                      className={`flex-shrink-0 rounded-2xl border-3 border-dashed transition-all duration-500 flex items-center justify-center ${
                        snappedPosition === index ? 
                        "border-green-400 bg-gradient-to-br from-green-400/30 to-green-300/20 scale-110 shadow-2xl animate-pulse" : 
                        "border-white/50 bg-white/10 hover:bg-white/15 hover:border-white/70"
                      }`}
                      style={{ 
                        width: `${GAP_WIDTH}px`,
                        height: `${CARD_HEIGHT}px`
                      }}
                    >
                      <div className={`w-4 h-4 rounded-full transition-all duration-500 ${
                        snappedPosition === index ? 
                        "bg-gradient-to-br from-green-400 to-green-300 shadow-xl animate-ping" : 
                        "bg-white/70 hover:bg-white/90"
                      }`} />
                    </div>
                    
                    {/* Enhanced 3D Card */}
                    <div 
                      className="flex-shrink-0 relative cursor-pointer group perspective-1000"
                      style={{ 
                        width: `${CARD_WIDTH}px`,
                        height: `${CARD_HEIGHT}px`
                      }}
                      onClick={() => song.preview_url && playPreview(song.preview_url, song.id)}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 rounded-2xl border-2 border-white/40 flex flex-col items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-y-12 group-hover:shadow-3xl ${
                        playingPreviewId === song.id ? 'animate-pulse border-yellow-400 bg-gradient-to-br from-yellow-900 via-yellow-800 to-yellow-700' : ''
                      }`}>
                        {/* Card shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:animate-pulse rounded-2xl" />
                        
                        <div className="relative z-10 text-center p-3">
                          <div className="text-white font-black text-2xl mb-2 drop-shadow-lg">
                            {song.release_year}
                          </div>
                          <div className="text-white/90 text-sm font-bold text-center px-1 mb-1 leading-tight">
                            {song.deezer_title.length > 15 ? 
                              song.deezer_title.substring(0, 15) + '...' : 
                              song.deezer_title}
                          </div>
                          <div className="text-white/70 text-xs text-center px-1 font-medium">
                            {song.deezer_artist.length > 12 ? 
                              song.deezer_artist.substring(0, 12) + '...' : 
                              song.deezer_artist}
                          </div>
                        </div>
                        
                        {song.preview_url && (
                          <div className="absolute bottom-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform">
                            {playingPreviewId === song.id ? (
                              <Pause className="w-4 h-4 text-white animate-pulse" />
                            ) : (
                              <Play className="w-4 h-4 text-white ml-0.5" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                
                {/* Final enhanced gap */}
                <div 
                  className={`flex-shrink-0 rounded-2xl border-3 border-dashed transition-all duration-500 flex items-center justify-center ${
                    snappedPosition === timelineCards.length ? 
                    "border-green-400 bg-gradient-to-br from-green-400/30 to-green-300/20 scale-110 shadow-2xl animate-pulse" : 
                    "border-white/50 bg-white/10 hover:bg-white/15 hover:border-white/70"
                  }`}
                  style={{ 
                    width: `${GAP_WIDTH}px`,
                    height: `${CARD_HEIGHT}px`
                  }}
                >
                  <div className={`w-4 h-4 rounded-full transition-all duration-500 ${
                    snappedPosition === timelineCards.length ? 
                    "bg-gradient-to-br from-green-400 to-green-300 shadow-xl animate-ping" : 
                    "bg-white/70 hover:bg-white/90"
                  }`} />
                </div>
                
                {/* Right edge spacer */}
                <div style={{ width: `${(containerWidth - GAP_WIDTH) / 2 - EXTRA_SPACE}px` }} />
              </div>
            </div>
            
            {/* Enhanced navigation hints */}
            <div className="flex justify-between items-center mt-4 text-white/70 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
                <MoveLeft className="w-4 h-4" />
                <span>Scroll timeline</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
                <span>Release to snap</span>
                <MoveRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Confirm Button */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-4 pb-8">
          <Button
            onClick={handleConfirmPlacement}
            disabled={hasConfirmed || isSubmitting}
            className={`w-full h-18 text-white font-black text-xl rounded-3xl border-0 shadow-2xl transition-all duration-500 relative overflow-hidden ${
              hasConfirmed || isSubmitting ? 
              "bg-gradient-to-r from-gray-600 to-gray-700" :
              "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 hover:scale-105 active:scale-95 hover:shadow-3xl"
            }`}
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
            
            <div className="relative z-10 py-2">
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>PLACING CARD...</span>
                </div>
              ) : hasConfirmed ? (
                <div className="flex items-center justify-center space-x-3">
                  <Check className="w-6 h-6 animate-pulse" />
                  <span>CARD PLACED!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                  <span>CONFIRM PLACEMENT</span>
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
              )}
            </div>
          </Button>
        </div>
      )}

      {/* Enhanced Footer */}
      <div className="relative z-10 pb-8">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-purple-200 tracking-wide drop-shadow-xl animate-pulse">
            ✨ TIMELINER ✨
          </div>
          <div className="text-white/60 text-sm mt-2 font-medium">
            Music • Timeline • Challenge
          </div>
        </div>
      </div>

      {/* Enhanced scrollbar and 3D styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .rotate-y-12 {
          transform: rotateY(12deg);
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.5);
        }
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}
