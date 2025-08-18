import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';
import { Crown, Trophy, Medal } from 'lucide-react';

interface MobileGameOverScreenProps {
  winner: Player | null;
  currentPlayer: Player;
  onRestart: () => void;
}

export function MobileGameOverScreen({ winner, currentPlayer, onRestart }: MobileGameOverScreenProps) {
  const isWinner = winner?.id === currentPlayer.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] text-white flex flex-col items-center justify-center p-4">
      {/* Confetti effect (optional) */}
      {/* You can add a confetti library here for visual flair */}

      {/* Header */}
      <div className="text-center mb-8">
        {isWinner ? (
          <>
            <Crown className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
            <h1 className="text-3xl font-bold tracking-tight">You Won!</h1>
            <p className="text-gray-400">Congratulations, you're the music master!</p>
          </>
        ) : (
          <>
            <Medal className="mx-auto h-12 w-12 text-gray-500 mb-2" />
            <h1 className="text-3xl font-bold tracking-tight">Game Over</h1>
            <p className="text-gray-400">Better luck next time!</p>
          </>
        )}
      </div>

      {/* Winner Display */}
      {winner && (
        <div className="text-center mb-6">
          <div className="text-lg font-semibold">
            {isWinner ? "You are" : `${winner.name} is`} the winner!
          </div>
          <div className="text-sm text-gray-500">With a legendary timeline!</div>
        </div>
      )}

      {/* Scoreboard (Simplified) */}
      <div className="mb-8">
        <div className="text-center">
          <div className="text-xl font-bold">Your Score</div>
          <div className="text-2xl text-blue-400">{currentPlayer.score} Points</div>
        </div>
      </div>

      {/* Restart Button */}
      <Button onClick={onRestart} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300">
        Play Again
      </Button>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-xs text-gray-600">
          Rythmy &copy; {new Date().getFullYear()} - A Fun Music Game
        </p>
      </div>
    </div>
  );
}
