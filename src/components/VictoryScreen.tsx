
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Star, Crown, RotateCcw, Home } from 'lucide-react';
import { Player } from '@/types/game';

interface VictoryScreenProps {
  winner: Player | null;
  players: Player[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function VictoryScreen({ winner, players, onPlayAgain, onBackToMenu }: VictoryScreenProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden flex items-center justify-center p-8">
      {/* Animated background elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-green-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-400/8 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}} />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Winner celebration */}
        <div className="mb-12">
          <div className="text-8xl mb-6 animate-bounce">🏆</div>
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-4">
            VICTORY!
          </h1>
          {winner && (
            <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-lg rounded-3xl p-8 border border-yellow-400/30">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div 
                  className="w-8 h-8 rounded-full border-4 border-white shadow-lg" 
                  style={{ backgroundColor: winner.color }}
                />
                <div className="text-4xl font-black text-white">
                  {winner.name}
                </div>
                <Crown className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="text-2xl text-yellow-200 mb-2">
                Completed their timeline with {winner.score} songs!
              </div>
              <div className="text-lg text-yellow-300">
                Master of Musical Chronology 🎵
              </div>
            </div>
          )}
        </div>

        {/* Final scores */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center justify-center gap-3">
            <Star className="h-8 w-8 text-yellow-400" />
            Final Scores
            <Star className="h-8 w-8 text-yellow-400" />
          </h2>
          
          <div className="grid gap-4 max-w-2xl mx-auto">
            {sortedPlayers.map((player, index) => (
              <Card 
                key={player.id}
                className={`bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-6 transition-all ${
                  index === 0 ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-black text-slate-400">
                      #{index + 1}
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white"
                      style={{ backgroundColor: player.color }}
                    />
                    <div className="text-xl font-bold text-white">
                      {player.name}
                    </div>
                    {index === 0 && <Trophy className="h-6 w-6 text-yellow-400" />}
                  </div>
                  
                  <div className="text-2xl font-black text-white">
                    {player.score} songs
                  </div>
                </div>
                
                {/* Mini timeline preview */}
                <div className="flex gap-1 mt-4 justify-center">
                  {player.timeline.slice(0, 10).map((song, songIndex) => (
                    <div
                      key={songIndex}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold border border-white/20"
                      style={{ backgroundColor: song.cardColor || player.color }}
                      title={`${song.deezer_title} (${song.release_year})`}
                    >
                      '{song.release_year.slice(-2)}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onPlayAgain}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg border-0 h-14 text-lg font-bold"
          >
            <RotateCcw className="h-6 w-6 mr-2" />
            Play Again
          </Button>
          
          <Button
            onClick={onBackToMenu}
            size="lg"
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 shadow-lg h-14 text-lg font-bold"
          >
            <Home className="h-6 w-6 mr-2" />
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
