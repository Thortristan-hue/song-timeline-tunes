import React from 'react';
import { Song } from '@/types/game';

// Import cassette images
import cassetteBlue from '@/assets/cassette-blue.png';
import cassetteGreen from '@/assets/cassette-green.png';
import cassetteLightBlue from '@/assets/cassette-lightblue.png';
import cassetteOrange from '@/assets/cassette-orange.png';
import cassettePink from '@/assets/cassette-pink.png';
import cassettePurple from '@/assets/cassette-purple.png';
import cassetteRed from '@/assets/cassetee-red.png';
import cassetteYellow from '@/assets/cassette-yellow.png';

const CASSETTE_IMAGES = [
  cassetteBlue,
  cassetteGreen,
  cassetteLightBlue,
  cassetteOrange,
  cassettePink,
  cassettePurple,
  cassetteRed,
  cassetteYellow
];

// Function to get a random cassette image based on song ID for consistency
const getRandomCassetteImage = (songId?: string) => {
  if (!songId) {
    return CASSETTE_IMAGES[0]; // Default fallback
  }
  // Use song ID to consistently get the same cassette for the same song
  const hash = songId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const index = Math.abs(hash) % CASSETTE_IMAGES.length;
  return CASSETTE_IMAGES[index];
};

interface CassetteMysteryCardProps {
  song: Song | null;
  isRevealed: boolean;
  isDestroyed?: boolean;
  className?: string;
}

export function RecordMysteryCard({ 
  song, 
  isRevealed, 
  isDestroyed = false,
  className = "" 
}: CassetteMysteryCardProps) {
  // Get consistent cassette image for this song
  const cassetteImage = getRandomCassetteImage(song?.id);

  return (
    <div className={`relative ${className}`}>
      <div className="w-64 h-64 flex items-center justify-center">
        <img 
          src={cassetteImage}
          alt="Mystery Cassette"
          className={`w-48 h-32 object-contain hover:scale-105 transition-all duration-500 ${
            isDestroyed 
              ? 'opacity-0 scale-0 rotate-180' 
              : 'opacity-100 scale-100'
          } ${
            !isRevealed ? 'cassette-pulse' : 'animate-pulse'
          }`}
          style={{
            filter: !isRevealed ? 'drop-shadow(0 0 15px rgba(73, 66, 82, 0.6))' : 'none'
          }}
        />
        
        {isRevealed && song && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center animate-fade-in-up">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-xs whitespace-nowrap hover:scale-105 transition-all duration-300 border border-[#494252]/30">
              <div className="font-bold animate-shimmer">{song.deezer_title}</div>
              <div className="text-white/80">{song.deezer_artist}</div>
              <div className="text-yellow-400 font-bold animate-bounce">{song.release_year}</div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes cassette-pulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 15px rgba(73, 66, 82, 0.6));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 25px rgba(73, 66, 82, 0.8));
          }
        }
        
        .cassette-pulse {
          animation: cassette-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
