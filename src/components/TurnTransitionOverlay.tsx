import React, { useEffect, useState } from 'react';
import { Player } from '@/types/game';

interface TurnTransitionOverlayProps {
  currentPlayer: Player;
  nextPlayer: Player;
  onTransitionComplete: () => void;
  isVisible: boolean;
}

export function TurnTransitionOverlay({
  currentPlayer,
  nextPlayer,
  onTransitionComplete,
  isVisible
}: TurnTransitionOverlayProps) {
  const [phase, setPhase] = useState<'fadeout' | 'show' | 'fadein'>('fadeout');

  useEffect(() => {
    if (!isVisible) return;

    // Transition sequence
    setPhase('fadeout');
    
    setTimeout(() => {
      setPhase('show');
    }, 300);

    setTimeout(() => {
      setPhase('fadein');
    }, 2000);

    setTimeout(() => {
      onTransitionComplete();
    }, 2800);
  }, [isVisible, onTransitionComplete]);

  if (!isVisible) return null;

  return (
    <div className={`turn-transition-overlay ${
      phase === 'fadeout' ? 'animate-turn-transition-fadeout' : 
      phase === 'fadein' ? 'animate-turn-transition-fadein' : ''
    }`}>
      <div className="text-center text-white">
        <div className="mb-8">
          <div className="text-6xl font-bold mb-4 animate-card-slide-in">
            {currentPlayer.name}'s Turn
          </div>
          <div className="text-2xl opacity-80 animate-card-slide-in stagger-1">
            Get ready to place your card!
          </div>
        </div>
        
        {/* Player character display */}
        <div className="animate-player-highlight-pulse">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <div 
              className="w-24 h-24 rounded-full border-4 border-white/40"
              style={{ backgroundColor: currentPlayer.color }}
            >
              <span className="text-white text-3xl font-bold flex items-center justify-center h-full">
                {currentPlayer.name.charAt(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="text-lg opacity-60 animate-card-slide-in stagger-2">
          Listen to the song and place it on your timeline
        </div>
      </div>
    </div>
  );
}