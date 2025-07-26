import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAnimationSystem } from '@/lib/AnimationSystem';

export interface Reaction {
  id: string;
  emoji: string;
  playerId: string;
  playerName: string;
  timestamp: number;
  x: number; // Position percentage
  y: number; // Position percentage
}

interface ReactionSystemProps {
  onSendReaction?: (emoji: string) => void;
  reactions?: Reaction[];
  className?: string;
  showReactionPicker?: boolean;
}

const AVAILABLE_REACTIONS = [
  '😂', '😍', '🤩', '😱', '🔥', '👏', 
  '💯', '❤️', '😭', '🤔', '😤', '🙌',
  '🎵', '🎉', '💪', '😎', '🤯', '🥳'
];

export function ReactionSystem({
  onSendReaction,
  reactions = [],
  className = "",
  showReactionPicker = false
}: ReactionSystemProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeReactions, setActiveReactions] = useState<Reaction[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getCSSClass } = useAnimationSystem();

  // Update active reactions when new reactions come in
  useEffect(() => {
    const now = Date.now();
    const freshReactions = reactions.filter(r => now - r.timestamp < 5000); // Show for 5 seconds
    setActiveReactions(freshReactions);
  }, [reactions]);

  // Clean up old reactions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveReactions(prev => prev.filter(r => now - r.timestamp < 5000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleReactionClick = (emoji: string) => {
    onSendReaction?.(emoji);
    setShowPicker(false);
  };

  const togglePicker = () => {
    setShowPicker(!showPicker);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full h-full", className)}>
      {/* Floating Reactions */}
      {activeReactions.map((reaction) => {
        const age = Date.now() - reaction.timestamp;
        const opacity = Math.max(0, 1 - age / 5000); // Fade out over 5 seconds
        const scale = 1 + (age / 5000) * 0.5; // Slightly grow as they fade
        
        return (
          <div
            key={reaction.id}
            className={cn(
              "absolute pointer-events-none z-50 transition-all duration-1000",
              getCSSClass('REACTION_POP')
            )}
            style={{
              left: `${reaction.x}%`,
              top: `${reaction.y}%`,
              opacity,
              transform: `translate(-50%, -50%) scale(${scale})`,
              animationDelay: '0s'
            }}
          >
            <div className="relative">
              {/* Reaction Emoji */}
              <div className="text-4xl mb-1 animate-bounce">
                {reaction.emoji}
              </div>
              
              {/* Player Name */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <div className="bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white border border-white/20">
                  {reaction.playerName}
                </div>
              </div>
              
              {/* Sparkle Effect */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Reaction Picker */}
      {showReactionPicker && (
        <div className="absolute bottom-4 right-4 z-40">
          {/* Reaction Button */}
          <button
            onClick={togglePicker}
            className={cn(
              "w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white text-xl transition-all duration-300 shadow-lg hover:shadow-xl",
              showPicker && "rotate-45"
            )}
            title="Send Reaction"
          >
            {showPicker ? '✕' : '😊'}
          </button>

          {/* Reaction Options */}
          {showPicker && (
            <div className="absolute bottom-16 right-0 mb-2">
              <div className={cn(
                "bg-black/90 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-2xl",
                "grid grid-cols-6 gap-2 max-w-xs",
                getCSSClass('REACTION_POP')
              )}>
                {AVAILABLE_REACTIONS.map((emoji, index) => (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className="w-10 h-10 hover:bg-white/10 rounded-lg flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110 active:scale-95"
                    style={{
                      animationDelay: `${index * 0.05}s`
                    }}
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              
              {/* Picker Arrow */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-black/90 border-r border-b border-white/20 transform rotate-45" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for managing reactions
export const useReactions = (roomId: string, playerId: string, playerName: string) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const sendReaction = (emoji: string) => {
    // Generate random position for the reaction
    const x = 20 + Math.random() * 60; // Keep reactions in center 60% of screen
    const y = 20 + Math.random() * 60;
    
    const newReaction: Reaction = {
      id: `${playerId}-${Date.now()}-${Math.random()}`,
      emoji,
      playerId,
      playerName,
      timestamp: Date.now(),
      x,
      y
    };

    // Add to local state immediately for instant feedback
    setReactions(prev => [...prev, newReaction]);

    // In a real implementation, you would send this to your backend/realtime system
    // For now, we'll simulate it with a custom event
    window.dispatchEvent(new CustomEvent('reaction-sent', {
      detail: { roomId, reaction: newReaction }
    }));
  };

  const addReaction = (reaction: Reaction) => {
    setReactions(prev => [...prev, reaction]);
  };

  // Listen for reactions from other players
  useEffect(() => {
    const handleReactionReceived = (event: CustomEvent) => {
      if (event.detail.roomId === roomId && event.detail.reaction.playerId !== playerId) {
        addReaction(event.detail.reaction);
      }
    };

    window.addEventListener('reaction-received', handleReactionReceived as EventListener);
    return () => {
      window.removeEventListener('reaction-received', handleReactionReceived as EventListener);
    };
  }, [roomId, playerId]);

  // Clean up old reactions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setReactions(prev => prev.filter(r => now - r.timestamp < 10000)); // Keep for 10 seconds
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    reactions,
    sendReaction,
    addReaction
  };
};

// Quick Reaction Bar for Mobile
interface QuickReactionBarProps {
  onReaction: (emoji: string) => void;
  className?: string;
}

export function QuickReactionBar({ onReaction, className = "" }: QuickReactionBarProps) {
  const quickReactions = ['👍', '😂', '🔥', '💯', '😱'];

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 bg-black/50 backdrop-blur-sm rounded-full border border-white/20",
      className
    )}>
      {quickReactions.map((emoji, index) => (
        <button
          key={emoji}
          onClick={() => onReaction(emoji)}
          className="w-8 h-8 hover:bg-white/10 rounded-full flex items-center justify-center text-lg transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            animationDelay: `${index * 0.1}s`
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}