
import { Player } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { GAME_CHARACTERS } from '@/constants/characters';

interface SidePlayersStackProps {
  players: Player[];
  currentPlayerId?: string;
}

export function SidePlayersStack({ players, currentPlayerId }: SidePlayersStackProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => {
        const character = GAME_CHARACTERS.find(c => c.id === player.character);
        const isCurrentPlayer = player.id === currentPlayerId;
        
        return (
          <div
            key={player.id}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
              isCurrentPlayer 
                ? 'bg-yellow-500/20 border border-yellow-500/40' 
                : 'bg-white/5 border border-white/10'
            }`}
          >
            {character && (
              <img 
                src={character.image} 
                alt={character.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {player.name}
              </div>
              <div className="text-white/60 text-xs">
                Score: {player.score}
              </div>
            </div>
            {isCurrentPlayer && (
              <Badge variant="secondary" className="text-xs">
                Turn
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
