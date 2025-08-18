import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { Crown, Music } from "lucide-react";

interface VictoryScreenProps {
  winner: Player;
  onRestart: () => void;
}

export function VictoryScreen({ winner, onRestart }: VictoryScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <Crown className="h-16 w-16 text-yellow-500 mb-4" />
      <h1 className="text-4xl font-bold mb-4">
        {winner.name} Wins!
      </h1>
      <p className="text-lg text-gray-400 mb-8">
        Congratulations on your victory!
      </p>
      <Button onClick={onRestart}>
        <Music className="mr-2" />
        Play Again
      </Button>
    </div>
  );
}
