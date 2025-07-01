
import React, { useState } from 'react';
import { Song, Player } from '@/types/game';
import { PlayerMysteryCard } from '@/components/player/PlayerMysteryCard';
import { PlayerResultDisplay } from '@/components/player/PlayerResultDisplay';
import { PlayerTimeline } from '@/components/PlayerTimeline';
import { Button } from '@/components/ui/button';
import { Home, Users, Crown, Check, RotateCcw } from 'lucide-react';

interface PlayerGameViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function PlayerGameView({
  currentPlayer,
  currentTurnPlayer,
  currentSong,
  roomCode,
  isMyTurn,
  isPlaying,
  onPlayPause,
  onPlaceCard,
  mysteryCardRevealed,
  cardPlacementResult
}: PlayerGameViewProps) {
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [placementPending, setPlacementPending] = useState<{ song: Song; position: number } | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);

  const handleDragStart = (song: Song) => {
    setDraggedSong(song);
  };

  const handleDragEnd = () => {
    setDraggedSong(null);
  };

  const handleDragOver = (e: React.DragEvent, position: number) => {
    if (!isMyTurn || !draggedSong) return;
    e.preventDefault();
    setHoveredPosition(position);
  };

  const handleDragLeave = () => {
    setHoveredPosition(null);
  };

  const handleDrop = (e: React.DragEvent | React.MouseEvent | React.TouchEvent, position: number) => {
    if (e && 'preventDefault' in e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    if (!isMyTurn || !draggedSong) return;
    
    setHoveredPosition(null);
    setPlacementPending({ song: draggedSong, position });
    setDraggedSong(null);
  };

  const confirmPlacement = async () => {
    if (!placementPending) return;
    
    try {
      console.log('Confirming placement:', { song: placementPending.song.deezer_title, position: placementPending.position });
      const result = await onPlaceCard(placementPending.song, placementPending.position);
      console.log('Card placement result:', result);
      
      setPlacementPending(null);
    } catch (error) {
      console.error('Failed to place card:', error);
      setPlacementPending(null);
    }
  };

  const tryAgain = () => {
    if (placementPending) {
      setDraggedSong(placementPending.song);
    }
    setPlacementPending(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/3 rounded-full blur-2xl" />
      </div>

      {/* Disclaimer */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
          <p className="text-white/70 text-sm font-medium">
            Your turn to play • Drag the mystery card to your timeline
          </p>
        </div>
      </div>

      <div className="absolute top-16 left-6 right-6 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-2xl tracking-tight">Timeliner</div>
              <div className="text-white/60 text-base">Put the song in the right place</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20">
              <div className="text-white/60 text-sm font-medium">Room Code</div>
              <div className="text-white font-mono text-xl font-bold tracking-wider">{roomCode}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-32 left-6 z-30">
        <div className="bg-white/12 backdrop-blur-2xl rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div 
              className="w-6 h-6 rounded-full shadow-lg" 
              style={{ backgroundColor: currentPlayer.color }}
            />
            <div>
              <div className="text-white font-semibold text-lg">{currentPlayer.name}</div>
              <div className="text-white/60 text-sm">{currentPlayer.score}/10 points</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-32 right-6 z-30">
        <div className={`bg-white/12 backdrop-blur-2xl rounded-2xl p-4 shadow-xl ${
          isMyTurn ? 'ring-2 ring-blue-400/50' : ''
        }`}>
          <div className="text-center">
            <div className="text-white/60 text-sm mb-1">Current Turn</div>
            <div className="flex items-center justify-center gap-2">
              <div 
                className="w-4 h-4 rounded-full shadow-sm" 
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <div className="text-white font-semibold">
                {isMyTurn ? 'Your turn!' : currentTurnPlayer.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mystery Card */}
      {currentSong && isMyTurn && !placementPending && (
        <PlayerMysteryCard
          currentSong={currentSong}
          mysteryCardRevealed={mysteryCardRevealed}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      )}

      {/* Waiting State */}
      {!isMyTurn && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="text-center">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 mx-auto border border-white/20">
              <div className="text-4xl animate-pulse">⏳</div>
            </div>
            <div className="text-2xl font-semibold text-white mb-2">
              {currentTurnPlayer.name}'s turn
            </div>
            <div className="text-white/60">
              Hang tight while they think...
            </div>
          </div>
        </div>
      )}

      {/* Player Timeline */}
      <div className="absolute bottom-6 left-6 right-6 z-20">
        <div className="bg-white/12 backdrop-blur-2xl rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ backgroundColor: currentPlayer.color }}
            />
            <h3 className="text-white text-xl font-semibold">
              Your Timeline
            </h3>
          </div>
          
          <PlayerTimeline
            player={currentPlayer}
            isCurrent={isMyTurn}
            isDarkMode={true}
            draggedSong={draggedSong}
            hoveredPosition={hoveredPosition}
            placementPending={placementPending}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
          />
        </div>
      </div>

      {/* Placement Confirmation Overlay */}
      {placementPending && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-white/20 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl text-center">
            <div className="text-white text-xl font-semibold mb-4">
              Confirm your placement?
            </div>
            <div className="text-white/70 text-sm mb-6">
              Place "{placementPending.song.deezer_title}" at position {placementPending.position + 1}
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={confirmPlacement}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Confirm Placement
              </Button>
              <Button
                onClick={tryAgain}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {cardPlacementResult && (
        <PlayerResultDisplay cardPlacementResult={cardPlacementResult} />
      )}
    </div>
  );
}
