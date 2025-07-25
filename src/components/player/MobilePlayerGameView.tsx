import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, ChevronLeft, ChevronRight, X, Volume2, VolumeX } from 'lucide-react';
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
  onPlayPause: () => void;
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
  onPlayPause,
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
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Enhanced data validation
  const isValidCurrentSong = useMemo(() => {
    const valid = !!(currentSong && 
                     typeof currentSong === 'object' && 
                     currentSong.id && 
                     currentSong.deezer_title);
    console.log('🎵 MOBILE: Song validation:', { valid, song: currentSong });
    return valid;
  }, [currentSong]);

  const isValidPlayerData = useMemo(() => {
    const valid = !!(currentPlayer && 
                     currentPlayer.id && 
                     currentPlayer.name);
    console.log('👤 MOBILE: Player validation:', { 
      valid, 
      player: currentPlayer,
      timeline: currentPlayer?.timeline 
    });
    return valid;
  }, [currentPlayer]);

  // Get player timeline with enhanced logging and validation
  const playerTimeline = useMemo(() => {
    console.log('📱 TIMELINE DEBUG: Raw currentPlayer data:', {
      currentPlayer,
      hasTimeline: !!currentPlayer?.timeline,
      timelineType: typeof currentPlayer?.timeline,
      timelineLength: Array.isArray(currentPlayer?.timeline) ? currentPlayer.timeline.length : 'not array',
      timelineData: currentPlayer?.timeline
    });

    if (!currentPlayer) {
      console.warn('📱 TIMELINE: No currentPlayer provided');
      return [];
    }

    if (!currentPlayer.timeline) {
      console.warn('📱 TIMELINE: Player has no timeline property');
      return [];
    }

    if (!Array.isArray(currentPlayer.timeline)) {
      console.warn('📱 TIMELINE: Timeline is not an array:', typeof currentPlayer.timeline);
      return [];
    }

    const validSongs = currentPlayer.timeline
      .filter((song, index) => {
        if (!song) {
          console.warn(`📱 TIMELINE: Song at index ${index} is null/undefined`);
          return false;
        }
        
        if (!song.id || !song.deezer_title) {
          console.warn(`📱 TIMELINE: Song at index ${index} missing required fields:`, {
            id: song.id,
            title: song.deezer_title,
            song
          });
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const yearA = parseInt(a.release_year || '2024');
        const yearB = parseInt(b.release_year || '2024');
        return yearA - yearB;
      });

    console.log(`📱 TIMELINE: Final timeline for ${currentPlayer.name}:`, {
      originalLength: currentPlayer.timeline.length,
      validLength: validSongs.length,
      songs: validSongs.map(s => ({ 
        id: s.id, 
        title: s.deezer_title, 
        year: s.release_year 
      }))
    });

    return validSongs;
  }, [currentPlayer]);

  // Universal audio control
  const universalPlayPause = useCallback(async () => {
    if (!isValidCurrentSong) {
      console.warn('📱 UNIVERSAL CONTROL: Cannot control audio - invalid song data');
      setError('Cannot control audio - song data unavailable');
      return;
    }

    console.log('📱 UNIVERSAL CONTROL: Triggering play/pause on host for:', currentSong.deezer_title);
    
    try {
      await onPlayPause();
      console.log('📱 UNIVERSAL CONTROL: Command sent successfully');
    } catch (error) {
      console.error('📱 UNIVERSAL CONTROL: Error triggering play/pause:', error);
      setError('Failed to control host audio. Check your connection.');
      setTimeout(() => setError(null), 3000);
    }
  }, [onPlayPause, currentSong, isValidCurrentSong]);

  // Total positions available (before first, between each song, after last)
  const totalPositions = playerTimeline.length + 1;

  // Handle card placement
  const handlePlaceCard = useCallback(async () => {
    if (isSubmitting || !isMyTurn || gameEnded || !isValidCurrentSong) return;

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
        setError('Failed to place card. Please try again.');
        console.error('📱 PLACE CARD: Failed');
      } else {
        console.log('📱 PLACE CARD: Success!');
      }
    } catch (err) {
      console.error('📱 PLACE CARD: Error during placement:', err);
      setError('Failed to place card. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isMyTurn, gameEnded, isValidCurrentSong, selectedPosition, totalPositions, currentSong, onPlaceCard]);

  // Navigation
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

  // Get position description
  const getPositionDescription = (position: number) => {
    if (playerTimeline.length === 0) return 'First card';
    if (position === 0) return 'Before first song';
    if (position === playerTimeline.length) return 'After last song';
    
    const beforeSong = playerTimeline[position - 1];
    const afterSong = playerTimeline[position];
    return `Between ${beforeSong?.release_year || '????'} and ${afterSong?.release_year || '????'}`;
  };

  // Touch handling
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
        setSelectedPosition(prev => prev + 1);
      } else if (touchDiff < 0 && selectedPosition > 0) {
        setSelectedPosition(prev => prev - 1);
      }
    }
    
    setTouchStartX(null);
  };

  // Reset position when turn changes
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      const initialPosition = Math.floor(totalPositions / 2);
      setSelectedPosition(initialPosition);
      setError(null);
      console.log('📱 TURN START: Setting initial position to', initialPosition);
    }
  }, [isMyTurn, gameEnded, totalPositions]);

  // Keyboard navigation
  useEffect(() => {
    if (!isMyTurn || gameEnded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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
        case ' ':
          if (!isSubmitting && currentSong) {
            handlePlaceCard();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMyTurn, gameEnded, selectedPosition, totalPositions, isSubmitting, currentSong, navigatePosition, handlePlaceCard]);

  // Validation error states
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
      <div className="h-full w-full flex flex-col" style={{ height: '100dvh' }}>
        
        {/* Header */}
        <div className="flex-shrink-0 py-4 px-4 border-b border-white/10">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100">
                {currentPlayer.name}
              </h1>
              <div className="text-white/60 text-sm mt-1">
                Score: {currentPlayer.score || 0}
              </div>
            </div>
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="text-white/40 hover:text-white/80 text-xs px-2 py-1 rounded"
            >
              DEBUG
            </button>
          </div>
          
          <div className="text-center mt-3">
            <div className="inline-block bg-white/10 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20">
              <span className="text-white/90 text-sm font-semibold">
                {gameEnded ? 'Game Over' : 
                 isMyTurn ? '🎯 Your Turn' : `⏳ ${currentTurnPlayer.name}'s Turn`}
              </span>
            </div>
          </div>
        </div>

        {/* Mystery Song Player */}
        <div className="flex-shrink-0 py-4 px-4 border-b border-white/10">
          <div className="text-center mb-3">
            <div className="text-white/80 text-sm font-medium flex items-center justify-center gap-2">
              <Volume2 className="w-4 h-4" />
              Universal Remote - Controls Host Audio
            </div>
          </div>
          <div className="flex justify-center">
            <div className="scale-75">
              <RecordMysteryCard 
                song={currentSong}
                isRevealed={mysteryCardRevealed}
                isPlaying={isPlaying}
                onPlayPause={universalPlayPause}
              />
            </div>
          </div>
          {isMyTurn && (
            <div className="text-center mt-2">
              <div className="text-white/60 text-xs">
                🎧 Listen and place this song in your timeline
              </div>
            </div>
          )}
        </div>

        {/* Timeline Section */}
        <div className="flex-1 flex flex-col min-h-0 p-4">
          <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 flex flex-col min-h-0">
            
            {/* Timeline Header */}
            <div className="text-center mb-4">
              <div className="text-white text-lg font-bold mb-2">
                🎵 Your Timeline
              </div>
              <div className="flex justify-center gap-4 text-sm">
                <div className="text-white/80">
                  Songs: {playerTimeline.length}
                </div>
                <div className="text-white/80">
                  Room: {roomCode}
                </div>
              </div>
              
              {isMyTurn && (
                <div className="mt-3 bg-blue-500/20 border border-blue-400/30 rounded-lg px-3 py-2">
                  <div className="text-blue-200 text-sm font-medium">
                    📍 {getPositionDescription(selectedPosition)}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Display */}
            <div className="flex-1 min-h-0">
              {playerTimeline.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white/60 bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="text-4xl mb-3">🎼</div>
                    <div className="text-lg mb-2 font-semibold">Empty Timeline</div>
                    <div className="text-sm">
                      {isMyTurn ? 'Place your first song to get started!' : 'Waiting for songs to be added...'}
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="h-full overflow-x-auto scroll-smooth p-2"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  <div className="flex items-center gap-3 min-w-max">
                    {/* Render timeline with placement gaps */}
                    {Array.from({ length: totalPositions }, (_, index) => {
                      const isLastPosition = index === totalPositions - 1;
                      const songAtPosition = playerTimeline[index - 1];
                      
                      return (
                        <div key={index} className="flex items-center gap-3">
                          
                          {/* Gap indicator for placement */}
                          {isMyTurn && (
                            <div 
                              className={cn(
                                "w-12 h-24 rounded-xl border-2 flex items-center justify-center transition-all duration-300 cursor-pointer flex-shrink-0 text-sm font-bold",
                                selectedPosition === index 
                                  ? "bg-gradient-to-br from-green-400/30 to-green-500/30 border-green-300 text-green-100 scale-110 animate-pulse shadow-lg shadow-green-400/30" 
                                  : "border-white/30 text-white/50 hover:border-white/50 hover:bg-white/5"
                              )}
                              onClick={() => setSelectedPosition(index)}
                            >
                              {index + 1}
                            </div>
                          )}
                          
                          {/* Song card */}
                          {!isLastPosition && songAtPosition && (
                            <div 
                              className={cn(
                                "flex-shrink-0 w-32 h-24 rounded-xl border border-white/20 overflow-hidden transition-all duration-300 shadow-lg",
                                songAtPosition.deezer_artist ? getArtistColor(songAtPosition.deezer_artist) : "bg-gray-600"
                              )}
                            >
                              <div className="w-full h-full p-3 flex flex-col justify-between">
                                <div className="text-white text-xs font-bold leading-tight">
                                  {truncateText(songAtPosition.deezer_title || 'Unknown Song', 18)}
                                </div>
                                <div className="flex justify-between items-end">
                                  <div className="text-white/80 text-xs">
                                    {songAtPosition.deezer_artist ? truncateText(songAtPosition.deezer_artist, 12) : 'Unknown'}
                                  </div>
                                  <div className="text-white font-bold text-sm bg-white/20 px-2 py-1 rounded">
                                    {songAtPosition.release_year || '????'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Error card for invalid songs */}
                          {!isLastPosition && !songAtPosition && (
                            <div className="flex-shrink-0 w-32 h-24 rounded-xl border border-red-400/50 bg-red-900/30 overflow-hidden">
                              <div className="w-full h-full p-3 flex flex-col justify-center items-center">
                                <div className="text-red-300 text-lg">⚠️</div>
                                <div className="text-red-300 text-xs">Invalid Song</div>
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
        </div>
        
        {/* Controls */}
        {isMyTurn && !gameEnded && (
          <div className="flex-shrink-0 p-4 border-t border-white/10">
            <div className="space-y-4">
              
              {/* Position Navigation */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={() => navigatePosition('prev')}
                  disabled={selectedPosition === 0}
                  className="bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-30 px-4 py-2 rounded-xl"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Prev
                </Button>
                
                <div className="text-center text-white/80 text-sm min-w-[100px]">
                  {selectedPosition + 1} / {totalPositions}
                </div>
                
                <Button
                  onClick={() => navigatePosition('next')}
                  disabled={selectedPosition === totalPositions - 1}
                  className="bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-30 px-4 py-2 rounded-xl"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Place Card Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handlePlaceCard}
                  disabled={isSubmitting || !currentSong}
                  className={cn(
                    "px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 min-w-[250px]",
                    isSubmitting
                      ? "bg-gray-600 text-gray-300"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg"
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Placing Card...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Place Card Here
                    </div>
                  )}
                </Button>
              </div>
              
              {error && (
                <div className="text-center text-red-400 text-sm bg-red-400/10 rounded-lg p-3 border border-red-400/20">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Non-turn state */}
        {!isMyTurn && !gameEnded && (
          <div className="flex-shrink-0 p-4 border-t border-white/10">
            <div className="text-center text-white/70 text-sm bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
              <div className="font-semibold mb-1">{currentTurnPlayer.name} is placing a card</div>
              <div className="text-xs text-white/60">Use the vinyl record to control host audio</div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {showDebugInfo && (
          <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-xl rounded-xl p-4 border border-white/20 text-xs text-white max-w-xs z-50">
            <div className="font-bold mb-2">Debug Info:</div>
            <div>Player: {currentPlayer?.name || 'N/A'}</div>
            <div>Timeline Length: {playerTimeline.length}</div>
            <div>Current Song: {currentSong?.deezer_title || 'N/A'}</div>
            <div>Is My Turn: {isMyTurn ? 'Yes' : 'No'}</div>
            <div>Selected Position: {selectedPosition}</div>
            <div>Total Positions: {totalPositions}</div>
            <div className="mt-2 text-yellow-300">
              Raw Timeline Data: {JSON.stringify(currentPlayer?.timeline?.slice(0, 2), null, 1)}...
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}