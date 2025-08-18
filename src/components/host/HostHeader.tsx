import { GamePhase, GameMode } from '@/types/game';
import { Clock, Users, Radio } from 'lucide-react';
import { format } from 'date-fns';

interface HostHeaderProps {
  phase: GamePhase;
  gameMode: GameMode;
  createdAt: string;
  playerCount: number;
}

export function HostHeader({ phase, gameMode, createdAt, playerCount }: HostHeaderProps) {
  const formattedDate = format(new Date(createdAt), 'MMM dd, yyyy HH:mm');

  return (
    <div className="flex items-center justify-between p-4 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800 text-white">
      {/* Left: Game Phase and Mode */}
      <div>
        <div className="text-lg font-semibold">{phase}</div>
        <div className="text-sm text-gray-400">Mode: {gameMode}</div>
      </div>

      {/* Middle: Game Creation Date */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Clock className="h-4 w-4" />
        <span>Created: {formattedDate}</span>
      </div>

      {/* Right: Player Count */}
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-gray-400" />
        <span className="text-sm">Players: {playerCount}</span>
      </div>
    </div>
  );
}
