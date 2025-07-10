import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, Sparkles, Zap } from 'lucide-react';
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
  const scrollEndTimer = useRef<NodeJS.Timeout | null>(null);

  // Responsive card dimensions
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
  const CARD_WIDTH = isSmallScreen ? 120 : 160;
  const CARD_HEIGHT = isSmallScreen ? 160 : 200;
  const GAP_WIDTH = 12;
  const TOTAL_ITEM_WIDTH = CARD_WIDTH + GAP_WIDTH;

  // Create timeline from player's existing songs
  const timelineCards = currentPlayer.timeline
    .filter(song => song !== null)
    .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));

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

  // Snap to the nearest gap with smooth animation
  const snapToNearestGap = () => {
    if (!scrollViewRef.current || !containerWidth) return;
    
    const scrollLeft = scrollViewRef.current.scrollLeft;
    const gapIndex = Math.round(scrollLeft / TOTAL_ITEM_WIDTH);
    const clampedGapIndex = Math.max(0, Math.min(gapIndex, timelineCards.length));
    
    const targetScroll = clampedGapIndex * TOTAL_ITEM_WIDTH;
    
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
  
  // Handle scroll events
  const handleScroll = () => {
    if (!scrollViewRef.current) return;

    // Real-time position update
    const scrollLeft = scrollViewRef.current.scrollLeft;
    const currentGapIndex = Math.round(scrollLeft / TOTAL_ITEM_WIDTH);
    const clampedGapIndex = Math.max(0, Math.min(currentGapIndex, timelineCards.length));
    if (clampedGapIndex !== snappedPosition) {
      setSnappedPosition(clampedGapIndex);
    }

    // Detect scroll end for snapping
    if (scrollEndTimer.current) {
      clearTimeout(scrollEndTimer.current);
    }
    
    scrollEndTimer.current = setTimeout(() => {
      if (!isDragging) {
        snapToNearestGap();
      }
    }, 150);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

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

  // Reset state on turn change or game end
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      setHasConfirmed(false);
      setSnappedPosition(0);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if(scrollEndTimer.current) {
        clearTimeout(scrollEndTimer.current);
      }
    };
  }, [isMyTurn, gameEnded]);
    
  // Result Overlay
  if (cardPlacementResult) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50">
        <div className="text-center space-y-8 p-8 max-w-sm relative">
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
          <div className={`text-9xl mb-8 ${cardPlacementResult.correct ? 'animate-bounce' : 'animate-pulse'}`}>
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
            <div className="text-2xl font-bold text-white mb-3">{cardPlacementResult.song.deezer_title}</div>
            <div className="text-lg text-white/80 mb-6">by {cardPlacementResult.song.deezer_artist}</div>
            <div className="inline-block bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white px-8 py-4 rounded-full font-black text-2xl shadow-xl animate-pulse">
              {cardPlacementResult.song.release_year}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:30px_30px] animate-pulse opacity-30" />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Player Header */}
        <div className="relative z-10 pt-4 pb-2 px-4">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-1 drop-shadow-lg truncate">
              <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                {currentPlayer.name}
              </span>
            </div>
            <div className="text-white/80 text-sm sm:text-base font-medium flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              {gameEnded ? 'Game Over' : isMyTurn ? 'Your Turn' : `${currentTurnPlayer.name}'s Turn`}
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
        </div>
        
        {/* Mystery Song Preview */}
        {isMyTurn && !gameEnded && (
          <div className="relative z-10 flex items-center justify-center px-4 py-2">
            <div className="text-center space-y-4 max-w-xs">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 animate-spin blur-xl opacity-60" style={{transform: 'scale(1.2)'}} />
                <div className={`relative w-32 h-32 mx-auto transition-all duration-500 ${isPlaying ? 'animate-spin' : 'hover:scale-110'}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-red-500/30 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-4 border-white/40">
                    <div className="absolute inset-4 border border-white/20 rounded-full" />
                    <div className="absolute inset-8 border border-white/15 rounded-full" />
                    <div className="absolute inset-12 border border-white/10 rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-4 border-white/50 shadow-xl"></div>
                    </div>
                  </div>
                  <Button
                    onClick={onPlayPause}
                    className="absolute inset-0 w-full h-full bg-black/30 hover:bg-black/50 border-0 rounded-full transition-all duration-300 group"
                    disabled={!currentSong?.preview_url}
                  >
                    <div className="text-white text-3xl group-hover:scale-125 transition-transform duration-300">
                      {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                    </div>
                  </Button>
                </div>
              </div>
              <div className="text-white/90 text-sm font-medium animate-pulse">
                🎵 Tap vinyl to preview 🎵
              </div>
            </div>
          </div>
        )}
        
        {/* Timeline Carousel */}
        {isMyTurn && !gameEnded && (
          <div className="relative z-10 px-2 pb-2 flex-1 min-h-0" ref={containerRef}>
            <div className="bg-gradient-to-r from-white/20 to-white/15 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-2xl h-full flex flex-col">
              <div className="text-center text-white/90 text-sm font-semibold mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Place your card in the timeline
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
              
              <div className="relative mb-4 h-8">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-xl animate-pulse"></div>
                <div className="absolute inset-0 flex justify-between items-center">
                  {Array.from({ length: timelineCards.length + 1 }, (_, i) => (
                    <div key={i} className={`w-1.5 h-5 rounded-full transition-all duration-500 ${snappedPosition === i ? "bg-gradient-to-t from-green-400 to-green-300 shadow-xl scale-150 animate-pulse" : "bg-white/60 hover:bg-white/80"}`} />
                  ))}
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-yellow-400 to-yellow-300 shadow-xl z-10 animate-pulse rounded-full" />
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-xs font-black px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                  PLACE HERE
                </div>
              </div>
              
              <div 
                ref={scrollViewRef}
                className="overflow-x-auto scrollbar-hide flex-1"
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div 
                  className="flex items-center h-full" 
                  style={{ 
                    paddingLeft: `calc(50% - ${CARD_WIDTH/2}px)`,
                    paddingRight: `calc(50% - ${CARD_WIDTH/2}px)`
                  }}
                >
                  {timelineCards.map((song, index) => (
                    <React.Fragment key={song.id || index}>
                      {/* Gap Indicator */}
                      <div 
                        className={`flex-shrink-0 rounded-xl border-2 border-dashed transition-all duration-500 flex items-center justify-center ${snappedPosition === index ? "border-green-400 bg-gradient-to-br from-green-400/30 to-green-300/20 scale-110 shadow-xl animate-pulse" : "border-white/50 bg-white/10 hover:bg-white/15 hover:border-white/70"}`}
                        style={{ width: `${GAP_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
                      >
                        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${snappedPosition === index ? "bg-gradient-to-br from-green-400 to-green-300 shadow-xl animate-ping" : "bg-white/70 hover:bg-white/90"}`} />
                      </div>
                      
                      {/* Card */}
                      <div 
                        className="flex-shrink-0 relative cursor-pointer group"
                        style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
                        onClick={() => song.preview_url && playPreview(song.preview_url, song.id)}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 rounded-xl border-2 border-white/40 flex flex-col items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl ${playingPreviewId === song.id ? 'animate-pulse border-yellow-400 bg-gradient-to-br from-yellow-900 via-yellow-800 to-yellow-700' : ''}`}>
                          <div className="relative z-10 text-center p-2">
                            <div className="text-white font-black text-xl mb-1 drop-shadow-lg">{song.release_year}</div>
                            <div className="text-white/90 text-xs font-bold text-center px-1 mb-1 leading-tight truncate w-full">
                              {song.deezer_title}
                            </div>
                            <div className="text-white/70 text-[10px] text-center px-1 font-medium truncate w-full">
                              {song.deezer_artist}
                            </div>
                          </div>
                          {song.preview_url && (
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform">
                              {playingPreviewId === song.id ? <Pause className="w-3 h-3 text-white animate-pulse" /> : <Play className="w-3 h-3 text-white ml-0.5" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                  
                  {/* Final Gap */}
                  <div 
                    className={`flex-shrink-0 rounded-xl border-2 border-dashed transition-all duration-500 flex items-center justify-center ${snappedPosition === timelineCards.length ? "border-green-400 bg-gradient-to-br from-green-400/30 to-green-300/20 scale-110 shadow-xl animate-pulse" : "border-white/50 bg-white/10 hover:bg-white/15 hover:border-white/70"}`}
                    style={{ width: `${GAP_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
                  >
                    <div className={`w-3 h-3 rounded-full transition-all duration-500 ${snappedPosition === timelineCards.length ? "bg-gradient-to-br from-green-400 to-green-300 shadow-xl animate-ping" : "bg-white/70 hover:bg-white/90"}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        {isMyTurn && !gameEnded && (
          <div className="relative z-10 px-4 pb-4 pt-2">
            <Button
              onClick={handleConfirmPlacement}
              disabled={hasConfirmed || isSubmitting}
              className={`w-full h-14 text-white font-black text-lg rounded-2xl border-0 shadow-xl transition-all duration-300 relative overflow-hidden ${hasConfirmed || isSubmitting ? "bg-gradient-to-r from-gray-600 to-gray-700" : "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 hover:scale-105 active:scale-95"}`}
            >
              <div className="relative z-10">
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>PLACING...</span>
                  </div>
                ) : hasConfirmed ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Check className="w-5 h-5 animate-pulse" />
                    <span>PLACED!</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span>CONFIRM</span>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                )}
              </div>
            </Button>
          </div>
        )}
        
        {/* Footer */}
        <div className="relative z-10 pb-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-purple-200 tracking-wide drop-shadow-lg">
              TIMELINER
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS Styles */}
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
