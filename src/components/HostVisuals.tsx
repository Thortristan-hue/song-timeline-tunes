import React, { useEffect, useState } from 'react';
import { Crown, Users, Play, Pause, Music, Check, X } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';
import { Button } from '@/components/ui/button';

// Import the image properly
import backgroundImage from 'src/assets/timeliner_bg.jpeg';

export function HostGameBackground() {
  return (
    <div className="absolute inset-0">
      {/* Add the background image */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: `url(${backgroundImage})`, // Use imported image
        }}
      />
    </div>
  );
}

function HostHeader({ roomCode, playersCount }: { roomCode: string; playersCount: number }) {
  return (
    <div className="absolute top-4 left-4 right-4 z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-black/50 backdrop-blur-2xl rounded-2xl flex items-center justify-center border-2 border-white/15 shadow-xl">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="text-white font-black text-3xl tracking-tight drop-shadow-lg">Timeliner</div>
            <div className="text-white/80 text-base font-semibold bg-black/60 backdrop-blur-xl rounded-full px-3 py-1 border border-white/15">
              Host Display
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-black/50 backdrop-blur-2xl px-6 py-3 rounded-2xl border-2 border-white/15 shadow-xl">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-white" />
              <div className="text-white font-black text-xl">{playersCount}</div>
            </div>
          </div>

          <div className="bg-black/50 backdrop-blur-2xl px-6 py-3 rounded-2xl border-2 border-white/15 shadow-xl">
            <div className="text-white font-mono text-xl font-black tracking-wider">{roomCode}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordPlayerSection({
  currentSong,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: {
  currentSong: Song | null;
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}) {
  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
      <div className="relative">
        <div className="text-center space-y-8 max-w-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-400/15 to-red-500/20 rounded-full blur-2xl animate-pulse scale-150"></div>
            <div className={`relative w-40 h-40 mx-auto transition-all duration-500 ${
              isPlaying ? 'animate-spin' : 'hover:scale-110'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-red-500/30 rounded-full blur-xl"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-4 border-white/40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-4 border-white/50 shadow-xl"></div>
                </div>
                
                {/* Vinyl grooves effect */}
                <div className="absolute inset-4 border border-white/10 rounded-full"></div>
                <div className="absolute inset-8 border border-white/10 rounded-full"></div>
                <div className="absolute inset-12 border border-white/10 rounded-full"></div>
              </div>
              
              <Button
                onClick={onPlayPause}
                className="absolute inset-0 w-full h-full bg-black/20 hover:bg-black/40 border-0 rounded-full transition-all duration-300 group"
                disabled={!currentSong?.preview_url}
              >
                <div className="text-white text-4xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">
                  {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                </div>
              </Button>
            </div>
          </div>
          <div className="text-white/90 text-lg font-semibold bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/20 shadow-lg">
            Mystery Song Playing
          </div>
        </div>
      </div>
    </div>
  );
}

// Additional components and logic remain unchanged

export function HostGameView({
  currentTurnPlayer,
  previousPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult,
  transitioning
}: {
  currentTurnPlayer: Player;
  previousPlayer?: Player;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  transitioning: boolean;
}) {
  const [displayedPlayer, setDisplayedPlayer] = useState(currentTurnPlayer);
  const [animationStage, setAnimationStage] = useState<'idle' | 'exiting' | 'entering'>('idle');
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    if (cardPlacementResult) {
      setShowResultModal(true);
      const resultTimer = setTimeout(() => {
        setShowResultModal(false);
        setAnimationStage('exiting');
        const transitionTimer = setTimeout(() => {
          setDisplayedPlayer(currentTurnPlayer);
          setAnimationStage('entering');
          const enterTimer = setTimeout(() => {
            setAnimationStage('idle');
          }, 1500);
          return () => clearTimeout(enterTimer);
        }, 1200);
        return () => clearTimeout(transitionTimer);
      }, 4000);
      return () => clearTimeout(resultTimer);
    } else if (transitioning) {
      setAnimationStage('exiting');
      setTimeout(() => {
        setDisplayedPlayer(currentTurnPlayer);
        setAnimationStage('entering');
        setTimeout(() => setAnimationStage('idle'), 1500);
      }, 1200);
    } else {
      setDisplayedPlayer(currentTurnPlayer);
    }
  }, [currentTurnPlayer, transitioning, cardPlacementResult]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <HostGameBackground />
      <HostHeader roomCode={roomCode} playersCount={players.length} />
      <RecordPlayerSection 
        currentSong={currentSong}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        cardPlacementResult={cardPlacementResult}
      />
      <div className="absolute top-1/2 left-0 right-0 z-30 mt-8">
        <div className="flex justify-center">
          <HostTimelineDisplay 
            currentPlayer={displayedPlayer} 
            isActive={animationStage !== 'exiting'}
            placementResult={cardPlacementResult}
          />
        </div>
      </div>
      <div className="absolute bottom-6 left-6 right-6 z-10">
        <CassettePlayerDisplay 
          players={players} 
          currentPlayerId={currentTurnPlayer.id}
        />
      </div>
      {showResultModal && cardPlacementResult && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-3xl flex items-center justify-center z-50 animate-epic-modal-appear">
          {/* Modal content */}
        </div>
      )}
    </div>
  );
}
