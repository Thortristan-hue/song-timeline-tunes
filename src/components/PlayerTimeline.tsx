
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Song, Player } from "@/pages/Index";

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
  let ghostIndex: number | null = null;
  if (
    activeDrag &&
    activeDrag.playerId === player.id &&
    draggedSong
  ) {
    ghostIndex = activeDrag.position;
  }

  const rejectPlacement = () => {
    // This will be handled by the parent component when throwingCard animation finishes
  };

  return (
    <Card
      className={cn(
        "p-6 shadow-2xl transition-all duration-500 mx-auto my-4 w-full max-w-4xl rounded-2xl",
        "bg-white/10 backdrop-blur-xl border border-white/20"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-6 h-6 rounded-full border-2 border-white/50 shadow-lg ring-2 ring-white/20" 
            style={{ backgroundColor: player.timelineColor }}
          />
          <h3 className="text-xl font-bold text-white">{player.name}'s Timeline</h3>
          {isCurrent && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse font-bold">Your Turn</Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span className="font-bold text-lg text-white">{player.score}/10</span>
        </div>
      </div>

      {/* Confirmation buttons for pending placement */}
      {pendingPlacement?.playerId === player.id && (
        <div className="mb-4 p-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h4 className="font-bold">Confirm Placement</h4>
              <p className="text-sm text-purple-200">
                Place "{pendingPlacement.song.deezer_title}" by {pendingPlacement.song.deezer_artist} ({pendingPlacement.song.release_year})?
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={confirmPlacement}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white rounded-full"
              >
                <Check className="h-4 w-4 mr-1" />
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "min-h-24 border-2 border-dashed rounded-xl p-4 overflow-x-auto transition-all duration-500 flex items-center justify-center",
          "border-purple-400/50 bg-white/5"
        )}
        onDragOver={(e) =>
          handleDragOver(e, player.id, player.timeline.length)
        }
        onDragLeave={handleDragLeave}
        onDrop={() => handleDrop(player.id, player.timeline.length)}
        style={{
          minHeight: 120,
        }}
      >
        <div className="flex gap-3 min-w-fit transition-all duration-500">
          {/* Timeline cards with possible ghost */}
          {player.timeline.map((song, index) => {
            const ghostHere =
              ghostIndex === index &&
              draggedSong &&
              player.id === currentPlayerId;

            const isPending = pendingPlacement?.playerId === player.id && pendingPlacement?.position === index;
            const isThrowing = throwingCard?.playerId === player.id && throwingCard?.position === index;

            return (
              <div key={`${player.id}-slot-${index}`} className="relative flex items-center">
                {ghostHere && (
                  <div
                    className={cn(
                      "w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center flex-shrink-0 mr-3",
                      "bg-white/10 backdrop-blur-sm",
                      "scale-105 animate-pulse opacity-70 transition-all duration-300"
                    )}
                    style={{
                      borderColor: player.timelineColor,
                      borderStyle: "dashed",
                    }}
                  >
                    <span className="text-xs text-purple-300 font-bold">Drop here</span>
                  </div>
                )}
                <div
                  className={cn(
                    "w-20 h-20 rounded-xl shadow-xl border-2 flex flex-col items-center justify-center p-2 text-center flex-shrink-0 transition-all duration-500 cursor-pointer group relative overflow-hidden",
                    isPending && "ring-4 ring-yellow-400 animate-pulse",
                    isThrowing && "animate-bounce scale-110"
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${player.timelineColor}, ${player.timelineColor}dd)`,
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                  onDragOver={(e) =>
                    handleDragOver(e, player.id, index)
                  }
                  onDrop={() => handleDrop(player.id, index)}
                  onMouseEnter={() => setHoveredCard(`${player.id}-${index}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
                  
                  {/* Card content */}
                  <div className="relative z-10 text-center">
                    {isPending ? (
                      <>
                        <div className="text-xs font-bold text-white/90 leading-tight mb-1">
                          {pendingPlacement?.song?.deezer_artist}
                        </div>
                        <div className="text-lg font-black text-white">
                          {pendingPlacement?.song?.release_year}
                        </div>
                        <div className="text-xs italic text-white/75 leading-tight">
                          Confirm?
                        </div>
                      </>
                    ) : isThrowing ? (
                      <>
                        <div className="text-xs font-bold text-white/90 truncate w-full leading-tight">
                          {throwingCard?.song?.deezer_artist}
                        </div>
                        <div className="text-lg font-black text-white my-1">
                          {throwingCard?.song?.release_year}
                        </div>
                        <div className="text-xs italic text-white/75 truncate w-full leading-tight">
                          Wrong!
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={cn("text-xs font-bold text-white/90 truncate w-full leading-tight transition-all duration-200",
                          hoveredCard === `${player.id}-${index}` ? "animate-pulse" : "")}>
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
                  "w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center flex-shrink-0 scale-105 animate-pulse opacity-70 transition-all duration-300",
                  "bg-white/10 backdrop-blur-sm"
                )}
                style={{
                  borderColor: player.timelineColor,
                  borderStyle: "dashed",
                }}
              >
                <span className="text-xs text-purple-300 font-bold">
                  Drop here
                </span>
              </div>
            )}
        </div>
      </div>
    </Card>
  );
}
