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
  activeDrag: { playerId: string; position: number; song: Song | null } | null;
  hoveredCard: string | null;
  throwingCard: { song: Song; playerId: string; position: number } | null;
  confirmingPlacement: { song: Song; position: number } | null;
  placedCardPosition: number | null;
  handleDragOver: (
    e: React.DragEvent,
    playerId: string,
    position: number
  ) => void;
  handleDragLeave: () => void;
  handleDrop: (playerId: string, position: number) => void;
  setHoveredCard: (id: string | null) => void;
  currentPlayerId: string;
  confirmPlacement: () => void;
  cancelPlacement: () => void;
  transitioningTurn?: boolean;
  transitionProgress?: number;
}

export function PlayerTimeline({
  player,
  isCurrent,
  isDarkMode,
  draggedSong,
  activeDrag,
  hoveredCard,
  throwingCard,
  confirmingPlacement,
  placedCardPosition,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  setHoveredCard,
  currentPlayerId,
  confirmPlacement,
  cancelPlacement,
  transitioningTurn = false,
  transitionProgress = 0
}: PlayerTimelineProps) {
  const renderCard = (song: Song, index: number) => {
    const isConfirming = placedCardPosition === index && confirmingPlacement?.position === index;
    const isHovered = hoveredCard === `${player.id}-${index}`;
    
    return (
      <div
        key={`${player.id}-card-${index}`}
        className={cn(
          "group relative w-32 h-36 rounded-2xl flex flex-col items-center justify-center p-3 text-white text-xs transition-all duration-500 cursor-pointer overflow-hidden",
          "shadow-2xl hover:shadow-3xl",
          "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:via-white/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300",
          "hover:before:opacity-100",
          "after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-t after:from-black/20 after:to-transparent",
          isHovered && "scale-110 z-20 rotate-1",
          isConfirming && "scale-115 shadow-purple-500/60 rotate-2 z-30"
        )}
        style={{
          backgroundColor: song.cardColor,
          transform: isConfirming ? 'scale(1.15) rotate(2deg)' : 
                    isHovered ? 'scale(1.1) rotate(1deg)' :
                    transitioningTurn ? `scale(${0.2 + 0.8 * (1 - transitionProgress)}) translateY(${50 * transitionProgress}px)` : 
                    'scale(1)',
          opacity: transitioningTurn ? 1 - 0.5 * transitionProgress : 1,
          boxShadow: isConfirming 
            ? '0 25px 50px rgba(147,51,234,0.8), 0 0 30px rgba(147,51,234,0.4)' 
            : isHovered
            ? '0 20px 40px rgba(0,0,0,0.5), 0 0 25px rgba(255,255,255,0.1)'
            : '0 8px 25px rgba(0,0,0,0.4)',
          filter: isHovered ? 'brightness(1.1) contrast(1.05)' : 'brightness(1)',
        }}
        onMouseEnter={() => setHoveredCard(`${player.id}-${index}`)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse" />
          <div className="absolute bottom-3 left-3 w-1 h-1 bg-white rounded-full animate-pulse delay-300" />
          <div className="absolute top-1/2 left-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-700" />
        </div>
        
        {/* Main content */}
        <div className="relative z-10 text-center w-full h-full flex flex-col justify-between">
          {/* Artist name with icon */}
          <div className="flex items-center justify-center gap-1 mb-1">
            <Sparkles className="h-3 w-3 opacity-60" />
            <div className="text-xs opacity-90 truncate font-semibold tracking-wide">
              {song.deezer_artist.length > 12 ? song.deezer_artist.substring(0, 12) + '...' : song.deezer_artist}
            </div>
          </div>
          
          {/* Release year - main focus */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              <div className="text-3xl font-black tracking-tight bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
                {song.release_year}
              </div>
              <Calendar className="h-4 w-4 absolute -top-1 -right-5 opacity-50" />
            </div>
          </div>
          
          {/* Song title with better typography */}
          <div className="bg-black/20 backdrop-blur-sm rounded-lg px-2 py-1 mt-2">
            <div className="text-xs truncate font-bold tracking-wide">
              {song.deezer_title.length > 14 ? song.deezer_title.substring(0, 14) + '...' : song.deezer_title}
            </div>
          </div>
        </div>

        {/* Hover glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none",
          "bg-gradient-to-br from-white/20 via-transparent to-transparent",
          isHovered ? "opacity-100" : "opacity-0"
        )} />

        {/* Confirmation overlay */}
        {isConfirming && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-black/90 backdrop-blur-md rounded-2xl flex items-center justify-center gap-3 z-40">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl animate-pulse" />
            <button
              onClick={confirmPlacement}
              className="relative bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 shadow-2xl border-2 border-white/20"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={cancelPlacement}
              className="relative bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 shadow-2xl border-2 border-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderDropZone = (position: number) => {
    const isGhostHere = activeDrag?.playerId === player.id && activeDrag?.position === position && draggedSong;
    
    return (
      <div
        key={`drop-zone-${position}`}
        className={cn(
          "transition-all duration-500 relative flex items-center justify-center",
          isGhostHere ? "w-32" : "w-3"
        )}
        onDragOver={(e) => handleDragOver(e, player.id, position)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(player.id, position)}
      >
        {isGhostHere && draggedSong && (
          <div className="relative w-32 h-36 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center p-3 text-center transition-all duration-500 bg-gradient-to-br from-cyan-500/30 via-purple-500/30 to-pink-500/30 backdrop-blur-lg shadow-2xl overflow-hidden">
            {/* Animated border */}
            <div className="absolute inset-0 rounded-2xl border-4 border-dashed border-cyan-400 animate-pulse" />
            
            {/* Sparkle effects */}
            <div className="absolute inset-0">
              <div className="absolute top-2 left-2 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping delay-300" />
              <div className="absolute bottom-3 left-1/2 w-1 h-1 bg-pink-400 rounded-full animate-ping delay-700" />
            </div>
            
            <Music className="h-8 w-8 text-cyan-300 mb-2 animate-bounce" />
            <div className="text-sm text-white font-bold tracking-wide">Perfect Spot!</div>
            <div className="text-xs text-cyan-200 font-medium">Drop to place</div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-400/20 animate-pulse" />
          </div>
        )}
        {!isGhostHere && (
          <div className="relative group">
            <div 
              className="w-3 h-36 bg-gradient-to-b from-white/30 via-white/20 to-white/30 rounded-full transition-all duration-500 hover:bg-gradient-to-b hover:from-purple-400/60 hover:via-cyan-400/60 hover:to-purple-400/60 hover:w-4 hover:h-40 hover:shadow-lg hover:shadow-purple-400/30"
              style={{
                opacity: transitioningTurn ? 1 - transitionProgress : 1,
                transform: transitioningTurn ? `scaleY(${1 - 0.5 * transitionProgress})` : 'scaleY(1)'
              }}
            />
            {/* Hover indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!player) return null;

  return (
    <div 
      className="absolute bottom-32 left-1/2 z-25"
      style={{
        transform: `translateX(-50%) perspective(1200px) rotateX(-8deg)`,
        transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: transitioningTurn ? 1 - 0.3 * transitionProgress : 1
      }}
    >
      {/* Enhanced header */}
      <div 
        className="flex items-center justify-center gap-4 mb-8"
        style={{
          transform: transitioningTurn ? `translateY(${20 * transitionProgress}px) scale(${1 - 0.1 * transitionProgress})` : 'translateY(0) scale(1)',
          transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="relative bg-gradient-to-r from-black/60 via-black/50 to-black/60 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/30 shadow-2xl overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-cyan-900/20" />
          
          <div className="relative flex items-center gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                  {player.name}'s Timeline
                </h3>
                {isCurrent && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
                )}
              </div>
              {isCurrent && (
                <Badge className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white font-bold px-4 py-2 text-sm shadow-lg border border-white/20 animate-pulse">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Your Turn
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-2 border border-white/20">
              <Trophy className="h-6 w-6 text-yellow-400 animate-pulse" />
              <div className="flex flex-col items-center">
                <span className="font-black text-2xl bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {player.score}/10
                </span>
                <span className="text-xs text-white/70 font-medium">
                  {player.timeline.length} cards
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced timeline container */}
      <div 
        className="relative flex items-center gap-6 p-8 bg-gradient-to-r from-black/40 via-black/30 to-black/40 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl overflow-hidden"
        style={{
          transform: transitioningTurn ? `scale(${1 - 0.2 * transitionProgress}) translateY(${30 * transitionProgress}px)` : 'scale(1) translateY(0)',
          transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-cyan-900/10 animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        
        <div className="relative flex items-center gap-6">
          {renderDropZone(0)}
          
          {player.timeline.map((song, index) => (
            <React.Fragment key={`timeline-${index}`}>
              {renderCard(song, index)}
              {renderDropZone(index + 1)}
            </React.Fragment>
          ))}
          
          {player.timeline.length === 0 && !draggedSong && (
            <div className="text-center py-8 px-16">
              <div className="relative">
                <Music className="h-16 w-16 text-purple-300 mx-auto mb-4 opacity-60 animate-bounce" />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping" />
              </div>
              <p className="text-purple-200 text-xl font-bold mb-2 bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Your Musical Journey Starts Here!
              </p>
              <p className="text-purple-400 text-sm font-medium">
                Drag the mystery song to build your chronological timeline
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
