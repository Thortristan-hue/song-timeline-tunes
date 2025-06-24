
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, Pause, Volume2, VolumeX, Crown, Check, X } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { MysteryCard } from '@/components/MysteryCard';
import { PlayerTimeline } from '@/components/PlayerTimeline';
import { cn } from '@/lib/utils';

interface PlayerGameViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPlaceCard: (position: number) => Promise<{ success: boolean }>;
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
  const [confirmingPlacement, setConfirmingPlacement] = useState<{ song: Song; position: number } | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const handleDragStart = (song: Song) => {
    if (!isMyTurn) return;
    setDraggedSong(song);
  };

  const handleDragEnd = () => {
    setDraggedSong(null);
  };

  const handleDrop = (position: number) => {
    if (!isMyTurn || !draggedSong) return;
    setConfirmingPlacement({ song: draggedSong, position });
  };

  const confirmPlacement = async () => {
    if (!confirmingPlacement) return;
    
    const result = await onPlaceCard(confirmingPlacement.position);
    setConfirmingPlacement(null);
    setDraggedSong(null);
  };

  const cancelPlacement = () => {
    setConfirmingPlacement(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      
      {/* Header */}
      <div className="absolute top-6 left-4 right-4 z-40">
        <div className="flex justify-between items-center">
          {/* Current Turn Player */}
          <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-600/50 shadow-lg">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg" 
              style={{ backgroundColor: currentTurnPlayer?.color }}
            />
            <div className="text-white">
              <div className="font-bold text-lg">
                {isMyTurn ? "Your Turn" : `${currentTurnPlayer?.name}'s Turn`}
              </div>
              <div className="text-sm text-slate-300">
                {currentTurnPlayer?.score}/10 cards
              </div>
            </div>
            {isMyTurn && <Crown className="h-5 w-5 text-yellow-400" />}
          </div>

          {/* Room Code */}
          <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400 text-lg px-4 py-2 font-mono">
            {roomCode}
          </Badge>
        </div>
      </div>

      {/* Mystery Card Section */}
      {isMyTurn && currentSong && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl scale-110" />
              
              <MysteryCard
                song={currentSong}
                isRevealed={mysteryCardRevealed}
                isInteractive={true}
                className="w-48 h-60"
                onDragStart={() => handleDragStart(currentSong)}
                onDragEnd={handleDragEnd}
              />
            </div>

            {/* Music Controls */}
            <div className="flex items-center justify-center gap-3 bg-slate-800/80 backdrop-blur-lg p-4 rounded-2xl border border-slate-600/30">
              <Button
                onClick={onPlayPause}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl"
                disabled={!currentSong?.preview_url}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={() => setIsMuted(!isMuted)}
                size="sm"
                variant="outline"
                className="rounded-xl border-slate-600/50 bg-slate-700/80"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>

            <div className="text-sm text-purple-200 bg-purple-900/50 px-3 py-1 rounded-full">
              Drag the mystery card to your timeline!
            </div>
          </div>
        </div>
      )}

      {/* Not My Turn Display */}
      {!isMyTurn && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="text-center space-y-4">
            <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 border border-slate-600/50">
              <Music className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-white mb-2">
                {currentTurnPlayer?.name} is playing
              </div>
              <div className="text-slate-300">
                Wait for your turn to place cards
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Timeline */}
      <div className="absolute bottom-40 left-0 right-0 z-20 px-6">
        <PlayerTimeline
          player={currentPlayer}
          isCurrent={isMyTurn}
          isDarkMode={true}
          draggedSong={draggedSong}
          hoveredPosition={null}
          confirmingPlacement={confirmingPlacement}
          handleDragOver={(e, position) => {
            if (!isMyTurn || !draggedSong) return;
            e.preventDefault();
          }}
          handleDragLeave={() => {}}
          handleDrop={handleDrop}
          confirmPlacement={confirmPlacement}
          cancelPlacement={cancelPlacement}
        />
      </div>

      {/* Confirmation Buttons */}
      {confirmingPlacement && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex gap-3 bg-slate-800/80 backdrop-blur-lg p-4 rounded-2xl border border-slate-600/30 shadow-xl">
            <Button
              onClick={confirmPlacement}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl px-4 h-10 font-bold"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirm
            </Button>
            <Button
              onClick={cancelPlacement}
              size="sm"
              className="bg-slate-600/80 hover:bg-slate-500/80 text-white rounded-xl px-4 h-10 font-bold border border-slate-500/50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Result Display */}
      {cardPlacementResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="text-center space-y-6 p-8">
            <div className={`text-9xl mb-4 ${
              cardPlacementResult.correct ? 'text-emerald-400 animate-bounce' : 'text-rose-400 animate-pulse'
            }`}>
              {cardPlacementResult.correct ? '🎯' : '💥'}
            </div>
            
            <div className={`text-5xl font-black ${
              cardPlacementResult.correct ? 
              'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400' : 
              'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400'
            }`}>
              {cardPlacementResult.correct ? 'PERFECT!' : 'CLOSE!'}
            </div>
            
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-600/30 max-w-md">
              <div className="text-xl font-bold text-white mb-2">
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-lg text-slate-300 mb-3">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                {cardPlacementResult.song.release_year}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
