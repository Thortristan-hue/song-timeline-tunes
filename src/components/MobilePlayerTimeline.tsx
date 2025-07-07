
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
  
  // CRITICAL FIX 2: Mobile-specific card and gap dimensions
  const CARD_WIDTH = 140; // Mobile-optimized width
  const GAP_WIDTH = 80;   // Touch-friendly gap width
  const SNAP_THRESHOLD = 20; // Pixels for snap sensitivity

  // Calculate total timeline width
  const totalGaps = player.timeline.length + 1;
  const totalCards = player.timeline.length;
  const timelineWidth = (totalCards * CARD_WIDTH) + (totalGaps * GAP_WIDTH);

  // CRITICAL FIX 2: Snap-to-center functionality for mobile
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

  // CRITICAL FIX 2: Mobile scroll handler with snap
  const handleScroll = () => {
    if (!isCurrent || gameEnded || !draggedSong) return;
    
    setIsScrolling(true);
    
    // Debounce scroll end detection
    const timeoutId = setTimeout(() => {
      setIsScrolling(false);
      const centerGap = calculateCenterGap();
      setCenterGapIndex(centerGap);
      
      // Auto-snap to center gap
      if (timelineRef.current) {
        const targetX = (centerGap * (CARD_WIDTH + GAP_WIDTH));
        timelineRef.current.scrollTo({
          left: targetX,
          behavior: 'smooth'
        });
      }
    }, 150);
    
    return () => clearTimeout(timeoutId);
  };

  // Set up scroll listener
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    
    timeline.addEventListener('scroll', handleScroll, { passive: true });
    return () => timeline.removeEventListener('scroll', handleScroll);
  }, [isCurrent, gameEnded, draggedSong, player.timeline.length]);

  // CRITICAL FIX 2: Touch-friendly confirm placement
  const handleConfirmPlacement = async () => {
    if (!placementPending || !onConfirmPlacement || gameEnded || isPlacingCard) {
      return;
    }
    
    setIsPlacingCard(true);
    
    try {
      console.log('📱 Mobile: Confirming card placement');
      await onConfirmPlacement(placementPending.song, placementPending.position);
    } catch (error) {
      console.error('❌ Mobile: Failed to confirm placement:', error);
    } finally {
      setTimeout(() => setIsPlacingCard(false), 1000);
    }
  };

  const handleCancelPlacement = () => {
    if (!onCancelPlacement || gameEnded || isPlacingCard) return;
    onCancelPlacement();
  };

  // CRITICAL FIX 2: Mobile tap to place card
  const handleGapTap = (position: number) => {
    if (!draggedSong || !isCurrent || gameEnded) return;
    
    console.log('📱 Mobile: Gap tapped at position', position);
    onDrop(position);
  };

  // Render mobile-optimized card
  const renderMobileCard = (song: Song, index: number) => (
    <div
      key={`mobile-card-${index}`}
      className={cn(
        "flex-shrink-0 w-32 h-36 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-xl",
        "flex flex-col items-center justify-center p-3 text-white",
        gameEnded && "opacity-50"
      )}
      style={{ width: CARD_WIDTH }}
    >
      <Music className="h-6 w-6 mb-2 opacity-70" />
      <div className="text-center space-y-1">
        <div className="font-semibold text-xs leading-tight">
          {song.deezer_title.length > 12 ? song.deezer_title.substring(0, 12) + '...' : song.deezer_title}
        </div>
        <div className="text-xs opacity-60">
          {song.deezer_artist.length > 10 ? song.deezer_artist.substring(0, 10) + '...' : song.deezer_artist}
        </div>
        <div className="text-lg font-bold bg-white/10 rounded-full px-2 py-1">
          {song.release_year}
        </div>
      </div>
    </div>
  );

  // CRITICAL FIX 2: Mobile-optimized drop zone with snap indication
  const renderMobileGap = (position: number) => {
    const isCenter = centerGapIndex === position && !isScrolling;
    const isPending = placementPending?.position === position;
    
    return (
      <div
        key={`mobile-gap-${position}`}
        className={cn(
          "flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-300",
          gameEnded ? "opacity-50" :
          isPending ? "bg-blue-500/30 border-2 border-blue-400 scale-110" :
          isCenter && draggedSong && isCurrent ? "bg-green-500/20 border-2 border-green-400 scale-105 shadow-lg shadow-green-400/25" :
          "bg-white/5 border border-white/10"
        )}
        style={{ 
          width: GAP_WIDTH, 
          height: 120,
          minWidth: GAP_WIDTH
        }}
        onClick={() => handleGapTap(position)}
      >
        {isCenter && draggedSong && isCurrent && !isPending && !gameEnded && (
          <div className="text-center">
            <div className="text-green-400 text-xs font-bold mb-1">CENTERED</div>
            <div className="text-white/80 text-xs">Tap to place</div>
          </div>
        )}
        {isPending && (
          <div className="text-blue-200 text-xs font-bold text-center">
            CONFIRM<br/>PLACEMENT
          </div>
        )}
      </div>
    );
  };

  if (!player) return null;

  return (
    <>
      {/* CRITICAL FIX 2: Mobile confirmation dialog */}
      {placementPending && !gameEnded && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-t-3xl p-6 w-full max-w-md shadow-2xl border-t border-slate-600/50">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Music className="h-6 w-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Confirm Placement</h2>
              <p className="text-slate-300 text-sm">Place the card in this position?</p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleConfirmPlacement}
                disabled={isPlacingCard}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 rounded-xl text-base shadow-lg"
                size="lg"
              >
                {isPlacingCard ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancelPlacement}
                disabled={isPlacingCard}
                variant="outline"
                className="flex-1 border-2 border-slate-500 text-white hover:bg-slate-700/50 font-bold py-4 rounded-xl text-base"
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CRITICAL FIX 2: Mobile timeline with snap behavior */}
      <div className="fixed bottom-4 left-0 right-0 z-20 px-4">
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Timeline instruction for mobile */}
          {draggedSong && isCurrent && !gameEnded && (
            <div className="bg-blue-500/20 border-b border-blue-400/30 px-4 py-2">
              <p className="text-center text-blue-200 text-sm font-medium">
                📱 Drag timeline to position card, then tap centered gap
              </p>
            </div>
          )}
          
          {/* Scrollable timeline */}
          <div 
            ref={timelineRef}
            className="flex items-center gap-2 p-4 overflow-x-auto scroll-smooth"
            style={{
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth'
            }}
          >
            {player.timeline.length === 0 ? (
              // Empty state
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <Music className="h-12 w-12 text-white/30 mb-3" />
                <p className="text-white/70 text-base font-medium mb-1">
                  {gameEnded ? "Game Over" : isCurrent ? "Your timeline starts here" : "Building timeline..."}
                </p>
                {isCurrent && !gameEnded && (
                  <p className="text-white/50 text-sm">
                    Drag the mystery card to create your timeline
                  </p>
                )}
              </div>
            ) : (
              // Timeline with cards and gaps
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
