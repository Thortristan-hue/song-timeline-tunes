import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn, getArtistColor, truncateText } from '@/lib/utils';
import { MysterySongControls } from '@/components/MysterySongControls';

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
  const [selectedGapIndex, setSelectedGapIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug menu state (Easter egg)
  const [debugClickCount, setDebugClickCount] = useState(0);
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  // Refs for scrolling
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Get sorted timeline songs for placement
  const timelineSongs = useMemo(() => {
    return currentPlayer.timeline
      .filter(song => song !== null)
      .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));
  }, [currentPlayer.timeline]);

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

  // Handle play/pause/stop for mystery song
  const handlePlay = () => {
    if (currentSong?.preview_url) {
      onPlayPause();
    }
  };

  const handlePause = () => {
    onPlayPause();
  };

  const handleStop = () => {
    // Stop and reset audio
    onPlayPause();
  };

  // Get gap description for selected gap
  const getGapDescription = (gapIndex: number) => {
    if (timelineSongs.length === 0) return 'First card';
    if (gapIndex === 0) return 'Before first song';
    if (gapIndex === timelineSongs.length) return 'After last song';
    
    const beforeSong = timelineSongs[gapIndex - 1];
    const afterSong = timelineSongs[gapIndex];
    return `${beforeSong.release_year} - ${afterSong.release_year}`;
  };

  // Get years for the gap display
  const getGapYears = (gapIndex: number) => {
    if (timelineSongs.length === 0) return 'First card';
    if (gapIndex === 0 && timelineSongs.length > 0) return `Before ${timelineSongs[0].release_year}`;
    if (gapIndex === timelineSongs.length && timelineSongs.length > 0) return `After ${timelineSongs[timelineSongs.length - 1].release_year}`;
    
    if (gapIndex > 0 && gapIndex < timelineSongs.length) {
      const beforeSong = timelineSongs[gapIndex - 1];
      const afterSong = timelineSongs[gapIndex];
      return `${beforeSong.release_year} - ${afterSong.release_year}`;
    }
    
    return 'Select gap';
  };

  // Handle card placement
  const handlePlaceCard = async () => {
    if (isSubmitting || !isMyTurn || gameEnded) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Find the year placed after based on selected gap
      let yearPlacedAfter = null;
      if (selectedGapIndex > 0 && timelineSongs.length > 0) {
        const beforeCard = timelineSongs[selectedGapIndex - 1];
        yearPlacedAfter = beforeCard.release_year;
      }

      const result = await onPlaceCard(currentSong, selectedGapIndex);
      
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

  // Navigation handlers
  const navigateLeft = () => {
    if (selectedGapIndex > 0) {
      setSelectedGapIndex(selectedGapIndex - 1);
    }
  };

  const navigateRight = () => {
    if (selectedGapIndex < timelineSongs.length) {
      setSelectedGapIndex(selectedGapIndex + 1);
    }
  };

  // Get character image path
  const getCharacterImagePath = (character: string) => {
    return `/src/assets/char_${character}.png`;
  };

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
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Player Name (Top) */}
      <div className="text-center py-4 text-2xl font-bold">
        {currentPlayer.name}
        {!isMyTurn && !gameEnded && (
          <div className="text-sm text-gray-400 mt-1">
            Waiting for {currentTurnPlayer.name}
          </div>
        )}
      </div>

      {/* Playback Controls (Below Name) */}
      {isMyTurn && !gameEnded && (
        <MysterySongControls
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          disabled={!currentSong?.preview_url}
        />
      )}

      {/* Timeline Element (Center) */}
      <div className="flex-grow overflow-hidden relative">
        {isMyTurn && !gameEnded ? (
          <>
            {/* Gap Text */}
            <div className="text-center p-2 text-lg font-semibold">
              {getGapYears(selectedGapIndex)}
            </div>

            {/* Card Container with Yellow Line */}
            <div className="relative h-full">
              {/* Yellow Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-400 -translate-x-1/2 z-10"></div>

              {/* Timeline Cards */}
              <div 
                ref={timelineScrollRef}
                className="flex items-center overflow-x-auto p-4 snap-x snap-mandatory h-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {timelineSongs.length === 0 ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="text-center text-gray-400">
                      <div className="text-xl mb-2">No cards yet</div>
                      <div className="text-sm">This will be your first card!</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 min-w-full justify-center snap-start">
                    {timelineSongs.map((song, index) => (
                      <div
                        key={song.id}
                        className="w-32 h-40 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex-shrink-0 flex flex-col items-center justify-center text-white shadow-lg snap-center"
                        style={{ 
                          backgroundColor: getCardColor(song).backgroundColor,
                          backgroundImage: getCardColor(song).backgroundImage
                        }}
                      >
                        <div className="text-xs text-center mb-2 px-2">
                          {truncateText(song.deezer_artist, 12)}
                        </div>
                        <div className="text-2xl font-bold mb-2">
                          {song.release_year}
                        </div>
                        <div className="text-xs text-center px-2">
                          {truncateText(song.deezer_title, 12)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              {gameEnded ? (
                <div className="space-y-4">
                  <div className="text-3xl">🎉</div>
                  <div className="text-xl">Game Over!</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Music className="w-8 h-8" />
                  </div>
                  <div className="text-xl">Waiting for your turn...</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons (Below Timeline) */}
      {isMyTurn && !gameEnded && (
        <div className="flex justify-around items-center p-4">
          <Button
            onClick={navigateLeft}
            disabled={selectedGapIndex === 0}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
            Navigate Left
          </Button>

          <Button
            onClick={handlePlaceCard}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-bold shadow-lg transform transition-transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            {isSubmitting ? 'PLACING...' : 'PLACE CARD'}
          </Button>

          <Button
            onClick={navigateRight}
            disabled={selectedGapIndex >= timelineSongs.length}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Navigate Right
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Footer Elements (Bottom) */}
      <div className="flex justify-between items-end p-4">
        {/* Rythmy Logo (Left) */}
        <div 
          className="text-lg font-bold cursor-pointer text-blue-400 hover:text-blue-300"
          onClick={handleDebugClick}
        >
          {debugMode ? 'DEBUG MODE' : 'RYTHMY'}
        </div>

        {/* Player Character (Right) */}
        <div className="w-24 h-auto">
          <img 
            src={getCharacterImagePath(currentPlayer.character)} 
            alt={`${currentPlayer.name}'s character`}
            className="w-full h-auto"
            onError={(e) => {
              // Fallback if image doesn't load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-4">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-center">
            {error}
          </div>
        </div>
      )}

      {/* Debug Info */}
      {debugMode && currentSong && (
        <div className="mx-4 mb-4 bg-black/50 rounded-lg p-3 text-xs">
          <div className="font-semibold mb-1">Song Debug Info:</div>
          <div>Title: {currentSong.deezer_title}</div>
          <div>Artist: {currentSong.deezer_artist}</div>
          <div>Release Year: {currentSong.release_year}</div>
        </div>
      )}

      {/* Passcode Dialog */}
      {showPasscodeDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className="text-white text-lg font-semibold mb-2">🔐 Debug Access</div>
              <div className="text-gray-300 text-sm">Enter the secret passcode:</div>
            </div>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasscodeSubmit()}
              placeholder="Enter passcode"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                onClick={() => {setShowPasscodeDialog(false); setPasscode(''); setDebugClickCount(0);}}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasscodeSubmit}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white"
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
