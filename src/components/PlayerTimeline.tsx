
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
  handleDragOver,
  handleDragLeave,
  handleDrop,
  setHoveredCard,
  currentPlayerId,
  confirmPlacement,
  cancelPlacement
}: PlayerTimelineProps) {
  const renderCard = (song: Song, index: number) => {
    const isThrowing = throwingCard?.playerId === player.id && throwingCard?.position === index;
    const isConfirming = confirmingPlacement?.position === index;
    
    return (
      <div
        key={`${player.id}-card-${index}`}
        className={cn(
          "w-36 h-36 rounded-xl shadow-2xl border-2 flex flex-col items-center justify-center p-4 text-center flex-shrink-0 transition-all duration-500 cursor-pointer group relative overflow-hidden",
          isThrowing && "animate-bounce scale-110 z-20",
          hoveredCard === `${player.id}-${index}` && "scale-105 -translate-y-2 z-10",
          "hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:z-10 hover:-translate-y-3"
        )}
        style={{
          backgroundColor: song.cardColor,
          borderColor: "rgba(255,255,255,0.4)",
          boxShadow: '0 12px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
        }}
        onMouseEnter={() => setHoveredCard(`${player.id}-${index}`)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* Card content */}
        <div className="relative z-10 text-center w-full">
          {isThrowing ? (
            <>
              <div className="text-sm font-bold text-red-200 leading-tight mb-2">
                WRONG!
              </div>
              <div className="text-2xl font-black text-white mb-1">
                {throwingCard?.song?.release_year}
              </div>
              <div className="text-xs italic text-red-200 leading-tight break-words">
                {throwingCard?.song?.deezer_artist}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-white/90 leading-tight break-words mb-2 line-clamp-2">
                {song.deezer_artist}
              </div>
              <div className="text-2xl font-black text-white mb-2">
                {song.release_year}
              </div>
              <div className="text-xs italic text-white/75 leading-tight break-words line-clamp-2">
                {song.deezer_title}
              </div>
            </>
          )}
        </div>

        {/* Confirmation buttons on the card */}
        {isConfirming && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center gap-3 z-30">
            <button
              onClick={confirmPlacement}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 shadow-xl"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={cancelPlacement}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 shadow-xl"
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
          "flex items-center justify-center transition-all duration-300 relative",
          isGhostHere ? "w-36 scale-105" : "w-6"
        )}
        onDragOver={(e) => handleDragOver(e, player.id, position)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(player.id, position)}
      >
        {isGhostHere && draggedSong && (
          <div
            className="w-36 h-36 rounded-xl border-4 border-dashed flex flex-col items-center justify-center p-4 text-center transition-all duration-300 bg-white/20 backdrop-blur-sm transform scale-105 animate-pulse"
            style={{
              borderColor: '#4ECDC4',
            }}
          >
            <Music className="h-8 w-8 text-white mb-3 animate-bounce" />
            <div className="text-sm text-white font-bold">Drop Here</div>
            <div className="text-xs text-white/70">Perfect Spot!</div>
          </div>
        )}
        {!isGhostHere && (
          <div className="w-2 h-32 bg-white/30 rounded-full transition-all duration-300 hover:bg-white/50 hover:w-3 hover:h-36 hover:shadow-lg" />
        )}
      </div>
    );
  };

  if (!player) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">{player.name}'s Timeline</h3>
          {isCurrent && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2 text-sm shadow-lg">
              Your Turn
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
          <Trophy className="h-6 w-6 text-yellow-400" />
          <span className="font-bold text-2xl text-white">{player.score}/10</span>
          <span className="text-sm text-white/70">({player.timeline.length} cards)</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 p-6 min-h-48 overflow-x-auto shadow-2xl rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10">
        {/* Start drop zone */}
        {renderDropZone(0)}
        
        {/* Cards with drop zones between them */}
        {player.timeline.map((song, index) => (
          <React.Fragment key={`timeline-${index}`}>
            {renderCard(song, index)}
            {renderDropZone(index + 1)}
          </React.Fragment>
        ))}
        
        {/* If no cards, show welcome message */}
        {player.timeline.length === 0 && !draggedSong && (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-purple-300 mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-purple-300 text-xl font-medium">Drag the mystery song here to start!</p>
            <p className="text-purple-400 text-sm mt-2">Build your timeline chronologically</p>
          </div>
        )}
      </div>
    </div>
  );
}
