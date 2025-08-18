import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Radio, Clock, Target } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface FiendModePlayerViewProps {
  currentPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSubmitGuess: (year: number) => Promise<{ success: boolean; accuracy?: number; points?: number }>;
  gameEnded: boolean;
  roundNumber: number;
  totalRounds: number;
  timeLeft?: number;
}

export function FiendModePlayerView({
  currentPlayer,
  currentSong,
  roomCode,
  isPlaying,
  onPlayPause,
  onSubmitGuess,
  gameEnded,
  roundNumber,
  totalRounds,
  timeLeft = 30
}: FiendModePlayerViewProps) {
  const [selectedYear, setSelectedYear] = useState<number>(1990);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [lastResult, setLastResult] = useState<{ accuracy: number; points: number } | null>(null);
  
  const sliderRef = useRef<HTMLInputElement>(null);
  const currentYear = new Date().getFullYear();
  const minYear = 1950;
  const maxYear = currentYear;

  // Reset submission state when new song starts
  useEffect(() => {
    setHasSubmitted(false);
    setLastResult(null);
    setSelectedYear(1990);
  }, [currentSong.id]);

  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedYear(parseInt(event.target.value));
  };

  const handleSubmitGuess = async () => {
    if (!currentSong || isSubmitting || hasSubmitted) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmitGuess(selectedYear);
      if (result.success && result.accuracy !== undefined && result.points !== undefined) {
        setLastResult({ accuracy: result.accuracy, points: result.points });
        setHasSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit guess:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-400';
    if (accuracy >= 80) return 'text-yellow-400';
    if (accuracy >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  // Only calculate these if currentSong exists
  const actualYear = currentSong ? parseInt(currentSong.release_year) : 0;
  const yearDifference = currentSong ? Math.abs(selectedYear - actualYear) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
      </div>

      <div className="relative z-10 p-4 h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#a53b8b]" />
            <span className="text-white font-bold">Fiend Mode</span>
          </div>
          
          <div className="text-center">
            <div className="text-white font-bold text-sm">Round {roundNumber}/{totalRounds}</div>
            <div className="text-[#d9e8dd] text-xs">Room: {roomCode}</div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#4CC9F0]" />
            <span className="text-[#4CC9F0] font-bold text-sm">{timeLeft}s</span>
          </div>
        </div>

        {/* Player Score */}
        <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-3 rounded-2xl mb-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-white font-bold">{currentPlayer.name}</div>
              <div className="text-[#d9e8dd] text-xs">Your Score</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#4CC9F0]">{currentPlayer.score}</div>
              <div className="text-[#d9e8dd] text-xs">points</div>
            </div>
          </div>
        </Card>

        {/* Current Song */}
        <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-4 rounded-3xl mb-4 flex-1">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-white mb-2">Mystery Track</h2>
            <p className="text-[#d9e8dd] text-sm">Listen and guess the year</p>
          </div>

          {/* Song Info */}
          <div className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 rounded-2xl p-4 mb-4">
            {currentSong ? (
              <>
                <div className="text-center mb-3">
                  <div className="text-lg font-bold text-white">{currentSong.deezer_title}</div>
                  <div className="text-[#a53b8b] font-semibold">{currentSong.deezer_artist}</div>
                </div>

                {/* Play/Pause Button */}
                <div className="flex justify-center mb-4">
                  <Button
                    onClick={onPlayPause}
                    size="lg"
                    className="bg-gradient-to-r from-[#a53b8b] to-[#4a4f5b] hover:from-[#4a4f5b] hover:to-[#a53b8b] text-white rounded-full w-16 h-16 p-0"
                    disabled={!currentSong.preview_url}
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-lg text-white/70 mb-2">Loading next song...</div>
                <div className="text-white/50 text-sm">Please wait while we prepare the next round</div>
              </div>
            )}
          </div>

          {/* Year Slider Interface */}
          {!hasSubmitted && !gameEnded && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-white font-bold text-lg">When was this released?</div>
                <div className="text-[#d9e8dd] text-sm">Drag the timeline to guess the year</div>
              </div>

              {/* Radio-style Timeline Slider */}
              <div className="relative">
                <div className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 rounded-2xl p-4">
                  {/* Year Display */}
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-[#4CC9F0] font-mono">
                      {selectedYear}
                    </div>
                    <div className="text-[#d9e8dd] text-sm">Selected Year</div>
                  </div>

                  {/* Custom Radio Scanner Style Slider */}
                  <div className="relative mb-4">
                    <input
                      ref={sliderRef}
                      type="range"
                      min={minYear}
                      max={maxYear}
                      value={selectedYear}
                      onChange={handleYearChange}
                      className="w-full h-3 bg-gradient-to-r from-[#a53b8b] via-[#4CC9F0] to-[#107793] rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, 
                          #a53b8b 0%, 
                          #4CC9F0 ${((selectedYear - minYear) / (maxYear - minYear)) * 100}%, 
                          #107793 100%)`
                      }}
                    />
                    
                    {/* Year Markers */}
                    <div className="flex justify-between mt-2 text-xs text-[#d9e8dd]/70">
                      <span>{minYear}</span>
                      <span>1980</span>
                      <span>2000</span>
                      <span>2020</span>
                      <span>{maxYear}</span>
                    </div>
                  </div>

                  {/* Accuracy Preview */}
                  {selectedYear && currentSong && (
                    <div className="text-center text-sm text-[#d9e8dd]/80 mb-4">
                      {yearDifference === 0 ? 
                        "Perfect guess! 🎯" : 
                        `${yearDifference} year${yearDifference === 1 ? '' : 's'} off from actual`
                      }
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitGuess}
                    disabled={!currentSong || isSubmitting}
                    className="w-full bg-gradient-to-r from-[#a53b8b] to-[#4a4f5b] text-white font-bold py-3 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Submitting...' : `Lock in ${selectedYear}`}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {hasSubmitted && lastResult && (
            <div className="text-center">
              <div className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 rounded-2xl p-4">
                <div className="mb-3">
                  <div className="text-lg font-bold text-white">Your Guess: {selectedYear}</div>
                  <div className="text-[#a53b8b] font-semibold">Actual: {currentSong.release_year}</div>
                </div>
                
                <div className="space-y-2">
                  <div className={cn("text-2xl font-bold", getAccuracyColor(lastResult.accuracy))}>
                    {lastResult.accuracy.toFixed(1)}% Accuracy
                  </div>
                  <div className="text-[#4CC9F0] text-xl font-bold">
                    +{lastResult.points} Points
                  </div>
                </div>
                
                <Badge 
                  className={cn(
                    "mt-3 text-white font-bold",
                    lastResult.accuracy >= 95 ? "bg-green-500" :
                    lastResult.accuracy >= 80 ? "bg-yellow-500" :
                    lastResult.accuracy >= 60 ? "bg-orange-500" : "bg-red-500"
                  )}
                >
                  {lastResult.accuracy >= 95 ? "🎯 Perfect!" :
                   lastResult.accuracy >= 80 ? "🔥 Great!" :
                   lastResult.accuracy >= 60 ? "👍 Good!" : "📻 Keep tuning!"}
                </Badge>
              </div>
            </div>
          )}

          {/* Waiting for next round */}
          {hasSubmitted && !gameEnded && (
            <div className="text-center mt-4">
              <div className="text-[#d9e8dd] text-sm animate-pulse">
                Waiting for next round...
              </div>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}