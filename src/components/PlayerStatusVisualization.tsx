import React, { useState, useEffect } from 'react';
import { Player } from '@/types/game';
import { cn } from '@/lib/utils';
import { useAnimationSystem } from '@/lib/AnimationSystem';
import { Smile, Meh, Frown, TrendingUp, TrendingDown, Zap, Star } from 'lucide-react';

export interface PlayerStats {
  playerId: string;
  correctAnswers: number;
  totalAnswers: number;
  currentStreak: number;
  bestStreak: number;
  averageTime: number;
  recentPerformance: boolean[]; // Last 5 answers
  mood: 'confident' | 'neutral' | 'struggling';
  streakActive: boolean;
}

interface PlayerStatusVisualizationProps {
  player: Player;
  stats: PlayerStats;
  isCurrentPlayer?: boolean;
  showDetailed?: boolean;
  className?: string;
}

export function PlayerStatusVisualization({
  player,
  stats,
  isCurrentPlayer = false,
  showDetailed = false,
  className = ""
}: PlayerStatusVisualizationProps) {
  const [showStreakEffect, setShowStreakEffect] = useState(false);
  const { getCSSClass } = useAnimationSystem();

  // Trigger streak effect when streak increases
  useEffect(() => {
    if (stats.streakActive && stats.currentStreak > 1) {
      setShowStreakEffect(true);
      const timer = setTimeout(() => setShowStreakEffect(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [stats.currentStreak, stats.streakActive]);

  // Get mood icon and color
  const getMoodDisplay = (mood: PlayerStats['mood']) => {
    switch (mood) {
      case 'confident':
        return {
          icon: Smile,
          color: 'text-green-400',
          bgColor: 'bg-green-400/20',
          description: 'Confident'
        };
      case 'struggling':
        return {
          icon: Frown,
          color: 'text-red-400',
          bgColor: 'bg-red-400/20',
          description: 'Struggling'
        };
      default:
        return {
          icon: Meh,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/20',
          description: 'Neutral'
        };
    }
  };

  // Get performance trend
  const getPerformanceTrend = () => {
    const recent = stats.recentPerformance.slice(-3);
    const correct = recent.filter(Boolean).length;
    if (correct >= 2) return { icon: TrendingUp, color: 'text-green-400' };
    if (correct <= 1) return { icon: TrendingDown, color: 'text-red-400' };
    return { icon: Meh, color: 'text-yellow-400' };
  };

  // Get accuracy percentage
  const getAccuracy = () => {
    if (stats.totalAnswers === 0) return 0;
    return Math.round((stats.correctAnswers / stats.totalAnswers) * 100);
  };

  // Get streak color based on length
  const getStreakColor = (streak: number) => {
    if (streak >= 5) return 'text-purple-400 bg-purple-400/20';
    if (streak >= 3) return 'text-yellow-400 bg-yellow-400/20';
    if (streak >= 2) return 'text-orange-400 bg-orange-400/20';
    return 'text-gray-400 bg-gray-400/20';
  };

  const moodDisplay = getMoodDisplay(stats.mood);
  const MoodIcon = moodDisplay.icon;
  const trendDisplay = getPerformanceTrend();
  const TrendIcon = trendDisplay.icon;

  return (
    <div className={cn(
      "relative p-4 rounded-lg border transition-all duration-300",
      isCurrentPlayer 
        ? "border-blue-400 bg-blue-400/10 ring-2 ring-blue-400/30" 
        : "border-gray-600 bg-gray-800/50",
      showStreakEffect && getCSSClass('STREAK_GLOW'),
      className
    )}>
      {/* Player Info Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            moodDisplay.bgColor
          )}>
            <MoodIcon className={cn("w-4 h-4", moodDisplay.color)} />
          </div>
          <div>
            <div className="font-semibold text-sm text-white">{player.name}</div>
            {showDetailed && (
              <div className="text-xs text-gray-400">{moodDisplay.description}</div>
            )}
          </div>
        </div>
        
        {/* Performance Trend */}
        <div className="flex items-center gap-1">
          <TrendIcon className={cn("w-4 h-4", trendDisplay.color)} />
          <span className="text-xs text-gray-400">{getAccuracy()}%</span>
        </div>
      </div>

      {/* Streak Display */}
      {stats.currentStreak > 1 && (
        <div className={cn(
          "mb-3 p-2 rounded-lg flex items-center gap-2",
          getStreakColor(stats.currentStreak),
          showStreakEffect && 'animate-pulse'
        )}>
          <Zap className="w-4 h-4" />
          <span className="font-bold text-sm">
            {stats.currentStreak} Streak!
          </span>
          {showStreakEffect && (
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <Star 
                  key={i} 
                  className="w-3 h-3 animate-bounce" 
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Performance Indicators */}
      <div className="flex gap-1 mb-3">
        {stats.recentPerformance.slice(-5).map((correct, index) => (
          <div
            key={index}
            className={cn(
              "w-4 h-4 rounded-full transition-all duration-300",
              correct ? "bg-green-400" : "bg-red-400",
              index === stats.recentPerformance.length - 1 && "ring-2 ring-white/30"
            )}
            title={correct ? 'Correct' : 'Incorrect'}
          />
        ))}
        
        {/* Fill empty slots */}
        {[...Array(Math.max(0, 5 - stats.recentPerformance.length))].map((_, index) => (
          <div
            key={`empty-${index}`}
            className="w-4 h-4 rounded-full bg-gray-600"
          />
        ))}
      </div>

      {/* Detailed Stats (if enabled) */}
      {showDetailed && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-700/50 rounded p-2">
            <div className="text-gray-400">Score</div>
            <div className="font-bold text-white">
              {stats.correctAnswers}/{stats.totalAnswers}
            </div>
          </div>
          
          <div className="bg-gray-700/50 rounded p-2">
            <div className="text-gray-400">Best Streak</div>
            <div className="font-bold text-yellow-400">
              {stats.bestStreak}
            </div>
          </div>
          
          {stats.averageTime > 0 && (
            <div className="bg-gray-700/50 rounded p-2 col-span-2">
              <div className="text-gray-400">Avg. Time</div>
              <div className="font-bold text-blue-400">
                {stats.averageTime.toFixed(1)}s
              </div>
            </div>
          )}
        </div>
      )}

      {/* Streak Effect Particles */}
      {showStreakEffect && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}

      {/* Current Player Indicator */}
      {isCurrentPlayer && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-pulse">
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
}

// Hook to calculate and manage player stats
export const usePlayerStats = (playerId: string) => {
  const [stats, setStats] = useState<PlayerStats>({
    playerId,
    correctAnswers: 0,
    totalAnswers: 0,
    currentStreak: 0,
    bestStreak: 0,
    averageTime: 0,
    recentPerformance: [],
    mood: 'neutral',
    streakActive: false
  });

  const recordAnswer = (correct: boolean, timeMs: number) => {
    setStats(prev => {
      const newStats = { ...prev };
      
      // Update basic stats
      newStats.totalAnswers += 1;
      if (correct) {
        newStats.correctAnswers += 1;
        newStats.currentStreak += 1;
        newStats.bestStreak = Math.max(newStats.bestStreak, newStats.currentStreak);
        newStats.streakActive = newStats.currentStreak > 1;
      } else {
        newStats.currentStreak = 0;
        newStats.streakActive = false;
      }
      
      // Update recent performance
      newStats.recentPerformance = [...prev.recentPerformance, correct].slice(-5);
      
      // Update average time
      const totalTime = prev.averageTime * (prev.totalAnswers - 1) + timeMs / 1000;
      newStats.averageTime = totalTime / newStats.totalAnswers;
      
      // Calculate mood based on recent performance
      const recentCorrect = newStats.recentPerformance.filter(Boolean).length;
      const recentTotal = newStats.recentPerformance.length;
      
      if (recentTotal >= 3) {
        const recentAccuracy = recentCorrect / recentTotal;
        if (recentAccuracy >= 0.8) {
          newStats.mood = 'confident';
        } else if (recentAccuracy <= 0.4) {
          newStats.mood = 'struggling';
        } else {
          newStats.mood = 'neutral';
        }
      }
      
      return newStats;
    });
  };

  const resetStats = () => {
    setStats({
      playerId,
      correctAnswers: 0,
      totalAnswers: 0,
      currentStreak: 0,
      bestStreak: 0,
      averageTime: 0,
      recentPerformance: [],
      mood: 'neutral',
      streakActive: false
    });
  };

  return {
    stats,
    recordAnswer,
    resetStats
  };
};