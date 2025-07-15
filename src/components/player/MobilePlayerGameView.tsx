
import React, { useState, useRef, useEffect, useCallback } from 'react';
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

  // Refs for performance optimization
  const audioCleanupRef = useRef<() => void>();

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

  // Show result overlay
  if (cardPlacementResult) {
    const isCorrect = cardPlacementResult.correct;
    
    return (
      <div 
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          "px-4 pt-safe-top pb-safe-bottom",
          isCorrect 
            ? 'bg-gradient-to-br from-green-500 via-green-600 to-green-700' 
            : 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
        )}
      >
        <div className="text-center space-y-6 max-w-sm w-full">
          {/* Result icon */}
          <div className="relative">
            <div className={cn(
              "text-8xl mb-4 font-black",
              isCorrect ? 'animate-bounce' : 'animate-pulse'
            )}>
              {isCorrect ? '✓' : '✗'}
            </div>
          </div>
          
          {/* Result text */}
          <div className={cn(
            "text-5xl font-black text-white drop-shadow-2xl",
            isCorrect ? 'animate-bounce' : 'animate-pulse'
          )}>
            {isCorrect ? 'CORRECT!' : 'INCORRECT'}
          </div>
          
          {/* Song info */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 border-4 border-white shadow-2xl">
            <div className="text-xl font-bold text-gray-900 mb-3 leading-tight">
              {cardPlacementResult.song.deezer_title}
            </div>
            <div className="text-lg text-gray-700 mb-4 font-medium">
              by {cardPlacementResult.song.deezer_artist}
            </div>
            <div className={cn(
              "inline-block text-white px-6 py-3 rounded-full font-black text-2xl shadow-xl",
              isCorrect 
                ? 'bg-gradient-to-r from-green-600 to-green-700' 
                : 'bg-gradient-to-r from-red-600 to-red-700'
            )}>
              {cardPlacementResult.song.release_year}
            </div>
          </div>
          
          {/* Score indicator */}
          <div className="text-white text-xl font-bold">
            {isCorrect ? 
              `+1 Point for ${currentPlayer.name}!` : 
              'No points this round'
            }
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

              {/* Timeline display */}
              <div className="flex-1 bg-white/10 backdrop-blur-2xl rounded-3xl p-4 border border-white/25 flex flex-col min-h-0">
                <div className="text-center mb-4">
                  <div className="text-white text-lg font-semibold mb-2">Your Timeline</div>
                  <div className="text-white/80 text-sm">
                    Position: {getPositionDescription(selectedPosition)}
                  </div>
                </div>

                {/* Timeline cards scroll area */}
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-3">
                    {timelineSongs.map((song, index) => (
                      <React.Fragment key={song.id}>
                        {/* Position indicator before song */}
                        {index === selectedPosition && (
                          <div className="flex items-center justify-center py-2">
                            <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                              ← Card will be placed here
                            </div>
                          </div>
                        )}
                        
                        {/* Song card */}
                        <div
                          className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 transition-all duration-200 hover:bg-white/15 active:scale-95"
                          onClick={() => song.preview_url && handleSongPreview(song)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                              {song.release_year.slice(-2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-semibold text-sm truncate">
                                {song.deezer_title}
                              </div>
                              <div className="text-white/70 text-xs truncate">
                                {song.deezer_artist} • {song.release_year}
                              </div>
                            </div>
                            {song.preview_url && (
                              <div className="flex-shrink-0">
                                {playingPreviewId === song.id ? (
                                  <Pause className="w-5 h-5 text-white" />
                                ) : (
                                  <Play className="w-5 h-5 text-white/70" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                    
                    {/* Final position indicator */}
                    {selectedPosition === timelineSongs.length && (
                      <div className="flex items-center justify-center py-2">
                        <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                          ← Card will be placed here
                        </div>
                      </div>
                    )}
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
