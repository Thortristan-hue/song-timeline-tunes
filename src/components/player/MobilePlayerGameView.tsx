import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn, getArtistColor, truncateText } from '@/lib/utils';
import { getCharacterById as getCharacterByIdUtil, getDefaultCharacter } from '@/constants/characters';

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

  // Refs for scrolling and performance optimization
  const timelineScrollRef = useRef<HTMLDivElement>(null);
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

  // Center the selected position in the timeline view
  const centerSelectedPosition = useCallback(() => {
    if (!timelineScrollRef.current) return;
    
    const container = timelineScrollRef.current;
    const containerWidth = container.clientWidth;
    
    // Calculate the position of the selected gap
    const cardWidth = 144; // w-36 = 144px
    const gapWidth = 40; // gap between cards
    const selectedGapPosition = selectedPosition * (cardWidth + gapWidth);
    
    // Center the selected position
    const scrollPosition = selectedGapPosition - containerWidth / 2;
    
    container.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });
  }, [selectedPosition]);

  // Handle position navigation with centering
  const navigatePosition = (direction: 'prev' | 'next') => {
    let newPosition = selectedPosition;
    
    if (direction === 'prev' && selectedPosition > 0) {
      newPosition = selectedPosition - 1;
    } else if (direction === 'next' && selectedPosition < totalPositions - 1) {
      newPosition = selectedPosition + 1;
    }
    
    if (newPosition !== selectedPosition) {
      setSelectedPosition(newPosition);
    }
  };

  // Center view when position changes
  useEffect(() => {
    if (isMyTurn) {
      centerSelectedPosition();
    }
  }, [selectedPosition, isMyTurn, centerSelectedPosition]);

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

  // Show enhanced result overlay with more vivid feedback
  if (cardPlacementResult) {
    const isCorrect = cardPlacementResult.correct;
    
    return (
      <div 
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-700",
          "px-4 pt-safe-top pb-safe-bottom",
          isCorrect 
            ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600' 
            : 'bg-gradient-to-br from-red-400 via-rose-500 to-pink-600'
        )}
        style={{
          backgroundImage: isCorrect 
            ? 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)'
            : 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)'
        }}
      >
        {/* Enhanced animated background effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating particles with more variety */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute rounded-full animate-bounce opacity-70",
                isCorrect ? "bg-yellow-300" : "bg-red-300"
              )}
              style={{
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`
              }}
            />
          ))}
          
          {/* Multiple radial pulse effects */}
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
            "w-96 h-96 rounded-full opacity-20 animate-ping",
            isCorrect ? "bg-white" : "bg-yellow-200"
          )} />
          <div className={cn(
            "absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2",
            "w-64 h-64 rounded-full opacity-15 animate-ping",
            isCorrect ? "bg-yellow-300" : "bg-red-300"
          )} style={{ animationDelay: '0.5s' }} />
          
          {/* Sparkle effects */}
          {isCorrect && [...Array(15)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute text-yellow-300 animate-ping opacity-80"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${Math.random() * 20 + 10}px`
              }}
            >
              ✨
            </div>
          ))}
        </div>

        <div className="relative text-center space-y-8 max-w-md w-full animate-in slide-in-from-bottom-8 duration-700">
          {/* Super large animated icon with glow effect */}
          <div className="relative mb-6">
            <div className={cn(
              "text-9xl mb-4 font-light transition-all duration-500 animate-in zoom-in-50",
              "drop-shadow-2xl filter",
              isCorrect ? 'text-yellow-200 animate-bounce' : 'text-red-200 animate-pulse'
            )}
            style={{
              filter: isCorrect 
                ? 'drop-shadow(0 0 20px rgba(255, 255, 0, 0.8))' 
                : 'drop-shadow(0 0 20px rgba(255, 100, 100, 0.8))'
            }}>
              {isCorrect ? '🎉' : '💔'}
            </div>
            <div className={cn(
              "text-8xl font-black text-white drop-shadow-2xl animate-in slide-in-from-top-4 duration-500 delay-200",
              isCorrect ? 'animate-pulse' : 'animate-bounce'
            )}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.8))',
              textShadow: isCorrect 
                ? '0 0 20px rgba(255, 255, 255, 0.8)' 
                : '0 0 20px rgba(255, 255, 255, 0.6)'
            }}>
              {isCorrect ? '✓' : '✗'}
            </div>
          </div>
          
          {/* Enhanced result text with pulsing glow */}
          <div className={cn(
            "text-5xl font-black text-white drop-shadow-2xl transition-all duration-300 animate-in slide-in-from-left-4 delay-300",
            isCorrect ? 'animate-pulse' : ''
          )}
          style={{
            textShadow: isCorrect 
              ? '0 0 30px rgba(255, 255, 255, 1), 0 0 40px rgba(255, 255, 0, 0.8)' 
              : '0 0 30px rgba(255, 255, 255, 1), 0 0 40px rgba(255, 100, 100, 0.8)'
          }}>
            {isCorrect ? 'AMAZING!' : 'OOPS!'}
          </div>
          
          {/* Super enhanced song information card */}
          <div className={cn(
            "bg-white/98 backdrop-blur-lg rounded-3xl p-8 border-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-500 delay-400 transform",
            isCorrect ? 'border-green-400' : 'border-red-400'
          )}
          style={{
            boxShadow: isCorrect 
              ? '0 25px 50px rgba(0, 255, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
              : '0 25px 50px rgba(255, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}>
            {/* Song Title - Extra Large and Bold */}
            <div className="text-2xl font-black text-gray-900 mb-4 leading-tight">
              🎵 <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {cardPlacementResult.song.deezer_title}
              </span>
            </div>
            
            {/* Artist Name - Large and Prominent */}
            <div className="text-xl text-gray-700 mb-5 font-bold">
              🎤 by <span className="text-gray-900">{cardPlacementResult.song.deezer_artist}</span>
            </div>
            
            {/* Release Year - Super Prominent */}
            <div className={cn(
              "inline-block text-white px-8 py-4 rounded-2xl font-black text-3xl shadow-2xl transition-all duration-200 border-4 border-white/30 mb-4",
              isCorrect 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 animate-pulse' 
                : 'bg-gradient-to-r from-red-500 to-rose-600'
            )}
            style={{
              boxShadow: isCorrect 
                ? '0 15px 30px rgba(0, 255, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)' 
                : '0 15px 30px rgba(255, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
            }}>
              📅 Released in {cardPlacementResult.song.release_year}
            </div>
            
            {/* Additional album info if available */}
            {cardPlacementResult.song.deezer_album && (
              <div className="text-base text-gray-600 mt-4 font-semibold italic">
                💿 from "<span className="text-gray-800">{cardPlacementResult.song.deezer_album}</span>"
              </div>
            )}
          </div>
          
          {/* Super enhanced feedback message */}
          <div className={cn(
            "text-white text-2xl font-black transition-all duration-300 animate-in slide-in-from-right-4 delay-500"
          )}
          style={{
            textShadow: '0 0 20px rgba(0, 0, 0, 0.8)'
          }}>
            {isCorrect ? (
              <div className="space-y-3">
                <div className="text-4xl animate-bounce" style={{ textShadow: '0 0 30px rgba(255, 255, 0, 0.8)' }}>
                  🎯 PERFECT PLACEMENT!
                </div>
                <div className="text-xl opacity-95 font-bold bg-white/20 backdrop-blur-sm rounded-xl py-2 px-4">
                  +1 Point for {currentPlayer.name}! 🏆
                </div>
                <div className="text-lg opacity-90 animate-pulse">
                  You're absolutely crushing it! 🔥⭐
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-3xl animate-bounce">🎯 Not quite right!</div>
                <div className="text-xl opacity-95 bg-white/20 backdrop-blur-sm rounded-xl py-2 px-4">
                  Keep the music flowing! 🎶
                </div>
                <div className="text-lg opacity-90">
                  Music history is tricky, but you've got this! 💪🎵
                </div>
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
            <div className="flex-1 flex flex-col items-center justify-center">
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

              {/* Timeline display with horizontal scroll and centered selection */}
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
                    {/* Timeline cards with smooth scrolling */}
                    <div className="flex-1 flex items-center justify-center">
                      <div 
                        ref={timelineScrollRef}
                        className="w-full overflow-x-auto pb-4 scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        <div className="flex items-center gap-2 min-w-max px-4 justify-start">
                          {/* Position indicator before first card */}
                          <div 
                            className={cn(
                              "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0",
                              selectedPosition === 0 
                                ? "bg-green-400 border-green-400 text-white scale-125 animate-pulse" 
                                : "border-white/40 text-white/60 hover:border-white/60"
                            )}
                            onClick={() => setSelectedPosition(0)}
                          >
                            {selectedPosition === 0 ? <Check className="w-5 h-5" /> : '+'}
                          </div>

                          {timelineSongs.map((song, index) => {
                            const cardColor = getCardColor(song);
                            return (
                              <React.Fragment key={song.id}>
                                {/* Song card */}
                                <div
                                  className={cn(
                                    "w-36 h-36 rounded-2xl border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-lg relative flex-shrink-0"
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
                                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0",
                                    selectedPosition === index + 1 
                                      ? "bg-green-400 border-green-400 text-white scale-125 animate-pulse" 
                                      : "border-white/40 text-white/60 hover:border-white/60"
                                  )}
                                  onClick={() => setSelectedPosition(index + 1)}
                                >
                                  {selectedPosition === index + 1 ? <Check className="w-5 h-5" /> : '+'}
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
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
        <div className="flex-shrink-0 py-4">
          {/* Debug Menu */}
          <div className="text-center">
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
