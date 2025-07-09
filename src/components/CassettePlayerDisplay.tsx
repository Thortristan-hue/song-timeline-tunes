import React, { useState } from 'react';
import { Player } from '@/types/game';

// Import cassette images
import cassetteBlue from '@/assets/cassette-blue.png';
import cassetteGreen from '@/assets/cassette-green.png';
import cassetteLightBlue from '@/assets/cassette-lightblue.png';
import cassetteOrange from '@/assets/cassette-orange.png';
import cassettePink from '@/assets/cassette-pink.png';
import cassettePurple from '@/assets/cassette-purple.png';
import cassetteRed from '@/assets/cassetee-red.png';
import cassetteYellow from '@/assets/cassette-yellow.png';

interface CassettePlayerDisplayProps {
  players: Player[];
  currentPlayerId?: string;
  className?: string;
}

const CASSETTE_IMAGES: Record<string, string> = {
  blue: cassetteBlue,
  green: cassetteGreen,
  lightblue: cassetteLightBlue,
  cyan: cassetteLightBlue,
  orange: cassetteOrange,
  pink: cassettePink,
  magenta: cassettePink,
  purple: cassettePurple,
  violet: cassettePurple,
  red: cassetteRed,
  yellow: cassetteYellow,
};

const getCassetteImage = (playerColor: string): string => {
  const colorLower = playerColor.toLowerCase();
  
  // Direct matches
  for (const [key, image] of Object.entries(CASSETTE_IMAGES)) {
    if (colorLower.includes(key)) {
      return image;
    }
  }

  // Hex color fallback
  if (playerColor.startsWith('#')) {
    const hex = playerColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    if (r > g && r > b) return cassetteRed;
    if (g > r && g > b) return cassetteGreen;
    if (b > r && b > g) return cassetteBlue;
    if (r > 200 && g > 200) return cassetteYellow;
    if (r > 150 && b > 150) return cassettePink;
    if (g > 150 && b > 150) return cassettePurple;
  }

  return cassetteBlue; // Default fallback
};

export const CassettePlayerDisplay: React.FC<CassettePlayerDisplayProps> = ({
  players,
  currentPlayerId,
  className = '',
}) => {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const togglePlayerExpansion = (playerId: string) => {
    setExpandedPlayer(prev => prev === playerId ? null : playerId);
  };

  return (
    <div className={`fixed bottom-4 left-0 right-0 z-20 px-4 ${className}`}>
      <div className="flex flex-wrap justify-center gap-4 max-w-6xl mx-auto">
        {players.map(player => {
          const isCurrent = player.id === currentPlayerId;
          const isExpanded = expandedPlayer === player.id;
          const hasCards = player.timeline.length > 0;

          return (
            <div 
              key={player.id}
              className={`relative transition-all duration-200 ${isCurrent ? 'z-10' : 'z-0'}`}
            >
              {/* Cassette Container - 1.5x larger */}
              <div
                className={`relative cursor-pointer ${isCurrent ? 'scale-125' : 'scale-100 hover:scale-125'}`}
                onClick={() => togglePlayerExpansion(player.id)}
              >
                {/* Cassette Image - 1.5x larger */}
                <img
                  src={getCassetteImage(player.color)}
                  alt={`${player.name}'s cassette`}
                  className="w-48 h-30 object-contain drop-shadow-md"
                />

                {/* Player Info Overlay */}
                <div className="absolute inset-0 p-2 flex flex-col">
                  {/* Player Name */}
                  <div className="flex justify-between items-start">
                    <span className="text-black font-bold text-sm max-w-[90px] truncate">
                      {player.name}
                    </span>
                    <span className="text-black font-bold text-sm bg-white/80 rounded px-1">
                      {player.timeline.length}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-2 left-4 right-4 h-1.5 bg-black/20 rounded-full">
                    <div
                      className="h-full bg-black/70 rounded-full transition-all duration-500"
                      style={{ width: `${(player.timeline.length / 10) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Current Player Indicator - Larger */}
                {isCurrent && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* Expanded Card List - Larger */}
              {isExpanded && hasCards && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 max-h-72 overflow-y-auto bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-3 z-30">
                  <div className="sticky top-0 bg-slate-800 py-2 border-b border-slate-700">
                    <h3 className="text-white text-sm font-bold text-center truncate">
                      {player.name}'s Timeline
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-700">
                    {player.timeline.map((song, index) => (
                      <div key={`${player.id}-${index}`} className="py-2 px-2">
                        <div className="flex items-start gap-2">
                          <span className="text-sm text-slate-400 font-mono w-6 flex-shrink-0">
                            {index + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {song.deezer_title}
                            </p>
                            <p className="text-slate-400 text-xs truncate">
                              {song.deezer_artist} · {song.release_year}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
