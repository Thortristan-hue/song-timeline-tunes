import React, { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Check, X, RotateCcw, Loader2, Play, Pause, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Song, Player } from "@/types/game";
import { DeezerAudioService } from "@/services/DeezerAudioService";

interface MobilePlayerTimelineProps {
  player: Player;
  isCurrent: boolean;
  isDarkMode: boolean;
  draggedSong: Song | null;
  placementPending: { song: Song; position: number } | null;
  onConfirmPlacement?: (song: Song, position: number) => Promise<{ success: boolean }>;
  onCancelPlacement?: () => void;
  gameEnded?: boolean;
  onDrop: (position: number) => void;
  isAudioPlaying?: boolean;
  onToggleAudio?: () => void;
  hasPlayedAudio?: boolean;
}

export function MobilePlayerTimeline({
  player,
  isCurrent,
  isDarkMode,
  draggedSong,
  placementPending,
  onConfirmPlacement,
  onCancelPlacement,
  gameEnded = false,
  onDrop,
  isAudioPlaying = false,
  onToggleAudio = () => {},
  hasPlayedAudio = false
}: MobilePlayerTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [snapPosition, setSnapPosition] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isPlacingCard, setIsPlacingCard] = useState(false);
  const [centerGapIndex, setCenterGapIndex] = useState<number>(0);
  
  // Enhanced mobile dimensions with better touch targets
  const CARD_WIDTH = 140;
  const CARD_HEIGHT = 180;
  const GAP_WIDTH = 100;
  const MIN_TOUCH_TARGET = 48;

  // Calculate total timeline width
  const totalGaps = player.timeline.length + 1;
  const totalCards = player.timeline.length;
  const timelineWidth = (totalCards * CARD_WIDTH) + (totalGaps * GAP_WIDTH);

  // Enhanced haptic feedback
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 30,
        medium: 50,
        heavy: 100
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // MOBILE TOUCH: Enhanced snap-to-center functionality
  const calculateCenterGap = () => {
    if (!timelineRef.current) return 0;
    
    const timeline = timelineRef.current;
    const scrollLeft = timeline.scrollLeft;
    const containerWidth = timeline.clientWidth;
    const centerX = scrollLeft + (containerWidth / 2);
    
    // Calculate which gap is closest to center
    let closestGap = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i <= player.timeline.length; i++) {
      const gapX = (i * (CARD_WIDTH + GAP_WIDTH)) + (GAP_WIDTH / 2);
      const distance = Math.abs(centerX - gapX);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestGap = i;
      }
    }
    
    return closestGap;
  };

  // Enhanced scroll handler with debouncing
  const handleScroll = () => {
    if (!isCurrent || gameEnded || !draggedSong) return;
    
    setIsScrolling(true);
    
    const timeoutId = setTimeout(() => {
      setIsScrolling(false);
      const centerGap = calculateCenterGap();
      setCenterGapIndex(centerGap);
      
      // Auto-snap to center gap with smooth behavior
      if (timelineRef.current) {
        const targetX = (centerGap * (CARD_WIDTH + GAP_WIDTH));
        timelineRef.current.scrollTo({
          left: targetX,
          behavior: 'smooth'
        });
      }
    }, 200);
    
    return () => clearTimeout(timeoutId);
  };

  // Set up scroll listener with iOS touch optimization
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    
    const style = timeline.style as any;
    style.webkitOverflowScrolling = 'touch';
    timeline.style.touchAction = 'pan-x';
    
    timeline.addEventListener('scroll', handleScroll, { passive: true });
    return () => timeline.removeEventListener('scroll', handleScroll);
  }, [isCurrent, gameEnded, draggedSong, player.timeline.length]);

  // Enhanced confirm placement with haptic feedback
  const handleConfirmPlacement = async () => {
    if (!placementPending || !onConfirmPlacement || gameEnded || isPlacingCard) {
      return;
    }
    
    setIsPlacingCard(true);
    triggerHaptic('heavy');
    
    try {
      await onConfirmPlacement(placementPending.song, placementPending.position);
    } catch (error) {
      console.error('❌ Mobile placement failed:', error);
    } finally {
      setTimeout(() => setIsPlacingCard(false), 1000);
    }
  };

  const handleCancelPlacement = () => {
    if (!onCancelPlacement || gameEnded || isPlacingCard) return;
    
    triggerHaptic('medium');
    onCancelPlacement();
  };

  // Enhanced gap tap with better touch response
  const handleGapTap = (position: number) => {
    if (!draggedSong || !isCurrent || gameEnded) return;
    
    triggerHaptic('light');
    onDrop(position);
  };

  // Enhanced mobile card rendering with better design
  const renderMobileCard = (song: Song, index: number) => (
    <div
      key={`mobile-card-${index}`}
      className={cn(
        "flex-shrink-0 bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl",
        "flex flex-col items-center justify-center p-6 text-white cursor-pointer",
        "transform transition-all duration-300 hover:scale-105 active:scale-95",
        gameEnded && "opacity-50 pointer-events-none"
      )}
      style={{ 
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        minWidth: `${CARD_WIDTH}px`,
        scrollSnapAlign: 'center',
        touchAction: 'manipulation'
      }}
    >
      <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
          <Music className="h-6 w-6 text-white/80" />
        </div>
        <div className="text-sm font-bold leading-tight">
          {song.deezer_title.length > 16 ? song.deezer_title.substring(0, 16) + '...' : song.deezer_title}
        </div>
        <div className="text-xs opacity-70 font-medium">
          {song.deezer_artist.length > 14 ? song.deezer_artist.substring(0, 14) + '...' : song.deezer_artist}
        </div>
        <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent px-4 py-2 rounded-full border border-white/40 bg-white/10">
          {song.release_year}
        </div>
      </div>
    </div>
  );

  // Enhanced drop zone with better visual feedback
  const renderMobileGap = (position: number) => {
    const isCenter = centerGapIndex === position && !isScrolling;
    const isPending = placementPending?.position === position;
    
    return (
      <button
        key={`mobile-gap-${position}`}
        onClick={() => handleGapTap(position)}
        disabled={gameEnded || isPlacingCard}
        className={cn(
          "flex-shrink-0 flex items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-500",
          "focus:outline-none",
          gameEnded || isPlacingCard ? "opacity-50 cursor-not-allowed" :
          isPending ? "bg-blue-500/40 border-blue-300 scale-110 shadow-lg shadow-blue-400/30" :
          isCenter && draggedSong && isCurrent ? "bg-green-500/30 border-green-300 scale-105 shadow-xl shadow-green-400/40 animate-pulse" :
          "bg-white/10 border-white/30 hover:bg-white/20 active:bg-white/30"
        )}
        style={{ 
          width: `${GAP_WIDTH}px`,
          height: `${CARD_HEIGHT - 40}px`,
          minWidth: `${GAP_WIDTH}px`,
          minHeight: `${MIN_TOUCH_TARGET}px`,
          touchAction: 'manipulation',
          scrollSnapAlign: 'center'
        }}
        aria-label={`Place card at position ${position + 1}`}
      >
        {isCenter && draggedSong && isCurrent && !isPending && !gameEnded && (
          <div className="text-center animate-bounce">
            <div className="text-green-200 text-sm font-bold mb-1">🎯 CENTERED</div>
            <div className="text-white/90 text-xs">Tap to Place</div>
          </div>
        )}
        {isPending && (
          <div className="text-blue-200 text-sm font-bold text-center animate-pulse">
            📍 CONFIRM PLACEMENT
          </div>
        )}
        {!isCenter && !isPending && draggedSong && isCurrent && !gameEnded && (
          <div className="text-white/60 text-xs text-center">
            DROP ZONE
          </div>
        )}
      </button>
    );
  };

  // Render timeline ruler with tick marks
  const renderTimelineRuler = () => (
    <div className="flex items-center justify-center mt-4 px-4">
      <div className="flex items-center space-x-2">
        {Array.from({ length: player.timeline.length + 1 }, (_, i) => (
          <div key={i} className="flex items-center">
            <div className="w-2 h-6 bg-white/30 rounded-full"></div>
            {i < player.timeline.length && (
              <div className="w-16 h-px bg-gradient-to-r from-white/30 to-white/10"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (!player) return null;

  return (
    <>
      {/* Enhanced confirmation modal */}
      {placementPending && !gameEnded && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-t-3xl p-6 w-full max-w-md shadow-2xl border-t-2 border-slate-600/50">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-400/50">
                <Music className="h-8 w-8 text-blue-300" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">📍 Confirm Placement</h2>
              <p className="text-slate-300 text-base">
                Place <span className="font-bold">{placementPending.song.deezer_title}</span> at position {placementPending.position + 1}?
              </p>
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={handleConfirmPlacement}
                disabled={isPlacingCard}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-5 rounded-2xl text-lg shadow-lg border border-green-400/30"
                size="lg"
                style={{ minHeight: '56px', touchAction: 'manipulation' }}
              >
                {isPlacingCard ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Placing...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancelPlacement}
                disabled={isPlacingCard}
                variant="outline"
                className="flex-1 border-2 border-slate-500 text-white hover:bg-slate-700/50 font-bold py-5 rounded-2xl text-lg shadow-lg"
                size="lg"
                style={{ minHeight: '56px', touchAction: 'manipulation' }}
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced timeline container */}
      <div className="fixed bottom-4 left-0 right-0 z-20 px-4">
        <div className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Player info header */}
          <div className="bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-b border-blue-400/40 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow"
                style={{ backgroundColor: player.color }}
              >
                {player.name.charAt(0)}
              </div>
              <span className="text-white font-bold">{player.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-bold">{player.score}</span>
            </div>
          </div>
          
          {/* Audio player controls */}
          {draggedSong && isCurrent && !gameEnded && (
            <div className="px-4 py-2 flex items-center justify-center gap-4 bg-black/30">
              <button
                onClick={onToggleAudio}
                disabled={gameEnded}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95"
                style={{ touchAction: 'manipulation' }}
                aria-label={isAudioPlaying ? 'Pause preview' : 'Play preview'}
              >
                {isAudioPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white ml-0.5" />
                )}
              </button>
              <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                hasPlayedAudio ? 'bg-green-500/20 border-green-400 text-green-200' : 'bg-white/10 border-white/30 text-white/60'
              }`}>
                {hasPlayedAudio ? '✅ Preview played' : '🎵 Listen to preview'}
              </div>
            </div>
          )}
          
          {/* Scrollable timeline with proper CSS */}
          <div 
            ref={timelineRef}
            className="flex items-center gap-6 p-6 overflow-x-auto scroll-smooth"
            style={{
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              touchAction: 'pan-x'
            }}
          >
            {player.timeline.length === 0 ? (
              // Enhanced empty state
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center min-w-full">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-4 border border-white/20">
                  <Music className="h-10 w-10 text-white/40" />
                </div>
                <p className="text-white/80 text-lg font-bold mb-2">
                  {gameEnded ? "🏁 Game Complete" : isCurrent ? "🚀 Your Timeline Starts Here" : "⏳ Building Timeline..."}
                </p>
                {isCurrent && !gameEnded && (
                  <p className="text-white/60 text-sm max-w-xs leading-relaxed">
                    Scroll to position the mystery song in chronological order
                  </p>
                )}
              </div>
            ) : (
              // Timeline with cards and enhanced gaps
              <>
                {renderMobileGap(0)}
                {player.timeline.map((song, index) => (
                  <React.Fragment key={`timeline-${index}`}>
                    {renderMobileCard(song, index)}
                    {renderMobileGap(index + 1)}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
          
          {/* Timeline ruler */}
          {player.timeline.length > 0 && renderTimelineRuler()}
        </div>
      </div>
    </>
  );
}
