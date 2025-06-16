
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
  
  // Fixed angles for player positioning on the ground: 60°, 90°, 120°, 210°, 240°, 270°
  const fixedAngles = [60, 90, 120, 210, 240, 270];
  
  const getPlayerPosition = (index: number) => {
    const angleInDegrees = fixedAngles[index % fixedAngles.length];
    const angle = (angleInDegrees * Math.PI) / 180; // Convert to radians
    const radius = 450; // Distance from center
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y, angle: angleInDegrees };
  };

  return (
    <>
      {otherPlayers.map((player, index) => {
        const { x, y, angle } = getPlayerPosition(index);
        const isLeft = x < -50;
        const isRight = x > 50;
        const isTop = y < -50;
        
        return (
          <div
            key={player.id}
            className="absolute z-10 transition-all duration-700 ease-out"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(75% + ${y * 0.4}px)`, // Position on "ground" with perspective
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={cn(
              "flex items-center gap-4 p-4 rounded-2xl shadow-2xl transition-all duration-500 bg-black/40 backdrop-blur-xl border border-white/30 hover:bg-black/50 hover:scale-105 hover:shadow-[0_0_30px_rgba(147,51,234,0.4)]",
              isLeft && "flex-row-reverse",
              (isTop || (!isLeft && !isRight)) && "flex-col items-center"
            )}>
              
              {/* Player Info */}
              <div className={cn(
                "text-center transition-all duration-300",
                isLeft && "text-right",
                isRight && "text-left"
              )}>
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white/50 shadow-lg animate-pulse" 
                    style={{ backgroundColor: player.timelineColor }}
                  />
                  <span className="font-bold text-white text-base drop-shadow-lg">{player.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 text-yellow-400 animate-pulse" />
                  <span className="text-white font-medium">{player.score}/10</span>
                </div>
              </div>

              {/* Square Stacked Cards on the ground - rotated 90 degrees */}
              <div className="relative">
                <div className="relative w-20 h-20 flex justify-center items-center">
                  {player.timeline.slice(0, 8).map((card, idx) => (
                    <div
                      key={idx}
                      className="absolute transition-all duration-700 hover:scale-125 cursor-pointer group"
                      style={{
                        zIndex: idx,
                        left: `${idx * 2}px`,
                        top: `${idx * -2.5}px`,
                        opacity: Math.max(0.7, 1 - idx * 0.08),
                        width: 32,
                        height: 32,
                        backgroundColor: card.cardColor,
                        borderRadius: 8,
                        border: "2px solid rgba(255,255,255,0.5)",
                        boxShadow: `0 ${4 + idx * 2}px ${8 + idx * 2}px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)`,
                        transform: `rotate(${90 + (idx - 3) * 4}deg) perspective(300px) rotateX(15deg)`, // 90 degree base rotation plus 3D effect
                      }}
                    >
                      {/* Shimmer effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg" />
                    </div>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <div className="text-xs text-purple-200 font-medium drop-shadow-lg">
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
