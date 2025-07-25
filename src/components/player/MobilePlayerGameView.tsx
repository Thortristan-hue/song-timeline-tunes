import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Music, Play, Pause, Check, ChevronLeft, ChevronRight, Volume2, MapPin, Target, Clock, TrendingUp } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn, getArtistColor, truncateText } from '@/lib/utils';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';

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
  onHighlightGap?: (gapIndex: number | null) => void;
  onViewportChange?: (viewportInfo: { startIndex: number; endIndex: number; totalCards: number } | null) => void;
}

// Enhanced Song Card Component with animations
const SongCard = React.memo(({ song, isLarge = false, isAnimating = false }: { song: Song; isLarge?: boolean; isAnimating?: boolean }) => {
  const cardStyle = useMemo(() => {
    if (!song?.deezer_artist) {
      return { backgroundColor: '#374151', borderColor: '#6B7280' };
    }
    return getArtistColor(song.deezer_artist);
  }, [song?.deezer_artist]);

  if (!song) {
    return (
      <div className={cn(
        "flex-shrink-0 rounded-lg border-2 border-red-400/50 bg-red-900/30 flex items-center justify-center",
        isLarge ? "w-40 h-32" : "w-28 h-24"
      )}>
        <div className="text-red-300 text-xs text-center">
          <div className="text-lg">⚠️</div>
          <div>Invalid</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex-shrink-0 rounded-lg border border-white/20 shadow-lg transition-all duration-300 relative overflow-hidden",
        isLarge ? "w-40 h-32" : "w-28 h-24",
        isAnimating ? "animate-pulse scale-105 shadow-2xl" : "hover:scale-105 active:scale-98"
      )}
      style={cardStyle}
    >
      {/* Shimmer effect for new cards */}
      {isAnimating && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer" />
      )}
      
      <div className="w-full h-full p-2 flex flex-col justify-between text-white relative z-10">
        <div className={cn("font-semibold leading-tight line-clamp-2", isLarge ? "text-sm" : "text-xs")}>
          {truncateText(song.deezer_title || 'Unknown', isLarge ? 30 : 20)}
        </div>
        <div className="flex justify-between items-end">
          <div className={cn("opacity-80 truncate flex-1 mr-1", isLarge ? "text-sm" : "text-xs")}>
            {truncateText(song.deezer_artist || 'Unknown', isLarge ? 15 : 10)}
          </div>
          <div className={cn(
            "bg-white/20 px-1.5 py-0.5 rounded font-bold backdrop-blur-sm", 
            isLarge ? "text-sm" : "text-xs"
          )}>
            {song.release_year || '????'}
          </div>
        </div>
      </div>
    </div>
  );
});

