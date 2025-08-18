import { Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface HostAllPlayersOverviewProps {
  players: Player[];
  isDarkMode: boolean;
}

export function HostAllPlayersOverview({ players, isDarkMode }: HostAllPlayersOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {players.map((player) => (
        <div
          key={player.id}
          className={cn(
            "p-4 rounded-lg shadow-md transition-all duration-300",
            isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800",
            "hover:scale-105"
          )}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: player.color }}
            />
            <div className="text-lg font-semibold">{player.name}</div>
          </div>
          <div className="mt-2">
            <div className="text-sm">Score: {player.score}</div>
            <div className="text-xs text-gray-500">
              {player.timeline.length} cards
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
