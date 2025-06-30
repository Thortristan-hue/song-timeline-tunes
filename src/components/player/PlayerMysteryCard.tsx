
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { MysteryCard } from '@/components/MysteryCard';
import { Song } from '@/types/game';

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
  );
}
