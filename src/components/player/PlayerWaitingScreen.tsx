
import React from 'react';
import { Music } from 'lucide-react';
import { Player } from '@/types/game';

interface PlayerWaitingScreenProps {
  currentTurnPlayer: Player;
}

export function PlayerWaitingScreen({ currentTurnPlayer }: PlayerWaitingScreenProps) {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
      <div className="text-center space-y-4">
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 border border-slate-600/50">
          <Music className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">
            {currentTurnPlayer?.name} is playing
          </div>
          <div className="text-slate-300">
            Wait for your turn to place cards
          </div>
        </div>
      </div>
    </div>
  );
}
