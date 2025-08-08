
import { cn } from "@/lib/utils";
import { Player } from "@/types/game";
import { Badge } from './ui/badge';

interface CircularPlayersLayoutProps {
  players: Player[];
  currentPlayerId: string;
  transitioningTurn?: boolean;
  transitionProgress?: number;
}

export function CircularPlayersLayout({ 
  players, 
  currentPlayerId, 
  transitioningTurn = false,
  transitionProgress = 0
}: CircularPlayersLayoutProps) {
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);
  
  return (
    <div className="absolute bottom-4 left-0 right-0 z-20">
      <div className="flex justify-center items-center gap-8 px-8">
        {otherPlayers.map((player) => {
          // Calculate if this player is becoming the current player
          const nextPlayerIndex = players.findIndex(p => p.id === currentPlayerId);
          const thisPlayerIndex = players.findIndex(p => p.id === player.id);
          const willBecomeCurrent = transitioningTurn && ((nextPlayerIndex + 1) % players.length) === thisPlayerIndex;
          
          // Enhanced transition animations
          const slideOffset = transitioningTurn 
            ? Math.sin(transitionProgress * Math.PI) * 20 
            : 0;
          
          const scaleValue = willBecomeCurrent 
            ? 1 + 0.2 * transitionProgress 
            : transitioningTurn 
            ? 0.95 - 0.1 * transitionProgress 
            : 1;
          
          const opacityValue = willBecomeCurrent 
            ? 1 
            : transitioningTurn 
            ? 0.7 + 0.3 * (1 - transitionProgress) 
            : 1;

          return (
            <div
              key={player.id}
              className={cn(
                "transition-all duration-1200 ease-out",
                willBecomeCurrent && "player-elevate"
              )}
              style={{
                transform: `translateY(${slideOffset}px) scale(${scaleValue})`,
                opacity: opacityValue
              }}
            >
              <div className="text-center">
                <div 
                  className={cn(
                    "bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 mb-3 shadow-xl",
                    willBecomeCurrent && "glow-pulse"
                  )}
                  style={{
                    borderColor: willBecomeCurrent ? '#4ECDC4' : 'rgba(255,255,255,0.2)',
                    boxShadow: willBecomeCurrent 
                      ? `0 0 ${20 + 10 * transitionProgress}px rgba(78, 205, 196, ${0.3 + 0.2 * transitionProgress})` 
                      : undefined
                  }}
                >
                  <div className="flex items-center gap-3 text-white text-base">
                    <div 
                      className={cn(
                        "w-4 h-4 rounded-full ring-2 ring-white/50",
                        willBecomeCurrent && "timeline-expand"
                      )}
                      style={{ 
                        backgroundColor: player.color,
                        transform: willBecomeCurrent ? `scale(${1 + 0.3 * transitionProgress})` : 'scale(1)'
                      }}
                    />
                    <span className="font-semibold">{player.name}</span>
                    <Badge className="bg-purple-600 text-white text-sm">
                      {player.score}
                    </Badge>
                  </div>
                </div>
                
                {/* Player's timeline preview with enhanced animations */}
                <div className="flex justify-center" style={{ gap: '-8px' }}>
                  {player.timeline.slice(0, 5).map((song, songIndex) => (
                    <div
                      key={songIndex}
                      className={cn(
                        "w-7 h-7 rounded text-xs flex items-center justify-center text-white font-bold shadow-lg border border-white/20 transition-all duration-300 hover:scale-110 hover:z-10 relative",
                        willBecomeCurrent && "timeline-expand"
                      )}
                      style={{ 
                        backgroundColor: song.cardColor,
                        marginLeft: songIndex > 0 ? '-4px' : '0',
                        zIndex: player.timeline.length - songIndex,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                        transform: willBecomeCurrent 
                          ? `scale(${1 + 0.5 * transitionProgress}) translateY(${-10 * transitionProgress}px)` 
                          : 'scale(1) translateY(0)',
                        animation: willBecomeCurrent 
                          ? `growToTimeline 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${songIndex * 0.1}s` 
                          : undefined
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
                      className={cn(
                        "w-7 h-7 rounded bg-white/30 text-xs flex items-center justify-center text-white font-bold border border-white/20 backdrop-blur-sm shadow-lg",
                        willBecomeCurrent && "timeline-expand"
                      )}
                      style={{ 
                        marginLeft: '-4px',
                        zIndex: 1,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transform: willBecomeCurrent 
                          ? `scale(${1 + 0.5 * transitionProgress}) translateY(${-10 * transitionProgress}px)` 
                          : 'scale(1) translateY(0)'
                      }}
                    >
                      +{player.timeline.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Global styles for transition animations */}
      <style>{`
        @keyframes growToTimeline {
          0% {
            transform: scale(1) translateY(0);
          }
          50% {
            transform: scale(1.8) translateY(-20px);
          }
          100% {
            transform: scale(4) translateY(-100px);
          }
        }
      `}</style>
    </div>
  );
}
