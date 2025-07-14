
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, Home, Crown, Star } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/3 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Disclaimer */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
          <p className="text-white/70 text-sm font-medium">
            Game complete • Thanks for playing • Hope you had fun!
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10">
        {/* Trophy Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-2xl scale-150" />
          <div className="relative w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20">
            <Trophy className="h-12 w-12 text-yellow-400" />
          </div>
        </div>

        {/* Winner Announcement */}
        <div className="text-center mb-12">
          <div className="text-6xl font-bold text-white mb-4 tracking-tight">
            Game Over!
          </div>
          <div className="text-2xl text-white/80 mb-6">
            <span className="text-yellow-400">{winner.name}</span> takes the crown
          </div>
          <div className="text-lg text-white/60">
            What a great game everyone! 🎉
          </div>
        </div>

        {/* Winner Spotlight */}
        <div className="bg-white/15 backdrop-blur-2xl rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl max-w-md w-full">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Crown className="h-8 w-8 text-yellow-400" />
              <div 
                className="w-8 h-8 rounded-full shadow-lg" 
                style={{ backgroundColor: winner.color }}
              />
              <div className="text-3xl font-bold text-white">
                {winner.name}
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-6 py-3 rounded-2xl text-2xl font-black inline-block">
              {winner.score}/10 Points
            </div>
          </div>
        </div>

        {/* All Players Leaderboard */}
        <div className="bg-white/12 backdrop-blur-2xl rounded-3xl p-6 mb-8 border border-white/20 shadow-xl w-full max-w-2xl">
          <div className="text-white text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
            <Star className="h-6 w-6 text-yellow-400" />
            Final Scores
          </div>
          
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                  player.id === winner.id
                    ? 'bg-yellow-400/20 border border-yellow-400/30'
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-white/60 w-8">
                    #{index + 1}
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full shadow-sm" 
                    style={{ backgroundColor: player.color }}
                  />
                  <div className="text-xl font-semibold text-white">
                    {player.name}
                  </div>
                  {player.id === winner.id && (
                    <Crown className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                <div className="text-2xl font-bold text-white">
                  {player.score}/10
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-6 flex-wrap justify-center">
          <Button
            onClick={onPlayAgain}
            className="bg-white/15 hover:bg-white/20 backdrop-blur-xl rounded-2xl px-8 py-4 text-white font-semibold text-lg border border-white/20 shadow-lg transition-all hover:scale-105"
          >
            <RefreshCw className="h-6 w-6 mr-3" />
            Play Again
          </Button>
          
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-2xl px-8 py-4 text-white font-semibold text-lg border border-white/30 shadow-lg transition-all hover:scale-105"
          >
            <Home className="h-6 w-6 mr-3" />
            Main Menu
          </Button>
        </div>

        {/* Thank You Message */}
        <div className="mt-12 text-center">
          <div className="text-white/50 text-lg">
            Thanks for playing Timeliner!
          </div>
          <div className="text-white/30 text-sm mt-2">
            Hope you discovered some great music along the way
          </div>
        </div>
      </div>
    </div>
  );
}
