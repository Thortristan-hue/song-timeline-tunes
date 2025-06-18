// src/components/VictoryScreen.tsx
import React from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';


interface VictoryScreenProps {
  winner: Player;
  players: Player[];
}

const VictoryScreen: React.FC<VictoryScreenProps> = ({ winner, players }) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center z-50 p-8">
      <div className="text-center max-w-2xl">
        <div className="relative inline-block mb-8">
          <Trophy className="h-32 w-32 text-yellow-400" />
          <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl" />
        </div>
        
        <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          We Have a Winner!
        </h1>
        
        <div className="text-3xl font-bold text-white mb-2">
          {winner.name}
        </div>
        
        <div className="text-xl text-white/80 mb-8">
          Scored {winner.score} points!
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div 
                key={player.id} 
                className={`p-4 rounded-xl ${index === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/30' : 'bg-white/5 border border-white/10'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <span className="font-bold">{player.score}</span>
                </div>
              </div>
            ))}
        </div>
        
        <Button 
          size="lg" 
          className="px-12 py-6 text-lg rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          onClick={() => window.location.reload()}
        >
          Play Again
        </Button>
      </div>
    </div>
  );
};

export default VictoryScreen;