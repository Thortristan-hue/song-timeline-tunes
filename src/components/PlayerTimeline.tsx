
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
          "w-40 h-40 rounded-xl shadow-2xl border-2 flex flex-col items-center justify-center p-4 text-center flex-shrink-0 transition-all duration-500 cursor-pointer group relative overflow-hidden",
          isThrowing && "animate-bounce scale-110 z-20",
          hoveredCard === `${player.id}-${index}` && "scale-110 -translate-y-4 z-10 shadow-[0_0_40px_rgba(147,51,234,0.6)]",
          "hover:shadow-[0_0_40px_rgba(147,51,234,0.4)] hover:z-10 hover:-translate-y-4 hover:scale-110 hover:rotate-1"
        )}
        style={{
          backgroundColor: song.cardColor,
          borderColor: "rgba(255,255,255,0.4)",
          boxShadow: '0 15px 35px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.2)',
          transform: `perspective(1000px) rotateX(${hoveredCard === `${player.id}-${index}` ? '-5deg' : '0deg'})`
        }}
        onMouseEnter={() => setHoveredCard(`${player.id}-${index}`)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        
        {/* Card content */}
        <div className="relative z-10 text-center w-full">
          {isThrowing ? (
            <div>
              <div className="text-xs font-bold text-red-200 leading-tight mb-1">
                WRONG!
              </div>
              <div className="text-xl font-black text-white mb-1">
                {throwingCard?.song?.release_year}
              </div>
              <div className="text-xs italic text-red-200 leading-tight break-words">
                {throwingCard?.song?.deezer_artist}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-bold text-white/90 leading-tight break-words mb-2 line-clamp-2">
                {song.deezer_artist}
              </div>
              <div className="text-2xl font-black text-white mb-2">
                {song.release_year}
              </div>
              <div className="text-sm italic text-white/75 leading-tight break-words line-clamp-3">
                {song.deezer_title}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation buttons on the card */}
        {isConfirming && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl flex items-center justify-center gap-3 z-30">
            <button
              onClick={confirmPlacement}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-all duration-200 hover:scale-125 shadow-xl animate-pulse"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={cancelPlacement}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-200 hover:scale-125 shadow-xl animate-pulse"
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
          isGhostHere ? "w-40 scale-110" : "w-8"
        )}
        onDragOver={(e) => handleDragOver(e, player.id, position)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(player.id, position)}
      >
        {isGhostHere && draggedSong && (
          <div
            className="w-40 h-40 rounded-xl border-4 border-dashed flex flex-col items-center justify-center p-4 text-center transition-all duration-300 bg-purple-500/30 backdrop-blur-sm transform scale-110 animate-pulse shadow-2xl"
            style={{
              borderColor: '#4ECDC4',
              boxShadow: '0 0 30px rgba(78, 205, 196, 0.5)'
            }}
          >
            <Music className="h-8 w-8 text-white mb-2 animate-bounce" />
            <div className="text-sm text-white font-bold">Drop Here</div>
            <div className="text-xs text-white/70">Perfect Spot!</div>
          </div>
        )}
        {!isGhostHere && (
          <div className="w-2 h-32 bg-white/20 rounded-full transition-all duration-300 hover:bg-purple-400/50 hover:w-3 hover:h-36 hover:shadow-lg" />
        )}
      </div>
    );
  };

  if (!player) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
      {/* Floating header */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">{player.name}'s Timeline</h3>
          {isCurrent && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2 text-sm shadow-lg animate-pulse">
              Your Turn
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
          <Trophy className="h-6 w-6 text-yellow-400" />
          <span className="font-bold text-2xl text-white">{player.score}/10</span>
          <span className="text-sm text-white/70">({player.timeline.length} cards)</span>
        </div>
      </div>

      {/* Floating timeline - no background box */}
      <div className="flex items-center justify-center gap-4 min-h-44 overflow-x-auto" 
           style={{ 
             perspective: '1200px',
             transform: 'translateZ(100px)'
           }}>
        {/* Start drop zone */}
        {renderDropZone(0)}
        
        {/* Cards with drop zones between them */}
        {player.timeline.map((song, index) => (
          <div key={`timeline-${index}`} className="flex items-center gap-4">
            {renderCard(song, index)}
            {renderDropZone(index + 1)}
          </div>
        ))}
        
        {/* If no cards, show welcome message */}
        {player.timeline.length === 0 && !draggedSong && (
          <div className="text-center py-8">
            <Music className="h-16 w-16 text-purple-300 mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-purple-300 text-xl font-medium">Drag the mystery song here to start!</p>
            <p className="text-purple-400 text-sm mt-2">Build your timeline chronologically</p>
          </div>
        )}
      </div>
    </div>
  );
}
