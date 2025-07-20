
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn, getArtistColor, truncateText } from '@/lib/utils';

interface MobilePlayerGameViewProps {
  currentPlayer: Player | null;
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

  // Debug menu state (Easter egg)
  const [debugClickCount, setDebugClickCount] = useState(0);
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  // Refs for scrolling and performance optimization
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Get sorted timeline songs for placement
  const timelineSongs = useMemo(() => {
    if (!currentPlayer) {
      console.log('📱 TIMELINE: No currentPlayer available');
      return [];
    }
    
    if (!currentPlayer.timeline) {
      console.log('📱 TIMELINE: currentPlayer.timeline is null/undefined');
      return [];
    }
    
    const validSongs = currentPlayer.timeline
      .filter(song => song !== null)
      .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));
      
    console.log(`📱 TIMELINE: Player ${currentPlayer.name} has ${validSongs.length} timeline cards:`, 
      validSongs.map(s => `${s.deezer_title} (${s.release_year})`));
    
    return validSongs;
  }, [currentPlayer]);

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
    if (isSubmitting || !isMyTurn || gameEnded || !currentPlayer) return;

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

  // ENHANCED: Center the selected position in the timeline view with smooth scrolling
  const centerSelectedPosition = useCallback(() => {
    if (!timelineScrollRef.current) return;
    
    const container = timelineScrollRef.current;
    const containerWidth = container.clientWidth;
    
    // Calculate the position of the selected gap with responsive card sizing
    const cardWidth = window.innerWidth < 640 ? 128 : 144; // w-32 (128px) on mobile, w-36 (144px) on larger screens
    const gapWidth = 48; // w-12 = 48px (gap indicator width)
    const spacing = 8; // gap-2 = 8px
    
    // Each position consists of a gap + card (except the last position which is just a gap)
    const selectedGapPosition = selectedPosition * (cardWidth + gapWidth + spacing * 2);
    
    // Center the selected position in the viewport
    const scrollPosition = selectedGapPosition - containerWidth / 2 + gapWidth / 2;
    
    container.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });
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

  // ENHANCED: Center view when position changes with immediate effect (only during turn)
  useEffect(() => {
    if (isMyTurn) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        centerSelectedPosition();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedPosition, isMyTurn, centerSelectedPosition]);

  // Reset position when turn changes (only when it becomes player's turn)
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      const initialPosition = Math.floor(totalPositions / 2);
      setSelectedPosition(initialPosition);
      setError(null);
      console.log('📱 TURN START: Setting initial position to', initialPosition);
    }
  }, [isMyTurn, gameEnded, totalPositions]);

  // Sync highlighted gap with host when position changes (only during turn)
  useEffect(() => {
    if (isMyTurn && onHighlightGap) {
      onHighlightGap(selectedPosition);
    }
  }, [selectedPosition, isMyTurn, onHighlightGap]);

  // ENHANCED: Update viewport information for host display (always update for timeline view)
  useEffect(() => {
    if (onViewportChange && timelineScrollRef.current) {
      const container = timelineScrollRef.current;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      
      const cardWidth = 144;
      const gapWidth = 48;
      const spacing = 8;
      const itemWidth = cardWidth + gapWidth + spacing * 2;
      
      const startIndex = Math.floor(scrollLeft / itemWidth);
      const endIndex = Math.min(startIndex + Math.ceil(containerWidth / itemWidth), totalPositions - 1);
      
      onViewportChange({
        startIndex,
        endIndex,
        totalCards: timelineSongs.length
      });
    }
  }, [selectedPosition, onViewportChange, timelineSongs.length, totalPositions]);

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

  // Show loading state when currentPlayer is not yet available
  if (!currentPlayer) {
    return (
      <div className="fixed inset-0 z-40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <div className="h-full flex flex-col items-center justify-center px-4 pt-safe-top pb-safe-bottom">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 mx-auto border border-white/20">
              <div className="text-3xl animate-spin">🎵</div>
            </div>
            <div className="text-2xl font-semibold text-white mb-2">Connecting to game...</div>
            <div className="text-white/60 max-w-md mx-auto">
              Setting up your player profile and timeline
            </div>
            
            {/* Universal audio control is still available */}
            <div className="pt-6">
              <div className="text-white/80 text-sm mb-3">You can still control audio:</div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className={cn(
                    "w-16 h-16 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-2 border-white/40 transition-all duration-500",
                    isPlaying && "animate-spin"
                  )}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-2 border-white/50" />
                    </div>
                    
                    <div className="absolute inset-1 border border-white/10 rounded-full" />
                    <div className="absolute inset-2 border border-white/10 rounded-full" />
                    <div className="absolute inset-3 border border-white/10 rounded-full" />
                  </div>
                  
                  <button
                    onClick={onPlayPause}
                    className="absolute inset-0 w-full h-full bg-black/20 hover:bg-black/40 border-0 rounded-full transition-all duration-300 group"
                    disabled={!currentSong?.preview_url}
                  >
                    <div className="text-white text-lg group-hover:scale-125 transition-transform duration-300">
                      {isPlaying ? '⏸️' : '▶️'}
                    </div>
                  </button>
                </div>
              </div>
              <div className="text-white/60 text-xs mt-2">Universal audio control</div>
            </div>
            
            <div className="text-white/50 text-sm mt-6">
              Room: {roomCode}
            </div>
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

        {/* ENHANCED: Universal Vinyl Player Section - Always visible for universal control */}
        <div className="flex-shrink-0 py-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className={cn(
                "w-20 h-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-2 border-white/40 transition-all duration-500",
                isPlaying && "animate-spin"
              )}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-2 border-white/50" />
                </div>
                
                <div className="absolute inset-1 border border-white/10 rounded-full" />
                <div className="absolute inset-2 border border-white/10 rounded-full" />
                <div className="absolute inset-3 border border-white/10 rounded-full" />
              </div>
              
              <Button
                onClick={onPlayPause} // ENHANCED: Universal control - triggers host audio
                className="absolute inset-0 w-full h-full bg-black/20 hover:bg-black/40 border-0 rounded-full transition-all duration-300 group"
                disabled={!currentSong?.preview_url}
              >
                <div className="text-white text-lg group-hover:scale-125 transition-transform duration-300">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </div>
              </Button>
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

        {/* Content area */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Game interface - always show timeline, interactive elements only during turn */}
          {!gameEnded && (
            <div className="flex-1 bg-white/10 backdrop-blur-2xl rounded-3xl p-4 border border-white/25 flex flex-col min-h-0">
              {/* Header section - always visible */}
              <div className="text-center mb-4">
                <div className="text-white text-lg font-semibold mb-1">
                  {isMyTurn ? 'Your Timeline' : `${currentPlayer.name}'s Timeline`}
                </div>
                {isMyTurn ? (
                  <div className="text-white/80 text-sm">
                    {getPositionDescription(selectedPosition)}
                  </div>
                ) : (
                  <div className="text-white/80 text-sm">
                    {currentTurnPlayer.name} is playing • You can view your timeline
                  </div>
                )}
              </div>

              {/* Timeline display - always visible */}
              <div className="flex-1 min-h-0">
                {timelineSongs.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white/60">
                      <div className="text-lg mb-2">No cards yet</div>
                      <div className="text-sm">
                        {isMyTurn ? 'Place your first card!' : 'Waiting for your first card'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* Timeline cards - always visible, interactive only during turn */}
                    <div className="flex-1 flex items-center justify-center">
                      <div 
                        ref={timelineScrollRef}
                        className="w-full overflow-x-auto pb-4 scroll-smooth"
                        style={{ 
                          scrollbarWidth: 'none', 
                          msOverflowStyle: 'none',
                          scrollBehavior: 'smooth'
                        }}
                      >
                        <div className="flex items-center gap-1 sm:gap-2 min-w-max px-4 sm:px-8 justify-start">
                          {/* Position indicator before first card - only interactive during turn */}
                          {isMyTurn && (
                            <div 
                              className={cn(
                                "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 font-bold",
                                selectedPosition === 0 
                                  ? "bg-green-400 border-green-400 text-white scale-125 animate-pulse shadow-lg shadow-green-400/50" 
                                  : "border-white/40 text-white/60 hover:border-white/60 hover:bg-white/10"
                              )}
                              onClick={() => setSelectedPosition(0)}
                            >
                              {selectedPosition === 0 ? <Check className="w-6 h-6" /> : '1'}
                            </div>
                          )}

                          {timelineSongs.map((song, index) => {
                            const cardColor = getCardColor(song);
                            return (
                              <React.Fragment key={song.id}>
                                {/* Song card - always visible with responsive sizing */}
                                <div
                                  className={cn(
                                    "w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border border-white/20 transition-all duration-200 shadow-lg relative flex-shrink-0",
                                    isMyTurn ? "hover:scale-105 active:scale-95 cursor-pointer" : "opacity-90"
                                  )}
                                  style={{ 
                                    backgroundColor: cardColor.backgroundColor,
                                    backgroundImage: cardColor.backgroundImage
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
                                  
                                  <div className="p-2 sm:p-3 h-full flex flex-col items-center justify-between text-white relative z-10">
                                    <div className="text-xs font-medium text-center leading-tight max-w-full text-white overflow-hidden">
                                      <div className="break-words">
                                        {truncateText(song.deezer_artist, 12)}
                                      </div>
                                    </div>
                                    
                                    <div className="text-xl sm:text-2xl font-black text-white flex-1 flex items-center justify-center">
                                      {song.release_year}
                                    </div>
                                    
                                    <div className="text-xs text-center italic text-white leading-tight max-w-full opacity-90 overflow-hidden">
                                      <div className="break-words">
                                        {truncateText(song.deezer_title, 12)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Position indicator after card - only interactive during turn */}
                                {isMyTurn && (
                                  <div 
                                    className={cn(
                                      "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 font-bold",
                                      selectedPosition === index + 1 
                                        ? "bg-green-400 border-green-400 text-white scale-125 animate-pulse shadow-lg shadow-green-400/50" 
                                        : "border-white/40 text-white/60 hover:border-white/60 hover:bg-white/10"
                                    )}
                                    onClick={() => setSelectedPosition(index + 1)}
                                  >
                                    {selectedPosition === index + 1 ? <Check className="w-6 h-6" /> : (index + 2).toString()}
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Position navigation - only during turn */}
                    {isMyTurn && (
                      <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        <Button
                          onClick={() => navigatePosition('prev')}
                          disabled={selectedPosition === 0}
                          className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeft className="w-5 h-5 text-white" />
                        </Button>
                        
                        <div className="text-white/80 text-sm text-center bg-white/10 backdrop-blur-xl rounded-lg px-3 py-1 border border-white/20">
                          Position {selectedPosition + 1} of {totalPositions}
                        </div>
                        
                        <Button
                          onClick={() => navigatePosition('next')}
                          disabled={selectedPosition === totalPositions - 1}
                          className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronRight className="w-5 h-5 text-white" />
                        </Button>
                      </div>
                    )}

                    {/* Waiting state indicator when not turn */}
                    {!isMyTurn && (
                      <div className="pt-4 border-t border-white/20">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto bg-white/15 backdrop-blur-2xl rounded-full flex items-center justify-center border-2 border-white/30 mb-3">
                            <Music className="w-6 h-6 text-white/90 animate-pulse" />
                          </div>
                          <div className="text-white/70 text-sm bg-white/10 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20">
                            {currentTurnPlayer.name} is playing
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="flex-shrink-0 mx-4 mb-4">
            <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-center animate-in slide-in-from-bottom-2">
              {error}
            </div>
          </div>
        )}

        {/* Action button - only during player's turn */}
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
