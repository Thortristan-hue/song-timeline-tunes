import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, ChevronLeft, ChevronRight, X, Volume2, VolumeX, MapPin } from 'lucide-react';
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

// Optimized Song Card Component
const SongCard = React.memo(({ song, index }: { song: Song; index: number }) => {
  const cardStyle = useMemo(() => {
    if (!song?.deezer_artist) {
      return { backgroundColor: '#374151', borderColor: '#6B7280' };
    }
    return getArtistColor(song.deezer_artist);
  }, [song?.deezer_artist]);

  if (!song) {
    return (
      <div className="flex-shrink-0 w-32 h-24 rounded-lg border-2 border-red-400/50 bg-red-900/30 flex items-center justify-center">
        <div className="text-red-300 text-xs text-center">
          <div className="text-lg">⚠️</div>
          <div>Invalid</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-shrink-0 w-32 h-24 rounded-lg border border-white/20 shadow-lg transition-all duration-200 hover:scale-105"
      style={cardStyle}
    >
      <div className="w-full h-full p-2 flex flex-col justify-between text-white">
        <div className="text-xs font-semibold leading-tight line-clamp-2">
          {truncateText(song.deezer_title || 'Unknown', 20)}
        </div>
        <div className="flex justify-between items-end">
          <div className="text-xs opacity-80 truncate flex-1 mr-1">
            {truncateText(song.deezer_artist || 'Unknown', 10)}
          </div>
          <div className="text-xs font-bold bg-white/20 px-1.5 py-0.5 rounded">
            {song.release_year || '????'}
          </div>
        </div>
      </div>
    </div>
  );
});

// Position Gap Component
const PositionGap = React.memo(({ 
  position, 
  isSelected, 
  onClick, 
  isMyTurn 
}: { 
  position: number; 
  isSelected: boolean; 
  onClick: () => void; 
  isMyTurn: boolean;
}) => {
  if (!isMyTurn) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-12 h-24 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all duration-200 active:scale-95",
        isSelected 
          ? "bg-green-500/30 border-green-400 text-green-200 shadow-lg shadow-green-500/30 scale-110" 
          : "border-white/40 text-white/60 hover:border-white/80 hover:bg-white/10"
      )}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
    >
      {position + 1}
    </button>
  );
});

// Position Description Component
const PositionDescription = React.memo(({ position, timeline }: { position: number; timeline: Song[] }) => {
  const description = useMemo(() => {
    if (timeline.length === 0) return 'First position';
    if (position === 0) return 'Before first song';
    if (position === timeline.length) return 'After last song';
    
    const beforeSong = timeline[position - 1];
    const afterSong = timeline[position];
    const beforeYear = beforeSong?.release_year || '????';
    const afterYear = afterSong?.release_year || '????';
    
    return `Between ${beforeYear} and ${afterYear}`;
  }, [position, timeline]);

  return (
    <div className="flex items-center justify-center gap-2 text-blue-200 text-sm font-medium">
      <MapPin className="w-4 h-4" />
      {description}
    </div>
  );
});

