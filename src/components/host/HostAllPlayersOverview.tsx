
import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, Crown } from 'lucide-react';
import { Player } from '@/types/game';

interface HostAllPlayersOverviewProps {
  players: Player[];
  currentTurnPlayer: Player;
}

export function HostAllPlayersOverview({ players, currentTurnPlayer }: HostAllPlayersOverviewProps) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-10">
      <Card className="bg-slate-800/80 backdrop-blur-md border-slate-600/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">All Players ({players.length})</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {players.map((player) => (
            <Card 
              key={player.id}
              className={`bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-4 transition-all ${
                player.id === currentTurnPlayer?.id 
                  ? 'ring-2 ring-yellow-400 bg-yellow-400/10' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: player.color }}
                />
                <div className="flex-1">
                  <div className="text-white font-bold text-lg">{player.name}</div>
                  <div className="text-slate-300 text-sm">{player.score}/10 points</div>
                </div>
                {player.id === currentTurnPlayer?.id && (
                  <Crown className="h-4 w-4 text-yellow-400" />
                )}
              </div>
              
              <div className="flex gap-1 flex-wrap">
                {player.timeline.slice(0, 6).map((song, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold border border-white/20"
                    style={{ backgroundColor: song.cardColor || player.color }}
                  >
                    '{song.release_year.slice(-2)}
                  </div>
                ))}
                {player.timeline.length > 6 && (
                  <div className="w-8 h-8 rounded-lg bg-slate-600/80 flex items-center justify-center text-white text-xs font-bold border border-white/20">
                    +{player.timeline.length - 6}
                  </div>
                )}
                {player.timeline.length === 0 && (
                  <div className="text-xs text-slate-400">No cards yet</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
