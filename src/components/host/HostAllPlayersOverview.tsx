
import React from 'react';
import { Player } from '@/types/game';

interface HostAllPlayersOverviewProps {
  players: Player[];
  currentTurnPlayer: Player | null;
}

export function HostAllPlayersOverview({ players, currentTurnPlayer }: HostAllPlayersOverviewProps) {
  if (!players || players.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white/60">No players in the game</p>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <h3 className="text-white font-bold mb-4 text-center">All Players</h3>
      <div className="flex justify-center gap-4 flex-wrap">
        {players.map(player => (
          <div 
            key={player.id} 
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              currentTurnPlayer?.id === player.id 
                ? 'bg-white/20 ring-2 ring-white/40' 
                : 'bg-white/10'
            }`}
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1"
              style={{ backgroundColor: player.color }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-white text-sm font-medium">{player.name}</span>
            <span className="text-white/70 text-xs">Score: {player.score || 0}</span>
            {currentTurnPlayer?.id === player.id && (
              <div className="text-yellow-300 text-xs mt-1 font-bold">Current Turn</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
