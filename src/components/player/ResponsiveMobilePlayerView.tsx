import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn, getArtistColor, truncateText } from '@/lib/utils';
import { useResponsive } from '@/lib/ResponsiveManager';
import { useCharacterSelection, characterManager } from '@/lib/CharacterManager';
import { animationManager } from '@/lib/AnimationManager';

interface ResponsiveMobilePlayerViewProps {
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
  refreshCurrentPlayerTimeline?: () => void;
}

export default function ResponsiveMobilePlayerView({
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
  onViewportChange,
  refreshCurrentPlayerTimeline
}: ResponsiveMobilePlayerViewProps) {
  // Responsive hooks
  const { viewport, isMobile } = useResponsive();
  const { selectedCharacter, getCharacterImagePath } = useCharacterSelection();

  // Core state management
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [debugClickCount, setDebugClickCount] = useState(0);

  // Refs for animations and DOM manipulation
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<HTMLDivElement>(null);

  // Process timeline data with enhanced validation
  const timelineData = React.useMemo(() => {
    console.log('🔍 TIMELINE ANALYSIS: Processing timeline for responsive view');
    
    let extractedTimeline: any[] = [];
    
    if (currentPlayer?.timeline && Array.isArray(currentPlayer.timeline)) {
      extractedTimeline = currentPlayer.timeline;
    }

    const validatedSongs = extractedTimeline
      .filter((item) => {
        return Boolean(
          item &&
          typeof item === 'object' &&
          (item.id || item.ID || item._id) &&
          (item.deezer_title || item.title || item.name) &&
          (item.deezer_artist || item.artist) &&
          (item.release_year || item.year || item.releaseYear)
        );
      })
      .map((item, index) => ({
        id: item.id || item.ID || item._id || `song-${index}`,
        deezer_title: item.deezer_title || item.title || item.name || 'Unknown Title',
        deezer_artist: item.deezer_artist || item.artist || 'Unknown Artist',
        release_year: String(item.release_year || item.year || item.releaseYear || '2000'),
        deezer_album: item.deezer_album || item.album || 'Unknown Album',
        genre: item.genre || 'Unknown',
        cardColor: item.cardColor || '#3b82f6',
        preview_url: item.preview_url || item.previewUrl || '',
        deezer_url: item.deezer_url || item.deezerUrl || ''
      }))
      .sort((a, b) => {
        const yearA = parseInt(a.release_year) || 0;
        const yearB = parseInt(b.release_year) || 0;
        return yearA - yearB;
      });

    return {
      songs: validatedSongs,
      totalPositions: validatedSongs.length + 1,
      hasCards: validatedSongs.length > 0,
    };
  }, [currentPlayer?.timeline]);

  const { songs: timelineSongs, totalPositions, hasCards } = timelineData;

  // Debug menu handler
  const handleDebugClick = () => {
    const newCount = debugClickCount + 1;
    setDebugClickCount(newCount);
    
    if (newCount === 7) {
      setDebugMode(!debugMode);
      setDebugClickCount(0);
    }
    
    setTimeout(() => {
      if (debugClickCount < 6) {
        setDebugClickCount(0);
      }
    }, 3000);
  };

  // Handle card placement
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

  // Position navigation
  const navigatePosition = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedPosition > 0) {
      setSelectedPosition(selectedPosition - 1);
    } else if (direction === 'next' && selectedPosition < totalPositions - 1) {
      setSelectedPosition(selectedPosition + 1);
    }
  };

  // Get position description
  const getPositionDescription = (position: number) => {
    if (!hasCards) return 'Place your first card';
    if (position === 0) return `Before ${timelineSongs[0]?.release_year || ''}`;
    if (position === timelineSongs.length) return `After ${timelineSongs[timelineSongs.length - 1]?.release_year || ''}`;
    
    const beforeSong = timelineSongs[position - 1];
    const afterSong = timelineSongs[position];
    return `Between ${beforeSong.release_year} and ${afterSong.release_year}`;
  };

  // Get consistent card colors
  const getCardColor = (song: Song) => {
    return getArtistColor(song.deezer_artist);
  };

  // Reset position when turn changes
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      setSelectedPosition(Math.floor(totalPositions / 2));
      setError(null);
    }
  }, [isMyTurn, gameEnded, totalPositions]);

  // Highlight gap for host view
  useEffect(() => {
    if (isMyTurn && onHighlightGap) {
      onHighlightGap(selectedPosition);
    }
  }, [selectedPosition, isMyTurn, onHighlightGap]);

  // Handle card placement result overlay
  if (cardPlacementResult) {
    const isCorrect = cardPlacementResult.correct;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div 
          className={cn(
            "w-full h-full flex items-center justify-center",
            isCorrect 
              ? 'bg-gradient-to-br from-green-500/95 via-emerald-600/95 to-green-700/95' 
              : 'bg-gradient-to-br from-red-500/95 via-red-600/95 to-red-700/95'
          )}
          style={{
            height: `${viewport.safeHeight}px`,
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div className="text-center space-y-6 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-8xl mb-6 animate-bounce">
              {isCorrect ? '✓' : '✗'}
            </div>
            
            <div className="text-4xl font-black text-white mb-4">
              {isCorrect ? 'Perfect!' : 'Not Quite'}
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
              <div className="text-xl font-bold text-gray-900 mb-2">
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-lg text-gray-700 mb-3">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className="text-3xl font-black text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl py-3 px-6 inline-block">
                {cardPlacementResult.song.release_year}
              </div>
            </div>
            
            <div className="text-white text-xl font-semibold">
              {isCorrect ? `+1 Point for ${currentPlayer.name}!` : 'Better luck next time!'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-900 to-indigo-950 overflow-hidden"
      style={{
        height: `${viewport.safeHeight}px`,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Main flex container - no scrolling */}
      <div className="h-full flex flex-col">
        
        {/* Header with player name */}
        <div className="flex-shrink-0 text-center py-4 px-4">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100">
              {currentPlayer.name}
            </h1>
            {refreshCurrentPlayerTimeline && (
              <Button
                onClick={refreshCurrentPlayerTimeline}
                variant="ghost"
                size="sm"
                className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-full p-2"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </Button>
            )}
          </div>
          <div className="mt-2 inline-block bg-white/15 backdrop-blur-xl rounded-full px-4 py-2 border border-white/25">
            <span className="text-white text-sm font-semibold">
              {gameEnded ? 'Game Over' : 
               isMyTurn ? 'Your Turn' : `${currentTurnPlayer.name}'s Turn`}
            </span>
          </div>
        </div>

        {/* Playback Controls Section */}
        <div className="flex-shrink-0 py-6">
          <div className="flex justify-center">
            <div className="relative">
              {/* Enhanced vinyl-style player */}
              <div 
                ref={playbackRef}
                className={cn(
                  "w-24 h-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-2 transition-all duration-500 relative overflow-hidden",
                  isPlaying 
                    ? "animate-spin border-white/60 shadow-blue-500/20" 
                    : "border-white/40 hover:border-white/60"
                )}
              >
                {/* Vinyl grooves */}
                <div className="absolute inset-1 border border-white/10 rounded-full" />
                <div className="absolute inset-2 border border-white/8 rounded-full" />
                <div className="absolute inset-3 border border-white/6 rounded-full" />
                
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-2 border-white/50" />
                </div>
                
                {/* Play/Pause overlay */}
                <Button
                  onClick={onPlayPause}
                  className="absolute inset-0 w-full h-full border-0 rounded-full bg-black/20 hover:bg-black/40 transition-all duration-300"
                  disabled={!currentSong?.preview_url}
                >
                  <div className="text-white text-lg">
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </div>
                </Button>
              </div>
              
              {/* Audio visualization */}
              {isPlaying && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-end space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-blue-400 to-purple-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 16 + 8}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '0.8s'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center mt-4">
            <div className="text-white text-sm font-medium">
              {isMyTurn ? 'Mystery Song' : 'Universal Player'}
            </div>
          </div>
        </div>

        {/* Main content area - flexible */}
        <div className="flex-1 min-h-0 px-4">
          
          {/* Waiting state */}
          {!isMyTurn && !gameEnded && (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-white">
                  {currentTurnPlayer.name} is playing
                </div>
                <div className="text-white/70 text-lg bg-white/10 backdrop-blur-xl rounded-xl px-6 py-3 border border-white/20">
                  Wait for your turn
                </div>
              </div>
              
              {/* Show current timeline */}
              {hasCards && (
                <div className="w-full max-w-sm bg-white/10 backdrop-blur-2xl rounded-2xl p-4 border border-white/25">
                  <div className="text-white text-center font-semibold mb-3">Your Timeline</div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {timelineSongs.map((song, index) => {
                      const cardColor = getCardColor(song);
                      return (
                        <div
                          key={`${song.id}-${index}`}
                          className="w-16 h-20 rounded-lg border border-white/20 flex-shrink-0 shadow-lg relative text-xs"
                          style={{ 
                            backgroundColor: cardColor.backgroundColor,
                            backgroundImage: cardColor.backgroundImage
                          }}
                        >
                          <div className="p-2 h-full flex flex-col items-center justify-between text-white relative z-10">
                            <div className="text-center leading-tight text-white overflow-hidden">
                              {truncateText(song.deezer_artist, 8)}
                            </div>
                            <div className="text-lg font-black text-white">
                              {song.release_year}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Playing state - Your turn */}
          {isMyTurn && !gameEnded && (
            <div className="h-full flex flex-col">
              {/* Timeline section header */}
              <div className="flex-shrink-0 text-center mb-4">
                <div className="text-white text-lg font-semibold mb-2">Your Timeline</div>
                <div className="text-white/80 text-sm bg-white/10 rounded-full px-4 py-2 inline-block">
                  {getPositionDescription(selectedPosition)}
                </div>
              </div>

              {/* Timeline display - scrollable */}
              <div className="flex-1 min-h-0">
                <div 
                  ref={timelineRef}
                  className="h-full flex items-center justify-center overflow-x-auto px-4"
                  style={{ 
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {!hasCards ? (
                    // First card placement
                    <div className="text-center text-white/80">
                      <div className="text-xl mb-4">Place your first card!</div>
                      <div 
                        className="w-16 h-16 rounded-full border-2 border-green-400 bg-green-400/20 flex items-center justify-center text-green-400 cursor-pointer hover:bg-green-400/30 transition-all"
                        onClick={() => setSelectedPosition(0)}
                      >
                        <span className="text-2xl">+</span>
                      </div>
                    </div>
                  ) : (
                    // Timeline with cards
                    <div className="flex items-center gap-3 min-w-max">
                      {/* Position before first card */}
                      <div 
                        className={cn(
                          "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0",
                          selectedPosition === 0 
                            ? "bg-green-400 border-green-400 text-white shadow-lg shadow-green-400/50" 
                            : "border-white/40 text-white/60 hover:border-white/60 hover:text-white"
                        )}
                        onClick={() => setSelectedPosition(0)}
                      >
                        {selectedPosition === 0 ? '✓' : '+'}
                      </div>

                      {timelineSongs.map((song, index) => {
                        const cardColor = getCardColor(song);
                        return (
                          <React.Fragment key={`${song.id}-${index}`}>
                            {/* Song card */}
                            <div
                              className="w-28 h-36 rounded-2xl border border-white/20 shadow-lg relative flex-shrink-0 transition-all duration-200 hover:scale-105"
                              style={{ 
                                backgroundColor: cardColor.backgroundColor,
                                backgroundImage: cardColor.backgroundImage
                              }}
                            >
                              <div className="p-3 h-full flex flex-col items-center justify-between text-white relative z-10">
                                <div className="text-xs font-medium text-center leading-tight text-white overflow-hidden">
                                  {truncateText(song.deezer_artist, 12)}
                                </div>
                                <div className="text-2xl font-black text-white">
                                  {song.release_year}
                                </div>
                                <div className="text-xs text-center italic text-white leading-tight opacity-90 overflow-hidden">
                                  {truncateText(song.deezer_title, 12)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Position after card */}
                            <div 
                              className={cn(
                                "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0",
                                selectedPosition === index + 1 
                                  ? "bg-green-400 border-green-400 text-white shadow-lg shadow-green-400/50" 
                                  : "border-white/40 text-white/60 hover:border-white/60 hover:text-white"
                              )}
                              onClick={() => setSelectedPosition(index + 1)}
                            >
                              {selectedPosition === index + 1 ? '✓' : '+'}
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation controls */}
              {hasCards && (
                <div className="flex-shrink-0 flex items-center justify-between pt-4 mb-4">
                  <Button
                    onClick={() => navigatePosition('prev')}
                    disabled={selectedPosition === 0}
                    className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl px-6 py-3 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </Button>
                  
                  <div className="text-white/80 text-sm text-center">
                    Position {selectedPosition + 1} of {totalPositions}
                  </div>
                  
                  <Button
                    onClick={() => navigatePosition('next')}
                    disabled={selectedPosition === totalPositions - 1}
                    className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl px-6 py-3 disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </Button>
                </div>
              )}
            </div>
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

        {/* Action button - My turn only */}
        {isMyTurn && !gameEnded && (
          <div className="flex-shrink-0 px-4 pb-4">
            <Button
              onClick={handlePlaceCard}
              disabled={isSubmitting}
              className={cn(
                "w-full h-16 text-white font-black text-xl rounded-2xl border-0 shadow-2xl transition-all duration-300",
                isSubmitting ? 
                "bg-gray-600 cursor-not-allowed" :
                "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:scale-105 active:scale-95"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>PLACING...</span>
                </div>
              ) : (
                'PLACE CARD'
              )}
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3">
          {/* Left: Rythmy logo with debug */}
          <div 
            className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100 cursor-pointer select-none"
            onClick={handleDebugClick}
          >
            {debugMode ? 'DEBUG' : 'RYTHMY'}
          </div>
          
          {/* Right: Character icon */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 bg-white/10">
            <img 
              src={getCharacterImagePath(selectedCharacter?.id || currentPlayer.name || 'mike')}
              alt="Player character"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/char_mike.png';
              }}
            />
          </div>
        </div>

        {/* Debug info */}
        {debugMode && (
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 text-xs text-white max-w-xs z-50">
            <div className="font-semibold mb-2">Debug Info:</div>
            <div>Viewport: {viewport.width}x{viewport.height}</div>
            <div>Safe Height: {viewport.safeHeight}px</div>
            <div>Is Mobile: {isMobile ? 'Yes' : 'No'}</div>
            <div>Timeline Songs: {timelineSongs.length}</div>
            <div>Selected Position: {selectedPosition}</div>
            <div>My Turn: {isMyTurn ? 'Yes' : 'No'}</div>
            <div>Character: {selectedCharacter?.displayName || 'None'}</div>
          </div>
        )}
      </div>
    </div>
  );
}