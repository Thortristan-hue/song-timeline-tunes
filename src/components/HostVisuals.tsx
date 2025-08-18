
import React, { useState, useEffect, useRef } from 'react';
import { Song, Player } from '@/types/game';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { HostCurrentPlayerTimeline } from '@/components/host/HostCurrentPlayerTimeline';
import { getDefaultCharacter, getCharacterById as getCharacterByIdUtil } from '@/constants/characters';

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

      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        {/* Top - Control Panel (moved from middle to top) */}
        <div className="mb-8">
          <div className="relative">
            <img 
              src="/src/assets/ass_cass_bg.png" 
              alt="Control Panel Background" 
              className="h-20 w-auto"
            />
            
            {/* Control Buttons Overlay */}
            <div className="absolute inset-0 flex items-center justify-center space-x-4">
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

        {/* Center - Current Turn Player Timeline (moved from top to center) */}
        {currentTurnPlayer && (
          <div className="w-full max-w-6xl mb-8">
            <HostCurrentPlayerTimeline 
              currentTurnPlayer={currentTurnPlayer}
              highlightedGapIndex={highlightedGapIndex}
              mobileViewport={mobileViewport}
            />
          </div>
        )}

        {/* Mystery Card (moved lower) */}
        <div className="mb-8">
          <RecordMysteryCard
            song={currentSong}
            isRevealed={isCardRevealed}
            isDestroyed={cardPlacementResult?.correct === false}
          />
        </div>

        {/* Player Characters Display (moved to bottom) */}
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

      {/* Feedback Overlay for Host Display */}
      {cardPlacementResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 text-center transform transition-all duration-500 scale-100 animate-in fade-in slide-in-from-bottom-4 ${
            cardPlacementResult.correct ? 'border-4 border-green-500' : 'border-4 border-red-500'
          }`}>
            <div className={`text-6xl mb-4 ${cardPlacementResult.correct ? 'text-green-500' : 'text-red-500'}`}>
              {cardPlacementResult.correct ? '✓' : '✗'}
            </div>
            
            <h2 className={`text-3xl font-bold mb-4 ${cardPlacementResult.correct ? 'text-green-600' : 'text-red-600'}`}>
              {cardPlacementResult.correct ? 'Correct!' : 'Incorrect!'}
            </h2>
            
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <div className="text-xl font-semibold text-gray-900 mb-2">
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-lg text-gray-700 mb-3">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className={`inline-block text-white px-4 py-2 rounded-xl font-bold text-2xl ${
                cardPlacementResult.correct ? 'bg-green-500' : 'bg-red-500'
              }`}>
                Released in {cardPlacementResult.song.release_year}
              </div>
            </div>
            
            <div className={`text-lg font-medium ${cardPlacementResult.correct ? 'text-green-600' : 'text-red-600'}`}>
              {cardPlacementResult.correct ? (
                `${currentTurnPlayer?.name} got it right! +1 point`
              ) : (
                `${currentTurnPlayer?.name} missed this one`
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
