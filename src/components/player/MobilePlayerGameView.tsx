
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, Pause, Volume2, VolumeX, Crown, Clock, Trophy, Star, Zap, Check, X } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { MysteryCard } from '@/components/MysteryCard';
import { cn } from '@/lib/utils';

interface MobilePlayerGameViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  currentSong: Song;
  roomCode: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  gameEnded: boolean;
}

export default function MobilePlayerGameView({
  currentPlayer,
  currentTurnPlayer,
  currentSong,
  roomCode,
  isMyTurn,
  isPlaying,
  onPlayPause,
  onPlaceCard,
  mysteryCardRevealed,
  cardPlacementResult,
  gameEnded
}: MobilePlayerGameViewProps) {
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
  const [placementPending, setPlacementPending] = useState<{ song: Song; position: number } | null>(null);

  // Handle drag start
  const handleDragStart = (song: Song) => {
    setDraggedSong(song);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedSong(null);
    setHoveredPosition(null);
  };

  // Handle drag over timeline position
  const handleDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    setHoveredPosition(position);
  };

  // Handle drop on timeline
  const handleDrop = async (e: React.DragEvent, position: number) => {
    e.preventDefault();
    
    if (!draggedSong || !isMyTurn) return;

    setPlacementPending({ song: draggedSong, position });
    
    try {
      await onPlaceCard(draggedSong, position);
    } catch (error) {
      console.error('Failed to place card:', error);
    } finally {
      setPlacementPending(null);
      setDraggedSong(null);
      setHoveredPosition(null);
    }
  };

  // Show result overlay
  if (cardPlacementResult) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/3 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-lg tracking-tight">Timeliner</div>
              <div className="text-white/60 text-sm">Room: {roomCode}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/12 backdrop-blur-2xl rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm" 
                  style={{ backgroundColor: currentPlayer.color }}
                />
                <div className="text-white font-medium text-sm">{currentPlayer.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Turn Indicator */}
      <div className="absolute top-20 left-4 right-4 z-30">
        <div className={`bg-white/12 backdrop-blur-2xl rounded-xl p-4 border-2 ${
          isMyTurn && !gameEnded ? 'border-green-400/50 ring-2 ring-green-400/30' : 
          gameEnded ? 'border-gray-500/50' : 'border-red-400/50'
        }`}>
          <div className="text-center">
            <div className="text-white/60 text-sm mb-1">Current Turn</div>
            <div className="flex items-center justify-center gap-2">
              <div 
                className="w-4 h-4 rounded-full shadow-sm" 
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <div className={`font-semibold ${
                isMyTurn && !gameEnded ? 'text-green-200' : 
                gameEnded ? 'text-gray-200' : 'text-white'
              }`}>
                {gameEnded ? 'Game Over' : 
                 isMyTurn ? 'Your turn!' : `${currentTurnPlayer.name}'s turn`}
              </div>
            </div>
            {isMyTurn && !gameEnded && (
              <div className="text-xs text-green-300 mt-1">Drag the mystery card to your timeline!</div>
            )}
          </div>
        </div>
      </div>

      {/* Mystery Card - Only show if it's my turn */}
      {isMyTurn && !gameEnded && (
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 z-30">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl scale-110" />
              
              <MysteryCard
                song={currentSong}
                isRevealed={mysteryCardRevealed}
                isInteractive={true}
                className="w-32 h-40"
                onDragStart={() => handleDragStart(currentSong)}
                onDragEnd={handleDragEnd}
              />
            </div>

            <div className="flex items-center justify-center gap-3 bg-slate-800/80 backdrop-blur-lg p-3 rounded-xl border border-slate-600/30">
              <Button
                onClick={onPlayPause}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg"
                disabled={!currentSong?.preview_url}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-4 h-4 rounded-full shadow-sm" 
              style={{ backgroundColor: currentPlayer.timelineColor }}
            />
            <div className="text-white font-medium">Your Timeline ({currentPlayer.timeline.length}/10)</div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {/* Timeline positions */}
            {Array.from({ length: 11 }, (_, i) => {
              const songAtPosition = currentPlayer.timeline[i];
              const isHovered = hoveredPosition === i;
              const isPending = placementPending?.position === i;

              return (
                <div
                  key={i}
                  className={cn(
                    "flex-shrink-0 w-16 h-20 rounded-lg border-2 border-dashed transition-all duration-200",
                    isHovered && draggedSong ? "border-green-400 bg-green-400/10 scale-105" : "border-white/30",
                    isPending && "border-yellow-400 bg-yellow-400/10",
                    !songAtPosition && "bg-white/5"
                  )}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                >
                  {songAtPosition ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-md flex flex-col items-center justify-center p-1">
                      <div className="text-white text-xs font-bold text-center leading-tight">
                        {songAtPosition.deezer_title.substring(0, 8)}...
                      </div>
                      <div className="text-white/80 text-xs mt-1">
                        {songAtPosition.release_year}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white/40 text-xs font-bold">{i + 1}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Waiting screen when not my turn */}
      {!isMyTurn && !gameEnded && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="text-center space-y-4">
            <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 border border-slate-600/50">
              <Music className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-white mb-2">
                {currentTurnPlayer.name} is playing
              </div>
              <div className="text-slate-300">
                Wait for your turn to place cards
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
