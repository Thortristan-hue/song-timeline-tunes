
import { Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GAME_CHARACTERS } from '@/constants/characters';

interface MobileGameOverScreenProps {
  players: Player[];
  currentPlayer: Player;
  winner: Player;
  onReplayGame: () => void;
}

export function MobileGameOverScreen({
  players,
  currentPlayer,
  winner,
  onReplayGame
}: MobileGameOverScreenProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const isWinner = currentPlayer.id === winner.id;
  const winnerCharacter = GAME_CHARACTERS.find(c => c.id === winner.character);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold mb-4">
            {isWinner ? '🎉 You Won!' : 'Game Over'}
          </h1>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            {winnerCharacter && (
              <img 
                src={winnerCharacter.image} 
                alt={winnerCharacter.name}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <div className="text-xl font-semibold">{winner.name}</div>
              <div className="text-yellow-400">Winner!</div>
            </div>
          </div>
        </div>

        {/* Final Scores */}
        <Card className="bg-white/10 border-white/20 p-4">
          <h2 className="text-lg font-semibold mb-4 text-center">Final Scores</h2>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => {
              const character = GAME_CHARACTERS.find(c => c.id === player.character);
              const isCurrentPlayer = player.id === currentPlayer.id;
              
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isCurrentPlayer 
                      ? 'bg-blue-500/20 border border-blue-500/40' 
                      : 'bg-white/5'
                  }`}
                >
                  <div className="text-white/60 text-sm font-mono w-6">
                    #{index + 1}
                  </div>
                  
                  {character && (
                    <img 
                      src={character.image} 
                      alt={character.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  
                  <div className="flex-1">
                    <div className="text-white font-medium">{player.name}</div>
                    <div className="text-white/60 text-sm">
                      {character?.name || 'Default Character'}
                    </div>
                  </div>
                  
                  <Badge 
                    variant={index === 0 ? "default" : "outline"}
                    className={index === 0 ? "bg-yellow-500 text-black" : "border-white/20 text-white/60"}
                  >
                    {player.score} pts
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Action Button */}
        <Button 
          onClick={onReplayGame}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          Play Again
        </Button>
      </div>
    </div>
  );
}
