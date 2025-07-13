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
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Increased card size while keeping timeline compact
  const CARD_WIDTH = 160;  // Increased from 110
  const CARD_HEIGHT = 160; // Increased from 110
  const GAP_WIDTH = 15;    // Slightly increased gap
  const ITEM_SPACING = 180; // Increased spacing for larger cards
  const SIDE_PADDING = 250; // Increased padding

  const timelineCards = currentPlayer.timeline
    .filter(song => song !== null)
    .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));

  const totalItems = timelineCards.length + 1;
  const totalWidth = (totalItems * ITEM_SPACING) + (2 * SIDE_PADDING);

  // Center the middle gap on screen load and when timeline changes
  useEffect(() => {
    const centerMiddleGap = () => {
      if (containerRef.current && scrollViewRef.current) {
        const screenWidth = containerRef.current.offsetWidth;
        const middleGapIndex = Math.floor(timelineCards.length / 2);
        const middleGapCenter = SIDE_PADDING + (middleGapIndex * ITEM_SPACING);
        const targetScroll = middleGapCenter - (screenWidth / 2);
        
        scrollViewRef.current.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
        setSnappedPosition(middleGapIndex);
      }
    };

    // Center on load
    const timer = setTimeout(centerMiddleGap, 100);
    
    // Re-center on window resize
    const handleResize = () => {
      centerMiddleGap();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [timelineCards.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollViewRef.current) return;

    const scrollLeft = scrollViewRef.current.scrollLeft;
    setScrollPosition(scrollLeft);

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      snapToNearestGap();
    }, 150);
  };

  const snapToNearestGap = () => {
    if (!scrollViewRef.current || !containerRef.current) return;

    const scrollLeft = scrollViewRef.current.scrollLeft;
    const screenCenter = scrollLeft + (containerRef.current.offsetWidth / 2);
    const relativeCenter = screenCenter - SIDE_PADDING;
    const gapIndex = Math.round(relativeCenter / ITEM_SPACING);

    const gapCenter = SIDE_PADDING + (gapIndex * ITEM_SPACING);
    const targetScroll = gapCenter - (containerRef.current.offsetWidth / 2);

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    });
    setSnappedPosition(Math.max(0, Math.min(gapIndex, timelineCards.length)));
  };

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (!scrollViewRef.current || !containerRef.current) return;

    const currentScroll = scrollViewRef.current.scrollLeft;
    const scrollAmount = ITEM_SPACING * (direction === 'left' ? -1 : 1);
    const targetScroll = currentScroll + scrollAmount;

    scrollViewRef.current.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth'
    });

    // Update snapped position after scroll
    setTimeout(() => {
      snapToNearestGap();
    }, 300);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col overflow-hidden" ref={containerRef}>
      {/* Timeline */}
      <div className="flex-1 flex items-center relative">
        {/* Left scroll button */}
        <button 
          onClick={() => scrollTimeline('left')} 
          className="absolute left-4 z-20 p-4 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 shadow-lg backdrop-blur-sm"
          disabled={scrollPosition <= 0}
        >
          <MoveLeft className="w-6 h-6 text-white" />
        </button>
        
        {/* Timeline container */}
        <div
          ref={scrollViewRef}
          className="overflow-x-auto scrollbar-hide w-full"
          onScroll={handleScroll}
          style={{ scrollBehavior: isScrolling ? 'auto' : 'smooth' }}
        >
          <div 
            className="flex items-center relative" 
            style={{ 
              width: `${totalWidth}px`,
              height: `${CARD_HEIGHT + 40}px` // Extra height for better spacing
            }}
          >
            {/* Center line indicator */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-1 bg-white/30 z-10"
              style={{
                left: '50%',
                height: `${CARD_HEIGHT + 20}px`
              }}
            />
            
            {Array.from({ length: totalItems }, (_, gapIndex) => {
              const gapX = SIDE_PADDING + (gapIndex * ITEM_SPACING);
              const cardIndex = gapIndex;
              const hasCard = cardIndex < timelineCards.length;
              const card = hasCard ? timelineCards[cardIndex] : null;

              return (
                <React.Fragment key={`gap-${gapIndex}`}>
                  {/* Gap/Drop zone */}
                  <div
                    className="absolute flex items-center justify-center"
                    style={{
                      left: `${gapX - (GAP_WIDTH / 2)}px`,
                      width: `${GAP_WIDTH}px`,
                      height: `${CARD_HEIGHT}px`,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <div
                      className={cn(
                        "w-full h-full rounded-xl border-2 border-dashed transition-all duration-500",
                        snappedPosition === gapIndex 
                          ? "border-green-400 bg-green-400/25 shadow-lg scale-105" 
                          : "border-white/50 bg-white/10"
                      )}
                    />
                  </div>
                  
                  {/* Card */}
                  {hasCard && card && (
                    <div
                      className="absolute flex items-center justify-center cursor-pointer"
                      style={{
                        left: `${gapX + (GAP_WIDTH / 2) + 10}px`,
                        width: `${CARD_WIDTH}px`,
                        height: `${CARD_HEIGHT}px`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                    >
                      <div className="w-full h-full rounded-xl border-2 border-white/70 bg-gradient-to-br from-slate-800 to-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center p-4">
                        <div className="text-white text-center">
                          <div className="text-sm font-semibold mb-1 truncate w-full">
                            {card.title}
                          </div>
                          <div className="text-xs text-white/70 mb-2 truncate w-full">
                            {card.artist}
                          </div>
                          <div className="text-lg font-bold text-blue-300">
                            {card.release_year}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        
        {/* Right scroll button */}
        <button 
          onClick={() => scrollTimeline('right')} 
          className="absolute right-4 z-20 p-4 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 shadow-lg backdrop-blur-sm"
        >
          <MoveRight className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
