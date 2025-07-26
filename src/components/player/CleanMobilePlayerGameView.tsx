import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn, getArtistColor, truncateText } from '@/lib/utils';
import { DynamicBackground } from '@/components/DynamicBackground';
import { EnhancedMysteryCard } from '@/components/EnhancedMysteryCard';
import { EnhancedTimelineCard } from '@/components/EnhancedTimelineCard';
import { ReactionSystem, useReactions, QuickReactionBar } from '@/components/ReactionSystem';
import { PlayerStatusVisualization, usePlayerStats } from '@/components/PlayerStatusVisualization';
import { AchievementSystem, useAchievements } from '@/components/AchievementSystem';

interface CleanMobilePlayerGameViewProps {
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
  refreshCurrentPlayerTimeline?: () => void;
}

export default function CleanMobilePlayerGameView({
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
  refreshCurrentPlayerTimeline
}: CleanMobilePlayerGameViewProps) {
  // Essential state only
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedGap, setHighlightedGap] = useState<number | null>(null);
  
  // Debug menu state (Rythmy debug menu)
  const [debugClickCount, setDebugClickCount] = useState(0);
  const [showDebugMenu, setShowDebugMenu] = useState(false);

  // Enhanced systems
  const { reactions, sendReaction } = useReactions(roomCode, currentPlayer.id, currentPlayer.name);
  const { stats, recordAnswer } = usePlayerStats(currentPlayer.id);
  const { unlockAchievement, updateProgress } = useAchievements(currentPlayer.id);

  // Process timeline data
  const timelineData = useMemo(() => {
    const timeline = currentPlayer?.timeline || [];
    return Array.isArray(timeline) ? timeline : [];
  }, [currentPlayer?.timeline]);

  // Handle card placement
  const handleCardPlacement = async () => {
    if (!currentSong || isSubmitting) return;
    
    setIsSubmitting(true);
    const startTime = Date.now();
    
    try {
      const result = await onPlaceCard(currentSong, selectedPosition);
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      
      // Record stats
      recordAnswer(result.success, timeTaken);
      
      // Trigger achievements
      if (result.success) {
        if (timeTaken < 5000) {
          unlockAchievement('speed_demon');
        }
        
        // Check for decade-specific achievements
        const decade = Math.floor(parseInt(currentSong.release_year) / 10) * 10;
        if (decade === 1980) {
          updateProgress('80s_expert', stats.correctAnswers + 1);
        }
        
        // Check for streaks
        if (stats.currentStreak >= 2) {
          updateProgress('hot_streak', stats.currentStreak + 1);
        }
      }
      
    } catch (error) {
      console.error('Card placement failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug menu toggle (Easter egg)
  const handlePlayerNameClick = () => {
    setDebugClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setShowDebugMenu(true);
        return 0;
      }
      return newCount;
    });
    
    // Reset count after 3 seconds
    setTimeout(() => setDebugClickCount(0), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col relative overflow-hidden">
      {/* Enhanced Dynamic Background */}
      <DynamicBackground 
        currentSong={currentSong} 
        isPlaying={isPlaying}
        audioIntensity={isPlaying ? 0.7 : 0.3}
        parallaxEnabled={true}
      />

      {/* Reaction System Overlay */}
      <ReactionSystem 
        reactions={reactions}
        onSendReaction={sendReaction}
        showReactionPicker={!gameEnded}
        className="absolute inset-0 z-10"
      />

      {/* Header with Player Name (clickable for debug) */}
      <div className="p-4 flex items-center justify-between relative z-20">
        <div 
          onClick={handlePlayerNameClick}
          className="text-white font-semibold text-lg cursor-pointer select-none"
        >
          {currentPlayer.name}
        </div>
        <div className="text-white/70 text-sm">
          Room: {roomCode}
        </div>
      </div>

      {/* Mystery Card Section */}
      {isMyTurn && !gameEnded && (
        <div className="flex-shrink-0 flex items-center justify-center py-6 relative z-20">
          <EnhancedMysteryCard
            song={currentSong}
            isRevealed={mysteryCardRevealed}
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            audioIntensity={isPlaying ? 0.8 : 0.3}
            className="transform scale-75 sm:scale-100"
          />
        </div>
      )}

      {/* Timeline Section */}
      <div className="flex-1 p-4 relative z-20">
        <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/20 h-full">
          {/* Timeline Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">Your Timeline</h2>
            {refreshCurrentPlayerTimeline && (
              <Button
                onClick={refreshCurrentPlayerTimeline}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Timeline Cards with Enhanced Design */}
          {timelineData.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {timelineData.map((song, index) => (
                <EnhancedTimelineCard
                  key={`${song.id}-${index}`}
                  song={song}
                  index={index}
                  isHighlighted={highlightedGap === index}
                  isSelected={selectedPosition === index}
                  onHover={setHighlightedGap}
                  onClick={setSelectedPosition}
                  showShimmer={isMyTurn}
                  className="flex-shrink-0"
                />
              ))}
              
              {/* Add position for placement */}
              <div
                className={cn(
                  "w-20 h-28 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-green-400",
                  selectedPosition === timelineData.length && "border-green-400 bg-green-400/10"
                )}
                onClick={() => setSelectedPosition(timelineData.length)}
              >
                <div className="text-white/50 text-2xl">+</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-white/50">
              No songs in timeline yet
            </div>
          )}
        </div>
      </div>

      {/* Navigation & Placement Controls */}
      {isMyTurn && !gameEnded && (
        <div className="p-4 space-y-4 relative z-20">
          {/* Quick Reactions */}
          <QuickReactionBar onReaction={sendReaction} className="mx-auto w-fit" />
          
          {/* Position Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => setSelectedPosition(Math.max(0, selectedPosition - 1))}
              disabled={selectedPosition <= 0}
              variant="ghost"
              size="sm"
              className="text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="text-white font-medium">
              Position {selectedPosition + 1}
            </div>
            
            <Button
              onClick={() => setSelectedPosition(Math.min(timelineData.length, selectedPosition + 1))}
              disabled={selectedPosition >= timelineData.length}
              variant="ghost"
              size="sm"
              className="text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Place Card Button */}
          <Button
            onClick={handleCardPlacement}
            disabled={!currentSong || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Place Card
              </div>
            )}
          </Button>
        </div>
      )}

      {/* Waiting State */}
      {!isMyTurn && !gameEnded && (
        <div className="flex-1 flex items-center justify-center relative z-20">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
              <Music className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="text-white text-xl font-semibold">
              {currentTurnPlayer?.name} is playing
            </div>
            <div className="text-white/70">
              Wait for your turn
            </div>
          </div>
        </div>
      )}

      {/* Debug Menu (Rythmy Debug Menu) */}
      {showDebugMenu && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-600 max-w-sm w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-4">🎵 Rythmy Debug Menu</h3>
            <div className="space-y-2 text-sm">
              <div className="text-gray-300">Player ID: {currentPlayer.id}</div>
              <div className="text-gray-300">Room: {roomCode}</div>
              <div className="text-gray-300">Timeline Cards: {timelineData.length}</div>
              <div className="text-gray-300">Is My Turn: {isMyTurn ? 'Yes' : 'No'}</div>
              <div className="text-gray-300">Current Song: {currentSong?.deezer_title || 'None'}</div>
            </div>
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => console.log('Current State:', { currentPlayer, timelineData, isMyTurn })}
                className="w-full text-sm"
                variant="secondary"
              >
                Log State
              </Button>
              <Button
                onClick={() => {
                  sendReaction('🐛');
                  unlockAchievement('speed_demon');
                }}
                className="w-full text-sm"
                variant="secondary"
              >
                Test Features
              </Button>
            </div>
            <Button
              onClick={() => setShowDebugMenu(false)}
              className="w-full mt-4"
              variant="outline"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Player Status (for development - can be hidden in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 max-w-xs z-30">
          <PlayerStatusVisualization
            player={currentPlayer}
            stats={stats}
            isCurrentPlayer={isMyTurn}
            showDetailed={false}
          />
        </div>
      )}
    </div>
  );
}