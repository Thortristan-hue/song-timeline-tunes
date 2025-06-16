
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
    <div>
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
              top: `calc(70% + ${y * 0.5}px)`, // Position on "ground" with perspective
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Remove the container box - just show cards laid on table */}
            <div className="flex flex-col items-center">
              
              {/* Player Info - floating above cards */}
              <div className="text-center mb-3 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-4 h-4 rounded-full border border-white/50" 
                    style={{ backgroundColor: player.timelineColor }}
                  />
                  <span className="font-bold text-white text-sm">{player.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Trophy className="h-3 w-3 text-yellow-400" />
                  <span className="text-white font-medium">{player.score}/10</span>
                  <span className="text-white/70">({player.timeline.length} cards)</span>
                </div>
              </div>

              {/* Cards laid flat on the table in a small fan */}
              <div className="relative">
                <div className="relative w-24 h-16 flex justify-center items-center">
                  {player.timeline.slice(0, 8).map((card, idx) => (
                    <div
                      key={idx}
                      className="absolute transition-all duration-500 hover:scale-110 cursor-pointer group"
                      style={{
                        zIndex: idx,
                        left: `${idx * 3}px`,
                        top: `${idx * -1}px`,
                        opacity: Math.max(0.8, 1 - idx * 0.05),
                        width: 28,
                        height: 28,
                        backgroundColor: card.cardColor,
                        borderRadius: 6,
                        border: "1px solid rgba(255,255,255,0.4)",
                        boxShadow: `0 ${2 + idx}px ${4 + idx}px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)`,
                        transform: `rotate(${(idx - 3) * 3}deg) perspective(200px) rotateX(20deg)`, // Laid flat on table with slight 3D
                      }}
                    >
                      {/* Card content - show release year */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-sm">
                          {card.release_year}
                        </span>
                      </div>
                      
                      {/* Subtle shine effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
