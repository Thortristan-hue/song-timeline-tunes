
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Music, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Song, Player } from "@/pages/Index";

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

export default function PlayerTimeline({
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
    
    return (
      <div
        key={`${player.id}-card-${index}`}
        className={cn(
          "w-28 h-28 rounded-lg shadow-xl flex flex-col items-center justify-center p-2 text-white text-xs relative transition-all duration-300 hover:scale-105",
          hoveredCard === `${player.id}-${index}` && "scale-105 z-10",
          isConfirming && "scale-110 shadow-2xl shadow-purple-500/50"
        )}
        style={{
          backgroundColor: song.cardColor,
          transform: isConfirming ? 'scale(1.1) rotate(2deg)' : 
                    transitioningTurn ? `scale(${0.2 + 0.8 * (1 - transitionProgress)}) translateY(${50 * transitionProgress}px)` : 
                    'scale(1)',
          opacity: transitioningTurn ? 1 - 0.5 * transitionProgress : 1,
          boxShadow: isConfirming 
            ? '0 10px 30px rgba(147,51,234,0.6)' 
            : '0 4px 12px rgba(0,0,0,0.3)'
        }}
        onMouseEnter={() => setHoveredCard(`${player.id}-${index}`)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg" />
        
        <div className="relative z-10 text-center w-full h-full flex flex-col justify-between">
          {/* Artist name at top */}
          <div className="text-xs opacity-75 truncate w-full leading-tight font-medium">
            {song.deezer_artist.length > 10 ? song.deezer_artist.substring(0, 10) + '...' : song.deezer_artist}
          </div>
          
          {/* Release year in middle - larger and prominent */}
          <div className="text-2xl font-black my-1">{song.release_year}</div>
          
          {/* Song title at bottom */}
          <div className="text-xs truncate w-full leading-tight font-semibold">
            {song.deezer_title.length > 12 ? song.deezer_title.substring(0, 12) + '...' : song.deezer_title}
          </div>
        </div>

        {isConfirming && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center gap-2 z-30">
            <button
              onClick={confirmPlacement}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 shadow-xl"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancelPlacement}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 shadow-xl"
            >
              <X className="h-4 w-4" />
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
          "transition-all duration-300 relative",
          isGhostHere ? "w-28" : "w-2"
        )}
        onDragOver={(e) => handleDragOver(e, player.id, position)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(player.id, position)}
      >
        {isGhostHere && draggedSong && (
          <div
            className="w-28 h-28 rounded-lg border-4 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all duration-300 bg-purple-500/30 backdrop-blur-sm shadow-2xl"
            style={{
              borderColor: '#4ECDC4',
              boxShadow: '0 0 25px rgba(78, 205, 196, 0.4)'
            }}
          >
            <Music className="h-6 w-6 text-white mb-1" />
            <div className="text-sm text-white font-bold">Drop Here</div>
            <div className="text-xs text-white/70">Perfect Spot!</div>
          </div>
        )}
        {!isGhostHere && (
          <div 
            className="w-2 h-28 bg-white/20 rounded-full transition-all duration-300 hover:bg-purple-400/50 hover:w-3 hover:h-32 hover:scale-110"
            style={{
              opacity: transitioningTurn ? 1 - transitionProgress : 1,
              transform: transitioningTurn ? `scaleY(${1 - 0.5 * transitionProgress})` : 'scaleY(1)'
            }}
          />
        )}
      </div>
    );
  };

  if (!player) return null;

  // Calculate dynamic timeline width for centering
  const timelineWidth = player.timeline.length * 120 + (player.timeline.length + 1) * 8;

  return (
    <div 
      className="absolute bottom-32 left-1/2 z-25"
      style={{
        transform: `translateX(-50%) perspective(1200px) rotateX(-8deg)`,
        transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: transitioningTurn ? 1 - 0.3 * transitionProgress : 1
      }}
    >
      <div 
        className="flex items-center justify-center gap-4 mb-6"
        style={{
          transform: transitioningTurn ? `translateY(${20 * transitionProgress}px) scale(${1 - 0.1 * transitionProgress})` : 'translateY(0) scale(1)',
          transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
          <div className="flex items-center gap-3 text-white">
            <h3 className="text-xl font-bold">{player.name}'s Timeline</h3>
            {isCurrent && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-3 py-1 text-sm shadow-lg">
                Your Turn
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <span className="font-bold text-xl">{player.score}/10</span>
              <span className="text-sm text-white/70">({player.timeline.length} cards)</span>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="flex items-center gap-4 p-6 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
        style={{
          transform: transitioningTurn ? `scale(${1 - 0.2 * transitionProgress}) translateY(${30 * transitionProgress}px)` : 'scale(1) translateY(0)',
          transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {renderDropZone(0)}
        
        {player.timeline.map((song, index) => (
          <React.Fragment key={`timeline-${index}`}>
            {renderCard(song, index)}
            {renderDropZone(index + 1)}
          </React.Fragment>
        ))}
        
        {player.timeline.length === 0 && !draggedSong && (
          <div className="text-center py-6 px-12">
            <Music className="h-12 w-12 text-purple-300 mx-auto mb-3 opacity-50" />
            <p className="text-purple-300 text-lg font-medium">Drag the mystery song here to start!</p>
            <p className="text-purple-400 text-sm mt-2">Build your timeline chronologically</p>
          </div>
        )}
      </div>
    </div>
  );
}