// Main Component
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
  // State Management
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioControlling, setIsAudioControlling] = useState(false);
  
  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Data Validation
  const isValidPlayer = useMemo(() => {
    return currentPlayer && currentPlayer.id && currentPlayer.name;
  }, [currentPlayer]);

  const isValidSong = useMemo(() => {
    return currentSong && currentSong.id && currentSong.deezer_title;
  }, [currentSong]);

  // Timeline Processing
  const playerTimeline = useMemo(() => {
    if (!currentPlayer?.timeline || !Array.isArray(currentPlayer.timeline)) {
      return [];
    }

    return currentPlayer.timeline
      .filter(song => song && song.id && song.deezer_title)
      .sort((a, b) => {
        const yearA = parseInt(a.release_year || '2024');
        const yearB = parseInt(b.release_year || '2024');
        return yearA - yearB;
      });
  }, [currentPlayer?.timeline]);

  const totalPositions = playerTimeline.length + 1;

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
    } catch (error) {
      console.error('Card placement failed:', error);
      showError('Failed to place card. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isMyTurn, gameEnded, isValidSong, selectedPosition, currentSong, onPlaceCard, showError]);

  // Position Navigation
  const navigatePosition = useCallback((direction: 'prev' | 'next') => {
    setSelectedPosition(current => {
      if (direction === 'prev' && current > 0) {
        return current - 1;
      } else if (direction === 'next' && current < totalPositions - 1) {
        return current + 1;
      }
      return current;
    });
  }, [totalPositions]);

  // Touch Navigation
  const handleTimelineSwipe = useCallback((e: React.TouchEvent) => {
    if (!isMyTurn || gameEnded) return;

    let startX = 0;
    
    const handleTouchStart = (touch: Touch) => {
      startX = touch.clientX;
    };

    const handleTouchEnd = (touch: Touch) => {
      const endX = touch.clientX;
      const diff = startX - endX;
      const minSwipeDistance = 50;

      if (Math.abs(diff) > minSwipeDistance) {
        if (diff > 0) {
          navigatePosition('next');
        } else {
          navigatePosition('prev');
        }
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    };

    if (e.type === 'touchstart') {
      handleTouchStart(e.touches[0]);
    } else if (e.type === 'touchend') {
      handleTouchEnd(e.changedTouches[0]);
    }
  }, [isMyTurn, gameEnded, navigatePosition]);

  // Initialize position when turn starts
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      setSelectedPosition(Math.floor(totalPositions / 2));
      setError(null);
    }
  }, [isMyTurn, gameEnded, totalPositions]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isMyTurn || gameEnded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigatePosition('prev');
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigatePosition('next');
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (!isSubmitting) {
            handlePlaceCard();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMyTurn, gameEnded, navigatePosition, handlePlaceCard, isSubmitting]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Loading States
  if (!isValidPlayer) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center p-4">
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
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
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
          ? 'bg-gradient-to-br from-green-600 to-green-800' 
          : 'bg-gradient-to-br from-red-600 to-red-800'
      )}>
        <div className="text-center space-y-6 max-w-sm w-full">
          <div className="text-6xl mb-4 text-white">
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
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 to-slate-800 flex flex-col">
      
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-1">
            {currentPlayer.name}
          </h1>
          <div className="text-white/60 text-sm">
            Score: {currentPlayer.score || 0} • Room: {roomCode}
          </div>
          
          <div className="mt-3">
            <div className={cn(
              "inline-block px-4 py-2 rounded-full text-sm font-semibold border",
              gameEnded 
                ? 'bg-gray-500/20 border-gray-400 text-gray-300'
                : isMyTurn 
                  ? 'bg-green-500/20 border-green-400 text-green-300' 
                  : 'bg-blue-500/20 border-blue-400 text-blue-300'
            )}>
              {gameEnded ? 'Game Over' : 
               isMyTurn ? '🎯 Your Turn' : `⏳ ${currentTurnPlayer.name}'s Turn`}
            </div>
          </div>
        </div>
      </div>

      {/* Mystery Card */}
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <div className="text-center mb-3">
          <div className="text-white/80 text-sm flex items-center justify-center gap-2">
            <Volume2 className="w-4 h-4" />
            Host Audio Control
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="transform scale-75">
            <RecordMysteryCard 
              song={currentSong}
              isRevealed={mysteryCardRevealed}
              isPlaying={isPlaying}
              onPlayPause={handleAudioControl}
            />
          </div>
        </div>

        {isMyTurn && (
          <div className="text-center mt-2 text-white/60 text-xs">
            🎧 Listen and place this song in your timeline
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 p-4 min-h-0">
        <div className="h-full bg-white/5 rounded-2xl border border-white/20 p-4 flex flex-col">
          
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-white mb-2">
              🎵 Your Timeline ({playerTimeline.length} songs)
            </h2>
            
            {isMyTurn && (
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                <PositionDescription position={selectedPosition} timeline={playerTimeline} />
              </div>
            )}
          </div>

          {/* Timeline Display */}
          <div className="flex-1 min-h-0">
            {playerTimeline.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white/60 bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="text-4xl mb-3">🎼</div>
                  <div className="text-lg font-semibold mb-2">Empty Timeline</div>
                  <div className="text-sm">
                    {isMyTurn ? 'Place your first song!' : 'Waiting for songs...'}
                  </div>
                </div>
              </div>
            ) : (
              <div 
                ref={timelineRef}
                className="h-full overflow-x-auto p-2"
                onTouchStart={handleTimelineSwipe}
                onTouchEnd={handleTimelineSwipe}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <div className="flex items-center gap-3 min-w-max">
                  {Array.from({ length: totalPositions }, (_, index) => {
                    const isLastPosition = index === totalPositions - 1;
                    const songAtPosition = playerTimeline[index - 1];
                    
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <PositionGap
                          position={index}
                          isSelected={selectedPosition === index}
                          onClick={() => setSelectedPosition(index)}
                          isMyTurn={isMyTurn}
                        />
                        
                        {!isLastPosition && songAtPosition && (
                          <SongCard song={songAtPosition} index={index} />
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
        <div className="flex-shrink-0 p-4 border-t border-white/10 space-y-4">
          
          {/* Position Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => navigatePosition('prev')}
              disabled={selectedPosition === 0}
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Prev
            </Button>
            
            <div className="text-white/80 text-sm font-medium min-w-[80px] text-center">
              {selectedPosition + 1} / {totalPositions}
            </div>
            
            <Button
              onClick={() => navigatePosition('next')}
              disabled={selectedPosition === totalPositions - 1}
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
          
          {/* Place Card Button */}
          <Button
            onClick={handlePlaceCard}
            disabled={isSubmitting || !currentSong}
            size="lg"
            className={cn(
              "w-full py-4 text-lg font-bold transition-all duration-200",
              "bg-gradient-to-r from-green-500 to-emerald-600",
              "hover:from-green-400 hover:to-emerald-500",
              "disabled:from-gray-600 disabled:to-gray-700",
              "shadow-lg hover:shadow-xl active:scale-95"
            )}
            style={{ touchAction: 'manipulation' }}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
      )}

      {/* Waiting State */}
      {!isMyTurn && !gameEnded && (
        <div className="flex-shrink-0 p-4 border-t border-white/10">
          <div className="text-center text-white/70 bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="font-semibold mb-1">
              {currentTurnPlayer.name} is placing a card
            </div>
            <div className="text-sm text-white/60">
              Use the record above to control host audio
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 z-60">
          <div className="bg-red-500/90 backdrop-blur-sm text-white text-center py-3 px-4 rounded-lg border border-red-400/50 shadow-lg">
            {error}
          </div>
        </div>
      )}
      
    </div>
  );
}
