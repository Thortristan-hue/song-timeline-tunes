import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';
import { Crown, RotateCcw } from 'lucide-react';

interface HostGameOverScreenProps {
  winner: Player | null;
  onRestartGame: () => void;
}

export function HostGameOverScreen({ winner, onRestartGame }: HostGameOverScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      {winner ? (
        <>
          <Crown className="h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">
            {winner.name} wins!
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Congratulations on being the ultimate music master.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-white mb-2">
            It's a draw!
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            No clear winner this time. Everyone's a music lover!
          </p>
        </>
      )}
      <Button onClick={onRestartGame}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Play Again
      </Button>
    </div>
  );
}
