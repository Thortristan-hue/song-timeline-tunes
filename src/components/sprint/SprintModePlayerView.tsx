import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Timer, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface SprintModePlayerViewProps {
  currentPlayer: Player;
  currentSong: Song;
  roomCode: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean; correct?: boolean }>;
  gameEnded: boolean;
  targetCards: number;
  timeLeft?: number;
  isInTimeout?: boolean;
  timeoutRemaining?: number;
}

export function SprintModePlayerView({
  currentPlayer,
  currentSong,
  roomCode,
  isPlaying,
  onPlayPause,
  onPlaceCard,
  gameEnded,
  targetCards,
  timeLeft = 30,
  isInTimeout = false,
  timeoutRemaining = 0
}: SprintModePlayerViewProps) {
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; song: Song } | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Get sorted timeline
  const timelineSongs = currentPlayer.timeline
    .filter(song => song !== null)
    .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));

  // Reset result display when new song starts
  useEffect(() => {
    setLastResult(null);
    setShowResult(false);
    setSelectedPosition(Math.floor(timelineSongs.length / 2)); // Start in middle
  }, [currentSong.id, timelineSongs.length]);

  // Show result briefly after placement
  useEffect(() => {
    if (lastResult) {
      setShowResult(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        setLastResult(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastResult]);

  const handlePlaceCard = async () => {
    if (isSubmitting || isInTimeout) return;

    setIsSubmitting(true);
    try {
      const result = await onPlaceCard(currentSong, selectedPosition);
      setLastResult({ 
        correct: result.correct || false, 
        song: currentSong 
      });
    } catch (error) {
      console.error('Failed to place card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCardBetweenYears = (position: number) => {
    if (timelineSongs.length === 0) return { before: '1950', after: '2024' };
    
    const beforeSong = position > 0 ? timelineSongs[position - 1] : null;
    const afterSong = position < timelineSongs.length ? timelineSongs[position] : null;
    
    return {
      before: beforeSong ? beforeSong.release_year : '1950',
      after: afterSong ? afterSong.release_year : '2024'
    };
  };

  const { before, after } = getCardBetweenYears(selectedPosition);
  const progress = (currentPlayer.timeline.length / targetCards) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
      </div>

      {/* Timeout Overlay */}
      {isInTimeout && (
        <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <Card className="bg-red-900/80 border border-red-500 p-6 rounded-3xl text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <div className="text-white font-bold text-xl mb-2">Incorrect Placement!</div>
            <div className="text-red-200 mb-4">5 second timeout</div>
            <div className="text-3xl font-bold text-red-400">{timeoutRemaining}s</div>
          </Card>
        </div>
      )}

      <div className="relative z-10 p-4 h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-[#107793]" />
            <span className="text-white font-bold">Sprint Mode</span>
          </div>
          
          <div className="text-center">
            <div className="text-white font-bold text-sm">Room: {roomCode}</div>
            <div className="text-[#d9e8dd] text-xs">Race to {targetCards} cards!</div>
          </div>

          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#4CC9F0]" />
            <span className="text-[#4CC9F0] font-bold text-sm">{timeLeft}s</span>
          </div>
        </div>

        {/* Progress */}
        <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-3 rounded-2xl mb-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-white font-bold">{currentPlayer.name}</div>
              <div className="text-[#d9e8dd] text-xs">Your Timeline</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#4CC9F0]">
                {currentPlayer.timeline.length}/{targetCards}
              </div>
              <div className="text-[#d9e8dd] text-xs">cards</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-[#1A1A2E]/70 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-[#107793] to-[#4CC9F0] h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center text-xs text-[#d9e8dd]/70 mt-1">
            {progress.toFixed(0)}% Complete
          </div>
        </Card>

        {/* Current Song */}
        <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-4 rounded-3xl mb-4 flex-1">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-white mb-2">Mystery Card</h2>
            <p className="text-[#d9e8dd] text-sm">Place it correctly to keep it!</p>
          </div>

          {/* Song Info */}
          <div className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 rounded-2xl p-4 mb-4">
            <div className="text-center mb-3">
              <div className="text-lg font-bold text-white">{currentSong?.deezer_title || 'Loading...'}</div>
              <div className="text-[#107793] font-semibold">{currentSong?.deezer_artist || 'Loading...'}</div>
            </div>

            {/* Play/Pause Button */}
            <div className="flex justify-center mb-4">
              <Button
                onClick={onPlayPause}
                size="lg"
                className="bg-gradient-to-r from-[#107793] to-[#4CC9F0] hover:from-[#4CC9F0] hover:to-[#107793] text-white rounded-full w-16 h-16 p-0"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Timeline Position Selector */}
          {!isInTimeout && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-white font-bold text-lg">Where does this fit?</div>
                <div className="text-[#d9e8dd] text-sm">Choose position in your timeline</div>
              </div>

              {/* Position Display */}
              <div className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 rounded-2xl p-4">
                <div className="text-center mb-4">
                  <div className="text-sm text-[#d9e8dd] mb-2">
                    Placing between:
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-[#107793] font-bold">{before}</div>
                    <div className="text-white">→ NEW CARD ←</div>
                    <div className="text-[#4CC9F0] font-bold">{after}</div>
                  </div>
                </div>

                {/* Timeline Visualization */}
                <div className="mb-4">
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {Array.from({ length: timelineSongs.length + 1 }, (_, i) => (
                      <div key={i} className="flex items-center">
                        {i < timelineSongs.length && (
                          <div 
                            className={cn(
                              "w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold",
                              "bg-[#4CC9F0]/20 border-[#4CC9F0] text-[#4CC9F0]"
                            )}
                          >
                            {timelineSongs[i].release_year.slice(-2)}
                          </div>
                        )}
                        
                        <Button
                          onClick={() => setSelectedPosition(i)}
                          size="sm"
                          className={cn(
                            "w-8 h-8 p-0 mx-1 rounded-full transition-all duration-200",
                            selectedPosition === i
                              ? "bg-[#a53b8b] border-2 border-white scale-110"
                              : "bg-[#4a4f5b]/50 border border-[#4a4f5b] hover:bg-[#4a4f5b]"
                          )}
                        >
                          {i === selectedPosition ? '📍' : '+'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handlePlaceCard}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#107793] to-[#4CC9F0] text-white font-bold py-3 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Placing...' : 'Place Card'}
                </Button>
              </div>
            </div>
          )}

          {/* Result Display */}
          {showResult && lastResult && (
            <div className="text-center">
              <div className={cn(
                "bg-[#1A1A2E]/70 border rounded-2xl p-4",
                lastResult.correct 
                  ? "border-green-500 bg-green-500/10" 
                  : "border-red-500 bg-red-500/10"
              )}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {lastResult.correct ? (
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  )}
                  <div className={cn(
                    "text-xl font-bold",
                    lastResult.correct ? "text-green-400" : "text-red-400"
                  )}>
                    {lastResult.correct ? "Correct!" : "Incorrect!"}
                  </div>
                </div>
                
                <div className="text-sm text-[#d9e8dd]">
                  {lastResult.correct 
                    ? "Card added to timeline!" 
                    : "Card removed - 5 second timeout!"}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Current Timeline Display */}
        <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-3 rounded-2xl">
          <div className="text-center mb-2">
            <div className="text-white font-bold text-sm">Your Timeline</div>
          </div>
          
          <div className="flex gap-1 overflow-x-auto">
            {timelineSongs.length === 0 ? (
              <div className="text-center w-full text-[#d9e8dd]/60 text-sm py-2">
                No cards yet - place your first one!
              </div>
            ) : (
              timelineSongs.map((song, index) => (
                <div 
                  key={song.id}
                  className="min-w-[60px] text-center p-2 bg-[#4CC9F0]/20 border border-[#4CC9F0]/50 rounded-lg"
                >
                  <div className="text-[#4CC9F0] font-bold text-xs">{song.release_year}</div>
                  <div className="text-white text-xs truncate">{song?.deezer_title?.substring(0, 8) || 'Loading...'}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}