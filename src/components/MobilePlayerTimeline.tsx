
import React, { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Check, X, RotateCcw, Loader2 } from "lucide-react";
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
  onDrop
}: MobilePlayerTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [snapPosition, setSnapPosition] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isPlacingCard, setIsPlacingCard] = useState(false);
  const [centerGapIndex, setCenterGapIndex] = useState<number>(0);
  
  // MOBILE OPTIMIZATION: Touch-friendly dimensions
  const CARD_WIDTH = 160; // Larger for better touch interaction
  const GAP_WIDTH = 100;   // Wider touch targets
  const SNAP_THRESHOLD = 30; // More forgiving snap sensitivity

  // Calculate total timeline width
  const totalGaps = player.timeline.length + 1;
  const totalCards = player.timeline.length;
  const timelineWidth = (totalCards * CARD_WIDTH) + (totalGaps * GAP_WIDTH);

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

  // MOBILE SCROLL: Enhanced scroll handler with iOS optimization
  const handleScroll = () => {
    if (!isCurrent || gameEnded || !draggedSong) return;
    
    setIsScrolling(true);
    
    // Debounce scroll end detection with iOS-friendly timing
    const timeoutId = setTimeout(() => {
      setIsScrolling(false);
      const centerGap = calculateCenterGap();
      setCenterGapIndex(centerGap);
      
      // Auto-snap to center gap with smooth iOS behavior
      if (timelineRef.current) {
        const targetX = (centerGap * (CARD_WIDTH + GAP_WIDTH));
        timelineRef.current.scrollTo({
          left: targetX,
          behavior: 'smooth'
        });
      }
      
      console.log(`📱 MOBILE SNAP: Gap ${centerGap} centered for card placement`);
    }, 200); // Slightly longer for better iOS performance
    
    return () => clearTimeout(timeoutId);
  };

  // Set up scroll listener with iOS touch optimization
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    
    // iOS-specific touch optimizations
    timeline.style.webkitOverflowScrolling = 'touch';
    timeline.style.touchAction = 'pan-x';
    
    timeline.addEventListener('scroll', handleScroll, { passive: true });
    return () => timeline.removeEventListener('scroll', handleScroll);
  }, [isCurrent, gameEnded, draggedSong, player.timeline.length]);

  // MOBILE TOUCH: Enhanced confirm placement with haptic feedback
  const handleConfirmPlacement = async () => {
    if (!placementPending || !onConfirmPlacement || gameEnded || isPlacingCard) {
      return;
    }
    
    setIsPlacingCard(true);
    
    // iOS haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    try {
      console.log('📱 MOBILE CONFIRM: Placing card at position', placementPending.position);
      await onConfirmPlacement(placementPending.song, placementPending.position);
    } catch (error) {
      console.error('❌ Mobile placement failed:', error);
    } finally {
      setTimeout(() => setIsPlacingCard(false), 1000);
    }
  };

  const handleCancelPlacement = () => {
    if (!onCancelPlacement || gameEnded || isPlacingCard) return;
    
    // iOS haptic feedback for cancel
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 30, 30]);
    }
    
    onCancelPlacement();
  };

  // MOBILE TOUCH: Enhanced gap tap with better touch response
  const handleGapTap = (position: number) => {
    if (!draggedSong || !isCurrent || gameEnded) return;
    
    console.log('📱 MOBILE TAP: Gap selected at position', position);
    
    // iOS haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(40);
    }
    
    onDrop(position);
  };

  // Enhanced mobile card rendering with better touch targets
  const renderMobileCard = (song: Song, index: number) => (
    <div
      key={`mobile-card-${index}`}
      className={cn(
        "flex-shrink-0 rounded-3xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl",
        "flex flex-col items-center justify-center p-4 text-white cursor-pointer",
        "transform transition-all duration-200 hover:scale-105 active:scale-95",
        gameEnded && "opacity-50 pointer-events-none"
      )}
      style={{ 
        width: CARD_WIDTH, 
        height: 140,
        minWidth: CARD_WIDTH,
        touchAction: 'manipulation'
      }}
    >
      <Music className="h-7 w-7 mb-3 opacity-80" />
      <div className="text-center space-y-2">
        <div className="font-bold text-sm leading-tight">
          {song.deezer_title.length > 14 ? song.deezer_title.substring(0, 14) + '...' : song.deezer_title}
        </div>
        <div className="text-xs opacity-70 font-medium">
          {song.deezer_artist.length > 12 ? song.deezer_artist.substring(0, 12) + '...' : song.deezer_artist}
        </div>
        <div className="text-xl font-bold bg-white/20 rounded-full px-3 py-1 border border-white/30">
          {song.release_year}
        </div>
      </div>
    </div>
  );

  // MOBILE TOUCH: Enhanced drop zone with visual feedback
  const renderMobileGap = (position: number) => {
    const isCenter = centerGapIndex === position && !isScrolling;
    const isPending = placementPending?.position === position;
    
    return (
      <div
        key={`mobile-gap-${position}`}
        className={cn(
          "flex-shrink-0 flex items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer",
          "border-2 border-dashed",
          gameEnded ? "opacity-50 pointer-events-none" :
          isPending ? "bg-blue-500/40 border-blue-300 scale-110 shadow-lg shadow-blue-400/30" :
          isCenter && draggedSong && isCurrent ? "bg-green-500/30 border-green-300 scale-105 shadow-xl shadow-green-400/40 animate-pulse" :
          "bg-white/10 border-white/30 hover:bg-white/20 active:bg-white/30"
        )}
        style={{ 
          width: GAP_WIDTH, 
          height: 120,
          minWidth: GAP_WIDTH,
          minHeight: 44, // iOS touch target minimum
          touchAction: 'manipulation'
        }}
        onClick={() => handleGapTap(position)}
        onTouchStart={(e) => {
          e.preventDefault();
          handleGapTap(position);
        }}
      >
        {isCenter && draggedSong && isCurrent && !isPending && !gameEnded && (
          <div className="text-center animate-bounce">
            <div className="text-green-300 text-sm font-bold mb-1">🎯 CENTERED</div>
            <div className="text-white/90 text-xs font-medium">Tap to Place</div>
          </div>
        )}
        {isPending && (
          <div className="text-blue-200 text-sm font-bold text-center animate-pulse">
            📍 CONFIRM<br/>PLACEMENT
          </div>
        )}
        {!isCenter && !isPending && draggedSong && isCurrent && !gameEnded && (
          <div className="text-white/60 text-xs text-center">
            Drop<br/>Zone
          </div>
        )}
      </div>
    );
  };

  if (!player) return null;

  return (
    <>
      {/* MOBILE CONFIRMATION: Enhanced modal with better touch targets */}
      {placementPending && !gameEnded && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-t-3xl p-6 w-full max-w-md shadow-2xl border-t-2 border-slate-600/50">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-400/50">
                <Music className="h-8 w-8 text-blue-300" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">📍 Confirm Card Placement</h2>
              <p className="text-slate-300 text-base">Place the mystery card in this timeline position?</p>
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
                    ✅ Confirm
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
                ❌ Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE TIMELINE: Enhanced with iOS scroll optimization */}
      <div className="fixed bottom-4 left-0 right-0 z-20 px-4">
        <div className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Touch instruction banner */}
          {draggedSong && isCurrent && !gameEnded && (
            <div className="bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-b border-blue-400/40 px-4 py-3">
              <p className="text-center text-blue-100 text-sm font-bold animate-pulse">
                📱 Scroll timeline → Center gap → Tap to place card
              </p>
            </div>
          )}
          
          {/* Scrollable timeline with iOS optimization */}
          <div 
            ref={timelineRef}
            className="flex items-center gap-3 p-6 overflow-x-auto scroll-smooth"
            style={{
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
              minHeight: '160px'
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
                    Scroll the mystery card timeline to find the perfect chronological placement
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
        </div>
      </div>
    </>
  );
}
