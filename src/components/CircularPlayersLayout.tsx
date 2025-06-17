
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
  
  return (
    <div className="absolute bottom-4 left-0 right-0 z-20">
      <div className="flex justify-center items-center gap-8 px-8">
        {otherPlayers.map((player, index) => (
          <div
            key={player.id}
            className="transition-all duration-1200 ease-out"
          >
            <div className="text-center">
              <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 mb-3 shadow-xl">
                <div className="flex items-center gap-3 text-white text-base">
                  <div 
                    className="w-4 h-4 rounded-full ring-2 ring-white/50" 
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="font-semibold">{player.name}</span>
                  <Badge className="bg-purple-600 text-white text-sm">
                    {player.score}
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-center" style={{ gap: '-8px' }}>
                {player.timeline.slice(0, 5).map((song, songIndex) => (
                  <div
                    key={songIndex}
                    className="w-7 h-7 rounded text-xs flex items-center justify-center text-white font-bold shadow-lg border border-white/20 transition-all duration-300 hover:scale-110 hover:z-10 relative"
                    style={{ 
                      backgroundColor: song.cardColor,
                      marginLeft: songIndex > 0 ? '-4px' : '0',
                      zIndex: player.timeline.length - songIndex,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded" />
                    <span className="relative z-10">
                      {song.release_year.slice(-2)}
                    </span>
                  </div>
                ))}
                {player.timeline.length > 5 && (
                  <div 
                    className="w-7 h-7 rounded bg-white/30 text-xs flex items-center justify-center text-white font-bold border border-white/20 backdrop-blur-sm shadow-lg"
                    style={{ 
                      marginLeft: '-4px',
                      zIndex: 1,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    +{player.timeline.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", className)}>
      {children}
    </div>
  );
}
