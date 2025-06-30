import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Music, Check, X, Sparkles, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Song, Player } from "@/types/game";

interface PlayerTimelineProps {
  player: Player;
  isCurrent: boolean;
  isDarkMode: boolean;
  draggedSong: Song | null;
  hoveredPosition: number | null;
  confirmingPlacement: { song: Song; position: number } | null;
  handleDragOver: (e: React.DragEvent, position: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent | React.MouseEvent | React.TouchEvent, position: number) => void;
  confirmPlacement: () => void;
  cancelPlacement: () => void;
  transitioningTurn?: boolean;
}

export function PlayerTimeline({
  player,
  isCurrent,
  isDarkMode,
  draggedSong,
  hoveredPosition,
  confirmingPlacement,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  confirmPlacement,
  cancelPlacement,
  transitioningTurn = false
}: PlayerTimelineProps) {
  const renderCard = (song: Song, index: number) => {
    return (
      <div
        key={`${player.id}-card-${index}`}
        className={cn(
          "relative w-32 h-40 rounded-3xl flex flex-col items-center justify-center p-4 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1",
          "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl" />
        <Music className="h-8 w-8 mb-3 opacity-70" />
        <div className="text-center relative z-10 space-y-1">
          <div className="font-semibold text-sm leading-tight tracking-tight">
            {song.deezer_title.length > 14 ? song.deezer_title.substring(0, 14) + '...' : song.deezer_title}
          </div>
          <div className="text-xs opacity-60 font-medium">
            {song.deezer_artist.length > 12 ? song.deezer_artist.substring(0, 12) + '...' : song.deezer_artist}
          </div>
          <div className="text-xl font-bold mt-2 bg-white/10 rounded-full px-2 py-1">
            {song.release_year}
          </div>
        </div>
      </div>
    );
  };

  const renderDropZone = (position: number) => {
    const isHovered = hoveredPosition === position;
    const isConfirming = confirmingPlacement?.position === position;
    
    return (
      <div
        key={`drop-zone-${position}`}
        className={cn(
          "w-20 h-36 rounded-3xl transition-all duration-300 mx-3 flex items-center justify-center",
          "touch-manipulation cursor-pointer backdrop-blur-xl border",
          isConfirming
            ? 'bg-blue-500/30 border-blue-400/50 shadow-lg shadow-blue-400/25 scale-110 animate-pulse'
            : isHovered 
            ? 'bg-white/15 border-white/20 shadow-lg scale-105' 
            : 'bg-white/5 border-white/10 hover:bg-white/10'
        )}
        onDragOver={(e) => handleDragOver(e, position)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, position)}
        onClick={(e) => {
          if (draggedSong && isCurrent) {
            handleDrop(e, position);
          }
        }}
        onTouchStart={(e) => {
          if (draggedSong && isCurrent) {
            e.preventDefault();
            handleDrop(e, position);
          }
        }}
      >
        {draggedSong && isCurrent && (
          <div className="text-white/80 text-xs font-medium text-center leading-tight">
            Drop<br />here
          </div>
        )}
      </div>
    );
  };

  if (!player) return null;

  return (
    <div 
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-25 w-full max-w-7xl px-6"
      style={{
        transform: `translateX(-50%)`,
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: transitioningTurn ? 0.6 : 1
      }}
    >
      <div className="flex items-center gap-4 p-8 bg-black/20 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl overflow-x-auto">
        {player.timeline.map((song, index) => (
          <React.Fragment key={`${song.deezer_title}-${index}`}>
            {renderDropZone(index)}
            {renderCard(song, index)}
          </React.Fragment>
        ))}
        
        {renderDropZone(player.timeline.length)}
        
        {player.timeline.length === 0 && (
          <div className="text-center py-12 px-20 flex-1">
            <Music className="h-16 w-16 text-white/30 mx-auto mb-6" />
            <p className="text-white/70 text-lg font-medium mb-2">
              {isCurrent ? "Your timeline starts here" : "Building timeline..."}
            </p>
            {isCurrent && (
              <p className="text-white/50 text-sm font-normal">
                Drag the song card to create your chronological timeline
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
