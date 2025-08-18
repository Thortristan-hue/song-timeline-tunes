
import { Badge } from '@/components/ui/badge';
import { GameRoom } from '@/types/game';

interface HostHeaderProps {
  room: GameRoom;
  playerCount: number;
}

export function HostHeader({ room, playerCount }: HostHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <div>
        <h1 className="text-2xl font-bold">Game Host View</h1>
        <p className="text-gray-400">Room: {room.lobby_code}</p>
      </div>
      <div className="flex items-center space-x-4">
        <Badge variant="secondary">
          {playerCount} Players
        </Badge>
        <Badge variant="outline">
          {room.gamemode}
        </Badge>
      </div>
    </div>
  );
}
