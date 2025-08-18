
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy, Star, Crown } from 'lucide-react';
import { Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface MobileGameOverScreenProps {
  winningPlayer: Player;
  allPlayers: Player[];
  onPlayAgain: () => void;
  roomCode: string;
}

export default function MobileGameOverScreen({
  winningPlayer,
  allPlayers,
  onPlayAgain,
  roomCode
}: MobileGameOverScreenProps) {
  // Sort players by timeline length for leaderboard
  const sortedPlayers = [...allPlayers].sort((a, b) => b.timeline.length - a.timeline.length);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">
      {/* Safe area container */}
      <div className="h-full flex flex-col px-4 pt-safe-top pb-safe-bottom">
        
        {/* Header */}
        <div className="flex-shrink-0 py-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-4 shadow-2xl">
            <Trophy className="w-10 h-10 text-yellow-900" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 mb-2">
            Game Over!
          </h1>
          <div className="text-lg text-white/80">
            Someone got 9 cards right!
          </div>
        </div>

        {/* Winner announcement */}
        <div className="flex-shrink-0 text-center py-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mr-4">
                <Crown className="w-8 h-8 text-yellow-900" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-white">
                  {winningPlayer.name}
                </div>
                <div className="text-yellow-400 font-semibold">
                  Winner!
                </div>
              </div>
            </div>
            <div className="text-lg text-white/90 mb-2">
              Timeline Complete: {winningPlayer.timeline.length} cards
            </div>
            <div className="text-sm text-white/70">
              Excellent music knowledge!
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="flex-1 min-h-0">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 h-full">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">
              Final Leaderboard
            </h2>
            <div className="space-y-3 overflow-y-auto max-h-full">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center p-3 rounded-xl border transition-all duration-200",
                    index === 0 
                      ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-400/30"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3",
                    index === 0 
                      ? "bg-yellow-400 text-yellow-900"
                      : index === 1
                      ? "bg-gray-300 text-gray-800"
                      : index === 2
                      ? "bg-amber-600 text-white"
                      : "bg-white/20 text-white"
                  )}>
                    {index + 1}
                  </div>
                  <div 
                    className="w-4 h-4 rounded-full mr-3" 
                    style={{ backgroundColor: player.color }}
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {player.name}
                    </div>
                    <div className="text-white/70 text-sm">
                      {player.timeline.length} cards placed
                    </div>
                  </div>
                  {index === 0 && (
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 pt-6 space-y-3">
          <Button
            onClick={onPlayAgain}
            className="w-full h-14 text-white font-semibold text-lg rounded-2xl border-0 shadow-lg transition-all duration-300 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again
          </Button>
          
          <div className="text-center text-white/60 text-sm">
            Room Code: <span className="font-mono font-semibold text-white/80">{roomCode}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 py-4 text-center">
          <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100">
            RYTHMY
          </div>
        </div>
      </div>
    </div>
  );
}
