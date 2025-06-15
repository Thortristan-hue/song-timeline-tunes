
import React from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Player } from "@/pages/Index";

interface CircularPlayersLayoutProps {
  players: Player[];
  currentPlayerId: string;
  isDarkMode: boolean;
}

export default function CircularPlayersLayout({ 
  players, 
  currentPlayerId, 
  isDarkMode 
}: CircularPlayersLayoutProps) {
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);
  
  const getPlayerPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    const radius = 300; // Distance from center
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  return (
    <>
      {otherPlayers.map((player, index) => {
        const { x, y } = getPlayerPosition(index, otherPlayers.length);
        const isLeft = x < -100;
        const isRight = x > 100;
        const isTop = y < -100;
        
        return (
          <div
            key={player.id}
            className="absolute z-10 transition-all duration-700 ease-out"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={cn(
              "flex items-center gap-4 p-4 rounded-2xl shadow-2xl transition-all duration-500 bg-white/10 backdrop-blur-xl border border-white/20",
              isLeft && "flex-row-reverse",
              (isTop || (!isLeft && !isRight)) && "flex-col items-center"
            )}>
              
              {/* Player Info */}
              <div className={cn(
                "text-center transition-all duration-300",
                isLeft && "text-right",
                isRight && "text-left"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white/50 shadow-lg" 
                    style={{ backgroundColor: player.timelineColor }}
                  />
                  <span className="font-bold text-white text-lg">{player.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-white font-medium">{player.score}/10</span>
                </div>
              </div>

              {/* Stacked Cards */}
              <div className="relative">
                <div className="relative w-16 h-20 flex justify-center items-center">
                  {player.timeline.map((_, idx) => (
                    <div
                      key={idx}
                      className="absolute transition-all duration-500 hover:scale-110"
                      style={{
                        zIndex: idx,
                        left: `${idx * 1}px`,
                        top: `${idx * -2}px`,
                        opacity: Math.max(0.4, 1 - idx * 0.1),
                        width: 40,
                        height: 56,
                        background: `linear-gradient(135deg, ${player.timelineColor}, ${player.timelineColor}dd)`,
                        borderRadius: 8,
                        border: "2px solid rgba(255,255,255,0.3)",
                        boxShadow: `0 ${4 + idx}px ${8 + idx * 2}px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)`,
                        transform: `rotate(${(idx - 2) * 1.5}deg)`,
                      }}
                    />
                  ))}
                </div>
                <div className="text-center mt-2">
                  <div className="text-xs text-purple-200 font-medium">
                    {player.timeline.length} cards
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
