
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, ChevronLeft, ChevronRight } from 'lucide-react';
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
  // Core state management
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(768); // Default fallback

  // Refs for performance optimization and carousel control
  const audioCleanupRef = useRef<() => void>();
  const carouselRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Get window width safely for dynamic calculations
  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    updateWindowWidth();
    
    // Listen for resize events
    window.addEventListener('resize', updateWindowWidth);
    return () => window.removeEventListener('resize', updateWindowWidth);
  }, []);

  // Get sorted timeline songs for placement
  const timelineSongs = currentPlayer.timeline
    .filter(song => song !== null)
    .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));

  // Generate random colors for cards
  const getRandomCardColor = (songId: string) => {
    // Use song ID as seed for consistent colors
    const colors = [
      'from-blue-600 to-blue-700',
      'from-purple-600 to-purple-700', 
      'from-green-600 to-green-700',
      'from-red-600 to-red-700',
      'from-yellow-600 to-yellow-700',
      'from-pink-600 to-pink-700',
      'from-indigo-600 to-indigo-700',
      'from-teal-600 to-teal-700',
      'from-orange-600 to-orange-700',
      'from-cyan-600 to-cyan-700'
    ];
    
    // Simple hash function for consistent color selection
    let hash = 0;
    for (let i = 0; i < songId.length; i++) {
      const char = songId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Total positions available (before first, between each song, after last)
  const totalPositions = timelineSongs.length + 1;

  // Audio cleanup utility
  const cleanupAudio = useCallback(() => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
      setPlayingPreviewId(null);
    }
  }, [previewAudio]);

  // Store cleanup function in ref for useEffect cleanup
  useEffect(() => {
    audioCleanupRef.current = cleanupAudio;
  }, [cleanupAudio]);

  // Handle song preview with error handling
  const handleSongPreview = useCallback(async (song: Song) => {
    try {
      setError(null);
      
      // Stop current audio if playing the same song
      if (playingPreviewId === song.id) {
        cleanupAudio();
        return;
      }

      // Clean up previous audio
      cleanupAudio();

      // Check if preview URL is available
      if (!song.preview_url) {
        setError('Preview not available for this song');
        return;
      }

      // Create and play new audio
      const audio = new Audio(song.preview_url);
      audio.volume = 0.7; // Set reasonable volume
      
      // Set up audio event handlers
      audio.onloadstart = () => setError(null);
      audio.oncanplay = () => {
        setPreviewAudio(audio);
        setPlayingPreviewId(song.id);
        audio.play().catch(err => {
          console.error('Audio play failed:', err);
          setError('Failed to play preview');
          cleanupAudio();
        });
      };
      audio.onended = () => {
        setPlayingPreviewId(null);
        setPreviewAudio(null);
      };
      audio.onerror = () => {
        setError('Failed to load preview');
        cleanupAudio();
      };

      // Start loading the audio
      audio.load();
    } catch (err) {
      console.error('Preview error:', err);
      setError('Failed to play preview');
      cleanupAudio();
    }
  }, [playingPreviewId, cleanupAudio]);

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
    if (position === 0) return 'Before first song';
    if (position === timelineSongs.length) return 'After last song';
    
    const beforeSong = timelineSongs[position - 1];
    const afterSong = timelineSongs[position];
    return `Between ${beforeSong.release_year} and ${afterSong.release_year}`;
  };

  // Handle position navigation
  const navigatePosition = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedPosition > 0) {
      setSelectedPosition(selectedPosition - 1);
    } else if (direction === 'next' && selectedPosition < totalPositions - 1) {
      setSelectedPosition(selectedPosition + 1);
    }
  };

  // Scroll carousel to center the selected position - improved for mobile
  const scrollToPosition = useCallback((position: number) => {
    if (!carouselRef.current || isScrollingRef.current) return;
    
    const carousel = carouselRef.current;
    const containerWidth = carousel.clientWidth;
    const cardWidth = 128; // w-32 = 128px
    const gapWidth = 6; // w-1.5 = 6px
    
    // Enhanced edge buffer for better mobile scrolling with larger buffer areas
    const edgeBuffer = Math.max(windowWidth * 0.6, 400); // Significantly increased buffer
    
    // Calculate precise scroll position to center the selected gap
    let targetScroll;
    
    if (position === 0) {
      // Before first card - center the first gap
      targetScroll = edgeBuffer + (gapWidth / 2) - (containerWidth / 2);
    } else if (position === timelineSongs.length) {
      // After last card - center the last gap with enhanced right buffer
      const totalCardsWidth = timelineSongs.length * cardWidth;
      const totalGapsWidth = (timelineSongs.length + 1) * gapWidth;
      const lastGapCenter = totalCardsWidth + totalGapsWidth - (gapWidth / 2);
      const rightBuffer = Math.max(480, windowWidth * 0.65); // Use larger right buffer
      targetScroll = edgeBuffer + lastGapCenter - (containerWidth / 2);
    } else {
      // Between cards - improved centering calculation
      const gapCenter = (position * (cardWidth + gapWidth)) + (gapWidth / 2);
      targetScroll = edgeBuffer + gapCenter - (containerWidth / 2);
    }
    
    // Ensure scroll position is within bounds
    targetScroll = Math.max(0, Math.min(targetScroll, carousel.scrollWidth - containerWidth));
    
    isScrollingRef.current = true;
    
    // Use smoother scrolling with shorter duration for mobile
    carousel.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset scrolling flag with optimized timing
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 300); // Reduced timeout for better responsiveness
  }, [timelineSongs.length, windowWidth]);

  // Handle scroll events to update selected position - simplified for better mobile performance
  const handleCarouselScroll = useCallback(() => {
    if (!carouselRef.current || isScrollingRef.current) return;
    
    const carousel = carouselRef.current;
    const scrollLeft = carousel.scrollLeft;
    const containerWidth = carousel.clientWidth;
    const cardWidth = 128; // w-32 = 128px
    const gapWidth = 6; // w-1.5 = 6px
    
    // Enhanced edge buffer for better mobile experience with larger buffer areas
    const edgeBuffer = Math.max(windowWidth * 0.6, 400); // Significantly increased buffer
    
    // Calculate which position is closest to center
    const centerPoint = scrollLeft + (containerWidth / 2);
    const adjustedCenterPoint = centerPoint - edgeBuffer;
    
    // Find the closest gap position with simplified calculation
    let closestPosition = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i <= timelineSongs.length; i++) {
      let gapCenter;
      if (i === 0) {
        // First gap
        gapCenter = gapWidth / 2;
      } else if (i === timelineSongs.length) {
        // Last gap after all cards
        gapCenter = (timelineSongs.length * cardWidth) + ((timelineSongs.length + 1) * gapWidth) - (gapWidth / 2);
      } else {
        // Gap between cards - simplified calculation
        gapCenter = (i * (cardWidth + gapWidth)) + (gapWidth / 2);
      }
      
      const distance = Math.abs(adjustedCenterPoint - gapCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestPosition = i;
      }
    }
    
    // Only update if position actually changed
    if (closestPosition !== selectedPosition) {
      setSelectedPosition(closestPosition);
    }
  }, [selectedPosition, timelineSongs.length, windowWidth]);

  // Simplified scroll handler for better mobile performance
  const scrollHandler = useMemo(() => {
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    
    return () => {
      // Clear any existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Immediate update for responsive feedback
      handleCarouselScroll();
      
      // Debounced update for final position
      scrollTimeout = setTimeout(() => {
        handleCarouselScroll();
      }, 50); // Reduced delay for better responsiveness
    };
  }, [handleCarouselScroll]);

  // Effect to scroll to position when it changes
  useEffect(() => {
    scrollToPosition(selectedPosition);
  }, [selectedPosition, scrollToPosition]);

  // Cleanup audio on unmount or turn change
  useEffect(() => {
    return () => {
      audioCleanupRef.current?.();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Reset position when turn changes
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      setSelectedPosition(Math.floor(totalPositions / 2)); // Start in middle
      setError(null);
    }
  }, [isMyTurn, gameEnded, totalPositions]);

  // Show result overlay with refined, tasteful design
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
          {/* Result icon with elegant animation */}
          <div className="relative">
            <div className={cn(
              "text-6xl mb-4 font-light transition-all duration-500",
              isCorrect ? 'text-white drop-shadow-lg' : 'text-white drop-shadow-lg'
            )}>
              {isCorrect ? '✓' : '✗'}
            </div>
          </div>
          
          {/* Result text with refined styling */}
          <div className={cn(
            "text-3xl font-semibold text-white drop-shadow-lg transition-all duration-300"
          )}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </div>
          
          {/* Song info with elegant slide-in animation */}
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
          
          {/* Score indicator with subtle feedback */}
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
    <div className="fixed inset-0 z-40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Safe area container */}
      <div className="h-full flex flex-col px-4 pt-safe-top pb-safe-bottom">
        
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

        {/* Content area */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Waiting screen */}
          {!isMyTurn && !gameEnded && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-white/15 backdrop-blur-2xl rounded-full flex items-center justify-center border-2 border-white/30">
                  <Music className="w-10 h-10 text-white/90 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">
                    {currentTurnPlayer.name} is playing
                  </div>
                  <div className="text-white/70 text-lg bg-white/10 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20">
                    Wait for your turn
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Game interface */}
          {isMyTurn && !gameEnded && (
            <>
              {/* Mystery song preview */}
              <div className="flex-shrink-0 text-center py-6">
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <div className={cn(
                      "w-24 h-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-2 border-white/40 transition-all duration-500",
                      isPlaying && "animate-spin"
                    )}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-2 border-white/50" />
                      </div>
                      
                      {/* Vinyl grooves */}
                      <div className="absolute inset-2 border border-white/10 rounded-full" />
                      <div className="absolute inset-3 border border-white/10 rounded-full" />
                    </div>
                    
                    <Button
                      onClick={onPlayPause}
                      className="absolute inset-0 w-full h-full bg-black/20 hover:bg-black/40 border-0 rounded-full transition-all duration-300 group"
                      disabled={!currentSong?.preview_url}
                    >
                      <div className="text-white text-xl group-hover:scale-125 transition-transform duration-300">
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                      </div>
                    </Button>
                  </div>
                  
                  <div className="text-white/90 text-sm font-semibold bg-white/10 backdrop-blur-xl rounded-xl px-3 py-2 border border-white/20 inline-block">
                    Mystery Song - Tap to preview
                  </div>
                </div>
              </div>

              {/* Timeline display - Horizontal Carousel */}
              <div className="flex-1 bg-white/10 backdrop-blur-2xl rounded-3xl p-4 border border-white/25 flex flex-col min-h-0">
                <div className="text-center mb-4">
                  <div className="text-white text-lg font-semibold mb-2">Your Timeline</div>
                  <div className="text-white/80 text-sm">
                    Position: {getPositionDescription(selectedPosition)}
                  </div>
                </div>

                {/* Horizontal carousel container */}
                <div className="flex-1 relative">
                  {/* Center line indicator - improved visibility and positioning */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-3/4 bg-green-400/80 z-10 pointer-events-none rounded-full shadow-lg">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-400 rounded-full w-4 h-4 animate-pulse shadow-lg border-2 border-white/50">
                    </div>
                  </div>
                  
                  {/* Selection indicator at center - improved visibility */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-green-400 text-white px-4 py-2 rounded-full text-sm font-bold z-20 pointer-events-none animate-bounce shadow-lg border-2 border-white/30">
                    Place Here
                  </div>

                  {/* Scrollable carousel with optimized mobile touch handling */}
                  <div 
                    ref={carouselRef}
                    className="flex items-center h-full overflow-x-auto overflow-y-hidden scrollbar-hide"
                    style={{ 
                      scrollSnapType: 'x mandatory', // More precise snapping for better mobile control
                      scrollBehavior: 'smooth',
                      WebkitOverflowScrolling: 'touch', // Enable momentum scrolling on iOS
                      scrollbarWidth: 'none', // Hide scrollbar on Firefox
                      msOverflowStyle: 'none', // Hide scrollbar on IE/Edge
                      touchAction: 'pan-x' // Allow only horizontal panning for better touch control
                    }}
                    onScroll={scrollHandler}
                  >
                    {/* Enhanced edge buffer at start for better mobile scrolling */}
                    <div className="flex-shrink-0" style={{ width: `${Math.max(400, windowWidth * 0.6)}px` }}></div>
                    
                    {/* Gap before first card */}
                    <div 
                      className={cn(
                        "flex-shrink-0 w-1.5 h-32 flex items-center justify-center transition-all duration-300",
                        selectedPosition === 0 && "bg-green-400/30 rounded-xl border-2 border-green-400/60"
                      )}
                      style={{ scrollSnapAlign: 'center' }}
                    >
                      {selectedPosition === 0 && (
                        <div className="text-green-300 text-xs font-bold text-center leading-tight">
                          Start
                        </div>
                      )}
                    </div>

                    {timelineSongs.map((song, index) => (
                      <React.Fragment key={song.id}>
                        {/* Song card - optimized layout */}
                        <div
                          className={cn(
                            "flex-shrink-0 w-32 h-32 rounded-2xl border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-lg relative",
                            `bg-gradient-to-br ${getRandomCardColor(song.id)}`
                          )}
                          style={{ scrollSnapAlign: 'center' }}
                          onClick={() => song.preview_url && handleSongPreview(song)}
                        >
                          {/* Subtle gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
                          
                          <div className="p-3 h-full flex flex-col items-center justify-center text-white relative z-10">
                            {/* Artist name - optimized typography */}
                            <div className="text-sm font-semibold text-center mb-2 leading-tight max-w-28 text-white/95">
                              {song.deezer_artist.length > 15 ? song.deezer_artist.substring(0, 15) + '...' : song.deezer_artist}
                            </div>
                            
                            {/* Song release year - prominent display */}
                            <div className="text-xl font-bold mb-2 text-white">
                              {song.release_year}
                            </div>
                            
                            {/* Song title - refined styling */}
                            <div className="text-xs text-center italic text-white/90 leading-tight max-w-28">
                              {song.deezer_title.length > 18 ? song.deezer_title.substring(0, 18) + '...' : song.deezer_title}
                            </div>
                          </div>
                        </div>
                        
                        {/* Gap after this card */}
                        <div 
                          className={cn(
                            "flex-shrink-0 w-1.5 h-32 flex items-center justify-center transition-all duration-300",
                            selectedPosition === index + 1 && "bg-green-400/30 rounded-xl border-2 border-green-400/60"
                          )}
                          style={{ scrollSnapAlign: 'center' }}
                        >
                          {selectedPosition === index + 1 && (
                            <div className="text-green-300 text-xs font-bold text-center leading-tight">
                              Gap {index + 1}
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    ))}
                    
                    {/* Enhanced edge buffer at end for better mobile scrolling with extra emphasis on rightmost card */}
                    <div className="flex-shrink-0" style={{ width: `${Math.max(480, windowWidth * 0.65)}px` }}></div>
                  </div>
                </div>

                {/* Position navigation */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                  <Button
                    onClick={() => navigatePosition('prev')}
                    disabled={selectedPosition === 0}
                    className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </Button>
                  
                  <div className="text-white/80 text-xs text-center">
                    Position {selectedPosition + 1} of {totalPositions}
                  </div>
                  
                  <Button
                    onClick={() => navigatePosition('next')}
                    disabled={selectedPosition === totalPositions - 1}
                    className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="flex-shrink-0 mx-4 mb-4">
            <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          </div>
        )}

        {/* Action button */}
        {isMyTurn && !gameEnded && (
          <div className="flex-shrink-0 pt-4">
            <Button
              onClick={handlePlaceCard}
              disabled={isSubmitting}
              className={cn(
                "w-full h-14 text-white font-black text-lg rounded-2xl border-0 shadow-2xl transition-all duration-300",
                isSubmitting ? 
                "bg-gray-600 cursor-not-allowed" :
                "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:scale-105 active:scale-95"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>PLACING...</span>
                </div>
              ) : (
                'PLACE CARD'
              )}
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 py-2 text-center">
          <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100">
            RYTHMY
          </div>
        </div>
      </div>
    </div>
  );
}
