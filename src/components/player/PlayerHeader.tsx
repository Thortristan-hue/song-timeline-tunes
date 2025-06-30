
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { Player } from '@/types/game';

interface PlayerHeaderProps {
  currentTurnPlayer: Player;
  roomCode: string;
  isMyTurn: boolean;
}

export function PlayerHeader({ currentTurnPlayer, roomCode, isMyTurn }: PlayerHeaderProps) {
  return (
    <div className="absolute top-6 left-4 right-4 z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-600/50 shadow-lg">
          <div 
            className="w-4 h-4 rounded-full border-2 border-white shadow-lg" 
            style={{ backgroundColor: currentTurnPlayer?.color }}
          />
          <div className="text-white">
            <div className="font-bold text-lg">
              {isMyTurn ? "Your Turn" : `${currentTurnPlayer?.name}'s Turn`}
            </div>
            <div className="text-sm text-slate-300">
              {currentTurnPlayer?.score}/10 cards
            </div>
          </div>
          {isMyTurn && <Crown className="h-5 w-5 text-yellow-400" />}
        </div>

        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400 text-lg px-4 py-2 font-mono">
          {roomCode}
        </Badge>
      </div>
    </div>
  );
}
