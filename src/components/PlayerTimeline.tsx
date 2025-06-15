
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Song, Player } from "@/pages/Index"; // We'll export types from Index

interface PlayerTimelineProps {
  player: Player;
  isCurrent: boolean;
  isDarkMode: boolean;
  draggedSong: Song | null;
  activeDrag: { playerId: string; position: number; song: Song | null } | null;
  hoveredCard: string | null;
  pendingPlacement: { playerId: string; song: Song; position: number } | null;
  throwingCard: { song: Song; playerId: string; position: number } | null;
  confirmPlacement: () => void;
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
  pendingPlacement,
  throwingCard,
  confirmPlacement,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  setHoveredCard,
  currentPlayerId
}: PlayerTimelineProps) {
  // ... code nearly identical to Index, adapted to props
  let ghostIndex: number | null = null;
  if (
    activeDrag &&
    activeDrag.playerId === player.id &&
    draggedSong
  ) {
    ghostIndex = activeDrag.position;
  }
  return (
    <Card
      className={cn(
        "p-4 shadow-lg transition-all duration-300 mx-auto my-4 w-full max-w-2xl",
        isDarkMode ? "bg-gray-800/90 backdrop-blur-sm border-gray-700" : "bg-white/90 backdrop-blur-sm"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-5 h-5 rounded-full border-2 border-white shadow-md" 
            style={{ backgroundColor: player.color }}
          />
          <h3 className={cn("text-base font-bold", isDarkMode ? "text-white" : "text-gray-800")}>{player.name}</h3>
          {isCurrent && (
            <Badge className="bg-yellow-100 text-yellow-800 animate-pulse text-xs">Current Turn</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className={cn("font-bold text-sm", isDarkMode ? "text-white" : "text-gray-800")}>{player.score}/10</span>
        </div>
      </div>
      <div
        className={cn(
          "min-h-20 border-2 border-dashed rounded-lg p-3 overflow-x-auto transition-all duration-300 flex items-center justify-center",
          isDarkMode
            ? "border-gray-600 bg-gray-700/30"
            : "border-gray-300 bg-gray-50/50"
        )}
        onDragOver={(e) =>
          handleDragOver(e, player.id, player.timeline.length)
        }
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(player.id, player.timeline.length)}
        style={{
          minHeight: 90,
          transition: "all 0.5s cubic-bezier(.25,1.7,.5,1.5)"
        }}
      >
        <div className="flex gap-2 min-w-fit transition-all duration-300">
          {/* Timeline cards with possible ghost */}
          {player.timeline.map((song, index) => {
            const ghostHere =
              ghostIndex === index &&
              draggedSong &&
              player.id === currentPlayerId;

            return (
              <div key={`${player.id}-slot-${index}`} className="relative flex items-center">
                {ghostHere && (
                  <div
                    className={cn(
                      "w-16 h-16 rounded-sm border-2 border-dashed flex flex-col items-center justify-center p-2 text-center flex-shrink-0",
                      "bg-gray-200/50 dark:bg-gray-900/30",
                      "scale-105 animate-pulse opacity-70 transition-all duration-300"
                    )}
                    style={{
                      borderColor: player.timelineColor,
                      borderStyle: "dashed",
                    }}
                  >
                    <span className="text-xs text-gray-400">Place here</span>
                  </div>
                )}
                <div
                  className={cn(
                    "w-16 h-16 rounded-sm shadow-md border-2 flex flex-col items-center justify-center p-2 text-center flex-shrink-0 transition-all duration-300 cursor-pointer group"
                  )}
                  style={{
                    backgroundColor: player.timelineColor,
                    borderColor: "rgba(255,255,255,0.2)",
                  }}
                  onDragOver={(e) =>
                    handleDragOver(e, player.id, index)
                  }
                  onDrop={() => handleDrop(player.id, index)}
                  onClick={pendingPlacement?.playerId === player.id && pendingPlacement?.position === index ? confirmPlacement : undefined}
                  onMouseEnter={() => setHoveredCard(`${player.id}-${index}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Animate based on state */}
                  {pendingPlacement?.playerId === player.id && 
                    pendingPlacement?.position === index ? (
                      <>
                        <div className="text-xs font-medium text-white/90 leading-tight mb-1">
                          Click to
                        </div>
                        <div className="text-sm font-bold text-white mb-1">
                          ?
                        </div>
                        <div className="text-xs italic text-white/75 leading-tight">
                          Confirm
                        </div>
                      </>
                  ) : throwingCard?.playerId === player.id && 
                      throwingCard?.position === index ? (
                      <>
                        <div className="text-xs font-medium text-white/90 truncate w-full leading-tight">
                          {throwingCard?.song?.deezer_artist}
                        </div>
                        <div className="text-sm font-bold text-white my-1">
                          {throwingCard?.song?.release_year}
                        </div>
                        <div className="text-xs italic text-white/75 truncate w-full leading-tight">
                          {throwingCard?.song?.deezer_title}
                        </div>
                      </>
                  ) : (
                    <>
                      <div className={cn("text-xs font-medium text-white/90 truncate w-full leading-tight transition-all duration-200",
                        hoveredCard === `${player.id}-${index}` ? "animate-pulse" : "")}>
                        {song.deezer_artist}
                      </div>
                      <div className="text-sm font-bold text-white my-1">
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
          })}
          {/* If ghost card slot is at end of list */}
          {ghostIndex === player.timeline.length &&
            draggedSong &&
            player.id === currentPlayerId && (
              <div
                className={cn(
                  "w-16 h-16 rounded-sm border-2 border-dashed flex flex-col items-center justify-center p-2 text-center flex-shrink-0 scale-105 animate-pulse opacity-70 transition-all duration-300",
                  "bg-gray-200/50 dark:bg-gray-900/30"
                )}
                style={{
                  borderColor: player.timelineColor,
                  borderStyle: "dashed",
                }}
              >
                <span className="text-xs text-gray-400">
                  Place here
                </span>
              </div>
            )}
        </div>
      </div>
    </Card>
  );
}
