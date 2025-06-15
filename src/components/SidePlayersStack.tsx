
import React from "react";
import { cn } from "@/lib/utils";
import { Player } from "@/pages/Index";

interface SidePlayersStackProps {
  players: Player[];
  currentId: string;
  isDarkMode: boolean;
}

export default function SidePlayersStack({ players, currentId, isDarkMode }: SidePlayersStackProps) {
  return (
    <div className={cn(
      "flex flex-col justify-center items-center gap-4 h-full w-32 py-4"
    )}>
      {players.filter(p => p.id !== currentId).map((player) => (
        <div key={player.id} className="flex flex-col items-center group transition-all">
          <div className="relative h-20 w-12 flex justify-center items-center">
            {/* Stack cards visually */}
            {player.timeline.map((_, idx) => (
              <div
                key={idx}
                className="absolute left-0 right-0 mx-auto"
                style={{
                  zIndex: idx,
                  top: `${idx * 3}px`,
                  opacity: 0.45,
                  width: 32,
                  height: 48,
                  background: player.timelineColor,
                  borderRadius: 6,
                  border: "2px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.07)",
                  transition: "all 0.28s cubic-bezier(.25,1.7,.5,1.5)"
                }}
              ></div>
            ))}
          </div>
          <div className={cn('text-xs mt-0.5', isDarkMode ? "text-gray-300" : "text-gray-700")}>
            {player.name}
          </div>
          <div className={cn('text-xs mb-2', isDarkMode ? "text-gray-400" : "text-gray-500")}>
            {player.timeline.length} cards
          </div>
        </div>
      ))}
    </div>
  );
}
