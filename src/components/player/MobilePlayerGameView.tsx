
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn, getArtistColor, truncateText } from '@/lib/utils';

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
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);

  // Debug menu state (Easter egg)
  const [debugClickCount, setDebugClickCount] = useState(0);
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  // Refs for performance optimization
  const audioCleanupRef = useRef<() => void>();

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
      
      if (playingPreviewId === song.id) {
        cleanupAudio();
        return;
      }

      cleanupAudio();

      if (!song.preview_url) {
        setError('Preview not available for this song');
        return;
      }

      const audio = new Audio(song.preview_url);
      audio.volume = 0.7;
      
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
    if (timelineSongs.length === 0) return 'First card';
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

  // Cleanup audio on unmount or turn change
  useEffect(() => {
    return () => {
      audioCleanupRef.current?.();
    };
  }, []);

  // Reset position when turn changes
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      setSelectedPosition(Math.floor(totalPositions / 2));
      setError(null);
    }
  }, [isMyTurn, gameEnded, totalPositions]);

  // Sync highlighted gap with host when position changes
  useEffect(() => {
    if (isMyTurn && onHighlightGap) {
      onHighlightGap(selectedPosition);
    }
  }, [selectedPosition, isMyTurn, onHighlightGap]);

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

        {/* Vinyl Player Section */}
        {isMyTurn && !gameEnded && (
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
                  onClick={onPlayPause}
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
              <div className="text-white/80 text-sm font-medium">Mystery Song</div>
            </div>
          </div>
        )}

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
            <div className="flex-1 bg-white/10 backdrop-blur-2xl rounded-3xl p-4 border border-white/25 flex flex-col min-h-0">
              <div className="text-center mb-4">
                <div className="text-white text-lg font-semibold mb-1">Your Timeline</div>
                <div className="text-white/80 text-sm">
                  {getPositionDescription(selectedPosition)}
                </div>
              </div>

              {/* Timeline display */}
              <div className="flex-1 min-h-0">
                {timelineSongs.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white/60">
                      <div className="text-lg mb-2">No cards yet</div>
                      <div className="text-sm">Place your first card!</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* Timeline cards */}
                    <div className="flex-1 flex items-center justify-center overflow-x-auto pb-4">
                      <div className="flex items-center gap-2 min-w-max px-4">
                        {/* Position indicator before first card */}
                        <div 
                          className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer",
                            selectedPosition === 0 
                              ? "bg-green-400 border-green-400 text-white" 
                              : "border-white/40 text-white/60 hover:border-white/60"
                          )}
                          onClick={() => setSelectedPosition(0)}
                        >
                          {selectedPosition === 0 ? <Check className="w-4 h-4" /> : '+'}
                        </div>

                        {timelineSongs.map((song, index) => {
                          const cardColor = getCardColor(song);
                          return (
                            <React.Fragment key={song.id}>
                              {/* Song card */}
                              <div
                                className={cn(
                                  "w-32 h-32 rounded-2xl border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-lg relative flex-shrink-0"
                                )}
                                style={{ 
                                  backgroundColor: cardColor.backgroundColor,
                                  backgroundImage: cardColor.backgroundImage
                                }}
                                onClick={() => song.preview_url && handleSongPreview(song)}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
                                
                                <div className="p-3 h-full flex flex-col items-center justify-between text-white relative z-10">
                                  <div className="text-xs font-medium text-center leading-tight max-w-full text-white overflow-hidden">
                                    <div className="break-words">
                                      {truncateText(song.deezer_artist, 15)}
                                    </div>
                                  </div>
                                  
                                  <div className="text-2xl font-black text-white flex-1 flex items-center justify-center">
                                    {song.release_year}
                                  </div>
                                  
                                  <div className="text-xs text-center italic text-white leading-tight max-w-full opacity-90 overflow-hidden">
                                    <div className="break-words">
                                      {truncateText(song.deezer_title, 15)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Position indicator after card */}
                              <div 
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0",
                                  selectedPosition === index + 1 
                                    ? "bg-green-400 border-green-400 text-white" 
                                    : "border-white/40 text-white/60 hover:border-white/60"
                                )}
                                onClick={() => setSelectedPosition(index + 1)}
                              >
                                {selectedPosition === index + 1 ? <Check className="w-4 h-4" /> : '+'}
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Position navigation */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/20">
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
                )}
              </div>
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
