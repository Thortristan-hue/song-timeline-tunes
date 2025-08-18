
import React, { useState } from 'react';
import { Player } from '@/types/game';
import { GAME_CHARACTERS, getCharacterById, getDefaultCharacter } from '@/constants/characters';

// Import cassette images as backup only
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

const getPlayerImage = (player: Player): { image: string; isCharacter: boolean } => {
  // Always prioritize character if available
  if (player.character) {
    const character = getCharacterById(player.character);
    if (character) {
      return { image: character.image, isCharacter: true };
    }
  }
  
  // Fallback to cassette based on color (only if no character)
  const colorLower = player.color.toLowerCase();
  
  for (const [key, image] of Object.entries(CASSETTE_IMAGES)) {
    if (colorLower.includes(key)) {
      return { image, isCharacter: false };
    }
  }

  if (player.color.startsWith('#')) {
    const hex = player.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    if (r > g && r > b) return { image: cassetteRed, isCharacter: false };
    if (g > r && g > b) return { image: cassetteGreen, isCharacter: false };
    if (b > r && b > g) return { image: cassetteBlue, isCharacter: false };
    if (r > 200 && g > 200) return { image: cassetteYellow, isCharacter: false };
    if (r > 150 && b > 150) return { image: cassettePink, isCharacter: false };
    if (g > 150 && b > 150) return { image: cassettePurple, isCharacter: false };
  }

  return { image: cassetteBlue, isCharacter: false };
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
      <div className="flex flex-wrap justify-center gap-4 max-w-6xl mx-auto">
        {players.map((player, index) => {
          const isCurrent = player.id === currentPlayerId;
          const isExpanded = expandedPlayer === player.id;
          const { image: playerImage, isCharacter } = getPlayerImage(player);

          return (
            <div 
              key={player.id}
              className={`relative transition-all duration-300 ${isCurrent ? 'z-10' : 'z-0'} stagger-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`relative cursor-pointer transition-all duration-300 ${
                  isCurrent 
                    ? 'scale-130 player-elevate' 
                    : 'scale-100 hover:scale-105 hover-lift'
                } ${isCurrent ? 'character-bounce' : ''}`}
                onClick={() => setExpandedPlayer(prev => prev === player.id ? null : player.id)}
              >
                {/* Always use character-style display now */}
                <div className="relative flex flex-col items-center">
                  {/* Player name at top */}
                  <div className="mb-1 text-center">
                    <div className={`bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 ${
                      isCurrent ? 'animate-pulse border border-[#494252]/50' : ''
                    }`}>
                      <div className="text-white font-bold text-xs truncate max-w-16">
                        {player.name}
                      </div>
                    </div>
                  </div>
                  
                  {/* Character or cassette image */}
                  <div className="relative">
                    <img
                      src={playerImage}
                      alt={`${player.name}'s ${isCharacter ? 'character' : 'cassette'}`}
                      className={`${
                        isCharacter 
                          ? 'w-16 h-20 object-contain' 
                          : 'w-20 h-16 object-contain'
                      } drop-shadow-md transition-all duration-300 ${
                        isCurrent ? 'drop-shadow-2xl' : ''
                      }`}
                      style={{
                        filter: isCurrent ? 'drop-shadow(0 0 15px rgba(73, 66, 82, 0.8))' : 'none'
                      }}
                    />
                    
                    {/* Card count badge */}
                    <div className="absolute -bottom-1 -right-1">
                      <div className={`bg-yellow-500 text-black font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center border border-white ${
                        isCurrent ? 'animate-bounce' : ''
                      }`}>
                        {player.timeline.length}
                      </div>
                    </div>
                  </div>
                </div>

                {isCurrent && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse glow-pulse"></div>
                )}
              </div>

              {/* Timeline expansion popup */}
              {isExpanded && player.timeline.length > 0 && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 max-h-52 overflow-y-auto bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-2 z-30 animate-scale-in">
                  <div className="sticky top-0 bg-slate-800 py-1 border-b border-slate-700">
                    <h3 className="text-white text-xs font-bold text-center truncate">
                      {player.name}'s Timeline
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-700">
                    {player.timeline.map((song, songIndex) => (
                      <div key={`${player.id}-${songIndex}`} className={`py-1 px-1 stagger-fade-in`} style={{ animationDelay: `${songIndex * 0.1}s` }}>
                        <div className="flex items-start gap-1">
                          <span className="text-xs text-slate-400 font-mono w-4 flex-shrink-0">
                            {songIndex + 1}.
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
      
      <style>{`
        @keyframes character-bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) scale(1.05);
          }
          40% {
            transform: translateY(-8px) scale(1.08);
          }
          60% {
            transform: translateY(-4px) scale(1.06);
          }
        }
        
        .character-bounce {
          animation: character-bounce 2s ease-in-out infinite;
        }
        
        .scale-130 {
          transform: scale(1.3);
        }
      `}</style>
    </div>
  );
};
