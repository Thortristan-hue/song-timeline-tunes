import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';
import { Trophy, Crown, Medal, RotateCcw } from 'lucide-react';

interface MobileVictoryScreenProps {
  winner: Player;
  players: Player[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function MobileVictoryScreen({ 
  winner, 
  players, 
  onPlayAgain, 
  onBackToMenu 
}: MobileVictoryScreenProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        {/* Winner Announcement */}
        <div className="space-y-4">
          <div className="relative">
            <Crown className="h-16 w-16 text-yellow-400 mx-auto animate-bounce" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping" />
          </div>
          
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Victory!</h1>
            <p className="text-xl text-purple-200">
              <span className="font-bold" style={{ color: winner.color }}>
                {winner.name}
              </span> wins!
            </p>
          </div>
        </div>

        {/* Final Scores */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5" />
            Final Scores
          </h2>
          
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  index === 0 
                    ? 'bg-yellow-500/20 border border-yellow-500/30' 
                    : 'bg-white/10 border border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {index === 0 && <Crown className="h-4 w-4 text-yellow-400" />}
                  {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                  {index === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                  {index > 2 && <div className="w-4 h-4" />}
                  
                  <div 
                    className="w-3 h-3 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="text-white font-medium">{player.name}</span>
                </div>
                
                <div className="text-right">
                  <div className="text-white font-bold">{player.score}</div>
                  <div className="text-white/60 text-xs">{player.timeline.length} cards</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 w-full">
          <Button
            onClick={onPlayAgain}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
          
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10 font-medium py-4 rounded-xl transition-all duration-300"
          >
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
