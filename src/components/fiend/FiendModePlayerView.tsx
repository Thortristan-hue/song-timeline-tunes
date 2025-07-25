import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Radio, Clock, Target, Zap, Star, TrendingUp } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface FiendModePlayerViewProps {
  currentPlayer: Player;
  currentSong: Song;
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
  const [sliderAnimation, setSliderAnimation] = useState(false);
  const [resultAnimation, setResultAnimation] = useState(false);
  
  const sliderRef = useRef<HTMLInputElement>(null);
  const currentYear = new Date().getFullYear();
  const minYear = 1950;
  const maxYear = currentYear;

  // Calculate progress values
  const roundProgress = (roundNumber / totalRounds) * 100;
  const timeProgress = (timeLeft / 30) * 100; // Assuming 30s per round

  // Reset submission state when new song starts
  useEffect(() => {
    setHasSubmitted(false);
    setLastResult(null);
    setSelectedYear(1990);
    setSliderAnimation(false);
    setResultAnimation(false);
  }, [currentSong.id]);

  // Trigger animations
  useEffect(() => {
    if (lastResult) {
      setResultAnimation(true);
      const timer = setTimeout(() => setResultAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastResult]);

  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedYear(parseInt(event.target.value));
    setSliderAnimation(true);
  };

  const handleSubmitGuess = async () => {
    if (isSubmitting || hasSubmitted) return;

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

  const actualYear = parseInt(currentSong.release_year);
  const yearDifference = Math.abs(selectedYear - actualYear);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] via-[#0e0e0e] to-[#1a1a2e] relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-[#4CC9F0]/5 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-[#4CC9F0]/20 rounded-full animate-bounce"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-4 h-screen flex flex-col">
        {/* Enhanced Header with Progress */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio className="h-6 w-6 text-[#a53b8b] animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#4CC9F0] rounded-full animate-ping" />
            </div>
            <div>
              <span className="text-white font-bold text-lg">Fiend Mode</span>
              <div className="text-[#a53b8b] text-xs font-semibold">Year Guessing Challenge</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-white font-bold text-sm mb-1">
              Round {roundNumber}/{totalRounds}
            </div>
            <Progress 
              value={roundProgress} 
              className="w-20 h-2 bg-[#1a1a2e]"
            />
            <div className="text-[#d9e8dd] text-xs mt-1">Room: {roomCode}</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Clock className={cn("h-5 w-5", timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-[#4CC9F0]")} />
              {timeLeft <= 10 && (
                <div className="absolute inset-0 animate-ping">
                  <Clock className="h-5 w-5 text-red-400" />
                </div>
              )}
            </div>
            <div className="text-center">
              <span className={cn("font-bold text-sm", timeLeft <= 10 ? "text-red-400" : "text-[#4CC9F0]")}>
                {timeLeft}s
              </span>
              <Progress 
                value={timeProgress} 
                className={cn("w-12 h-1 mt-1", timeLeft <= 10 ? "bg-red-900" : "bg-[#1a1a2e]")}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Player Score Card */}
        <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-4 rounded-2xl mb-4 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#a53b8b] to-[#4CC9F0] rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">{currentPlayer.name}</div>
                <div className="text-[#d9e8dd] text-sm flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Your Performance
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#4CC9F0] tabular-nums">
                {currentPlayer.score}
              </div>
              <div className="text-[#d9e8dd] text-sm">points</div>
              <div className="w-16 h-1 bg-gradient-to-r from-[#107793] to-[#4CC9F0] rounded-full mt-1" />
            </div>
          </div>
        </Card>

        {/* Enhanced Current Song Card */}
        <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-4 rounded-3xl mb-4 flex-1 transform transition-all duration-300 hover:shadow-2xl">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-[#4CC9F0] animate-pulse" />
              <h2 className="text-xl font-bold text-white">Mystery Track</h2>
              <Zap className="h-5 w-5 text-[#4CC9F0] animate-pulse" />
            </div>
            <p className="text-[#d9e8dd] text-sm">Listen carefully and guess the release year</p>
          </div>

          {/* Enhanced Song Info */}
          <div className="bg-gradient-to-br from-[#1A1A2E]/70 to-[#2d1b69]/30 border border-[#4a4f5b]/30 rounded-2xl p-4 mb-4 transform transition-all duration-300 hover:scale-[1.02]">
            <div className="text-center mb-3">
              <div className="text-lg font-bold text-white mb-1">{currentSong.deezer_title}</div>
              <div className="text-[#a53b8b] font-semibold text-base">{currentSong.deezer_artist}</div>
              {currentSong.deezer_album && (
                <div className="text-[#d9e8dd]/70 text-sm mt-1">{currentSong.deezer_album}</div>
              )}
            </div>

            {/* Enhanced Play/Pause Button */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Button
                  onClick={onPlayPause}
                  size="lg"
                  className={cn(
                    "bg-gradient-to-r from-[#a53b8b] to-[#4a4f5b] hover:from-[#4a4f5b] hover:to-[#a53b8b] text-white rounded-full w-20 h-20 p-0 transition-all duration-300 transform hover:scale-110 active:scale-95",
                    isPlaying && "animate-pulse shadow-lg shadow-[#a53b8b]/50"
                  )}
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </Button>
                {isPlaying && (
                  <div className="absolute inset-0 rounded-full border-4 border-[#4CC9F0]/30 animate-ping" />
                )}
              </div>
            </div>

            {/* Audio visualizer effect */}
            {isPlaying && (
              <div className="flex justify-center items-end gap-1 h-8 mb-2">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-t from-[#a53b8b] to-[#4CC9F0] rounded-full w-1"
                    style={{
                      height: '20px',
                      animation: `audioBar 0.5s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Year Slider Interface */}
          {!hasSubmitted && !gameEnded && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-white font-bold text-xl mb-2 flex items-center justify-center gap-2">
                  <Target className="h-5 w-5 text-[#4CC9F0]" />
                  When was this released?
                </div>
                <div className="text-[#d9e8dd] text-sm">Drag the timeline to select your guess</div>
              </div>

              {/* Enhanced Radio-style Timeline Slider */}
              <div className="relative">
                <div className="bg-gradient-to-br from-[#1A1A2E]/70 to-[#2d1b69]/30 border border-[#4a4f5b]/30 rounded-2xl p-6 transform transition-all duration-300">
                  {/* Enhanced Year Display */}
                  <div className="text-center mb-6">
                    <div className={cn(
                      "text-4xl font-bold font-mono transition-all duration-300 transform",
                      sliderAnimation ? "scale-110 text-[#4CC9F0]" : "text-[#4CC9F0]"
                    )}>
                      {selectedYear}
                    </div>
                    <div className="text-[#d9e8dd] text-sm mt-1">Selected Year</div>
                    
                    {/* Confidence indicator */}
                    <div className="mt-3">
                      <div className="text-xs text-[#d9e8dd]/70 mb-1">Confidence Level</div>
                      <div className="flex justify-center">
                        <div className="w-32 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                            style={{ width: `${Math.max(20, 100 - yearDifference * 2)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Custom Radio Scanner Style Slider */}
                  <div className="relative mb-6">
                    <div className="relative">
                      <input
                        ref={sliderRef}
                        type="range"
                        min={minYear}
                        max={maxYear}
                        value={selectedYear}
                        onChange={handleYearChange}
                        className="w-full h-4 bg-gradient-to-r from-[#a53b8b] via-[#4CC9F0] to-[#107793] rounded-lg appearance-none cursor-pointer slider-thumb transform transition-all duration-200 hover:scale-105"
                        style={{
                          background: `linear-gradient(to right, 
                            #a53b8b 0%, 
                            #4CC9F0 ${((selectedYear - minYear) / (maxYear - minYear)) * 100}%, 
                            #107793 100%)`
                        }}
                      />
                      
                      {/* Slider glow effect */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#a53b8b]/20 via-[#4CC9F0]/20 to-[#107793]/20 blur-md -z-10" />
                    </div>
                    
                    {/* Enhanced Year Markers */}
                    <div className="flex justify-between mt-3 text-xs text-[#d9e8dd]/70">
                      <span className="font-bold">{minYear}</span>
                      <span>1970</span>
                      <span>1990</span>
                      <span>2010</span>
                      <span className="font-bold">{maxYear}</span>
                    </div>
                    
                    {/* Decade indicators */}
                    <div className="flex justify-between mt-1 text-xs text-[#4CC9F0]/50">
                      {['50s', '70s', '90s', '10s', '20s'].map((decade, i) => (
                        <span key={decade} className="transform rotate-12">{decade}</span>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Accuracy Preview */}
                  {selectedYear && (
                    <div className="text-center text-sm mb-6">
                      <div className={cn(
                        "font-semibold transition-all duration-300",
                        yearDifference === 0 ? "text-green-400" : 
                        yearDifference <= 2 ? "text-yellow-400" : 
                        yearDifference <= 5 ? "text-orange-400" : "text-red-400"
                      )}>
                        {yearDifference === 0 ? 
                          "🎯 Perfect guess! Maximum points!" : 
                          `📊 ${yearDifference} year${yearDifference === 1 ? '' : 's'} difference`
                        }
                      </div>
                      <div className="text-[#d9e8dd]/60 text-xs mt-1">
                        Closer guesses earn more points
                      </div>
                    </div>
                  )}

                  {/* Enhanced Submit Button */}
                  <Button
                    onClick={handleSubmitGuess}
                    disabled={isSubmitting}
                    className={cn(
                      "w-full bg-gradient-to-r from-[#a53b8b] to-[#4a4f5b] text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden",
                      isSubmitting && "opacity-75 cursor-not-allowed"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="relative flex items-center justify-center gap-2">
                      <Target className="h-5 w-5" />
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </div>
                      ) : (
                        `🎯 Lock in ${selectedYear}`
                      )}
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Result Display */}
          {hasSubmitted && lastResult && (
            <div className={cn(
              "text-center transform transition-all duration-500",
              resultAnimation ? "scale-110" : "scale-100"
            )}>
              <div className="bg-gradient-to-br from-[#1A1A2E]/70 to-[#2d1b69]/30 border border-[#4a4f5b]/30 rounded-2xl p-6 transform transition-all duration-300 hover:scale-[1.02]">
                {/* Result header */}
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="h-6 w-6 text-[#4CC9F0]" />
                    <div className="text-lg font-bold text-white">Your Prediction</div>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#4CC9F0]">{selectedYear}</div>
                      <div className="text-xs text-[#d9e8dd]">Your Guess</div>
                    </div>
                    <div className="text-[#a53b8b] text-2xl">vs</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#a53b8b]">{currentSong.release_year}</div>
                      <div className="text-xs text-[#d9e8dd]">Actual Year</div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced accuracy and points display */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className={cn(
                      "text-3xl font-bold transition-all duration-500",
                      getAccuracyColor(lastResult.accuracy)
                    )}>
                      {lastResult.accuracy.toFixed(1)}% Accuracy
                    </div>
                    
                    {/* Accuracy bar */}
                    <div className="w-full bg-[#1a1a2e] rounded-full h-3 mt-2 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000 rounded-full",
                          lastResult.accuracy >= 95 ? "bg-gradient-to-r from-green-500 to-green-400" :
                          lastResult.accuracy >= 80 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" :
                          lastResult.accuracy >= 60 ? "bg-gradient-to-r from-orange-500 to-orange-400" :
                          "bg-gradient-to-r from-red-500 to-red-400"
                        )}
                        style={{ width: `${lastResult.accuracy}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-[#4CC9F0] text-2xl font-bold flex items-center justify-center gap-2">
                    <Star className="h-6 w-6 text-yellow-400" />
                    +{lastResult.points} Points
                  </div>
                </div>
                
                {/* Enhanced performance badge */}
                <Badge 
                  className={cn(
                    "mt-4 text-white font-bold px-4 py-2 text-sm transition-all duration-300 transform hover:scale-105",
                    lastResult.accuracy >= 95 ? "bg-gradient-to-r from-green-500 to-green-600" :
                    lastResult.accuracy >= 80 ? "bg-gradient-to-r from-yellow-500 to-yellow-600" :
                    lastResult.accuracy >= 60 ? "bg-gradient-to-r from-orange-500 to-orange-600" : 
                    "bg-gradient-to-r from-red-500 to-red-600"
                  )}
                >
                  {lastResult.accuracy >= 95 ? "🎯 Perfect Shot!" :
                   lastResult.accuracy >= 80 ? "🔥 On Fire!" :
                   lastResult.accuracy >= 60 ? "👍 Nice Guess!" : "📻 Keep Tuning!"}
                </Badge>
                
                {/* Fun fact about accuracy */}
                <div className="mt-3 text-xs text-[#d9e8dd]/70">
                  {lastResult.accuracy >= 95 ? "You're a music historian! 🎓" :
                   lastResult.accuracy >= 80 ? "Excellent musical intuition! 🎵" :
                   lastResult.accuracy >= 60 ? "Good ear for music eras! 👂" : 
                   "Every guess teaches you something new! 📚"}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced waiting indicator */}
          {hasSubmitted && !gameEnded && (
            <div className="text-center mt-6">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-[#4CC9F0] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-[#4CC9F0] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-[#4CC9F0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <div className="text-[#d9e8dd] text-sm mt-2">
                Waiting for next round...
              </div>
            </div>
          )}
        </Card>
      </div>

      <style>{`
        @keyframes audioBar {
          0% { height: 8px; }
          100% { height: 24px; }
        }
        
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(45deg, #4CC9F0, #a53b8b);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(76, 201, 240, 0.4);
          border: 2px solid white;
          transition: all 0.2s ease;
        }
        
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(76, 201, 240, 0.6);
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(45deg, #4CC9F0, #a53b8b);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(76, 201, 240, 0.4);
          border: 2px solid white;
          transition: all 0.2s ease;
        }
        
        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(76, 201, 240, 0.6);
        }
      `}</style>
    </div>
  );
}