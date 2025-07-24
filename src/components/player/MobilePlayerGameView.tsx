
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
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);

  // Audio manager integration
  useEffect(() => {
    const handlePlayStateChange = (playing: boolean) => {
      setAudioIsPlaying(playing);
    };

    audioManager.addPlayStateListener(handlePlayStateChange);
    setAudioIsPlaying(audioManager.getIsPlaying());

    return () => {
      audioManager.removePlayStateListener(handlePlayStateChange);
    };
  }, []);

  // Debug menu state (Easter egg)
  const [debugClickCount, setDebugClickCount] = useState(0);
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  // Refs for scrolling and performance optimization
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Get sorted timeline songs for placement
  const timelineSongs = useMemo(() => {
    return currentPlayer.timeline
      .filter(song => song !== null)
      .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));
  }, [currentPlayer.timeline]);

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

  // Handle card placement with error handling
  const handlePlaceCard = async () => {
    if (isSubmitting || !isMyTurn || gameEnded) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await onPlaceCard(currentSong, selectedPosition);
      
      if (!result.success) {
        setError('Failed to place card. Please try again.');
      }
    } catch (err) {
      console.error('Card placement error:', err);
      setError('Failed to place card. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Handle position navigation with enhanced centering
  const navigatePosition = (direction: 'prev' | 'next') => {
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
  };

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
  }, [isMyTurn, gameEnded, selectedPosition, totalPositions, isSubmitting, currentSong]);

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
      {/* Fullscreen container with viewport meta support */}
      <div className="h-full w-full flex flex-col px-2 pt-2 pb-2" style={{ height: '100dvh' }}>
        
        {/* Header */}
        <div className="flex-shrink-0 py-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100">
              {currentPlayer.name}
            </h1>
            <div className="inline-block bg-white/10 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20">
              <span className="text-white/90 text-sm font-semibold">
                {gameEnded ? 'Game Over' : 
                 isMyTurn ? 'Your Turn' : `${currentTurnPlayer.name}'s Turn`}
              </span>
            </div>
          </div>
        </div>

        {/* ENHANCED: Universal Mystery Song Player - Always visible for universal control */}
        <div className="flex-shrink-0 py-2">
          <div className="flex justify-center">
            <div className="scale-75">
              <RecordMysteryCard 
                song={currentSong}
                isRevealed={mysteryCardRevealed}
                isPlaying={audioIsPlaying}
                onPlayPause={() => audioManager.togglePlayPause(currentSong)}
              />
            </div>
          </div>
          <div className="text-center mt-2">
            <div className="text-white/80 text-sm font-medium">
              {isMyTurn ? 'Mystery Song' : 'Universal Control'}
            </div>
            <div className="text-white/60 text-xs">
              {isMyTurn ? 'Place this song in your timeline' : 'Control host audio playback'}
            </div>
          </div>
        </div>

        {/* Content area with timeline always visible */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Enhanced timeline display */}
          <div className="flex-1 bg-white/10 backdrop-blur-2xl rounded-3xl p-4 border border-white/25 flex flex-col min-h-0">
            <div className="text-center mb-4">
              <div className="text-white text-lg font-semibold mb-1">
                {isMyTurn ? 'Your Timeline' : `${currentPlayer.name}'s Timeline`}
              </div>
              {isMyTurn && (
                <div className="text-white/80 text-sm">
                  {getPositionDescription(selectedPosition)}
                </div>
              )}
              {!isMyTurn && (
                <div className="text-white/70 text-sm bg-white/10 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20 mx-auto inline-block">
                  {currentTurnPlayer.name} is playing
                </div>
              )}
            </div>

            {/* Timeline cards - now always visible with enhanced mobile rendering */}
            <div className="flex-1 min-h-0">
              {timelineSongs.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white/60">
                    <div className="text-lg mb-2 font-semibold">No songs yet</div>
                    <div className="text-sm">
                      {isMyTurn ? 'Place your first song!' : 'Waiting for songs...'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 flex items-center justify-center">
                    <div 
                      ref={timelineScrollRef}
                      className="w-full overflow-x-auto pb-4 scroll-smooth"
                      style={{ 
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none',
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch', // Enhanced iOS momentum scrolling
                        touchAction: 'pan-x', // Better touch scrolling performance
                        overscrollBehavior: 'contain', // Prevent scrolling parent elements
                        // Enhanced mobile visibility
                        minHeight: '160px', // Ensure adequate height for cards
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-max px-8 justify-start" style={{ minHeight: '144px' }}>
                        {/* Enhanced position indicator before first card (only when my turn) */}
                        {isMyTurn && (
                          <div 
                            className={cn(
                              "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-700 cursor-pointer flex-shrink-0 font-bold touch-manipulation",
                              selectedPosition === 0 
                                ? "bg-gradient-to-br from-green-400 to-green-500 border-green-300 text-white scale-125 animate-mobile-gap-highlight shadow-lg shadow-green-400/60 hover:shadow-green-400/80" 
                                : "border-white/40 text-white/60 hover:border-white/60 hover:bg-white/10 hover:scale-110 active:scale-95"
                            )}
                            onClick={() => setSelectedPosition(0)}
                          >
                            {selectedPosition === 0 ? (
                              <Check className="w-6 h-6 animate-bounce" />
                            ) : (
                              <span className="animate-pulse">1</span>
                            )}
                          </div>
                        )}

                        {timelineSongs.map((song, index) => {
                          const cardColor = getCardColor(song);
                          return (
                            <React.Fragment key={song.id}>
                              {/* Enhanced song card with improved mobile visibility and grandiose animations */}
                              <div
                                className={cn(
                                  "w-36 h-36 rounded-2xl border border-white/20 transition-all duration-700 hover:scale-105 active:scale-95 cursor-pointer shadow-lg relative flex-shrink-0 touch-manipulation",
                                  "hover:shadow-xl hover:shadow-white/20 active:shadow-md hover:border-white/40",
                                  // Add subtle mobile-specific animation when it's the user's turn
                                  isMyTurn ? "hover:animate-mobile-card-select" : "",
                                  // Enhance visibility on mobile
                                  "backdrop-blur-sm border-2"
                                )}
                                style={{ 
                                  backgroundColor: cardColor.backgroundColor,
                                  backgroundImage: cardColor.backgroundImage,
                                  // Ensure cards are clearly visible on mobile
                                  minWidth: '144px',
                                  minHeight: '144px'
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
                                
                                <div className="p-3 h-full flex flex-col items-center justify-between text-white relative z-10">
                                  <div className="text-xs font-bold text-center leading-tight max-w-full text-white overflow-hidden drop-shadow-md">
                                    <div className="break-words">
                                      {truncateText(song.deezer_artist, 20)}
                                    </div>
                                  </div>
                                  
                                  <div className="text-3xl font-black text-white drop-shadow-lg">
                                    {song.release_year}
                                  </div>
                                  
                                  <div className="text-xs italic text-center leading-tight max-w-full text-white/90 overflow-hidden drop-shadow-sm">
                                    <div className="break-words">
                                      {truncateText(song.deezer_title, 18)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Enhanced position indicator after each card (only when my turn) */}
                              {isMyTurn && (
                                <div 
                                  className={cn(
                                    "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-700 cursor-pointer flex-shrink-0 font-bold touch-manipulation",
                                    selectedPosition === index + 1
                                      ? "bg-gradient-to-br from-green-400 to-green-500 border-green-300 text-white scale-125 animate-mobile-gap-highlight shadow-lg shadow-green-400/60 hover:shadow-green-400/80" 
                                      : "border-white/40 text-white/60 hover:border-white/60 hover:bg-white/10 hover:scale-110 active:scale-95"
                                  )}
                                  onClick={() => setSelectedPosition(index + 1)}
                                >
                                  {selectedPosition === index + 1 ? (
                                    <Check className="w-6 h-6 animate-bounce" />
                                  ) : (
                                    <span className="animate-pulse">{index + 2}</span>
                                  )}
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Turn-specific controls */}
        {!isMyTurn && !gameEnded && (
          <div className="flex-shrink-0 pt-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-white/15 backdrop-blur-2xl rounded-full flex items-center justify-center border-2 border-white/30">
                <Music className="w-8 h-8 text-white/90 animate-pulse" />
              </div>
              <div className="text-white/60 text-sm">
                Control the mystery song while you wait
              </div>
            </div>
          </div>
        )}

        {/* Turn-specific controls only when it's my turn */}
        {isMyTurn && !gameEnded && (
          <div className="flex-shrink-0 pt-4">
            <div className="px-4 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/15 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                {/* Previous button with enhanced touch feedback */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigatePosition('prev')}
                  disabled={selectedPosition === 0}
                  className={cn(
                    "flex-1 h-14 bg-white/10 border-white/30 text-white font-semibold transition-all duration-300 touch-manipulation",
                    selectedPosition === 0 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:bg-white/20 hover:border-white/50 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-white/20"
                  )}
                >
                  <ChevronLeft className="w-5 h-5 mr-2 animate-pulse" />
                  Previous
                </Button>

                {/* Enhanced Place card button with more grandiose visual feedback */}
                <Button
                  onClick={handlePlaceCard}
                  disabled={isSubmitting || !currentSong}
                  className={cn(
                    "flex-1 h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold transition-all duration-500 border-0 shadow-lg touch-manipulation",
                    !isSubmitting && currentSong 
                      ? "hover:scale-110 active:scale-95 animate-pulse-glow shadow-green-500/40 hover:shadow-green-500/60 hover:shadow-xl" 
                      : "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="animate-pulse">Placing...</span>
                    </div>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2 animate-bounce" />
                      <span className="animate-pulse font-black">Place Here</span>
                    </>
                  )}
                </Button>

                {/* Next button with enhanced touch feedback */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigatePosition('next')}
                  disabled={selectedPosition >= totalPositions - 1}
                  className={cn(
                    "flex-1 h-14 bg-white/10 border-white/30 text-white font-semibold transition-all duration-300 touch-manipulation",
                    selectedPosition >= totalPositions - 1 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:bg-white/20 hover:border-white/50 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-white/20"
                  )}
                >
                  <span className="animate-pulse">Next</span>
                  <ChevronRight className="w-5 h-5 ml-2 animate-pulse" />
                </Button>
              </div>

              {/* Error display with better styling */}
              {error && (
                <div className="mt-3 p-3 bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-xl">
                  <div className="flex items-center gap-2 text-red-200 text-sm font-medium">
                    <X className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
