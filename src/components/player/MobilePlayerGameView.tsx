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
  
  const CARD_WIDTH = 110;
  const GAP_WIDTH = 25;
  const ITEM_SPACING = 145;
  const SIDE_PADDING = 200;

  const timelineCards = currentPlayer.timeline
    .filter(song => song !== null)
    .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));

  const totalItems = timelineCards.length + 1;
  const totalWidth = (totalItems * ITEM_SPACING) + (2 * SIDE_PADDING);

  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setScrollPosition((SIDE_PADDING + (Math.floor(timelineCards.length / 2) * ITEM_SPACING)) - (width / 2));
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
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
        left: targetScroll,
        behavior: 'smooth'
      });
    });
    setSnappedPosition(gapIndex);
  };

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (!scrollViewRef.current || !containerRef.current) return;

    const currentScroll = scrollViewRef.current.scrollLeft;
    const scrollAmount = ITEM_SPACING * (direction === 'left' ? -1 : 1);
    const targetScroll = currentScroll + scrollAmount;

    scrollViewRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    if (!scrollViewRef.current || !containerRef.current) return;

    const middleGapIndex = Math.floor(timelineCards.length / 2);
    const middleGapCenter = SIDE_PADDING + (middleGapIndex * ITEM_SPACING);
    const initialScroll = middleGapCenter - (containerRef.current.offsetWidth / 2);

    scrollViewRef.current.scrollTo({
      left: initialScroll,
      behavior: 'smooth'
    });
  }, [timelineCards.length]);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col overflow-hidden" ref={containerRef}>
      {/* Timeline */}
      <div className="flex-1 flex items-center">
        <button onClick={() => scrollTimeline('left')} className="absolute left-2 z-10 p-3 bg-white/20 rounded-full">
          <MoveLeft className="w-6 h-6 text-white" />
        </button>
        <div
          ref={scrollViewRef}
          className="overflow-x-auto scrollbar-hide w-full px-2"
          onScroll={handleScroll}
          style={{ scrollBehavior: isScrolling ? 'auto' : 'smooth' }}
        >
          <div className="flex items-center" style={{ width: `${totalWidth}px` }}>
            {Array.from({ length: totalItems }, (_, gapIndex) => {
              const gapX = SIDE_PADDING + (gapIndex * ITEM_SPACING);
              const cardIndex = gapIndex;
              const hasCard = cardIndex < timelineCards.length;

              return (
                <React.Fragment key={`gap-${gapIndex}`}>
                  <div
                    className="absolute flex items-center justify-center"
                    style={{
                      left: `${gapX - (GAP_WIDTH / 2)}px`,
                      width: `${GAP_WIDTH}px`,
                      height: '110px'
                    }}
                  >
                    <div
                      className={cn(
                        "rounded-xl border-2 border-dashed transition-all duration-500",
                        snappedPosition === gapIndex ? "border-green-400 bg-green-400/25 shadow-lg" : "border-white/50 bg-white/10"
                      )}
                    />
                  </div>
                  {hasCard && (
                    <div
                      className="absolute flex items-center justify-center cursor-pointer"
                      style={{
                        left: `${gapX + (GAP_WIDTH / 2)}px`,
                        width: `${CARD_WIDTH}px`,
                        height: '110px'
                      }}
                    >
                      <div className="rounded-xl border border-white" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <button onClick={() => scrollTimeline('right')} className="absolute right-2 z-10 p-3 bg-white/20 rounded-full">
          <MoveRight className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
