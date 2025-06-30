
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause } from 'lucide-react';
import { MysteryCard } from '@/components/MysteryCard';
import { Song, Player } from '@/types/game';

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
