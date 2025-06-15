
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

// Random vibrant colors for cards
const getRandomCardColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', 
    '#BB8FCE', '#85C1E9', '#FFB6C1', '#87CEEB', '#DDA0DD', '#F0E68C',
    '#FF9999', '#66CDAA', '#87CEFA', '#DEB887', '#F0A0A0', '#B0E0E6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

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
          "w-20 h-20 rounded-xl shadow-xl border-2 flex flex-col items-center justify-center p-2 text-center flex-shrink-0 transition-all duration-700 cursor-pointer group relative overflow-hidden transform",
          isThrowing && "animate-bounce scale-110 z-20",
          hoveredCard === `${player.id}-${index}` && "scale-105 -translate-y-1 rotate-2",
          "hover:shadow-2xl hover:z-10"
        )}
        style={{
          background: `linear-gradient(135deg, ${getRandomCardColor()}, ${getRandomCardColor()}dd)`,
          borderColor: "rgba(255,255,255,0.3)",
          boxShadow: '0 8px 25px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
        }}
        onMouseEnter={() => setHoveredCard(`${player.id}-${index}`)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
        
        {/* Floating animation elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${20 + i * 30}%`,
                top: `${15 + i * 25}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${2 + i}s`
              }}
            />
          ))}
        </div>
        
        {/* Card content */}
        <div className="relative z-10 text-center w-full">
          {isThrowing ? (
            <>
              <div className="text-xs font-bold text-red-200 leading-tight mb-1">
                WRONG!
              </div>
              <div className="text-lg font-black text-white">
                {throwingCard?.song?.release_year}
              </div>
              <div className="text-xs italic text-red-200 leading-tight truncate">
                {throwingCard?.song?.deezer_artist}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-bold text-white/90 truncate w-full leading-tight">
                {song.deezer_artist}
              </div>
              <div className="text-lg font-black text-white my-1">
                {song.release_year}
              </div>
              <div className="text-xs italic text-white/75 truncate w-full leading-tight">
                {song.deezer_title}
              </div>
            </>
          )}
        </div>

        {/* Confirmation buttons on the card */}
        {isConfirming && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2 z-30">
            <button
              onClick={confirmPlacement}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancelPlacement}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
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
          "flex items-center justify-center transition-all duration-500 relative",
          isGhostHere ? "w-20 scale-110" : "w-3"
        )}
        onDragOver={(e) => handleDragOver(e, player.id, position)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(player.id, position)}
      >
        {isGhostHere && draggedSong && (
          <div
            className="w-20 h-20 rounded-xl border-3 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all duration-300 animate-pulse bg-white/20 backdrop-blur-sm transform scale-110"
            style={{
              borderColor: getRandomCardColor(),
            }}
          >
            <Music className="h-5 w-5 text-white mb-1 animate-bounce" />
            <div className="text-xs text-white font-bold">Drop</div>
          </div>
        )}
        {!isGhostHere && (
          <div 
            className="w-1 h-16 bg-white/30 rounded-full transition-all duration-300 hover:bg-white/50 hover:w-2 hover:h-20 hover:shadow-lg"
          />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-6 h-6 rounded-full border-2 border-white/50 shadow-lg animate-pulse" 
            style={{ backgroundColor: getRandomCardColor() }}
          />
          <h3 className="text-xl font-bold text-white">{player.name}'s Timeline</h3>
          {isCurrent && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse font-bold px-3 py-1 text-xs">
              Your Turn
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400 animate-bounce" />
          <span className="font-bold text-xl text-white">{player.score}/10</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 p-3 min-h-28 overflow-x-auto">
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
          <div className="text-center py-6">
            <Music className="h-10 w-10 text-purple-300 mx-auto mb-3 opacity-50 animate-pulse" />
            <p className="text-purple-300 text-base">Drag the mystery song here to start!</p>
          </div>
        )}
      </div>
    </div>
  );
}
