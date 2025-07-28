import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Star, Target, Music, Clock, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnimationSystem } from '@/lib/AnimationSystem';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'accuracy' | 'speed' | 'streak' | 'decade' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: Date;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'perfect_decade',
    title: 'Perfect Decade',
    description: 'Get 5 songs correct from the same decade',
    icon: Trophy,
    category: 'accuracy',
    rarity: 'rare',
    unlocked: false,
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Place a card in under 5 seconds',
    icon: Zap,
    category: 'speed',
    rarity: 'common',
    unlocked: false
  },
  {
    id: 'hot_streak',
    title: 'Hot Streak',
    description: 'Get 3 songs correct in a row',
    icon: Star,
    category: 'streak',
    rarity: 'common',
    unlocked: false,
    progress: 0,
    maxProgress: 3
  },
  {
    id: '80s_expert',
    title: '80s Expert',
    description: 'Correctly place 10 songs from the 1980s',
    icon: Music,
    category: 'decade',
    rarity: 'epic',
    unlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Complete a game without any mistakes',
    icon: Target,
    category: 'accuracy',
    rarity: 'legendary',
    unlocked: false
  },
  {
    id: 'time_master',
    title: 'Time Master',
    description: 'Complete a game in under 5 minutes',
    icon: Clock,
    category: 'speed',
    rarity: 'rare',
    unlocked: false
  },
  {
    id: 'music_historian',
    title: 'Music Historian',
    description: 'Correctly place songs from 5 different decades',
    icon: Award,
    category: 'special',
    rarity: 'epic',
    unlocked: false,
    progress: 0,
    maxProgress: 5
  }
];

interface AchievementSystemProps {
  className?: string;
  playerId?: string;
}

export function AchievementSystem({ className = "", playerId }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const { getCSSClass } = useAnimationSystem();

  // Load achievements from localStorage
  useEffect(() => {
    if (playerId) {
      const saved = localStorage.getItem(`achievements_${playerId}`);
      if (saved) {
        try {
          const savedAchievements = JSON.parse(saved);
          setAchievements(prev => prev.map(achievement => {
            const savedAchievement = savedAchievements.find((s: Achievement) => s.id === achievement.id);
            return savedAchievement ? { ...achievement, ...savedAchievement } : achievement;
          }));
        } catch (error) {
          console.error('Failed to load achievements:', error);
        }
      }
    }
  }, [playerId]);

  // Save achievements to localStorage
  const saveAchievements = (newAchievements: Achievement[]) => {
    if (playerId) {
      localStorage.setItem(`achievements_${playerId}`, JSON.stringify(newAchievements));
    }
  };

  // Check for achievement unlock
  const checkAchievement = (achievementId: string, progress?: number) => {
    setAchievements(prev => {
      const newAchievements = prev.map(achievement => {
        if (achievement.id === achievementId && !achievement.unlocked) {
          const newAchievement = { ...achievement };
          
          if (progress !== undefined && achievement.maxProgress) {
            newAchievement.progress = Math.min(progress, achievement.maxProgress);
            if (newAchievement.progress >= achievement.maxProgress) {
              newAchievement.unlocked = true;
              newAchievement.unlockedAt = new Date();
              triggerUnlockNotification(newAchievement);
            }
          } else {
            newAchievement.unlocked = true;
            newAchievement.unlockedAt = new Date();
            triggerUnlockNotification(newAchievement);
          }
        }
        return achievement.id === achievementId ? achievement : achievement;
      });
      
      saveAchievements(newAchievements);
      return newAchievements;
    });
  };

  // Trigger unlock notification
  const triggerUnlockNotification = (achievement: Achievement) => {
    setRecentUnlock(achievement);
    setShowNotification(true);
    
    setTimeout(() => {
      setShowNotification(false);
      setTimeout(() => setRecentUnlock(null), 500);
    }, 3000);
  };

  // Get rarity color
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 bg-gray-800/50';
      case 'rare': return 'text-blue-400 bg-blue-800/50';
      case 'epic': return 'text-purple-400 bg-purple-800/50';
      case 'legendary': return 'text-yellow-400 bg-yellow-800/50';
      default: return 'text-gray-400 bg-gray-800/50';
    }
  };

  // Get category icon color
  const getCategoryColor = (category: Achievement['category']) => {
    switch (category) {
      case 'accuracy': return 'text-green-400';
      case 'speed': return 'text-yellow-400';
      case 'streak': return 'text-orange-400';
      case 'decade': return 'text-purple-400';
      case 'special': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={cn("achievement-system", className)}>
      {/* Achievement Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          const isUnlocked = achievement.unlocked;
          const progress = achievement.progress || 0;
          const maxProgress = achievement.maxProgress || 1;
          const progressPercent = (progress / maxProgress) * 100;
          
          return (
            <div
              key={achievement.id}
              className={cn(
                "relative p-4 rounded-lg border transition-all duration-300 hover:scale-105",
                isUnlocked 
                  ? `${getRarityColor(achievement.rarity)} border-current` 
                  : "bg-gray-900/50 border-gray-700 text-gray-500",
                isUnlocked && getCSSClass('ACHIEVEMENT_UNLOCK')
              )}
            >
              {/* Achievement Icon */}
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full mb-3 mx-auto",
                isUnlocked 
                  ? getCategoryColor(achievement.category)
                  : "text-gray-600",
                isUnlocked ? "bg-current/20" : "bg-gray-800"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              
              {/* Achievement Info */}
              <div className="text-center">
                <h3 className="font-bold text-sm mb-1">{achievement.title}</h3>
                <p className="text-xs opacity-80 mb-2">{achievement.description}</p>
                
                {/* Progress Bar (if applicable) */}
                {achievement.maxProgress && achievement.maxProgress > 1 && (
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        isUnlocked ? "bg-current" : "bg-gray-600"
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
                
                {/* Rarity Badge */}
                <div className={cn(
                  "inline-block px-2 py-1 rounded-full text-xs font-bold capitalize",
                  getRarityColor(achievement.rarity)
                )}>
                  {achievement.rarity}
                </div>
              </div>
              
              {/* Unlock Glow Effect */}
              {isUnlocked && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Unlock Notification */}
      {recentUnlock && (
        <div className={cn(
          "fixed top-4 right-4 z-50 bg-black/90 backdrop-blur-md border border-yellow-400/50 rounded-lg p-4 transition-all duration-500",
          showNotification ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
          getCSSClass('ACHIEVEMENT_UNLOCK')
        )}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <div className="text-yellow-400 font-bold text-sm">Achievement Unlocked!</div>
              <div className="text-white font-semibold">{recentUnlock.title}</div>
              <div className="text-gray-300 text-xs">{recentUnlock.description}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to use the achievement system
export const useAchievements = (playerId?: string) => {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);

  const checkAchievement = (achievementId: string, progress?: number) => {
    // This would integrate with the AchievementSystem component
    // For now, we'll just trigger a custom event
    window.dispatchEvent(new CustomEvent('achievement-check', {
      detail: { achievementId, progress }
    }));
  };

  const unlockAchievement = (achievementId: string) => {
    checkAchievement(achievementId);
  };

  const updateProgress = (achievementId: string, progress: number) => {
    checkAchievement(achievementId, progress);
  };

  const getUnlockedCount = () => {
    return achievements.filter(a => a.unlocked).length;
  };

  const getTotalCount = () => {
    return achievements.length;
  };

  return {
    achievements,
    unlockAchievement,
    updateProgress,
    getUnlockedCount,
    getTotalCount,
  };
};