
import React, { useState, useEffect, useRef } from 'react';
import { Song, Player } from '@/types/game';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { HostCurrentPlayerTimeline } from '@/components/host/HostCurrentPlayerTimeline';
import { getDefaultCharacter, getCharacterById as getCharacterByIdUtil } from '@/constants/characters';

// Import assets
import assRythmy from '@/assets/ass_rythmy.png';
import assRoomcode from '@/assets/ass_roomcode.png';
import assSpeaker from '@/assets/ass_speaker.png';
import assPlay from '@/assets/ass_play.png';
import assPause from '@/assets/ass_pause.png';
import assStop from '@/assets/ass_stop.png';

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
          src={assRythmy} 
          alt="RYTHMY" 
          className="h-12 w-auto"
        />
      </div>

      {/* Top Right - Room Code */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <img 
            src={assRoomcode} 
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
          src={assSpeaker} 
          alt="Speaker" 
          className="h-16 w-auto opacity-80"
        />
      </div>

      {/* Bottom Right Speaker */}
      <div className="absolute bottom-4 right-4 z-10">
        <img 
          src={assSpeaker} 
          alt="Speaker" 
          className="h-16 w-auto opacity-80 scale-x-[-1]"
        />
      </div>

      {/* Main Content Area - Reorganized Layout */}
      <div className="flex flex-col items-center justify-start min-h-screen p-8 pt-20">
        
        {/* TOP MIDDLE - Mystery Card with audio controls below */}
        <div className="mb-8">
          <div className="relative flex flex-col items-center">
            {/* Mystery Card positioned on top of cassette */}
            <div className={`mb-4 transition-all duration-500 ${
              cardPlacementResult 
                ? cardPlacementResult.correct 
                  ? 'animate-smooth-card-success' 
                  : 'animate-smooth-card-error'
                : ''
            }`}>
              <RecordMysteryCard
                song={currentSong}
                isRevealed={isCardRevealed}
                isDestroyed={cardPlacementResult?.correct === false}
              />
            </div>
            
            {/* Audio Controls positioned right below the mystery card */}
            <div className="mt-4">
              <div className="flex items-center justify-center space-x-6">
                {/* Play/Pause Button */}
                <button
                  onClick={handleRecordClick}
                  className="relative group transition-transform hover:scale-110 active:scale-95"
                  disabled={!currentSong}
                >
                  <img 
                    src={isPlaying ? assPause : assPlay}
                    alt={isPlaying ? "Pause" : "Play"}
                    className="h-12 w-12 drop-shadow-md"
                  />
                  <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                {/* Stop Button */}
                <button
                  onClick={() => {
                    if (isPlaying) {
                      onPlayPause(); // This will stop/pause the audio
                    }
                  }}
                  className="relative group transition-transform hover:scale-110 active:scale-95"
                  disabled={!isPlaying}
                >
                  <img 
                    src={assStop}
                    alt="Stop"
                    className="h-12 w-12 drop-shadow-md"
                  />
                  <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BELOW AUDIO CONTROLS - Song Timeline */}
        {currentTurnPlayer && (
          <div className="w-full max-w-7xl mb-6 flex flex-col items-center flex-1 min-h-0">
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-white mb-1">
                {currentTurnPlayer.name}'s Timeline
              </h2>
              <p className="text-white/70">Place the mystery song in the correct chronological order</p>
            </div>
            <div className="w-full overflow-hidden flex-1 flex items-center justify-center">
              <HostCurrentPlayerTimeline 
                currentTurnPlayer={currentTurnPlayer}
                highlightedGapIndex={highlightedGapIndex}
                mobileViewport={mobileViewport}
              />
            </div>
          </div>
        )}

        {/* Player Characters Display (at bottom) */}
        <div className="w-full max-w-6xl">
          <div className="flex justify-center items-end space-x-6">
            {players.map((player) => {
              const isCurrentPlayer = currentTurnPlayer?.id === player.id;
              const character = getCharacterByIdUtil(player.character || getDefaultCharacter().id);
              
              return (
                <div
                  key={player.id}
                  className={`relative transition-all duration-500 ${
                    isCurrentPlayer 
                      ? 'scale-110 z-10' 
                      : 'scale-100 opacity-75'
                  } ${transitioning ? 'animate-turn-transition-fadeout' : ''}`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {/* Character Image */}
                    <div className="relative">
                      <img
                        src={character?.image || getDefaultCharacter().image}
                        alt={character?.name || getDefaultCharacter().name}
                        className="h-20 w-20 border-4 object-cover"
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
