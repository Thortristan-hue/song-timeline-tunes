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
  
  for (const [key, image] of Object.entries(CASSETTE_IMAGES)) {
    if (colorLower.includes(key)) {
      return image;
    }
  }

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

  return cassetteBlue;
};

export const CassettePlayerDisplay = ({
  players,
  currentPlayerId,
  className = ''
}: {
  players: Player[];
  currentPlayerId?: string;
  className?: string;
}) => {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  return (
    <div className={`fixed bottom-4 left-0 right-0 z-20 px-4 ${className}`}>
      <div className="flex flex-wrap justify-center gap-2 max-w-6xl mx-auto">
        {players.map(player => {
          const isCurrent = player.id === currentPlayerId;
          const isExpanded = expandedPlayer === player.id;

          return (
            <div 
              key={player.id}
              className={`relative transition-all duration-200 ${isCurrent ? 'z-10' : 'z-0'}`}
            >
              <div
                className={`relative cursor-pointer ${isCurrent ? 'scale-105' : 'scale-90 hover:scale-95'}`}
                onClick={() => setExpandedPlayer(prev => prev === player.id ? null : player.id)}
              >
                <img
                  src={getCassetteImage(player.color)}
                  alt={`${player.name}'s cassette`}
                  className="w-36 h-24 object-contain drop-shadow-md"
                />

                <div className="absolute inset-0 flex flex-col justify-end pb-4">
                  <div className="flex justify-between items-start px-2">
                    <span className="text-black font-bold text-xs max-w-[60px] truncate">
                      {player.name}
                    </span>
                    <span className="text-black font-bold text-xs bg-white/80 rounded px-0.5">
                      {player.timeline.length}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-1.5 left-3 right-3 h-1 bg-black/20 rounded-full">
                  <div
                    className="h-full bg-black/70 rounded-full transition-all duration-500"
                    style={{ width: `${(player.timeline.length / 10) * 100}%` }}
                  />
                </div>

                {isCurrent && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                )}
              </div>

              {isExpanded && player.timeline.length > 0 && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 max-h-52 overflow-y-auto bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-2 z-30">
                  <div className="sticky top-0 bg-slate-800 py-1 border-b border-slate-700">
                    <h3 className="text-white text-xs font-bold text-center truncate">
                      {player.name}'s Timeline
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-700">
                    {player.timeline.map((song, index) => (
                      <div key={`${player.id}-${index}`} className="py-1 px-1">
                        <div className="flex items-start gap-1">
                          <span className="text-xs text-slate-400 font-mono w-4 flex-shrink-0">
                            {index + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">
                              {song.deezer_title}
                            </p>
                            <p className="text-slate-400 text-xxs truncate">
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
