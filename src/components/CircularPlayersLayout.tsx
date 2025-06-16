
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
    const radius = 400; // Distance from center
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
            className="absolute z-10 transition-all duration-500 ease-out"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(80% + ${y * 0.3}px)`, // Position on "ground" with perspective
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={cn(
              "flex items-center gap-4 p-4 rounded-2xl shadow-2xl transition-all duration-300 bg-black/30 backdrop-blur-xl border border-white/20 hover:bg-black/40 hover:scale-105",
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
                    className="w-5 h-5 rounded-full border-2 border-white/50 shadow-lg" 
                    style={{ backgroundColor: player.timelineColor }}
                  />
                  <span className="font-bold text-white text-base">{player.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-white font-medium">{player.score}/10</span>
                </div>
              </div>

              {/* Square Stacked Cards on the ground - rotated 90 degrees */}
              <div className="relative">
                <div className="relative w-16 h-16 flex justify-center items-center">
                  {player.timeline.slice(0, 5).map((card, idx) => (
                    <div
                      key={idx}
                      className="absolute transition-all duration-500 hover:scale-110 cursor-pointer"
                      style={{
                        zIndex: idx,
                        left: `${idx * 1.5}px`,
                        top: `${idx * -2}px`,
                        opacity: Math.max(0.6, 1 - idx * 0.1),
                        width: 28,
                        height: 28,
                        backgroundColor: card.cardColor,
                        borderRadius: 6,
                        border: "2px solid rgba(255,255,255,0.4)",
                        boxShadow: `0 ${3 + idx}px ${6 + idx}px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)`,
                        transform: `rotate(${90 + (idx - 2) * 3}deg)`, // 90 degree base rotation plus variation
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
