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

// Function to get a random cassette image
const getRandomCassetteImage = () => {
  const randomIndex = Math.floor(Math.random() * CASSETTE_IMAGES.length);
  return CASSETTE_IMAGES[randomIndex];
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
  // Use the same random cassette throughout the component lifecycle
  const [cassetteImage] = React.useState(() => getRandomCassetteImage());

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
            filter: !isRevealed ? 'drop-shadow(0 0 15px rgba(16, 119, 147, 0.6))' : 'none'
          }}
        />
        
        {isRevealed && song && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center animate-fade-in-up">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-xs whitespace-nowrap hover:scale-105 transition-all duration-300 border border-[#107793]/30">
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
            filter: drop-shadow(0 0 15px rgba(16, 119, 147, 0.6));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 25px rgba(16, 119, 147, 0.8));
          }
        }
        
        .cassette-pulse {
          animation: cassette-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
