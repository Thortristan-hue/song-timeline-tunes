
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
  handleDrop: (position: number) => void;
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
          "relative aspect-square w-28 rounded-lg shadow-xl flex flex-col items-center justify-center p-2 text-white text-xs transition-all duration-300 hover:scale-105"
        )}
        style={{
          backgroundColor: song.cardColor,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg" />
        <Music className="h-8 w-8 mb-1 opacity-80" />
        <div className="text-center relative z-10">
          <div className="font-bold text-xs mb-1 truncate w-full">
            {song.deezer_title.length > 12 ? song.deezer_title.substring(0, 12) + '...' : song.deezer_title}
          </div>
          <div className="text-xs opacity-75 truncate w-full">
            {song.deezer_artist.length > 10 ? song.deezer_artist.substring(0, 10) + '...' : song.deezer_artist}
          </div>
          <div className="text-lg font-black mt-1">{song.release_year}</div>
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
          "w-16 h-32 rounded-full transition-all duration-300 mx-2 flex items-center justify-center",
          "touch-manipulation cursor-pointer", // Better mobile touch handling
          isConfirming
            ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50 scale-125 animate-pulse'
            : isHovered 
            ? 'bg-purple-400 shadow-lg shadow-purple-400/50 scale-110' 
            : 'bg-white/20 hover:bg-white/30'
        )}
        onDragOver={(e) => handleDragOver(e, position)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(position)}
        // Mobile-friendly touch events
        onClick={() => {
          if (draggedSong && isCurrent) {
            handleDrop(position);
          }
        }}
        onTouchStart={(e) => {
          if (draggedSong && isCurrent) {
            e.preventDefault();
            handleDrop(position);
          }
        }}
      >
        {draggedSong && isCurrent && (
          <div className="text-white text-xs font-bold text-center">
            Place<br />Here
          </div>
        )}
      </div>
    );
  };

  if (!player) return null;

  return (
    <div 
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-25 w-full max-w-6xl px-4"
      style={{
        transform: `translateX(-50%) perspective(1200px) rotateX(-2deg)`,
        transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: transitioningTurn ? 0.7 : 1
      }}
    >
      <div className="flex items-center gap-2 p-6 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-x-auto">
        {player.timeline.map((song, index) => (
          <React.Fragment key={`${song.deezer_title}-${index}`}>
            {renderDropZone(index)}
            {renderCard(song, index)}
          </React.Fragment>
        ))}
        
        {renderDropZone(player.timeline.length)}
        
        {player.timeline.length === 0 && (
          <div className="text-center py-8 px-16 flex-1">
            <Music className="h-16 w-16 text-purple-300 mx-auto mb-4 opacity-60" />
            <p className="text-purple-400 text-sm font-medium">
              {isCurrent ? "Drag the mystery song to build your chronological timeline" : "Waiting for cards..."}
            </p>
            {isCurrent && (
              <p className="text-purple-300 text-xs mt-2 opacity-75">
                Drop zones will appear when you start dragging
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
