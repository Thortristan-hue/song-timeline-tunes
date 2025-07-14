
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, Home, Crown, Star, Building } from 'lucide-react';
import { Player } from '@/types/game';

interface VictoryScreenProps {
  winner: Player;
  players: Player[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function VictoryScreen({ winner, players, onPlayAgain, onBackToMenu }: VictoryScreenProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] relative overflow-hidden">
      {/* Urban neon background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00d4ff]/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#ff0080]/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#39ff14]/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
        
        {/* Additional urban lighting */}
        <div className="absolute top-16 right-16 w-32 h-32 bg-[#00d4ff]/8 rounded-full blur-xl" />
        <div className="absolute bottom-32 left-16 w-40 h-40 bg-[#ff0080]/8 rounded-full blur-xl" />
        <div className="absolute top-1/3 left-1/6 w-28 h-28 bg-[#39ff14]/6 rounded-full blur-lg" />
        
        {/* City lights pattern */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="absolute animate-float opacity-20"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${15 + Math.random() * 10}s linear infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              <Building className="h-3 w-3 text-[#00d4ff]" />
            </div>
          ))}
        </div>
      </div>

      {/* Urban street disclaimer */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl px-4 py-2 rounded-full border border-[#00d4ff]/40">
          <p className="text-[#d1d5db] text-sm font-medium">
            The streets have spoken • Another legend emerges • Respect earned
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10">
        {/* Urban Trophy Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff0080]/30 to-[#39ff14]/30 rounded-full blur-2xl scale-150" />
          <div className="relative w-24 h-24 bg-[#1a1a1a]/80 backdrop-blur-xl rounded-full flex items-center justify-center border-2 border-[#00d4ff]/60 shadow-lg shadow-[#00d4ff]/30">
            <Crown className="h-12 w-12 text-[#ff0080]" />
          </div>
        </div>

        {/* Urban Winner Announcement */}
        <div className="text-center mb-12">
          <div className="text-6xl font-black text-white mb-4 tracking-tight">
            STREET LEGEND!
          </div>
          <div className="text-2xl text-[#d1d5db] mb-6">
            <span className="text-[#00d4ff] font-bold">{winner.name}</span> rules the urban soundscape
          </div>
          <div className="text-lg text-[#d1d5db]/80">
            The concrete jungle has crowned its beat master! 🏙️✨
          </div>
        </div>

        {/* Winner Spotlight */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-2xl rounded-3xl p-8 mb-8 border border-[#ff0080]/40 shadow-2xl shadow-[#ff0080]/20 max-w-md w-full">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Crown className="h-8 w-8 text-[#ff0080]" />
              <div 
                className="w-8 h-8 rounded-full shadow-lg border-2 border-[#00d4ff]" 
                style={{ backgroundColor: winner.color }}
              />
              <div className="text-3xl font-bold text-white">
                {winner.name}
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#ff0080] to-[#00d4ff] text-white px-6 py-3 rounded-2xl text-2xl font-black inline-block shadow-lg">
              {winner.score}/10 Beats
            </div>
          </div>
        </div>

        {/* All Players Leaderboard */}
        <div className="bg-[#1a1a1a]/70 backdrop-blur-2xl rounded-3xl p-6 mb-8 border border-[#00d4ff]/30 shadow-xl shadow-[#00d4ff]/10 w-full max-w-2xl">
          <div className="text-white text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
            <Building className="h-6 w-6 text-[#00d4ff]" />
            Street Rankings
          </div>
          
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                  player.id === winner.id
                    ? 'bg-gradient-to-r from-[#ff0080]/20 to-[#00d4ff]/20 border border-[#ff0080]/40'
                    : 'bg-[#2a2a2a]/40 border border-[#00d4ff]/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold w-8 ${
                    index === 0 ? 'text-[#ff0080]' : 
                    index === 1 ? 'text-[#00d4ff]' : 
                    index === 2 ? 'text-[#39ff14]' : 'text-[#d1d5db]'
                  }`}>
                    #{index + 1}
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full shadow-sm border border-[#00d4ff]/40" 
                    style={{ backgroundColor: player.color }}
                  />
                  <div className="text-xl font-semibold text-white">
                    {player.name}
                  </div>
                  {player.id === winner.id && (
                    <Crown className="h-5 w-5 text-[#ff0080]" />
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {player.score}/10
                  </div>
                  <div className="text-[#d1d5db] text-xs">
                    {index === 0 ? 'Legend' : 
                     index === 1 ? 'Scholar' : 
                     index === 2 ? 'Seeker' : 'Regular'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-6 flex-wrap justify-center">
          <Button
            onClick={onPlayAgain}
            className="bg-gradient-to-r from-[#00d4ff] to-[#1a1a1a] hover:from-[#00d4ff]/80 hover:to-[#1a1a1a] backdrop-blur-xl rounded-2xl px-8 py-4 text-white font-semibold text-lg border border-[#00d4ff]/40 shadow-lg shadow-[#00d4ff]/20 transition-all hover:scale-105"
          >
            <RefreshCw className="h-6 w-6 mr-3" />
            Run It Back
          </Button>
          
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="bg-gradient-to-r from-[#ff0080] to-[#2a2a2a] hover:from-[#ff0080]/80 hover:to-[#2a2a2a] backdrop-blur-xl rounded-2xl px-8 py-4 text-white font-semibold text-lg border border-[#ff0080]/40 shadow-lg shadow-[#ff0080]/20 transition-all hover:scale-105"
          >
            <Home className="h-6 w-6 mr-3" />
            Back to Streets
          </Button>
        </div>

        {/* Urban Thank You Message */}
        <div className="mt-12 text-center">
          <div className="text-[#d1d5db] text-lg font-semibold">
            Thanks for bringing the heat to Urban Beats! 🔥
          </div>
          <div className="text-[#d1d5db]/70 text-sm mt-2">
            The streets remember every beat you discovered tonight
          </div>
        </div>
      </div>
    </div>
  );
}
