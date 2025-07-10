import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check } from 'lucide-react';
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
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Card dimensions
  const CARD_WIDTH = 160;
  const GAP_WIDTH = 8;
  const TOTAL_ITEM_WIDTH = CARD_WIDTH + GAP_WIDTH;
  const VISIBLE_CARDS = 2;

  // Create timeline from player's existing songs
  const timelineCards = currentPlayer.timeline
    .filter(song => song !== null)
    .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));

  // Calculate total width needed for scrolling
  const totalWidth = timelineCards.length * TOTAL_ITEM_WIDTH;

  // Handle scroll with scaling effect
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollViewRef.current) return;
    
    const scrollLeft = scrollViewRef.current.scrollLeft;
    const progress = (scrollLeft % TOTAL_ITEM_WIDTH) / TOTAL_ITEM_WIDTH;
    setScrollProgress(progress);
    
    // Calculate which gap we're closest to
    const gapIndex = Math.round(scrollLeft / TOTAL_ITEM_WIDTH);
    setSnappedPosition(gapIndex);
  };

  // Snap to nearest card on scroll end
  const handleScrollEnd = () => {
    if (!scrollViewRef.current) return;
    
    const scrollLeft = scrollViewRef.current.scrollLeft;
    const gapIndex = Math.round(scrollLeft / TOTAL_ITEM_WIDTH);
    const targetScroll = gapIndex * TOTAL_ITEM_WIDTH;
    
    scrollViewRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    
    setSnappedPosition(gapIndex);
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

  // Calculate card scale based on position
  const getCardScale = (index: number) => {
    const centerPosition = (scrollViewRef.current?.scrollLeft || 0) / TOTAL_ITEM_WIDTH;
    const distanceFromCenter = Math.abs(index - centerPosition);
    
    if (distanceFromCenter < 1) return 1.0;
    if (distanceFromCenter < 2) return 0.9;
    if (distanceFromCenter < 3) return 0.8;
    return 0.7;
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
        scrollViewRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isMyTurn, gameEnded]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex flex-col relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 20 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Player Header */}
      <div className="relative z-10 pt-10 pb-6 px-4">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-2 drop-shadow-lg truncate">
            {currentPlayer.name}
          </div>
          <div className="text-white/80 text-sm sm:text-base font-medium">
            {gameEnded ? 'Game Over' : 
             isMyTurn ? (
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-transparent bg-clip-text animate-pulse">
                Your Turn
              </span>
             ) : (
              <span>
                <span className="text-white/70">{currentTurnPlayer.name}'s</span> Turn
              </span>
             )}
          </div>
        </div>
      </div>

      {/* Mystery Song Preview */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
          <div className="text-center space-y-6 max-w-xs">
            <div className="relative">
              <div className={`relative w-40 h-40 mx-auto transition-transform duration-300 ${
                isPlaying ? 'animate-spin-slow' : 'hover:scale-105'
              }`}>
                {/* Vinyl Record Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-red-500/20 rounded-full blur-xl animate-pulse"></div>
                
                {/* Vinyl Record */}
                <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-4 border-white/30 overflow-hidden">
                  {/* Vinyl grooves */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
                  <div className="absolute inset-4 rounded-full border-2 border-white/5"></div>
                  <div className="absolute inset-8 rounded-full border-2 border-white/5"></div>
                  
                  {/* Center label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-4 border-white/40 shadow-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-white/80 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Play/Pause Button */}
                <Button
                  onClick={onPlayPause}
                  className="absolute inset-0 w-full h-full bg-black/30 hover:bg-black/50 border-0 rounded-full transition-all duration-300 group"
                  disabled={!currentSong?.preview_url}
                >
                  <div className="text-white text-3xl group-hover:scale-110 transition-transform duration-200">
                    {isPlaying ? (
                      <Pause className="w-8 h-8 fill-white" />
                    ) : (
                      <Play className="w-8 h-8 ml-1 fill-white" />
                    )}
                  </div>
                </Button>
              </div>
            </div>
            <div className="text-white/90 text-base font-medium">
              {currentSong?.preview_url ? (
                "Tap vinyl to preview"
              ) : (
                <span className="text-amber-400">No preview available</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Waiting screen */}
      {!isMyTurn && !gameEnded && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-lg border border-white/30 shadow-2xl animate-pulse">
              <Music className="w-12 h-12 text-white/80" />
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

      {/* Enhanced Carousel Timeline */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-2 pb-6" ref={containerRef}>
          <div className="bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/30 shadow-2xl">
            <div className="text-center text-white/90 text-base font-medium mb-4">
              Scroll to place between years
            </div>
            
            {/* Timeline with Center Indicator */}
            <div className="relative mb-4 h-8">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg"></div>
              {/* Center line indicator */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-yellow-400 shadow-lg z-10"></div>
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs font-bold">
                PLACE HERE
              </div>
            </div>

            {/* Carousel Container */}
            <div className="relative h-64 overflow-hidden">
              {/* Scaling Cards Carousel */}
              <div 
                ref={scrollViewRef}
                className="overflow-x-auto scrollbar-hide py-8"
                onScroll={handleScroll}
                onScrollEnd={handleScrollEnd}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth',
                  scrollSnapType: 'x mandatory'
                }}
              >
                <div 
                  className="flex items-center" 
                  style={{ 
                    width: `${totalWidth}px`,
                    height: `${CARD_WIDTH}px`
                  }}
                >
                  {timelineCards.map((song, index) => {
                    const scale = getCardScale(index);
                    const isCenter = Math.abs(index - snappedPosition) < 1.5;
                    
                    return (
                      <React.Fragment key={song.id || index}>
                        {/* Gap indicator (just a line) */}
                        {index > 0 && (
                          <div 
                            className="flex-shrink-0 h-full flex items-center justify-center"
                            style={{ width: `${GAP_WIDTH}px` }}
                          >
                            <div className={cn(
                              "w-0.5 h-16 rounded-full transition-all duration-300",
                              snappedPosition === index ? "bg-green-400 shadow-lg" : "bg-white/60"
                            )}></div>
                          </div>
                        )}
                        
                        {/* Scaling Card */}
                        <div 
                          className="flex-shrink-0 relative cursor-pointer transition-all duration-300"
                          style={{ 
                            width: `${CARD_WIDTH}px`,
                            height: `${CARD_WIDTH}px`,
                            transform: `scale(${scale})`,
                            zIndex: isCenter ? 10 : 1,
                            opacity: scale > 0.7 ? 1 : 0.8
                          }}
                          onClick={() => song.preview_url && playPreview(song.preview_url, song.id)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl border-2 border-white/30 flex flex-col items-center justify-center shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="text-white font-bold text-xl mb-2">
                              {song.release_year}
                            </div>
                            <div className="text-white/70 text-sm text-center px-2 font-medium truncate w-full">
                              {song.deezer_title.substring(0, 20)}...
                            </div>
                            {song.preview_url && (
                              <div className="absolute bottom-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                                {playingPreviewId === song.id ? (
                                  <Pause className="w-4 h-4 text-white fill-white" />
                                ) : (
                                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Placement Hint */}
            <div className="text-center text-white/60 text-xs mt-2">
              Scroll until the line is between the cards where you want to place
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
          <div className="text-xs text-white/50 mt-1">
            Room Code: {roomCode}
          </div>
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0) rotate(360deg); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
      
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
