
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Music } from "lucide-react";
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
  handleDragOver: (
    e: React.DragEvent,
    playerId: string,
    position: number
  ) => void;
  handleDragLeave: () => void;
  handleDrop: (playerId: string, position: number) => void;
  setHoveredCard: (id: string | null) => void;
  currentPlayerId: string;
}

export default function PlayerTimeline({
  player,
  isCurrent,
  isDarkMode,
  draggedSong,
  activeDrag,
  hoveredCard,
  throwingCard,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  setHoveredCard,
  currentPlayerId
}: PlayerTimelineProps) {
  const renderCard = (song: Song, index: number) => {
    const isThrowing = throwingCard?.playerId === player.id && throwingCard?.position === index;
    
    return (
      <div
        key={`${player.id}-card-${index}`}
        className={cn(
          "w-20 h-28 rounded-xl shadow-xl border-2 flex flex-col items-center justify-center p-2 text-center flex-shrink-0 transition-all duration-500 cursor-pointer group relative overflow-hidden",
          isThrowing && "animate-bounce scale-110 z-20"
        )}
        style={{
          background: `linear-gradient(135deg, ${player.timelineColor}, ${player.timelineColor}dd)`,
          borderColor: "rgba(255,255,255,0.3)",
        }}
        onMouseEnter={() => setHoveredCard(`${player.id}-${index}`)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
        
        {/* Card content */}
        <div className="relative z-10 text-center">
          {isThrowing ? (
            <>
              <div className="text-xs font-bold text-red-200 leading-tight mb-1">
                WRONG!
              </div>
              <div className="text-lg font-black text-white">
                {throwingCard?.song?.release_year}
              </div>
              <div className="text-xs italic text-red-200 leading-tight">
                {throwingCard?.song?.deezer_artist}
              </div>
            </>
          ) : (
            <>
              <div className={cn("text-xs font-bold text-white/90 truncate w-full leading-tight transition-all duration-200",
                hoveredCard === `${player.id}-${index}` ? "animate-pulse" : "")}>
                {song.deezer_artist}
              </div>
              <div className="text-xl font-black text-white my-1">
                {song.release_year}
              </div>
              <div className="text-xs italic text-white/75 truncate w-full leading-tight">
                {song.deezer_title}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderDropZone = (position: number) => {
    const isGhostHere = activeDrag?.playerId === player.id && activeDrag?.position === position && draggedSong;
    
    return (
      <div
        key={`drop-zone-${position}`}
        className={cn(
          "w-2 h-28 flex items-center justify-center transition-all duration-300 relative",
          isGhostHere ? "w-20" : "w-2"
        )}
        onDragOver={(e) => handleDragOver(e, player.id, position)}
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(player.id, position)}
      >
        {isGhostHere && draggedSong && (
          <div
            className="w-20 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all duration-300 animate-pulse bg-white/10 backdrop-blur-sm"
            style={{
              borderColor: player.timelineColor,
            }}
          >
            <Music className="h-6 w-6 text-purple-300 mb-2" />
            <div className="text-xs text-purple-300 font-bold">Drop here</div>
          </div>
        )}
        {!isGhostHere && (
          <div 
            className="w-1 h-12 bg-white/20 rounded-full transition-all duration-300 hover:bg-white/40 hover:w-2 hover:h-16"
          />
        )}
      </div>
    );
  };

  return (
    <Card className="p-6 shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-8 h-8 rounded-full border-2 border-white/50 shadow-lg" 
            style={{ backgroundColor: player.timelineColor }}
          />
          <h3 className="text-2xl font-bold text-white">{player.name}'s Timeline</h3>
          {isCurrent && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse font-bold px-4 py-2">
              Your Turn
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-yellow-400" />
          <span className="font-bold text-2xl text-white">{player.score}/10</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 p-4 min-h-32 overflow-x-auto">
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
          <div className="text-center py-8">
            <Music className="h-12 w-12 text-purple-300 mx-auto mb-4 opacity-50" />
            <p className="text-purple-300 text-lg">Drag the mystery song here to start your timeline!</p>
          </div>
        )}
      </div>
    </Card>
  );
}
