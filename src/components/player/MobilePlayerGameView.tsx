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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Card dimensions optimized for mobile
  const CARD_WIDTH = 120;
  const GAP_WIDTH = 16;
  const TOTAL_ITEM_WIDTH = CARD_WIDTH + GAP_WIDTH;

  // Create timeline from player's existing songs
  const timelineCards = currentPlayer.timeline
    .filter(song => song !== null)
    .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));

  // Calculate total width needed for scrolling
  const totalWidth = timelineCards.length * CARD_WIDTH + (timelineCards.length + 1) * GAP_WIDTH;

  // Handle scroll with scaling effect
  const handleScroll = () => {
    if (!scrollViewRef.current) return;
    
    const scrollLeft = scrollViewRef.current.scrollLeft;
    const containerWidth = scrollViewRef.current.clientWidth;
    const centerPosition = scrollLeft + containerWidth / 2;
    
    // Calculate which gap we're closest to
    const gapIndex = Math.round((centerPosition - GAP_WIDTH / 2) / TOTAL_ITEM_WIDTH);
    setSnappedPosition(Math.max(0, Math.min(gapIndex, timelineCards.length)));
  };

  // Snap to nearest gap on scroll end
  const handleScrollEnd = () => {
    if (!scrollViewRef.current) return;
    
    const containerWidth = scrollViewRef.current.clientWidth;
    const targetScroll = snappedPosition * TOTAL_ITEM_WIDTH - (containerWidth / 2 - GAP_WIDTH / 2);
    
    scrollViewRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
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
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ left: -scrollViewRef.current.clientWidth / 2 + GAP_WIDTH / 2, behavior: 'smooth' });
        }
      }, 100);
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
        <div className="text-center space-y-8 p-4 max-w-xs">
          <div className={`text-8xl mb-6 ${cardPlacementResult.correct ? 'animate-bounce' : 'animate-pulse'}`}>
            {cardPlacementResult.correct ? '🎯' : '💥'}
          </div>
          
          <div className={`text-4xl font-black mb-4 ${
            cardPlacementResult.correct ? 
            'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500' : 
            'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500'
          }`}>
            {cardPlacementResult.correct ? 'PERFECT!' : 'CLOSE!'}
          </div>
          
          <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/30 shadow-lg">
            <div className="text-xl font-bold text-white mb-2">
              {cardPlacementResult.song.deezer_title}
            </div>
            <div className="text-md text-white/80 mb-4">
              by {cardPlacementResult.song.deezer_artist}
            </div>
            <div className="inline-block bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-6 py-3 rounded-full font-black text-xl shadow-lg">
              {cardPlacementResult.song.release_year}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex flex-col overflow-hidden">
      {/* Player Header */}
      <div className="relative z-10 pt-4 pb-2 px-4">
        <div className="text-center">
          <div className="text-xl font-black text-white tracking-wide mb-1 truncate">
            {currentPlayer.name}
          </div>
          <div className="text-white/70 text-xs font-medium">
            {gameEnded ? 'Game Over' : 
             isMyTurn ? (
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-transparent bg-clip-text">
                Your Turn
              </span>
             ) : (
              `${currentTurnPlayer.name}'s Turn`
             )}
          </div>
        </div>
      </div>

      {/* Mystery Song Preview */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 flex items-center justify-center px-4 py-2">
          <div className="text-center space-y-4">
            <div className={`relative w-28 h-28 mx-auto transition-transform ${
              isPlaying ? 'animate-spin-slow' : 'hover:scale-105'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-red-500/20 rounded-full blur-md"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-full border-2 border-white/30">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-2 border-white/40"></div>
                </div>
              </div>
              <Button
                onClick={onPlayPause}
                className="absolute inset-0 w-full h-full bg-black/30 hover:bg-black/40 rounded-full"
                disabled={!currentSong?.preview_url}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white mx-auto" />
                ) : (
                  <Play className="w-6 h-6 text-white mx-auto ml-0.5" />
                )}
              </Button>
            </div>
            <div className="text-white/80 text-xs">
              Tap vinyl to preview
            </div>
          </div>
        </div>
      )}

      {/* Waiting screen */}
      {!isMyTurn && !gameEnded && (
        <div className="flex items-center justify-center px-4 py-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-lg border border-white/30">
              <Music className="w-8 h-8 text-white/80" />
            </div>
            <div className="text-lg font-bold text-white">
              {currentTurnPlayer.name} is playing
            </div>
            <div className="text-white/70 text-xs">
              Wait for your turn
            </div>
          </div>
        </div>
      )}

      {/* Timeline Placement Area */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 flex-1 flex flex-col justify-end px-2 pb-2">
          <div className="bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-md rounded-xl p-3 border border-white/30 shadow-lg">
            <div className="text-center text-white/80 text-xs mb-2">
              Scroll to place between years
            </div>
            
            {/* Timeline Ruler */}
            <div className="relative mb-2 h-6">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-yellow-400"></div>
              <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 text-yellow-400 text-[10px] font-bold">
                PLACE HERE
              </div>
            </div>

            {/* Cards Container */}
            <div className="relative h-40 overflow-hidden">
              <div 
                ref={scrollViewRef}
                className="overflow-x-auto scrollbar-hide py-6"
                onScroll={handleScroll}
                onTouchEnd={handleScrollEnd}
                onScrollEnd={handleScrollEnd}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}
              >
                <div 
                  className="flex items-center" 
                  style={{ 
                    width: `${totalWidth}px`,
                    height: `${CARD_WIDTH}px`,
                    paddingLeft: `calc(50% - ${GAP_WIDTH/2}px)`,
                    paddingRight: `calc(50% - ${GAP_WIDTH/2}px)`
                  }}
                >
                  {/* Initial gap */}
                  <div className="flex-shrink-0 h-full flex items-center justify-center"
                    style={{ width: `${GAP_WIDTH}px` }}>
                    <div className={cn(
                      "w-0.5 h-12 rounded-full transition-all",
                      snappedPosition === 0 ? "bg-green-400" : "bg-white/60"
                    )}></div>
                  </div>
                  
                  {timelineCards.map((song, index) => (
                    <React.Fragment key={song.id || index}>
                      {/* Card */}
                      <div className="flex-shrink-0 relative"
                        style={{ 
                          width: `${CARD_WIDTH}px`,
                          height: `${CARD_WIDTH}px`,
                          transform: `scale(${1 - Math.abs(index - snappedPosition + 1) * 0.1})`,
                          opacity: 1 - Math.abs(index - snappedPosition + 1) * 0.2
                        }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg border border-white/30 flex flex-col items-center justify-center shadow">
                          <div className="text-white font-bold text-lg">
                            {song.release_year}
                          </div>
                          <div className="text-white/70 text-[10px] text-center px-1 truncate w-full">
                            {song.deezer_title.substring(0, 15)}...
                          </div>
                        </div>
                      </div>
                      
                      {/* Gap after card */}
                      <div className="flex-shrink-0 h-full flex items-center justify-center"
                        style={{ width: `${GAP_WIDTH}px` }}>
                        <div className={cn(
                          "w-0.5 h-12 rounded-full transition-all",
                          snappedPosition === index + 1 ? "bg-green-400" : "bg-white/60"
                        )}></div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-4 pb-2 pt-2">
          <Button
            onClick={handleConfirmPlacement}
            disabled={hasConfirmed || isSubmitting}
            className={cn(
              "w-full h-12 text-white font-bold text-sm rounded-lg border-0",
              hasConfirmed || isSubmitting ? 
              "bg-gray-600" :
              "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>PLACING...</span>
              </div>
            ) : hasConfirmed ? (
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-4 h-4" />
                <span>PLACED!</span>
              </div>
            ) : (
              'CONFIRM PLACEMENT'
            )}
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 pb-2 pt-1">
        <div className="text-center">
          <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
            TIMELINER
          </div>
          <div className="text-[10px] text-white/50">
            Room: {roomCode}
          </div>
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
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
