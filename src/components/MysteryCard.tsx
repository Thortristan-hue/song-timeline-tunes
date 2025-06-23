
import React from 'react';
import { Card } from '@/components/ui/card';
import { Music, HelpCircle, AlertTriangle } from 'lucide-react';
import { Song } from '@/types/game';
import { cn } from '@/lib/utils';

interface MysteryCardProps {
  song: Song | null;
  isRevealed: boolean;
  isInteractive?: boolean;
  isDestroyed?: boolean;
  className?: string;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  loadingError?: string | null;
}

export function MysteryCard({
  song,
  isRevealed,
  isInteractive = false,
  isDestroyed = false,
  className,
  onDragStart,
  onDragEnd,
  loadingError
}: MysteryCardProps) {
  // Show error state if there's a loading error
  if (loadingError) {
    return (
      <Card className={cn(
        "w-32 h-40 bg-red-500/20 border-red-400/50 flex flex-col items-center justify-center text-white",
        className
      )}>
        <AlertTriangle className="h-8 w-8 mb-2 text-red-400" />
        <div className="text-xs text-center px-2 text-red-200 leading-tight">
          {loadingError}
        </div>
      </Card>
    );
  }

  if (isDestroyed) {
    return (
      <Card className={cn(
        "w-32 h-40 bg-red-500/20 border-red-400/50 flex flex-col items-center justify-center text-white opacity-50 animate-pulse",
        className
      )}>
        <div className="text-4xl mb-2">💥</div>
        <div className="text-sm text-center px-2">Incorrect!</div>
      </Card>
    );
  }

  if (!song) {
    return (
      <Card className={cn(
        "w-32 h-40 bg-slate-600/50 border-slate-500/50 flex flex-col items-center justify-center text-white animate-pulse",
        className
      )}>
        <Music className="h-8 w-8 mb-2 opacity-50" />
        <div className="text-sm text-center px-2 opacity-50">Loading...</div>
      </Card>
    );
  }

  // Validate song data before rendering
  const isValidSong = song.release_year && 
                     song.release_year !== 'undefined' && 
                     song.release_year !== 'null' && 
                     song.release_year.trim() !== '' &&
                     song.deezer_title &&
                     song.deezer_artist;

  if (!isValidSong && isRevealed) {
    return (
      <Card className={cn(
        "w-32 h-40 bg-yellow-500/20 border-yellow-400/50 flex flex-col items-center justify-center text-white",
        className
      )}>
        <AlertTriangle className="h-8 w-8 mb-2 text-yellow-400" />
        <div className="text-xs text-center px-2 text-yellow-200 leading-tight">
          Invalid song data
        </div>
      </Card>
    );
  }

  if (!isRevealed) {
    return (
      <Card
        className={cn(
          "w-32 h-40 bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-400/50 flex flex-col items-center justify-center text-white shadow-lg transition-all",
          isInteractive && "cursor-grab hover:scale-105 active:cursor-grabbing active:scale-95 touch-manipulation select-none",
          className
        )}
        draggable={isInteractive}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        // Enhanced touch support for mobile
        style={{
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          touchAction: isInteractive ? 'none' : 'auto'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg" />
        <HelpCircle className="h-12 w-12 mb-2 relative z-10" />
        <div className="text-2xl font-black mb-1 relative z-10">?</div>
        <div className="text-xs text-center px-2 opacity-90 relative z-10">Mystery Song</div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "w-32 h-40 flex flex-col items-center justify-center text-white shadow-lg border border-white/20 transition-all",
        isInteractive && "cursor-grab hover:scale-105 active:cursor-grabbing active:scale-95 touch-manipulation select-none",
        className
      )}
      style={{ 
        backgroundColor: song.cardColor,
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: isInteractive ? 'none' : 'auto'
      }}
      draggable={isInteractive}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg" />
      <Music className="h-6 w-6 mb-2 opacity-80 relative z-10" />
      <div className="text-center relative z-10 px-2">
        <div className="text-lg font-black mb-1">
          {song.release_year}
        </div>
        <div className="text-xs opacity-90 leading-tight">
          {song.deezer_title?.slice(0, 12)}
          {song.deezer_title && song.deezer_title.length > 12 ? '...' : ''}
        </div>
        <div className="text-xs opacity-75 mt-1 leading-tight">
          {song.deezer_artist?.slice(0, 10)}
          {song.deezer_artist && song.deezer_artist.length > 10 ? '...' : ''}
        </div>
      </div>
    </Card>
  );
}
