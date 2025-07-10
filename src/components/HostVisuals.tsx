
import React, { useState, useEffect } from 'react';
import { Song, Player } from '@/types/game';
import { HostGameBackground } from '@/components/host/HostGameBackground';
import { HostHeader } from '@/components/host/HostHeader';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';

interface RecordPlayerSectionProps {
  currentSong: Song | null;
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

function RecordPlayerSection({
  currentSong,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: RecordPlayerSectionProps) {
  return (
    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30">
      <div className="relative">
        <div className="absolute inset-0 bg-white/8 rounded-3xl blur-xl scale-110" />
        <div 
          className="relative cursor-pointer transition-all duration-300 hover:scale-105"
          onClick={onPlayPause}
        >
          <RecordMysteryCard
            song={currentSong}
            isRevealed={mysteryCardRevealed}
            isDestroyed={cardPlacementResult?.correct === false}
          />
          
          {currentSong?.preview_url && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity">
              {isPlaying ? (
                <div className="h-6 w-6 text-white">⏸</div>
              ) : (
                <div className="h-6 w-6 text-white">▶</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface HostTimelineCardProps {
  song: Song;
}

function HostTimelineCard({ song }: HostTimelineCardProps) {
  const artistHash = Array.from(song.deezer_artist).reduce(
    (acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0
  );
  const hue = Math.abs(artistHash) % 360;
  
  return (
    <div 
      className="w-36 h-36 rounded-xl flex flex-col items-center justify-center p-2 text-white font-bold text-center"
      style={{ 
        backgroundColor: `hsl(${hue}, 70%, 30%)`,
        backgroundImage: `linear-gradient(135deg, hsl(${hue}, 70%, 25%), hsl(${hue}, 70%, 40%))`,
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
      }}
    >
      <div className="text-sm font-medium mb-1 truncate w-full">
        {song.deezer_title}
      </div>
      <div className="text-xs font-semibold mb-2 truncate w-full">
        {song.deezer_artist}
      </div>
      <div className="text-2xl font-bold">
        {song.release_year}
      </div>
    </div>
  );
}

interface HostTimelineDisplayProps {
  currentPlayer: Player;
  isActive: boolean;
  placementResult: { correct: boolean; song: Song } | null;
}

function HostTimelineDisplay({ currentPlayer, isActive, placementResult }: HostTimelineDisplayProps) {
  return (
    <div className={`flex justify-center items-center gap-4 p-6 bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 transition-opacity duration-800 ${
      isActive ? 'opacity-100' : 'opacity-0'
    }`}>
      {currentPlayer.timeline.length === 0 ? (
        <div className="text-white/50 italic py-6 text-lg">
          {currentPlayer.name} hasn't placed any cards yet
        </div>
      ) : (
        currentPlayer.timeline.map((song, index) => (
          <React.Fragment key={song.id}>
            <HostTimelineCard song={song} />
            {index < currentPlayer.timeline.length - 1 && (
              <div className="w-8 h-1 bg-white/20 rounded-full" />
            )}
          </React.Fragment>
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
  
  useEffect(() => {
    if (transitioning) {
      setAnimationStage('exiting');
      setTimeout(() => {
        setDisplayedPlayer(currentTurnPlayer);
        setAnimationStage('entering');
        setTimeout(() => setAnimationStage('idle'), 1000);
      }, 800);
    } else {
      setDisplayedPlayer(currentTurnPlayer);
    }
  }, [currentTurnPlayer, transitioning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-yellow-50 relative overflow-hidden">
      <HostGameBackground />
      <HostHeader roomCode={roomCode} playersCount={players.length} />
      <RecordPlayerSection 
        currentSong={currentSong}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        cardPlacementResult={cardPlacementResult}
      />
      
      <div className="absolute top-1/2 left-0 right-0 z-30 mt-4">
        <div className="flex justify-center">
          <HostTimelineDisplay 
            currentPlayer={displayedPlayer} 
            isActive={animationStage !== 'exiting'}
            placementResult={cardPlacementResult}
          />
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10">
        <CassettePlayerDisplay 
          players={players} 
          currentPlayerId={currentTurnPlayer.id}
        />
      </div>

      {cardPlacementResult && (
        <div className="fixed inset-0 bg-orange-900/80 backdrop-blur-2xl flex items-center justify-center z-50">
          <div className="text-center space-y-8 p-8">
            <div className={`text-9xl mb-6 ${
              cardPlacementResult.correct ? 'animate-bounce' : 'animate-pulse'
            }`}>
              {cardPlacementResult.correct ? '🎯' : '💫'}
            </div>
            <div className={`text-6xl font-black tracking-tight transform -rotate-1 ${
              cardPlacementResult.correct ? 
              'text-orange-500' : 
              'text-orange-400'
            }`} style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
              {cardPlacementResult.correct ? 'PERFECT MATCH!' : 'NICE TRY!'}
            </div>
            <div className="bg-orange-200/90 backdrop-blur-3xl rounded-3xl p-8 border-4 border-orange-400 max-w-lg shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold text-orange-900 mb-3" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-2xl text-orange-800 mb-6 font-medium">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className="inline-block bg-orange-500 text-white px-6 py-3 rounded-full font-bold text-2xl border-4 border-orange-600 shadow-lg">
                {cardPlacementResult.song.release_year}
              </div>
            </div>
            <div className="text-orange-200 text-xl font-medium" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
              {cardPlacementResult.correct ? 
                `${currentTurnPlayer.name} scored a point!` : 
                `Better luck next time, ${currentTurnPlayer.name}!`
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
