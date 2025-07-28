import React, { useState, useEffect } from 'react';
import { Player } from '@/types/game';
import { cn } from '@/lib/utils';
import { useAnimationSystem } from '@/lib/AnimationSystem';
import { 
  Trophy, Clock, Zap, Target, TrendingUp, Award, 
  Music, Star, ThumbsUp, Brain, Heart, Crown
} from 'lucide-react';

export interface GameStats {
  playerId: string;
  playerName: string;
  totalScore: number;
  correctAnswers: number;
  totalAnswers: number;
  averageTime: number;
  bestStreak: number;
  fastestAnswer: number; // in milliseconds
  perfectDecades: string[]; // decades where all answers were correct
  genreExpertise: { [genre: string]: number }; // accuracy per genre
  timeDistribution: {
    under5s: number;
    under10s: number;
    under20s: number;
    over20s: number;
  };
  moodDistribution: {
    confident: number;
    neutral: number;
    struggling: number;
  };
}

interface PostGameStatsProps {
  players: Player[];
  gameStats: GameStats[];
  winner: Player | null;
  gameDuration: number; // in seconds
  totalSongsPlayed: number;
  className?: string;
}

export function PostGameStats({
  players,
  gameStats,
  winner,
  gameDuration,
  totalSongsPlayed,
  className = ""
}: PostGameStatsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('overview');
  const [showConfetti, setShowConfetti] = useState(false);
  const { getCSSClass } = useAnimationSystem();

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate fun statistics
  const calculateFunStats = () => {
    const sortedByAccuracy = [...gameStats].sort((a, b) => 
      (b.correctAnswers / b.totalAnswers) - (a.correctAnswers / a.totalAnswers)
    );
    
    const sortedBySpeed = [...gameStats].sort((a, b) => a.averageTime - b.averageTime);
    
    const sortedByConsistency = [...gameStats].sort((a, b) => b.bestStreak - a.bestStreak);

    return {
      mostAccurate: sortedByAccuracy[0],
      speedDemon: sortedBySpeed[0],
      mostConsistent: sortedByConsistency[0],
      slowAndSteady: sortedBySpeed[sortedBySpeed.length - 1],
      luckyGuesser: gameStats.find(p => 
        p.correctAnswers > 0 && p.averageTime > 15 && (p.correctAnswers / p.totalAnswers) > 0.6
      ),
      perfectionist: gameStats.find(p => p.correctAnswers === p.totalAnswers && p.totalAnswers > 5),
      researcher: gameStats.find(p => p.averageTime > 20),
      intuitive: gameStats.find(p => p.averageTime < 5 && p.correctAnswers > 3)
    };
  };

  const funStats = calculateFunStats();

  // Category components
  const categories = {
    overview: {
      title: 'Game Overview',
      icon: Trophy,
      component: (
        <div className="space-y-6">
          {/* Winner Section */}
          {winner && (
            <div className={cn(
              "bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-xl p-6 border border-yellow-400/30",
              getCSSClass('ACHIEVEMENT_UNLOCK')
            )}>
              <div className="flex items-center gap-4">
                <Crown className="w-12 h-12 text-yellow-400" />
                <div>
                  <h3 className="text-2xl font-bold text-yellow-400">Victory!</h3>
                  <p className="text-white text-lg">{winner.name} wins the game!</p>
                </div>
              </div>
            </div>
          )}

          {/* Game Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{Math.floor(gameDuration / 60)}m</div>
              <div className="text-sm text-gray-400">Game Duration</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <Music className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{totalSongsPlayed}</div>
              <div className="text-sm text-gray-400">Songs Played</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {Math.round(gameStats.reduce((acc, p) => acc + (p.correctAnswers / p.totalAnswers), 0) / gameStats.length * 100)}%
              </div>
              <div className="text-sm text-gray-400">Avg Accuracy</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {Math.round(gameStats.reduce((acc, p) => acc + p.averageTime, 0) / gameStats.length)}s
              </div>
              <div className="text-sm text-gray-400">Avg Time</div>
            </div>
          </div>

          {/* Player Rankings */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white">Final Rankings</h3>
            {gameStats
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((player, index) => (
                <div
                  key={player.playerId}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
                    index === 0 
                      ? "bg-yellow-400/10 border-yellow-400/30" 
                      : index === 1
                      ? "bg-gray-400/10 border-gray-400/30"
                      : index === 2
                      ? "bg-amber-600/10 border-amber-600/30"
                      : "bg-gray-800/50 border-gray-600"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                    index === 0 
                      ? "bg-yellow-400 text-black" 
                      : index === 1
                      ? "bg-gray-400 text-black"
                      : index === 2
                      ? "bg-amber-600 text-white"
                      : "bg-gray-600 text-white"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{player.playerName}</div>
                    <div className="text-sm text-gray-400">
                      {player.correctAnswers}/{player.totalAnswers} correct • {Math.round((player.correctAnswers / player.totalAnswers) * 100)}% accuracy
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{player.totalScore} pts</div>
                    <div className="text-sm text-gray-400">{Math.round(player.averageTime)}s avg</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )
    },

    funCategories: {
      title: 'Fun Categories',
      icon: Star,
      component: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funStats.mostAccurate && (
            <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <h4 className="font-bold text-green-400">🎯 Sharpshooter</h4>
              </div>
              <p className="text-white font-semibold">{funStats.mostAccurate.playerName}</p>
              <p className="text-sm text-gray-400">
                Most accurate player - {Math.round((funStats.mostAccurate.correctAnswers / funStats.mostAccurate.totalAnswers) * 100)}% success rate
              </p>
            </div>
          )}

          {funStats.speedDemon && (
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h4 className="font-bold text-yellow-400">⚡ Speed Demon</h4>
              </div>
              <p className="text-white font-semibold">{funStats.speedDemon.playerName}</p>
              <p className="text-sm text-gray-400">
                Fastest average response - {Math.round(funStats.speedDemon.averageTime)}s per answer
              </p>
            </div>
          )}

          {funStats.mostConsistent && (
            <div className="bg-blue-400/10 border border-blue-400/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h4 className="font-bold text-blue-400">🔥 Hot Streak</h4>
              </div>
              <p className="text-white font-semibold">{funStats.mostConsistent.playerName}</p>
              <p className="text-sm text-gray-400">
                Best winning streak - {funStats.mostConsistent.bestStreak} in a row
              </p>
            </div>
          )}

          {funStats.researcher && (
            <div className="bg-purple-400/10 border border-purple-400/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-purple-400">🧠 The Researcher</h4>
              </div>
              <p className="text-white font-semibold">{funStats.researcher.playerName}</p>
              <p className="text-sm text-gray-400">
                Most thoughtful player - {Math.round(funStats.researcher.averageTime)}s average thinking time
              </p>
            </div>
          )}

          {funStats.intuitive && (
            <div className="bg-pink-400/10 border border-pink-400/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <h4 className="font-bold text-pink-400">💫 Intuitive Genius</h4>
              </div>
              <p className="text-white font-semibold">{funStats.intuitive.playerName}</p>
              <p className="text-sm text-gray-400">
                Quick and accurate - {Math.round(funStats.intuitive.averageTime)}s average with great results
              </p>
            </div>
          )}

          {funStats.perfectionist && (
            <div className="bg-indigo-400/10 border border-indigo-400/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-indigo-400">✨ Perfectionist</h4>
              </div>
              <p className="text-white font-semibold">{funStats.perfectionist.playerName}</p>
              <p className="text-sm text-gray-400">
                Perfect game - 100% accuracy rate!
              </p>
            </div>
          )}
        </div>
      )
    },

    detailed: {
      title: 'Detailed Stats',
      icon: Award,
      component: (
        <div className="space-y-6">
          {gameStats.map((player) => (
            <div key={player.playerId} className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
              <h4 className="text-lg font-bold text-white mb-4">{player.playerName}</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{player.correctAnswers}</div>
                  <div className="text-sm text-gray-400">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{player.totalAnswers - player.correctAnswers}</div>
                  <div className="text-sm text-gray-400">Incorrect</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{player.bestStreak}</div>
                  <div className="text-sm text-gray-400">Best Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{Math.round(player.averageTime)}s</div>
                  <div className="text-sm text-gray-400">Avg Time</div>
                </div>
              </div>

              {/* Time Distribution */}
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-white mb-2">Response Time Distribution</h5>
                <div className="flex gap-2 h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-400" 
                    style={{ width: `${(player.timeDistribution.under5s / player.totalAnswers) * 100}%` }}
                    title="Under 5s"
                  />
                  <div 
                    className="bg-yellow-400" 
                    style={{ width: `${(player.timeDistribution.under10s / player.totalAnswers) * 100}%` }}
                    title="5-10s"
                  />
                  <div 
                    className="bg-orange-400" 
                    style={{ width: `${(player.timeDistribution.under20s / player.totalAnswers) * 100}%` }}
                    title="10-20s"
                  />
                  <div 
                    className="bg-red-400" 
                    style={{ width: `${(player.timeDistribution.over20s / player.totalAnswers) * 100}%` }}
                    title="Over 20s"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>&lt;5s</span>
                  <span>5-10s</span>
                  <span>10-20s</span>
                  <span>&gt;20s</span>
                </div>
              </div>

              {/* Perfect Decades */}
              {player.perfectDecades.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-white mb-2">Perfect Decades</h5>
                  <div className="flex flex-wrap gap-2">
                    {player.perfectDecades.map((decade) => (
                      <span 
                        key={decade}
                        className="px-2 py-1 bg-purple-400/20 text-purple-400 rounded-full text-xs"
                      >
                        {decade}s
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }
  };

  return (
    <div className={cn("bg-gray-900 rounded-xl p-6 border border-gray-600", className)}>
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#fbbf24', '#f59e0b', '#d97706', '#92400e'][i % 4],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">🎵 Game Complete! 🎵</h2>
        <p className="text-gray-400">Here's how everyone performed</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {Object.entries(categories).map(([key, category]) => {
          const Icon = category.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200",
                selectedCategory === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              )}
            >
              <Icon className="w-4 h-4" />
              {category.title}
            </button>
          );
        })}
      </div>

      {/* Category Content */}
      <div className={cn("transition-all duration-300", getCSSClass('CARD_STAGGER_ENTRANCE'))}>
        {categories[selectedCategory as keyof typeof categories].component}
      </div>
    </div>
  );
}