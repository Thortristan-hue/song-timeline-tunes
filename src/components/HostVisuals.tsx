
import React, { useState, useEffect, useRef } from 'react';
import { Song, Player } from '@/types/game';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { HostCurrentPlayerTimeline } from '@/components/host/HostCurrentPlayerTimeline';
import { getDefaultCharacter, getCharacterById as getCharacterByIdUtil } from '@/constants/characters';
import { audioEngine } from '@/utils/audioEngine';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

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
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  
  useEffect(() => {
    setIsCardRevealed(mysteryCardRevealed);
  }, [mysteryCardRevealed]);

  const handleRecordClick = () => {
    onPlayPause();
  };

  const handlePreviewClick = () => {
    if (!currentSong?.preview_url) {
      console.warn('[HostVisuals] No preview URL available');
      return;
    }

    if (isPreviewPlaying) {
      audioEngine.stopPreview();
      setIsPreviewPlaying(false);
    } else {
      audioEngine.playPreview(currentSong.preview_url);
      setIsPreviewPlaying(true);
      // Auto-stop after 30 seconds (typical preview length)
      setTimeout(() => {
        setIsPreviewPlaying(false);
      }, 30000);
    }
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

      {/* Center Top - Control Panel */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
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

        {/* Mystery Card */}
        <div className="mb-8 flex flex-col items-center space-y-4">
          <RecordMysteryCard
            song={currentSong}
            isRevealed={isCardRevealed}
            isDestroyed={cardPlacementResult?.correct === false}
          />
          
          {/* Preview Button for Mystery Song */}
          {currentSong?.preview_url && (
            <Button
              onClick={handlePreviewClick}
              className={`px-6 py-2 rounded-full text-white shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2 interactive-button hover-glow ${
                isPreviewPlaying 
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600' 
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}
              title="Preview Mystery Song"
            >
              {isPreviewPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold">
                {isPreviewPlaying ? 'Stop Preview' : 'Play Preview'}
              </span>
            </Button>
          )}
        </div>

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