// Enhanced Timeline Gap Component with better animations
const TimelineGap = React.memo(({ 
  position, 
  isSelected, 
  onClick, 
  isMyTurn,
  totalPositions,
  beforeYear,
  afterYear,
  isPulsing = false
}: { 
  position: number; 
  isSelected: boolean; 
  onClick: () => void; 
  isMyTurn: boolean;
  totalPositions: number;
  beforeYear?: string | null;
  afterYear?: string | null;
  isPulsing?: boolean;
}) => {
  if (!isMyTurn) return null;

  // Position description
  const label = useMemo(() => {
    if (position === 0) return 'First';
    if (position === totalPositions - 1) return 'Last';
    return `${position + 1}`;
  }, [position, totalPositions]);

  const yearRange = useMemo(() => {
    if (beforeYear && afterYear) {
      return `Between ${beforeYear} - ${afterYear}`;
    } else if (beforeYear) {
      return `After ${beforeYear}`;
    } else if (afterYear) {
      return `Before ${afterYear}`;
    } else {
      return 'Any year';
    }
  }, [beforeYear, afterYear]);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={cn(
          "w-12 h-24 rounded-lg border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-xs font-medium relative overflow-hidden",
          isSelected
            ? "border-yellow-400 bg-yellow-400/20 text-yellow-300 scale-110 shadow-lg shadow-yellow-400/30"
            : "border-white/30 bg-white/5 text-white/60 hover:border-white/50 hover:bg-white/10 hover:text-white/80",
          isPulsing && !isSelected && "animate-pulse border-blue-400 bg-blue-400/20"
        )}
      >
        {/* Animated background for selected position */}
        {isSelected && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 animate-pulse" />
        )}
        
        <div className="relative z-10 text-center">
          <div className="text-lg mb-1">
            {isSelected ? '🎯' : '+'}
          </div>
          <div className="text-xs leading-tight">
            {label}
          </div>
        </div>
        
        {/* Tooltip */}
        {isSelected && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 animate-fade-in">
            {yearRange}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
          </div>
        )}
      </button>
    </div>
  );
});

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
  gameEnded,
  onHighlightGap
}: MobilePlayerGameViewProps) {
  // State Management
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioControlling, setIsAudioControlling] = useState(false);
  const [visibleTimelineRange, setVisibleTimelineRange] = useState({ start: 0, end: 0 });
  
  // Refs
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Data Validation
  const isValidPlayer = useMemo(() => {
    return currentPlayer && currentPlayer.id && currentPlayer.name;
  }, [currentPlayer]);

  const isValidSong = useMemo(() => {
    return currentSong && currentSong.id && currentSong.deezer_title;
  }, [currentSong]);

  // Timeline Processing - FIXED: Ensure player timeline is properly displayed
  const playerTimeline = useMemo(() => {
    console.log('Processing player timeline:', currentPlayer?.timeline);
    
    if (!currentPlayer?.timeline || !Array.isArray(currentPlayer.timeline)) {
      console.log('No timeline found or not an array');
      return [];
    }

    const filteredTimeline = currentPlayer.timeline
      .filter(song => {
        const isValid = song && song.id && song.deezer_title;
        if (!isValid) {
          console.log('Filtering out invalid song:', song);
        }
        return isValid;
      })
      .sort((a, b) => {
        const yearA = parseInt(a.release_year || '2024');
        const yearB = parseInt(b.release_year || '2024');
        return yearA - yearB;
      });

    console.log('Filtered and sorted timeline:', filteredTimeline);
    return filteredTimeline;
  }, [currentPlayer?.timeline]);

  const totalPositions = playerTimeline.length + 1;

  // Debug logging
  useEffect(() => {
    console.log('Mobile Player View Debug:', {
      currentPlayer: currentPlayer?.name,
      playerTimeline: playerTimeline.length,
      currentSong: currentSong?.deezer_title,
      isMyTurn,
      selectedPosition,
      totalPositions
    });
  }, [currentPlayer, playerTimeline, currentSong, isMyTurn, selectedPosition, totalPositions]);

  // Error Handling
  const showError = useCallback((message: string, duration = 3000) => {
    setError(message);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setError(null);
    }, duration);
  }, []);

  // Audio Control
  const handleAudioControl = useCallback(async () => {
    if (!isValidSong || isAudioControlling) return;

    setIsAudioControlling(true);
    
    try {
      await onPlayPause();
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Audio control failed:', error);
      showError('Failed to control audio. Please try again.');
      
      // Error vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setTimeout(() => setIsAudioControlling(false), 500);
    }
  }, [isValidSong, isAudioControlling, onPlayPause, showError]);

  // Card Placement
  const handlePlaceCard = useCallback(async () => {
    if (isSubmitting || !isMyTurn || gameEnded || !isValidSong) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onPlaceCard(currentSong, selectedPosition);
      
      if (!result.success) {
        showError('Failed to place card. Please try again.');
      }
      
      // Haptic feedback on success
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 100]);
      }
    } catch (error) {
      console.error('Card placement failed:', error);
      showError('Failed to place card. Please check your connection.');
      
      // Error vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isMyTurn, gameEnded, isValidSong, currentSong, selectedPosition, onPlaceCard, showError]);

  // Navigate to position and scroll timeline
  const navigatePosition = useCallback((direction: 'prev' | 'next') => {
    setSelectedPosition(current => {
      let newPosition = current;
      
      if (direction === 'prev' && current > 0) {
        newPosition = current - 1;
      } else if (direction === 'next' && current < totalPositions - 1) {
        newPosition = current + 1;
      } else {
        return current; // No change
      }
      
      // Scroll to the new position
      if (timelineScrollRef.current) {
        const timelineItems = timelineScrollRef.current.children;
        if (timelineItems && timelineItems[newPosition]) {
          const targetItem = timelineItems[newPosition] as HTMLElement;
          
          // Calculate center position
          const containerWidth = timelineContainerRef.current?.offsetWidth || 0;
          const scrollLeft = targetItem.offsetLeft - (containerWidth / 2) + (targetItem.offsetWidth / 2);
          
          timelineScrollRef.current.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
          });
          
          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(20);
          }
        }
      }
      
      return newPosition;
    });
  }, [totalPositions]);

  // Select position by clicking
  const selectPosition = useCallback((position: number) => {
    if (position >= 0 && position < totalPositions) {
      setSelectedPosition(position);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
      
      // Highlight the gap if callback exists
      if (onHighlightGap) {
        onHighlightGap(position);
      }
    }
  }, [totalPositions, onHighlightGap]);

  // Initialize position when turn starts
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      // Set initial position to middle of timeline
      const initialPosition = Math.min(Math.floor(totalPositions / 2), totalPositions - 1);
      setSelectedPosition(initialPosition);
      setError(null);
      
      // Scroll to initial position
      if (timelineScrollRef.current && initialPosition >= 0) {
        setTimeout(() => {
          const timelineItems = timelineScrollRef.current?.children;
          if (timelineItems && timelineItems[initialPosition]) {
            const targetItem = timelineItems[initialPosition] as HTMLElement;
            
            // Calculate center position
            const containerWidth = timelineContainerRef.current?.offsetWidth || 0;
            const scrollLeft = targetItem.offsetLeft - (containerWidth / 2) + (targetItem.offsetWidth / 2);
            
            timelineScrollRef.current.scrollTo({
              left: scrollLeft,
              behavior: 'smooth'
            });
          }
        }, 300);
      }
    }
  }, [isMyTurn, gameEnded, totalPositions]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Track scroll position to update visible range
  useEffect(() => {
    const handleScroll = () => {
      if (timelineScrollRef.current && timelineContainerRef.current) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          const scrollLeft = timelineScrollRef.current?.scrollLeft || 0;
          const containerWidth = timelineContainerRef.current?.offsetWidth || 0;
          const scrollRight = scrollLeft + containerWidth;
          
          const childElements = Array.from(timelineScrollRef.current?.children || []);
          let startIndex = 0;
          let endIndex = childElements.length - 1;
          
          for (let i = 0; i < childElements.length; i++) {
            const element = childElements[i] as HTMLElement;
            const elementLeft = element.offsetLeft;
            const elementRight = elementLeft + element.offsetWidth;
            
            if (elementRight >= scrollLeft && startIndex === 0) {
              startIndex = i;
            }
            
            if (elementLeft <= scrollRight) {
              endIndex = i;
            }
          }
          
          setVisibleTimelineRange({
            start: startIndex,
            end: endIndex
          });
        }, 100);
      }
    };
    
    const scrollElement = timelineScrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial call
    }
    
    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [playerTimeline]);

  // Loading States
  if (!isValidPlayer) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Player Error</h2>
          <p className="text-white/80 mb-4">Failed to load player data. Please refresh the page.</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/20"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  if (!isValidSong) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="text-4xl mb-4">🎵</div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Song...</h2>
          <p className="text-white/80 mb-4">Waiting for the next song to load.</p>
          <div className="w-8 h-8 mx-auto border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Result Screen
  if (cardPlacementResult) {
    const isCorrect = cardPlacementResult.correct;
    
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        isCorrect 
          ? 'bg-gradient-to-br from-green-600/90 to-green-900/90 backdrop-blur-sm' 
          : 'bg-gradient-to-br from-red-600/90 to-red-900/90 backdrop-blur-sm'
      )}>
        <div className="text-center space-y-6 max-w-sm w-full animate-fade-in">
          <div className="text-6xl mb-4 text-white animate-scale-in">
            {isCorrect ? '✓' : '✗'}
          </div>
          
          <div className="text-3xl font-bold text-white">
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </div>
          
          <div className="bg-white/95 rounded-2xl p-6 shadow-xl">
            <div className="text-lg font-bold text-gray-900 mb-2">
              {cardPlacementResult.song.deezer_title}
            </div>
            <div className="text-base text-gray-700 mb-3">
              by {cardPlacementResult.song.deezer_artist}
            </div>
            <div className={cn(
              "inline-block text-white px-4 py-2 rounded-lg font-bold text-lg",
              isCorrect ? 'bg-green-500' : 'bg-red-500'
            )}>
              {cardPlacementResult.song.release_year}
            </div>
          </div>
          
          <div className="text-white text-lg">
            {isCorrect ? (
              <div>
                <div className="font-bold">Perfect!</div>
                <div className="text-sm opacity-90">+1 Point</div>
              </div>
            ) : (
              <div className="font-bold">Better luck next time!</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Game View
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col relative overflow-hidden">
      
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-green-500/5 rounded-full blur-xl animate-ping" style={{ animationDuration: '4000ms' }} />
      </div>

      {/* Enhanced Header with Progress */}
      <div className="flex-shrink-0 p-4 border-b border-white/10 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Music className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                {currentPlayer.name}
              </h1>
              <div className="text-xs text-white/60">Timeliner Mode</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">
              Room: {roomCode}
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">
                {currentPlayer.timeline.length} cards
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Progress Indicator */}
        <div className="bg-white/10 rounded-full p-1 mb-2">
          <div className="flex items-center justify-between text-xs text-white/70 mb-1 px-2">
            <span>Timeline Progress</span>
            <span>{currentPlayer.timeline.length}/10 songs</span>
          </div>
          <Progress 
            value={(currentPlayer.timeline.length / 10) * 100} 
            className="h-2 bg-white/10"
          />
        </div>

        {/* Turn Indicator */}
        <div className={cn(
          "text-center py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300",
          isMyTurn 
            ? "bg-green-500/20 border border-green-400/30 text-green-300 animate-pulse" 
            : "bg-white/5 border border-white/20 text-white/60"
        )}>
          {isMyTurn ? (
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              Your Turn - Place the Mystery Card
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {currentTurnPlayer.name}'s Turn
            </div>
          )}
        </div>
      </div>

      {/* Mystery Card */}
      <div className="flex-shrink-0 py-3 px-4 border-b border-white/10 flex flex-col items-center">
        <div className="text-center mb-2">
          <div className="text-white/80 text-sm flex items-center justify-center gap-2">
            <Volume2 className="w-4 h-4" />
            Audio Control
          </div>
        </div>
        
        <div className="transform transition-transform duration-200 hover:scale-105 active:scale-98">
          <RecordMysteryCard 
            song={currentSong}
            isRevealed={mysteryCardRevealed}
            isPlaying={isPlaying}
            onPlayPause={handleAudioControl}
            className="w-48 h-48"
          />
        </div>

        {isMyTurn && (
          <div className="text-center mt-2 text-white/70 text-sm flex items-center justify-center">
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg py-1 px-3 flex items-center gap-2">
              <Music className="w-4 h-4" />
              <span>Place this song in your timeline</span>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="flex-1 flex flex-col relative">        
        {isMyTurn && (
          <div className="px-3 mb-1 text-center">
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg py-2 flex items-center justify-center gap-2 text-blue-200">
              <MapPin className="w-4 h-4" />
              {selectedPosition === 0 && "Before first song"}
              {selectedPosition === playerTimeline.length && "After last song"}
              {selectedPosition > 0 && selectedPosition < playerTimeline.length && (
                <>Between songs {selectedPosition} and {selectedPosition + 1}</>
              )}
            </div>
          </div>
        )}

        {/* Timeline Display */}
        <div className="flex-1 min-h-0 flex flex-col relative">
          {playerTimeline.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-white/60 bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="text-4xl mb-3">🎼</div>
                <div className="text-lg font-semibold mb-2">Empty Timeline</div>
                <div className="text-sm">
                  {isMyTurn ? 'Place your first song!' : 'Waiting for songs...'}
                </div>
              </div>
            </div>
          ) : (
            <div ref={timelineContainerRef} className="flex-1 relative flex flex-col overflow-hidden">
              {isMyTurn && (
                <div className="absolute left-0 right-0 top-1 z-10 pointer-events-none flex items-center justify-center">
                  <div className="bg-green-500/20 text-green-300 border border-green-400/30 rounded-full px-3 py-1 text-xs font-medium shadow-lg animate-fade-in">
                    Swipe timeline or use arrows to navigate
                  </div>
                </div>
              )}
              
              {/* Timeline Scroll View */}
              <div 
                ref={timelineScrollRef}
                className="flex-1 overflow-x-auto px-4 py-3"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <div className="min-h-full flex items-center">
                  <div className="flex items-center gap-3 min-w-max pb-6">
                    {/* First position gap */}
                    <TimelineGap
                      position={0}
                      isSelected={selectedPosition === 0}
                      onClick={() => selectPosition(0)}
                      isMyTurn={isMyTurn}
                      totalPositions={totalPositions}
                      afterYear={playerTimeline[0]?.release_year}
                    />
                    
                    {/* Timeline items */}
                    {playerTimeline.map((song, idx) => (
                      <React.Fragment key={song.id}>
                        <SongCard song={song} />
                        
                        {/* Gap after each song */}
                        <TimelineGap
                          position={idx + 1}
                          isSelected={selectedPosition === idx + 1}
                          onClick={() => selectPosition(idx + 1)}
                          isMyTurn={isMyTurn}
                          totalPositions={totalPositions}
                          beforeYear={song.release_year}
                          afterYear={playerTimeline[idx + 1]?.release_year}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Selected position indicator */}
              {isMyTurn && selectedPosition >= 0 && selectedPosition < totalPositions && (
                <div className="absolute bottom-0 left-0 right-0 px-4 py-1">
                  <div className="w-full bg-white/10 rounded-lg py-1.5 text-center">
                    <span className="text-xs text-white/70">Selected position: </span>
                    <span className="text-sm font-bold text-white">{selectedPosition + 1}</span>
                    <span className="text-xs text-white/70"> of {totalPositions}</span>
                  </div>
                </div>
              )}
              
              {/* Edge scroll indicators */}
              {visibleTimelineRange.start > 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none bg-gradient-to-r from-slate-900/80 to-transparent z-10" />
              )}
              {visibleTimelineRange.end < totalPositions - 1 && (
                <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none bg-gradient-to-l from-slate-900/80 to-transparent z-10" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timeline Navigation & Controls */}
      <div className="flex-shrink-0 p-3 border-t border-white/10 bg-slate-900/50">
        {isMyTurn ? (
          <div className="space-y-3">
            {/* Position Navigation */}
            <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
              <Button
                onClick={() => navigatePosition('prev')}
                disabled={selectedPosition === 0}
                size="lg"
                className={cn(
                  "flex-1 h-14 text-white",
                  "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700",
                  "border border-slate-600 disabled:opacity-40"
                )}
              >
                <ChevronLeft className="w-6 h-6" />
                <span className="ml-1">Previous</span>
              </Button>
              
              <Button
                onClick={() => navigatePosition('next')}
                disabled={selectedPosition === totalPositions - 1}
                size="lg"
                className={cn(
                  "flex-1 h-14 text-white",
                  "bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600",
                  "border border-slate-600 disabled:opacity-40"
                )}
              >
                <span className="mr-1">Next</span>
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Place Card Button */}
            <Button
              onClick={handlePlaceCard}
              disabled={isSubmitting || !currentSong}
              size="lg"
              className={cn(
                "w-full h-14 text-lg font-bold",
                "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400",
                "shadow-lg shadow-green-900/30 disabled:from-gray-600 disabled:to-gray-500"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Placing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>Place Card Here</span>
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center text-white/70 bg-white/10 rounded-xl p-3 border border-white/20">
            <div className="font-medium">
              {currentTurnPlayer.name} is placing a card
            </div>
            <div className="text-sm text-white/60 mt-1">
              Use the record above to control audio
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 z-60">
          <div className="bg-red-500/90 backdrop-blur-sm text-white text-center py-3 px-4 rounded-lg border border-red-400/50 shadow-lg animate-fade-in">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}