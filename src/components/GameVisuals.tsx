import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Music, Play, Pause, Volume2, VolumeX, Crown, Clock, Trophy, Star, Zap, Check, X } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { MysteryCard } from '@/components/MysteryCard';
import { cn } from '@/lib/utils';

// Mystery Card for Players
interface PlayerMysteryCardProps {
  currentSong: Song;
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDragStart: (song: Song) => void;
  onDragEnd: () => void;
}

export function PlayerMysteryCard({
  currentSong,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  onDragStart,
  onDragEnd
}: PlayerMysteryCardProps) {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl scale-110" />
          
          <MysteryCard
            song={currentSong}
            isRevealed={mysteryCardRevealed}
            isInteractive={true}
            className="w-48 h-60"
            onDragStart={() => onDragStart(currentSong)}
            onDragEnd={onDragEnd}
          />
        </div>

        <div className="flex items-center justify-center gap-3 bg-slate-800/80 backdrop-blur-lg p-4 rounded-2xl border border-slate-600/30">
          <Button
            onClick={onPlayPause}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl"
            disabled={!currentSong?.preview_url}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>

        <div className="text-sm text-purple-200 bg-purple-900/50 px-3 py-1 rounded-full">
          Drag the mystery card to your timeline!
        </div>
      </div>
    </div>
  );
}

// Mystery Card for Host
interface HostMysteryCardProps {
  currentSong: Song | null;
  currentTurnPlayer: Player;
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function HostMysteryCard({
  currentSong,
  currentTurnPlayer,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: HostMysteryCardProps) {
  return (
    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
      <div className="text-center space-y-6">
        {/* Current Player Info */}
        <div className="bg-slate-800/80 backdrop-blur-md px-8 py-4 rounded-2xl border border-indigo-400/30 shadow-lg">
          <div className="flex items-center justify-center gap-4 text-white">
            <div 
              className="w-6 h-6 rounded-full border-2 border-white shadow-lg" 
              style={{ backgroundColor: currentTurnPlayer.color }}
            />
            <div className="text-center">
              <div className="font-bold text-xl">{currentTurnPlayer.name}'s Turn</div>
              <div className="text-sm text-indigo-200">Score: {currentTurnPlayer.score}/10</div>
            </div>
          </div>
        </div>

        {/* Mystery Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl scale-110" />
          
          {currentSong ? (
            <MysteryCard
              song={currentSong}
              isRevealed={mysteryCardRevealed}
              isInteractive={false}
              isDestroyed={cardPlacementResult?.correct === false}
              className="w-64 h-80"
            />
          ) : (
            <Card className="relative w-64 h-80 bg-slate-700/50 border-slate-500/50 flex flex-col items-center justify-center text-white animate-pulse">
              <Music className="h-16 w-16 mb-4 opacity-50" />
              <div className="text-xl text-center px-4 opacity-50">Loading Mystery Song...</div>
            </Card>
          )}
        </div>

        {/* Audio Controls */}
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 border border-slate-600/50">
          <div className="text-lg text-slate-300 text-center mb-4">
            {currentTurnPlayer.name} is placing their card...
          </div>

          <div className="flex items-center justify-center">
            <Button
              onClick={onPlayPause}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl px-8 py-4 font-bold text-white shadow-lg"
              disabled={!currentSong?.preview_url}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-6 w-6 mr-3" />
                  Pause Preview
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 mr-3" />
                  Play Preview
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Player Result Display
interface PlayerResultDisplayProps {
  cardPlacementResult: { correct: boolean; song: Song };
}

export function PlayerResultDisplay({ cardPlacementResult }: PlayerResultDisplayProps) {
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

// Player Waiting Screen
interface PlayerWaitingScreenProps {
  currentTurnPlayer: Player;
}

export function PlayerWaitingScreen({ currentTurnPlayer }: PlayerWaitingScreenProps) {
  return (
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
  );
}

// Game Background Component
export function GameBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/3 rounded-full blur-2xl" />
    </div>
  );
}

// Game Header Component
interface GameHeaderProps {
  roomCode: string;
  currentPlayer?: Player;
  currentTurnPlayer: Player;
  isMyTurn: boolean;
  gameEnded: boolean;
}

export function GameHeader({ roomCode, currentPlayer, currentTurnPlayer, isMyTurn, gameEnded }: GameHeaderProps) {
  return (
    <>
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

      {currentPlayer && (
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
      )}

      <div className="absolute top-32 right-6 z-30">
        <div className={`bg-white/12 backdrop-blur-2xl rounded-2xl p-4 shadow-xl border-2 ${
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
                 isMyTurn ? 'Your turn!' : currentTurnPlayer.name}
              </div>
            </div>
            {isMyTurn && !gameEnded && (
              <div className="text-xs text-green-300 mt-1">Click to place card!</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
