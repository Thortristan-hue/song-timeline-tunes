
import React from "react";
import { cn } from "@/lib/utils";
import { Player } from "@/pages/Index";

interface SidePlayersStackProps {
  players: Player[];
  currentId: string;
  isDarkMode: boolean;
}

export function SidePlayersStack({ players, currentId, isDarkMode }: SidePlayersStackProps) {
  return (
    <div className={cn(
      "flex flex-col justify-center items-center gap-6 h-full w-32 py-4"
    )}>
      {players.filter(p => p.id !== currentId).map((player) => (
        <div key={player.id} className="flex flex-col items-center group transition-all">
          <div className="relative h-24 w-20 flex justify-center items-center">
            {/* Stack cards visually - now square */}
            {player.timeline.map((_, idx) => (
              <div
                key={idx}
                className="absolute left-0 right-0 mx-auto transition-all duration-300 group-hover:scale-105"
                style={{
                  zIndex: idx,
                  top: `${idx * 2}px`,
                  opacity: Math.max(0.3, 1 - idx * 0.15),
                  width: 40,
                  height: 40,
                  background: `linear-gradient(135deg, ${player.timelineColor}, ${player.timelineColor}dd)`,
                  borderRadius: 8,
                  border: "2px solid rgba(255,255,255,0.2)",
                  boxShadow: `0 ${2 + idx}px ${6 + idx * 2}px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
                  transform: `rotate(${(idx - 2) * 2}deg)`,
                }}
              ></div>
            ))}
          </div>
          <div className="text-center mt-2">
            <div className={cn('text-sm font-bold', isDarkMode ? "text-white" : "text-gray-700")}>
              {player.name}
            </div>
            <div className={cn('text-xs opacity-75', isDarkMode ? "text-purple-300" : "text-gray-500")}>
              {player.timeline.length} cards
            </div>
            <div className="w-8 h-1 mx-auto mt-1 rounded-full opacity-50" style={{ backgroundColor: player.timelineColor }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
