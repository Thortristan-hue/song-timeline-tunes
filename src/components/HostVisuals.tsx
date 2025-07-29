
import React, { useState, useEffect, useRef } from 'react';
import { Song, Player } from '@/types/game';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { HostCurrentPlayerTimeline } from '@/components/host/HostCurrentPlayerTimeline';
import { getDefaultCharacter, getCharacterById as getCharacterByIdUtil } from '@/constants/characters';

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

interface HostGameViewProps {
  currentTurnPlayer: Player | null;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  transitioning: boolean;
  highlightedGapIndex: number | null;
  mobileViewport: { startIndex: number; endIndex: number; totalCards: number } | null;
}

export function HostGameView({
  currentTurnPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult,
  transitioning,
  highlightedGapIndex,
  mobileViewport
}: HostGameViewProps) {
  const [recordPlayerRef, setRecordPlayerRef] = useState<HTMLDivElement | null>(null);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  
  useEffect(() => {
    setIsCardRevealed(mysteryCardRevealed);
  }, [mysteryCardRevealed]);

  const handleRecordClick = () => {
    onPlayPause();
  };

  // Get consistent cassette image for current song
  const cassetteImage = getRandomCassetteImage(currentSong?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#494252] via-[#524555] to-[#403844] relative overflow-hidden">
      {/* Top Left - RYTHMY Logo */}
      <div className="absolute top-4 left-4 z-10">
        <img 
          src="/src/assets/ass_rythmy.png" 
          alt="RYTHMY" 
          className="h-12 w-auto"
        />
      </div>

      {/* Top Right - Room Code */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <img 
            src="/src/assets/ass_roomcode.png" 
            alt="Room Code Background" 
            className="h-12 w-auto"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-wider">
              {roomCode}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Left Speaker */}
      <div className="absolute bottom-4 left-4 z-10">
        <img 
          src="/src/assets/ass_speaker.png" 
          alt="Speaker" 
          className="h-16 w-auto opacity-80"
        />
      </div>

      {/* Bottom Right Speaker */}
      <div className="absolute bottom-4 right-4 z-10">
        <img 
          src="/src/assets/ass_speaker.png" 
          alt="Speaker" 
          className="h-16 w-auto opacity-80 scale-x-[-1]"
        />
      </div>

      {/* Center Top - Control Panel with Mystery Cassette */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="relative">
          <img 
            src="/src/assets/ass_cass_bg.png" 
            alt="Control Panel Background" 
            className="h-20 w-auto scale-x-150"
          />
          
          {/* Control Buttons and Cassette Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center space-x-6">
              {/* Play/Pause Button */}
              <button
                onClick={handleRecordClick}
                className="relative group transition-transform hover:scale-110"
                disabled={!currentSong}
              >
                <img 
                  src={isPlaying ? "/src/assets/ass_pause.png" : "/src/assets/ass_play.png"}
                  alt={isPlaying ? "Pause" : "Play"}
                  className="h-8 w-8"
                />
              </button>
              
              {/* Mystery Cassette */}
              <div className="relative">
                <img 
                  src={cassetteImage}
                  alt="Mystery Cassette"
                  className={`w-12 h-8 object-contain transition-all duration-500 ${
                    cardPlacementResult?.correct === false 
                      ? 'opacity-0 scale-0 rotate-180' 
                      : 'opacity-100 scale-100'
                  } ${
                    !isCardRevealed ? 'animate-pulse' : ''
                  }`}
                />
                
                {isCardRevealed && currentSong && (
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 text-white text-xs whitespace-nowrap">
                      <div className="font-bold">{currentSong.deezer_title}</div>
                      <div className="text-white/80">{currentSong.deezer_artist}</div>
                      <div className="text-yellow-400 font-bold">{currentSong.release_year}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Stop Button */}
              <button
                onClick={() => {
                  if (isPlaying) {
                    onPlayPause(); // This will stop/pause the audio
                  }
                }}
                className="relative group transition-transform hover:scale-110"
                disabled={!isPlaying}
              >
                <img 
                  src="/src/assets/ass_stop.png"
                  alt="Stop"
                  className="h-8 w-8"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        {/* Current Turn Player Timeline */}
        {currentTurnPlayer && (
          <div className="w-full max-w-6xl mb-8">
            <HostCurrentPlayerTimeline 
              currentTurnPlayer={currentTurnPlayer}
              highlightedGapIndex={highlightedGapIndex}
              mobileViewport={mobileViewport}
            />
          </div>
        )}

        {/* Player Characters Display */}
        <div className="w-full max-w-6xl">
          <div className="flex justify-center items-end space-x-6">
            {players.map((player) => {
              const isCurrentPlayer = currentTurnPlayer?.id === player.id;
              const character = getCharacterByIdUtil(player.character || getDefaultCharacter().id);
              
              return (
                <div
                  key={player.id}
                  className={`relative transition-all duration-300 ${
                    isCurrentPlayer 
                      ? 'scale-110 z-10' 
                      : 'scale-100 opacity-75'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {/* Character Image */}
                    <div className="relative">
                      <img
                        src={character?.image || getDefaultCharacter().image}
                        alt={character?.name || getDefaultCharacter().name}
                        className="h-20 w-20 rounded-full border-4"
                        style={{ borderColor: player.color }}
                      />
                      {isCurrentPlayer && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-xs">🎵</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Player Info */}
                    <div className="text-center">
                      <div className="text-white font-semibold text-sm truncate max-w-20">
                        {player.name}
                      </div>
                      <div className="text-white/70 text-xs">
                        {player.timeline.length} cards
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
