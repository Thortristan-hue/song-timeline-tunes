
import React from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Player } from "@/pages/Index";

interface CircularPlayersLayoutProps {
  players: Player[];
  currentPlayerId: string;
  isDarkMode: boolean;
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

export default function CircularPlayersLayout({ 
  players, 
  currentPlayerId, 
  isDarkMode 
}: CircularPlayersLayoutProps) {
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);
  
  // Fixed angles for player positioning: 60°, 90°, 120°, 210°, 240°, 270°
  const fixedAngles = [60, 90, 120, 210, 240, 270];
  
  const getPlayerPosition = (index: number) => {
    const angleInDegrees = fixedAngles[index % fixedAngles.length];
    const angle = (angleInDegrees * Math.PI) / 180; // Convert to radians
    const radius = 300; // Distance from center
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
            className="absolute z-10 transition-all duration-1000 ease-out"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-2xl shadow-2xl transition-all duration-500 bg-white/15 backdrop-blur-xl border border-white/30 hover:bg-white/20 hover:scale-105",
              isLeft && "flex-row-reverse",
              (isTop || (!isLeft && !isRight)) && "flex-col items-center"
            )}>
              
              {/* Player Info */}
              <div className={cn(
                "text-center transition-all duration-300",
                isLeft && "text-right",
                isRight && "text-left"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-4 h-4 rounded-full border border-white/50 shadow-lg animate-pulse" 
                    style={{ backgroundColor: getRandomCardColor() }}
                  />
                  <span className="font-bold text-white text-sm">{player.name}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Trophy className="h-3 w-3 text-yellow-400 animate-bounce" />
                  <span className="text-white font-medium">{player.score}/10</span>
                </div>
              </div>

              {/* Square Stacked Cards */}
              <div className="relative">
                <div className="relative w-12 h-12 flex justify-center items-center">
                  {player.timeline.slice(0, 5).map((_, idx) => (
                    <div
                      key={idx}
                      className="absolute transition-all duration-700 hover:scale-110 cursor-pointer animate-pulse"
                      style={{
                        zIndex: idx,
                        left: `${idx * 1}px`,
                        top: `${idx * -1.5}px`,
                        opacity: Math.max(0.5, 1 - idx * 0.15),
                        width: 24,
                        height: 24,
                        background: `linear-gradient(135deg, ${getRandomCardColor()}, ${getRandomCardColor()}dd)`,
                        borderRadius: 4,
                        border: "1px solid rgba(255,255,255,0.3)",
                        boxShadow: `0 ${2 + idx}px ${4 + idx}px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)`,
                        transform: `rotate(${(idx - 2) * 2}deg)`,
                        animationDelay: `${idx * 0.2}s`,
                        animationDuration: `${2 + idx * 0.5}s`
                      }}
                    />
                  ))}
                </div>
                <div className="text-center mt-1">
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
