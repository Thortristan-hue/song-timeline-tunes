import React, { useEffect, useState } from 'react';
import { Crown, Users, Play, Pause, Music, Check, X } from 'lucide-react';
// Import HostTimelineCard from HostGameView
import { Song, Player } from '@/types/game';

function HostTimelineCard({ song, isActive }: { song: Song; isActive?: boolean }) {
  const artistHash = Array.from(song.deezer_artist).reduce(
    (acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0
  );
  const hue = Math.abs(artistHash) % 360;
  
  return (
    <div 
      className={`w-32 h-32 rounded-xl flex flex-col items-center justify-between p-3 text-white transition-all duration-300 hover:scale-110 cursor-pointer relative
        ${isActive ? 'ring-4 ring-green-400' : ''}`}
      style={{ 
        backgroundColor: `hsl(${hue}, 70%, 30%)`,
        backgroundImage: `linear-gradient(135deg, hsl(${hue}, 70%, 25%), hsl(${hue}, 70%, 40%))`,
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
      }}
    >
      <div className="text-sm font-medium w-full text-center truncate">
        {song.deezer_artist}
      </div>
      <div className="text-3xl font-bold my-auto">
        {song.release_year}
      </div>
      <div className="text-xs italic w-full text-center truncate">
        {song.deezer_title}
      </div>
    </div>
  );
}
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';
import { Button } from '@/components/ui/button';

export function HostGameBackground() {
  return (
    <div className="absolute inset-0">
      {/* Add the background image */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: "url('src/assets/timeliner_bg.jpeg')", // Background image path
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

function HostTimelineDisplay({ 
  currentPlayer, 
  isActive, 
  placementResult 
}: { 
  currentPlayer: Player; 
  isActive: boolean;
  placementResult?: { correct: boolean; song: Song };
}) {
  const [visibleCards, setVisibleCards] = useState(0);
  const [newCardIndex, setNewCardIndex] = useState<number | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const cardCount = currentPlayer.timeline.length;
  const gapSize = Math.max(12, 50 - cardCount * 2);

  useEffect(() => {
    if (isActive) {
      setIsEntering(true);
      setIsExiting(false);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setVisibleCards(count);
        if (count >= cardCount) clearInterval(interval);
      }, 150);
      
      const enteringTimer = setTimeout(() => setIsEntering(false), 2000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(enteringTimer);
      };
    } else {
      setIsExiting(true);
      setIsEntering(false);
      setVisibleCards(0);
      const exitTimer = setTimeout(() => setIsExiting(false), 1000);
      return () => clearTimeout(exitTimer);
    }
  }, [isActive, cardCount]);

  useEffect(() => {
    if (currentPlayer.timeline.length > 0 && placementResult) {
      const newIndex = currentPlayer.timeline.findIndex(
        song => song.id === placementResult.song.id
      );
      if (newIndex >= 0) {
        setNewCardIndex(newIndex);
        setTimeout(() => setNewCardIndex(null), 2000);
      }
    }
  }, [currentPlayer.timeline, placementResult]);

  return (
    <div 
      className={`flex justify-center items-center p-6 rounded-3xl transition-all duration-1200 ${
        isEntering ? 'animate-epic-timeline-enter' : ''
      } ${isExiting ? 'animate-epic-timeline-exit' : ''}`}
      style={{
        gap: `${gapSize}px`,
        transform: isActive ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.85)',
        opacity: isActive ? 1 : 0.4,
        filter: isActive ? 'blur(0px)' : 'blur(4px)'
      }}
    >
      {currentPlayer.timeline.length === 0 ? (
        <div className={`text-white/60 italic py-8 text-xl transition-all duration-1000 ${
          isActive ? 'animate-text-elegant-fade-in' : 'opacity-0'
        }`}>
          {currentPlayer.name} hasn't placed any cards yet
        </div>
      ) : (
        currentPlayer.timeline.map((song, index) => (
          <div 
            key={song.id}
            className={`transition-all duration-900 ${index < visibleCards ? 'opacity-100 scale-100' : 'opacity-0 scale-60'} ${
              newCardIndex === index ? 'animate-epic-card-drop' : ''
            }`}
            style={{
              transitionDelay: `${index * 100}ms`,
              transformOrigin: 'bottom center',
              filter: index < visibleCards ? 'blur(0px)' : 'blur(5px)'
            }}
          >
            <HostTimelineCard 
              song={song} 
              isActive={placementResult?.song.id === song.id}
            />
          </div>
        ))
      )}
    </div>
  );
}

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
