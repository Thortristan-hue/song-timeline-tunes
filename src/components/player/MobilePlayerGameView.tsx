
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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

  // Refs for performance optimization and carousel control
  const audioCleanupRef = useRef<() => void>();
  const carouselRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Get sorted timeline songs for placement
  const timelineSongs = currentPlayer.timeline
    .filter(song => song !== null)
    .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));

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

  // Scroll carousel to center the selected position
  const scrollToPosition = useCallback((position: number) => {
    if (!carouselRef.current || isScrollingRef.current) return;
    
    const carousel = carouselRef.current;
    const containerWidth = carousel.clientWidth;
    const cardWidth = 132; // Updated for new card size (w-32 = 128px + 4px margin)
    const gapWidth = 48; // Updated for new gap size (w-12 = 48px)
    const totalWidth = (timelineSongs.length * cardWidth) + ((timelineSongs.length + 1) * gapWidth);
    
    // Calculate scroll position to center the selected gap
    let targetScroll;
    if (position === 0) {
      // Before first card - center the first gap
      targetScroll = (gapWidth / 2) - (containerWidth / 2);
    } else if (position === timelineSongs.length) {
      // After last card - center the last gap
      targetScroll = totalWidth - (gapWidth / 2) - (containerWidth / 2);
    } else {
      // Between cards - center the gap
      const cardsBeforeGap = position;
      const gapsBeforeGap = position;
      const positionInTimeline = (gapsBeforeGap * gapWidth) + (cardsBeforeGap * cardWidth) + (gapWidth / 2);
      targetScroll = positionInTimeline - (containerWidth / 2);
    }
    
    // Ensure scroll position is within bounds
    targetScroll = Math.max(0, Math.min(targetScroll, carousel.scrollWidth - containerWidth));
    
    isScrollingRef.current = true;
    carousel.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    
    // Reset scrolling flag after animation
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 300);
  }, [timelineSongs.length]);

  // Handle scroll events to update selected position based on scroll position
  const handleCarouselScroll = useCallback(() => {
    if (!carouselRef.current || isScrollingRef.current) return;
    
    const carousel = carouselRef.current;
    const scrollLeft = carousel.scrollLeft;
    const containerWidth = carousel.clientWidth;
    const cardWidth = 132; // Updated for new card size
    const gapWidth = 48; // Updated for new gap size
    
    // Calculate which position is closest to center
    const centerPoint = scrollLeft + (containerWidth / 2);
    
    // Find the closest gap position
    let closestPosition = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i <= timelineSongs.length; i++) {
      let gapCenter;
      if (i === 0) {
        gapCenter = gapWidth / 2;
      } else {
        gapCenter = (i * gapWidth) + ((i - 1) * cardWidth) + (gapWidth / 2);
      }
      
      const distance = Math.abs(centerPoint - gapCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestPosition = i;
      }
    }
    
    if (closestPosition !== selectedPosition) {
      setSelectedPosition(closestPosition);
    }
  }, [selectedPosition, totalPositions, timelineSongs.length]);

  // Effect to scroll to position when it changes
  useEffect(() => {
    scrollToPosition(selectedPosition);
  }, [selectedPosition, scrollToPosition]);

  // Cleanup audio on unmount or turn change
  useEffect(() => {
    return () => {
      audioCleanupRef.current?.();
    };
  }, []);

  // Reset position when turn changes
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      setSelectedPosition(Math.floor(totalPositions / 2)); // Start in middle
      setError(null);
    }
  }, [isMyTurn, gameEnded, totalPositions]);

  // Show result overlay with enhanced animation
  if (cardPlacementResult) {
    const isCorrect = cardPlacementResult.correct;
    
    return (
      <div 
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-500",
          "px-4 pt-safe-top pb-safe-bottom",
          isCorrect 
            ? 'bg-gradient-to-br from-green-500 via-green-600 to-green-700' 
            : 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
        )}
      >
        <div className="text-center space-y-6 max-w-sm w-full animate-in slide-in-from-bottom-8 duration-700">
          {/* Result icon with more subtle animation */}
          <div className="relative">
            <div className={cn(
              "text-8xl mb-4 font-black transition-all duration-700",
              isCorrect ? 'animate-pulse text-white drop-shadow-2xl' : 'animate-pulse text-white drop-shadow-2xl scale-110'
            )}>
              {isCorrect ? '✓' : '✗'}
            </div>
            {/* Toned down celebration effects for correct placement */}
            {isCorrect && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-2xl animate-pulse opacity-50">
                ✨
              </div>
            )}
          </div>
          
          {/* Result text with more subtle animation */}
          <div className={cn(
            "text-5xl font-black text-white drop-shadow-2xl transition-all duration-500",
            isCorrect ? 'animate-pulse' : 'animate-pulse scale-105'
          )}>
            {isCorrect ? 'CORRECT!' : 'INCORRECT'}
          </div>
          
          {/* Song info with slide-in animation */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 border-4 border-white shadow-2xl animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="text-xl font-bold text-gray-900 mb-3 leading-tight">
              {cardPlacementResult.song.deezer_title}
            </div>
            <div className="text-lg text-gray-700 mb-4 font-medium">
              by {cardPlacementResult.song.deezer_artist}
            </div>
            <div className={cn(
              "inline-block text-white px-6 py-3 rounded-full font-black text-2xl shadow-xl transition-all duration-300",
              isCorrect 
                ? 'bg-gradient-to-r from-green-600 to-green-700 animate-pulse' 
                : 'bg-gradient-to-r from-red-600 to-red-700'
            )}>
              {cardPlacementResult.song.release_year}
            </div>
          </div>
          
          {/* Score indicator with more subtle feedback */}
          <div className={cn(
            "text-white text-xl font-bold transition-all duration-500"
          )}>
            {isCorrect ? (
              <div className="space-y-2">
                <div className="text-2xl">🏆 Perfect Placement! 🏆</div>
                <div>+1 Point for {currentPlayer.name}!</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xl">❌ Not quite right ❌</div>
                <div>No points this round</div>
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
                  {/* Center line indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-full bg-green-500/60 z-10 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 rounded-full w-3 h-3 animate-pulse">
                    </div>
                  </div>
                  
                  {/* Selection indicator at center */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold z-20 pointer-events-none animate-bounce">
                    Place Here
                  </div>

                  {/* Scrollable carousel */}
                  <div 
                    ref={carouselRef}
                    className="flex items-center h-full overflow-x-auto overflow-y-hidden scrollbar-hide pb-4"
                    style={{ 
                      scrollSnapType: 'x mandatory',
                      scrollBehavior: 'smooth'
                    }}
                    onScroll={handleCarouselScroll}
                  >
                    {/* Gap before first card - reduced width */}
                    <div 
                      className={cn(
                        "flex-shrink-0 w-12 h-36 flex items-center justify-center transition-all duration-300",
                        selectedPosition === 0 && "bg-green-500/20 rounded-xl border-2 border-green-500/50"
                      )}
                      style={{ scrollSnapAlign: 'center' }}
                    >
                      {selectedPosition === 0 && (
                        <div className="text-green-400 text-xs font-bold text-center leading-tight">
                          Start
                        </div>
                      )}
                    </div>

                    {timelineSongs.map((song, index) => (
                      <React.Fragment key={song.id}>
                        {/* Song card - redesigned to match host display */}
                        <div
                          className="flex-shrink-0 w-32 h-36 mx-1 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 transition-all duration-200 hover:bg-white/15 hover:scale-105 active:scale-95 cursor-pointer shadow-lg relative"
                          style={{ scrollSnapAlign: 'center' }}
                          onClick={() => song.preview_url && handleSongPreview(song)}
                        >
                          {/* Gradient overlay like host cards */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
                          
                          <div className="p-3 h-full flex flex-col items-center justify-center text-white relative z-10">
                            {/* Calendar icon like host cards */}
                            <Calendar className="h-5 w-5 mb-2 opacity-70" />
                            
                            {/* Year prominently displayed */}
                            <div className="text-lg font-bold mb-1">
                              {song.release_year}
                            </div>
                            
                            {/* Song title with proper truncation */}
                            <div className="text-xs text-center opacity-80 leading-tight max-w-28 mb-1">
                              {song.deezer_title.length > 16 ? song.deezer_title.substring(0, 16) + '...' : song.deezer_title}
                            </div>
                            
                            {/* Artist with proper truncation */}
                            <div className="text-xs text-center opacity-60 leading-tight max-w-28 mb-2">
                              {song.deezer_artist.length > 12 ? song.deezer_artist.substring(0, 12) + '...' : song.deezer_artist}
                            </div>
                            
                            {/* Play/pause indicator */}
                            {song.preview_url && (
                              <div className="flex justify-center">
                                {playingPreviewId === song.id ? (
                                  <Pause className="w-3 h-3 text-white" />
                                ) : (
                                  <Play className="w-3 h-3 text-white/70" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Gap after this card - reduced width */}
                        <div 
                          className={cn(
                            "flex-shrink-0 w-12 h-36 flex items-center justify-center transition-all duration-300",
                            selectedPosition === index + 1 && "bg-green-500/20 rounded-xl border-2 border-green-500/50"
                          )}
                          style={{ scrollSnapAlign: 'center' }}
                        >
                          {selectedPosition === index + 1 && (
                            <div className="text-green-400 text-xs font-bold text-center leading-tight">
                              Gap {index + 1}
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    ))}
                    
                    {/* Enhanced edge buffers for better scrolling experience */}
                    <div className="flex-shrink-0 w-32"></div>
                  </div>
                </div>

                {/* Additional buffer space after carousel for proper centering */}
                <div className="flex-shrink-0 w-32"></div>

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
