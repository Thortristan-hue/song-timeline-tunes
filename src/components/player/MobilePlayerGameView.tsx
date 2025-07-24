
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn, getArtistColor, truncateText } from '@/lib/utils';
import { audioManager } from '@/services/AudioManager';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';

interface MobilePlayerGameViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  currentSong: Song;
  roomCode: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  onPlayPause: () => void; // This is now the universal control
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  gameEnded: boolean;
  onHighlightGap?: (gapIndex: number | null) => void;
  onViewportChange?: (viewportInfo: { startIndex: number; endIndex: number; totalCards: number } | null) => void;
}

export default function MobilePlayerGameView({
  currentPlayer,
  currentTurnPlayer,
  currentSong,
  roomCode,
  isMyTurn,
  isPlaying,
  onPlayPause, // Universal control - triggers audio on host
  onPlaceCard,
  mysteryCardRevealed,
  cardPlacementResult,
  gameEnded,
  onHighlightGap,
  onViewportChange
}: MobilePlayerGameViewProps) {
  // Core state management
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Universal audio control - enhanced with validation and error handling
  const universalPlayPause = useCallback(async () => {
    if (!isValidCurrentSong) {
      console.warn('📱 UNIVERSAL CONTROL: Cannot control audio - invalid song data');
      setError('Cannot control audio - song data unavailable');
      return;
    }

    console.log('📱 UNIVERSAL CONTROL: Triggering play/pause on host for:', currentSong.deezer_title);
    
    try {
      const result = await onPlayPause(); // This triggers the host device audio via AudioManager
      if (result === false) {
        console.warn('📱 UNIVERSAL CONTROL: Command failed, showing user feedback');
        setError('Universal remote temporarily unavailable. Please try again.');
        setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
      }
    } catch (error) {
      console.error('📱 UNIVERSAL CONTROL: Error triggering play/pause:', error);
      setError('Failed to control host audio. Check your connection.');
      setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
    }
  }, [onPlayPause, currentSong, isValidCurrentSong]);

  // Debug menu state (Easter egg)
  const [debugClickCount, setDebugClickCount] = useState(0);
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  // Refs for scrolling and performance optimization
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Get sorted timeline songs for placement with relaxed validation
  const timelineSongs = useMemo(() => {
    if (!currentPlayer?.timeline) {
      console.log('📱 TIMELINE: No currentPlayer or timeline data found');
      return [];
    }

    if (!Array.isArray(currentPlayer.timeline)) {
      console.warn('📱 TIMELINE: Timeline data is not an array:', typeof currentPlayer.timeline);
      return [];
    }

    const validSongs = currentPlayer.timeline
      .filter(song => {
        // Relaxed validation for song data - only require essential fields
        if (!song || typeof song !== 'object') {
          console.debug('📱 TIMELINE: Filtering out invalid song object:', song);
          return false;
        }
        
        // Only require id and title - other fields can be missing
        if (!song.id || !song.deezer_title) {
          console.debug('📱 TIMELINE: Filtering out song with missing essential fields:', {
            id: song.id,
            title: song.deezer_title
          });
          return false;
        }

        // Validate release_year if present, otherwise use fallback
        if (song.release_year) {
          const year = parseInt(song.release_year);
          if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
            console.debug('📱 TIMELINE: Invalid year, but keeping song with fallback:', song.release_year);
            // Don't filter out, just use current year as fallback
            song.release_year = new Date().getFullYear().toString();
          }
        } else {
          // Assign fallback year if missing
          song.release_year = new Date().getFullYear().toString();
          console.debug('📱 TIMELINE: Missing year, using fallback for:', song.deezer_title);
        }

        return true;
      })
      .sort((a, b) => {
        const yearA = parseInt(a.release_year || '2024');
        const yearB = parseInt(b.release_year || '2024');
        return yearA - yearB;
      });

    console.log(`📱 TIMELINE: Displaying ${validSongs.length} songs on mobile timeline for ${currentPlayer.name || 'unknown player'}`);
    
    // Log if we filtered out any invalid songs
    const originalCount = currentPlayer.timeline.length;
    if (validSongs.length < originalCount) {
      console.warn(`📱 TIMELINE: Filtered out ${originalCount - validSongs.length} invalid songs from timeline`);
    }
    
    return validSongs;
  }, [currentPlayer?.timeline, currentPlayer?.name]);

  // Total positions available (before first, between each song, after last)
  const totalPositions = timelineSongs.length + 1;

  // Handle debug menu clicks
  const handleDebugClick = () => {
    const newCount = debugClickCount + 1;
    setDebugClickCount(newCount);
    
    if (newCount === 7) {
      setShowPasscodeDialog(true);
      setDebugClickCount(0);
    }
    
    setTimeout(() => {
      if (debugClickCount < 6) {
        setDebugClickCount(0);
      }
    }, 5000);
  };

  // Handle passcode submission
  const handlePasscodeSubmit = () => {
    if (passcode === 'IloveYou') {
      setDebugMode(true);
      setShowPasscodeDialog(false);
    } else {
      setPasscode('');
      setShowPasscodeDialog(false);
      setDebugClickCount(0);
    }
  };

  // Get consistent artist-based colors for cards
  const getCardColor = (song: Song) => {
    return getArtistColor(song.deezer_artist);
  };

  // Enhanced data validation
  const isValidCurrentSong = useMemo(() => {
    if (!currentSong || typeof currentSong !== 'object') {
      console.warn('📱 VALIDATION: Invalid currentSong object:', currentSong);
      return false;
    }
    
    if (!currentSong.id || !currentSong.deezer_title || !currentSong.release_year) {
      console.warn('📱 VALIDATION: CurrentSong missing required fields:', {
        id: currentSong.id,
        title: currentSong.deezer_title,
        year: currentSong.release_year
      });
      return false;
    }
    
    return true;
  }, [currentSong]);

  const isValidPlayerData = useMemo(() => {
    if (!currentPlayer || !currentPlayer.id || !currentPlayer.name) {
      console.warn('📱 VALIDATION: Invalid currentPlayer data:', currentPlayer);
      return false;
    }
    return true;
  }, [currentPlayer]);

  // Handle card placement with enhanced error handling and validation
  const handlePlaceCard = useCallback(async () => {
    if (isSubmitting || !isMyTurn || gameEnded) return;

    // Enhanced validation before placement
    if (!isValidCurrentSong) {
      setError('Invalid song data. Please refresh the page.');
      return;
    }

    if (!isValidPlayerData) {
      setError('Invalid player data. Please refresh the page.');
      return;
    }

    if (selectedPosition < 0 || selectedPosition > totalPositions - 1) {
      setError('Invalid position selected. Please try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      console.log('📱 PLACE CARD: Attempting placement:', {
        song: currentSong.deezer_title,
        position: selectedPosition,
        totalPositions
      });

      const result = await onPlaceCard(currentSong, selectedPosition);
      
      if (!result.success) {
        const errorMsg = result.error || 'Failed to place card. Please try again.';
        setError(errorMsg);
        console.error('📱 PLACE CARD: Failed:', errorMsg);
      } else {
        console.log('📱 PLACE CARD: Success!');
      }
    } catch (err) {
      console.error('📱 PLACE CARD: Error during placement:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to place card. Please try again.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isMyTurn, gameEnded, isValidCurrentSong, isValidPlayerData, selectedPosition, totalPositions, currentSong, onPlaceCard]);

  // Get position description
  const getPositionDescription = (position: number) => {
    if (timelineSongs.length === 0) return 'First card';
    if (position === 0) return 'Before first song';
    if (position === timelineSongs.length) return 'After last song';
    
    const beforeSong = timelineSongs[position - 1];
    const afterSong = timelineSongs[position];
    return `Between ${beforeSong.release_year} and ${afterSong.release_year}`;
  };

  // ENHANCED: Center the selected position in the timeline view with smoother scrolling
  const centerSelectedPosition = useCallback(() => {
    if (!timelineScrollRef.current) return;
    
    const container = timelineScrollRef.current;
    const containerWidth = container.clientWidth;
    
    // Calculate the position of the selected gap with improved precision
    const cardWidth = 144; // w-36 = 144px
    const gapWidth = 48; // w-12 = 48px (gap indicator width)
    const spacing = 8; // gap-2 = 8px
    
    // Each position consists of a gap + card (except the last position which is just a gap)
    const selectedGapPosition = selectedPosition * (cardWidth + gapWidth + spacing * 2);
    
    // Center the selected position in the viewport with enhanced smoothness
    const scrollPosition = selectedGapPosition - containerWidth / 2 + gapWidth / 2;
    
    // Use enhanced smooth scrolling with better performance
    container.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });

    // Add visual feedback for scrolling
    if (container.children[0]) {
      (container.children[0] as HTMLElement).classList.add('animate-mobile-timeline-scroll');
      setTimeout(() => {
        (container.children[0] as HTMLElement).classList.remove('animate-mobile-timeline-scroll');
      }, 800);
    }
  }, [selectedPosition]);

  // Enhanced touch gesture handling for timeline navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMyTurn || gameEnded) return;
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !isMyTurn || gameEnded) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchDiff = touchStartX - touchEndX;
    const minSwipeDistance = 50;
    
    if (Math.abs(touchDiff) > minSwipeDistance) {
      if (touchDiff > 0 && selectedPosition < totalPositions - 1) {
        // Swipe left - next position
        setSelectedPosition(prev => prev + 1);
      } else if (touchDiff < 0 && selectedPosition > 0) {
        // Swipe right - previous position
        setSelectedPosition(prev => prev - 1);
      }
    }
    
    setTouchStartX(null);
  };

  // Handle position navigation with enhanced centering
  const navigatePosition = useCallback((direction: 'prev' | 'next') => {
    let newPosition = selectedPosition;
    
    if (direction === 'prev' && selectedPosition > 0) {
      newPosition = selectedPosition - 1;
    } else if (direction === 'next' && selectedPosition < totalPositions - 1) {
      newPosition = selectedPosition + 1;
    }
    
    if (newPosition !== selectedPosition) {
      setSelectedPosition(newPosition);
      console.log('📱 NAVIGATION: Moving to position', newPosition, 'of', totalPositions);
    }
  }, [selectedPosition, totalPositions]);

  // ENHANCED: Center view when position changes with immediate effect
  useEffect(() => {
    if (isMyTurn) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        centerSelectedPosition();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedPosition, isMyTurn, centerSelectedPosition]);

  // Enhanced keyboard navigation support
  useEffect(() => {
    if (!isMyTurn || gameEnded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior to avoid page scrolling
      if (['ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case 'ArrowLeft':
          navigatePosition('prev');
          break;
        case 'ArrowRight':
          navigatePosition('next');
          break;
        case 'Enter':
        case ' ': // Spacebar
          if (!isSubmitting && currentSong) {
            handlePlaceCard();
          }
          break;
        default:
          break;
      }
    };

    // Add event listener to document for global keyboard support
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMyTurn, gameEnded, selectedPosition, totalPositions, isSubmitting, currentSong, navigatePosition, handlePlaceCard]);

  // Reset position when turn changes
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      const initialPosition = Math.floor(totalPositions / 2);
      setSelectedPosition(initialPosition);
      setError(null);
      console.log('📱 TURN START: Setting initial position to', initialPosition);
    }
  }, [isMyTurn, gameEnded, totalPositions]);

  // Sync highlighted gap with host when position changes
  useEffect(() => {
    if (isMyTurn && onHighlightGap) {
      onHighlightGap(selectedPosition);
    }
  }, [selectedPosition, isMyTurn, onHighlightGap]);

  // ENHANCED: Update viewport information for host display (throttled to reduce console noise)
  useEffect(() => {
    if (onViewportChange && timelineScrollRef.current && isMyTurn) {
      const container = timelineScrollRef.current;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      
      const cardWidth = 144;
      const gapWidth = 48;
      const spacing = 8;
      const itemWidth = cardWidth + gapWidth + spacing * 2;
      
      const startIndex = Math.floor(scrollLeft / itemWidth);
      const endIndex = Math.min(startIndex + Math.ceil(containerWidth / itemWidth), totalPositions - 1);
      
      // Only report significant viewport changes to avoid console noise
      onViewportChange({
        startIndex,
        endIndex,
        totalCards: timelineSongs.length
      });
    }
  }, [selectedPosition, onViewportChange, timelineSongs.length, totalPositions, isMyTurn]);

  // Early validation and error states
  if (!isValidPlayerData) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-red-950 via-red-900 to-red-800 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Player Data Error</h2>
          <p className="text-white/80 mb-4">
            There was an issue loading your player data. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 border border-white/20"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!isValidCurrentSong) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-orange-950 via-orange-900 to-orange-800 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="text-4xl mb-4">🎵</div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Song...</h2>
          <p className="text-white/80 mb-4">
            Waiting for the host to load the next song.
          </p>
          <div className="w-8 h-8 mx-auto border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Show result overlay
  if (cardPlacementResult) {
    const isCorrect = cardPlacementResult.correct;
    
    return (
      <div 
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-500",
          "px-4 pt-safe-top pb-safe-bottom",
          isCorrect 
            ? 'bg-gradient-to-br from-green-600 via-green-700 to-green-800' 
            : 'bg-gradient-to-br from-red-600 via-red-700 to-red-800'
        )}
      >
        <div className="text-center space-y-6 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-500">
          <div className="relative">
            <div className={cn(
              "text-6xl mb-4 font-light transition-all duration-500",
              isCorrect ? 'text-white drop-shadow-lg' : 'text-white drop-shadow-lg'
            )}>
              {isCorrect ? '✓' : '✗'}
            </div>
          </div>
          
          <div className={cn(
            "text-3xl font-semibold text-white drop-shadow-lg transition-all duration-300"
          )}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl animate-in slide-in-from-bottom-2 duration-400 delay-150">
            <div className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
              {cardPlacementResult.song.deezer_title}
            </div>
            <div className="text-base text-gray-700 mb-3 font-medium">
              by {cardPlacementResult.song.deezer_artist}
            </div>
            <div className={cn(
              "inline-block text-white px-4 py-2 rounded-xl font-semibold text-lg shadow-md transition-all duration-200",
              isCorrect 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-red-500 to-red-600'
            )}>
              {cardPlacementResult.song.release_year}
            </div>
          </div>
          
          <div className={cn(
            "text-white text-lg font-medium transition-all duration-300"
          )}>
            {isCorrect ? (
              <div className="space-y-1">
                <div className="text-xl">Perfect Placement!</div>
                <div className="text-sm opacity-90">+1 Point for {currentPlayer.name}</div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-lg">Not quite right</div>
                <div className="text-sm opacity-90">Try again next time</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
      {/* Fullscreen container with proper mobile viewport */}
      <div className="h-full w-full flex flex-col" style={{ height: '100dvh' }}>
        
        {/* Compact Header */}
        <div className="flex-shrink-0 py-3 px-4">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100">
              {currentPlayer.name}
            </h1>
            <div className="inline-block bg-white/10 backdrop-blur-xl rounded-full px-3 py-1 border border-white/20">
              <span className="text-white/90 text-xs font-semibold">
                {gameEnded ? 'Game Over' : 
                 isMyTurn ? 'Your Turn' : `${currentTurnPlayer.name}'s Turn`}
              </span>
            </div>
          </div>
        </div>

        {/* Universal Mystery Song Player - Compact */}
        <div className="flex-shrink-0 py-2 px-4">
          <div className="flex justify-center">
            <div className="scale-60">
              <RecordMysteryCard 
                song={currentSong}
                isRevealed={mysteryCardRevealed}
                isPlaying={isPlaying}
                onPlayPause={universalPlayPause}
              />
            </div>
          </div>
          <div className="text-center mt-1">
            <div className="text-white/80 text-xs font-medium">
              {isMyTurn ? 'Mystery Song - Tap to control host playback' : 'Universal Remote'}
            </div>
          </div>
        </div>

        {/* Enhanced Timeline Interface */}
        <div className="flex-1 flex flex-col min-h-0 px-4">
          
          {/* Timeline Section */}
          <div className="flex-1 bg-white/10 backdrop-blur-2xl rounded-3xl p-3 border border-white/25 flex flex-col min-h-0">
            <div className="text-center mb-3">
              <div className="text-white text-base font-semibold mb-1">
                Your Timeline ({timelineSongs.length} songs)
              </div>
              {isMyTurn && (
                <div className="text-white/80 text-xs bg-white/10 rounded-lg px-3 py-1">
                  {getPositionDescription(selectedPosition)}
                </div>
              )}
            </div>

            {/* Enhanced Mobile Timeline Display */}
            <div className="flex-1 min-h-0">
              {timelineSongs.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white/60">
                    <div className="text-base mb-2 font-semibold">Empty Timeline</div>
                    <div className="text-xs">
                      {isMyTurn ? 'Place your first song!' : 'Waiting for songs...'}
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="h-full overflow-x-auto scroll-smooth"
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-x',
                    overscrollBehavior: 'contain'
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="flex items-center gap-2 min-w-max px-4 h-full">
                    {/* Interactive timeline with placement gaps */}
                    {Array.from({ length: totalPositions }, (_, index) => {
                      const isLastPosition = index === totalPositions - 1;
                      const songAtPosition = timelineSongs[index - 1]; // Offset by 1 for gaps
                      
                      return (
                        <div key={index} className="flex items-center gap-2">
                          {/* Gap indicator for placement */}
                          {isMyTurn && (
                            <div 
                              className={cn(
                                "w-8 h-20 rounded-lg border-2 flex items-center justify-center transition-all duration-500 cursor-pointer flex-shrink-0 text-xs font-bold touch-manipulation active:scale-95",
                                selectedPosition === index 
                                  ? "bg-gradient-to-br from-green-400/30 to-green-500/30 border-green-300 text-green-100 scale-110 animate-pulse shadow-lg shadow-green-400/40" 
                                  : "border-white/30 text-white/50 hover:border-white/50 hover:bg-white/5 hover:scale-105"
                              )}
                              onClick={() => setSelectedPosition(index)}
                            >
                              {index + 1}
                            </div>
                          )}
                          
                          {/* Song card (if not last position) with enhanced error handling */}
                          {!isLastPosition && songAtPosition && (
                            <div 
                              className={cn(
                                "flex-shrink-0 w-24 h-20 rounded-lg border border-white/20 overflow-hidden transition-all duration-300",
                                songAtPosition.deezer_artist ? getCardColor(songAtPosition) : "bg-gray-600"
                              )}
                            >
                              <div className="w-full h-full p-2 flex flex-col justify-between">
                                <div className="text-white text-xs font-semibold leading-tight">
                                  {songAtPosition.deezer_title ? 
                                    truncateText(songAtPosition.deezer_title, 15) : 
                                    'Unknown Song'
                                  }
                                </div>
                                <div className="text-white/80 text-xs">
                                  {songAtPosition.release_year || new Date().getFullYear()}
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Handle invalid song data gracefully */}
                          {!isLastPosition && !songAtPosition && (
                            <div className="flex-shrink-0 w-24 h-20 rounded-lg border border-red-400/50 bg-red-900/30 overflow-hidden">
                              <div className="w-full h-full p-2 flex flex-col justify-center items-center">
                                <div className="text-red-300 text-xs">⚠️</div>
                                <div className="text-red-300 text-xs">Error</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Mobile Controls */}
          {isMyTurn && !gameEnded && (
            <div className="flex-shrink-0 pt-4 pb-safe-bottom">
              <div className="space-y-3">
                {/* Position Navigation */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={() => navigatePosition('prev')}
                    disabled={selectedPosition === 0}
                    className="bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-30 px-6 py-3 rounded-xl transition-all duration-300 active:scale-95"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Prev</span>
                  </Button>
                  
                  <div className="text-center text-white/80 text-xs min-w-[120px]">
                    Position {selectedPosition + 1} of {totalPositions}
                  </div>
                  
                  <Button
                    onClick={() => navigatePosition('next')}
                    disabled={selectedPosition === totalPositions - 1}
                    className="bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-30 px-6 py-3 rounded-xl transition-all duration-300 active:scale-95"
                  >
                    <span className="text-sm font-medium">Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Place Card Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handlePlaceCard}
                    disabled={isSubmitting || !currentSong}
                    className={cn(
                      "px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 active:scale-95 min-w-[200px]",
                      isSubmitting
                        ? "bg-gray-600 text-gray-300"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                    )}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Placing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        Place Card Here
                      </div>
                    )}
                  </Button>
                </div>
                
                {/* Swipe Hint */}
                <div className="text-center text-white/50 text-xs">
                  💡 Swipe left/right or use arrows to navigate
                </div>
                
                {error && (
                  <div className="text-center text-red-400 text-sm bg-red-400/10 rounded-lg p-2 border border-red-400/20">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Non-turn state info */}
          {!isMyTurn && !gameEnded && (
            <div className="flex-shrink-0 pt-4 pb-safe-bottom">
              <div className="text-center text-white/70 text-sm bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                <div className="font-semibold mb-1">{currentTurnPlayer.name} is playing</div>
                <div className="text-xs text-white/60">Use the record player to control host audio</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Debug Menu */}
        <div className="flex-shrink-0 py-2 text-center">
          <div 
            className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100 cursor-pointer"
            onClick={handleDebugClick}
          >
            {debugMode ? 'DEBUG MODE' : 'RYTHMY'}
          </div>
          {debugMode && currentSong && (
            <div className="mt-2 bg-black/50 backdrop-blur-xl rounded-xl p-3 border border-white/20 text-xs text-white">
              <div className="font-semibold mb-1">Song Debug Info:</div>
              <div>Title: {currentSong.deezer_title}</div>
              <div>Artist: {currentSong.deezer_artist}</div>
              <div>Release Year: {currentSong.release_year}</div>
            </div>
          )}
        </div>
      </div>

      {/* Passcode Dialog */}
      {showPasscodeDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className="text-white text-lg font-semibold mb-2">🔐 Debug Access</div>
              <div className="text-white/70 text-sm">Enter the secret passcode:</div>
            </div>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasscodeSubmit()}
              placeholder="Enter passcode"
              className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                onClick={() => {setShowPasscodeDialog(false); setPasscode(''); setDebugClickCount(0);}}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasscodeSubmit}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white border-0 rounded-xl"
              >
                Enter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
