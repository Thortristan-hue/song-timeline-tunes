import React from 'react';
import { Player } from '@/types/game';
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
}

// Map player colors to cassette images
const getCassetteImage = (playerColor: string): string => {
  const colorLower = playerColor.toLowerCase();
  
  if (colorLower.includes('blue') && !colorLower.includes('light')) return cassetteBlue;
  if (colorLower.includes('green')) return cassetteGreen;
  if (colorLower.includes('cyan') || colorLower.includes('light')) return cassetteLightBlue;
  if (colorLower.includes('orange')) return cassetteOrange;
  if (colorLower.includes('pink') || colorLower.includes('magenta')) return cassettePink;
  if (colorLower.includes('purple') || colorLower.includes('violet')) return cassettePurple;
  if (colorLower.includes('red')) return cassetteRed;
  if (colorLower.includes('yellow')) return cassetteYellow;
  
  // Default mapping based on hex color ranges
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
  
  return cassetteBlue; // Default fallback
};

export function CassettePlayerDisplay({ players, currentPlayerId }: CassettePlayerDisplayProps) {
  return (
    <div className="absolute bottom-6 left-6 right-6 z-10">
      <div className="flex flex-wrap gap-4 justify-center">
        {players.map((player) => (
          <div 
            key={player.id}
            className={`relative transition-all ${
              player.id === currentPlayerId 
                ? 'scale-110 ring-4 ring-white/50' 
                : ''
            }`}
          >
            {/* Cassette Image */}
            <img 
              src={getCassetteImage(player.color)}
              alt={`${player.name}'s cassette`}
              className="w-32 h-20 object-contain"
            />
            
            {/* Player Name - positioned at x100px, y250px of original cassette (scaled down) */}
            <div 
              className="absolute text-black font-bold text-xs whitespace-nowrap"
              style={{ 
                left: '15px', // Adjusted for better visibility on cassette
                top: '12px'   // Adjusted for better positioning
              }}
            >
              {player.name}
            </div>
            
            {/* Card Count - positioned at x675px, y250px of original cassette (scaled down) */}
            <div 
              className="absolute text-black font-bold text-xs"
              style={{ 
                right: '8px', // Adjusted for better positioning
                top: '12px'   // Adjusted for better positioning
              }}
            >
              {player.timeline.length}/10
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}