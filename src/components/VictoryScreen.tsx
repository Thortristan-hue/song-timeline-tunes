
import React from 'react';
import { Trophy, Star, Crown, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/types/game';

interface VictoryScreenProps {
  winner: Player;
  players: Player[];
  onBackToMenu: () => void;
}

export function VictoryScreen({ winner, players, onBackToMenu }: VictoryScreenProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-yellow-900/90 via-orange-900/90 to-red-900/90 backdrop-blur-lg flex flex-col items-center justify-center z-50 p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          >
            <Sparkles className="h-6 w-6 text-yellow-300" />
          </div>
        ))}
        
        {/* Confetti effect */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`confetti-${i}`}
            className="absolute w-3 h-3 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#98D8C8'][Math.floor(Math.random() * 5)],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="text-center max-w-4xl mx-auto relative z-10">
        {/* Winner Announcement */}
        <div className="mb-12">
          <div className="relative inline-block mb-8">
            <div className="absolute -inset-8 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 rounded-full blur-2xl animate-pulse"></div>
            <Trophy className="h-32 w-32 text-yellow-400 relative z-10 animate-bounce" />
            <Crown className="absolute -top-4 left-1/2 transform -translate-x-1/2 h-16 w-16 text-yellow-300 animate-pulse" />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent animate-fade-in">
            Victory!
          </h1>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-2xl"
                style={{ backgroundColor: winner.color }}
              >
                {winner.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <h2 className="text-4xl font-bold text-white mb-2">
                  {winner.name}
                </h2>
                <p className="text-2xl text-yellow-300 font-semibold">
                  Timeline Master! 🎵
                </p>
              </div>
            </div>
            
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400 text-xl px-6 py-3 font-bold">
              <Star className="h-5 w-5 mr-2" />
              {winner.score} points
            </Badge>
          </div>
        </div>

        {/* Leaderboard */}
        <Card className="bg-black/30 border-yellow-400/30 p-8 mb-12 backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-white mb-8 flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-400" />
            Final Leaderboard
          </h3>
          
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => {
              const isWinner = index === 0;
              const medalEmojis = ['🥇', '🥈', '🥉'];
              const medal = medalEmojis[index] || '🏅';
              
              return (
                <Card 
                  key={player.id}
                  className={`p-6 transition-all duration-300 ${
                    isWinner 
                      ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-yellow-400/50 shadow-2xl scale-105' 
                      : 'bg-white/10 border-white/20 hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{medal}</div>
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className={`font-bold text-lg ${isWinner ? 'text-yellow-300' : 'text-white'}`}>
                          {player.name}
                        </p>
                        <p className="text-gray-300 text-sm">
                          {player.timeline.length} songs placed
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${isWinner ? 'text-yellow-300' : 'text-white'}`}>
                        {player.score}
                      </p>
                      <p className="text-gray-400 text-sm">points</p>
                    </div>
                  </div>
                  
                  {/* Player's timeline preview */}
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {player.timeline.slice(0, 10).map((song, songIndex) => (
                      <div
                        key={songIndex}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md"
                        style={{ backgroundColor: song.cardColor }}
                        title={`${song.deezer_title} (${song.release_year})`}
                      >
                        {song.release_year.slice(-2)}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="px-12 py-6 text-xl rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="h-6 w-6 mr-3" />
            Play Again
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            className="px-12 py-6 text-xl rounded-2xl bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            onClick={onBackToMenu}
          >
            Back to Menu
          </Button>
        </div>

        {/* Game stats */}
        <div className="mt-8 text-center">
          <p className="text-yellow-200/70 text-lg">
            🎵 Another epic Timeline Tunes battle complete! 🎵
          </p>
        </div>
      </div>
    </div>
  );
}

export { VictoryScreen };
