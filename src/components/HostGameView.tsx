
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Crown, Users, Trophy, Star } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { MysteryCard } from '@/components/MysteryCard';
import { cn } from '@/lib/utils';

interface HostGameViewProps {
  currentTurnPlayer: Player | null;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
}

export function HostGameView({
  currentTurnPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed
}: HostGameViewProps) {
  if (!currentTurnPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-spin">🎵</div>
          <div className="text-2xl font-bold mb-2">Loading Game...</div>
          <div className="text-slate-300">Setting up the next turn</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      
      {/* Header */}
      <div className="absolute top-6 left-4 right-4 z-40">
        <div className="flex justify-between items-center">
          {/* Host indicator */}
          <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-yellow-400/50 shadow-lg">
            <Crown className="h-6 w-6 text-yellow-400" />
            <div className="text-white">
              <div className="font-bold text-lg">Host View</div>
              <div className="text-sm text-yellow-200">Timeline Tunes</div>
            </div>
          </div>

          {/* Room Code */}
          <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400 text-lg px-4 py-2 font-mono">
            {roomCode}
          </Badge>
        </div>
      </div>

      {/* Current Turn Section */}
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
        <div className="text-center space-y-6">
          {/* Current Player Info */}
          <div className="bg-slate-800/80 backdrop-blur-md px-8 py-4 rounded-2xl border border-indigo-400/30 shadow-lg">
            <div className="flex items-center justify-center gap-4 text-white">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg" 
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <div className="text-center">
                <div className="font-bold text-xl">{currentTurnPlayer.name}'s Turn</div>
                <div className="text-sm text-indigo-200">Current Score: {currentTurnPlayer.score}/10</div>
              </div>
            </div>
          </div>

          {/* Mystery Card - Host can see it */}
          {currentSong && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl scale-110" />
              
              <MysteryCard
                song={currentSong}
                isRevealed={mysteryCardRevealed}
                isInteractive={false}
                className="w-48 h-60"
              />
              
              <div className="mt-4 text-sm text-purple-200 bg-purple-900/50 px-3 py-1 rounded-full">
                {currentTurnPlayer.name} is placing this card
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Player Timeline */}
      {currentTurnPlayer && (
        <div className="absolute bottom-60 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-600/30 shadow-xl">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                {currentTurnPlayer.name}'s Timeline
              </h3>
            </div>
            
            <div className="flex items-center gap-4">
              {currentTurnPlayer.timeline.length === 0 ? (
                <div className="text-center py-4 px-8">
                  <Music className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No cards placed yet</p>
                </div>
              ) : (
                currentTurnPlayer.timeline.map((song, index) => (
                  <div
                    key={index}
                    className="w-20 h-20 rounded-lg shadow-lg flex flex-col items-center justify-center p-2 text-white text-xs transition-all duration-300"
                    style={{ backgroundColor: song.cardColor }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg" />
                    <Music className="h-6 w-6 mb-1 opacity-80" />
                    <div className="text-center relative z-10">
                      <div className="font-bold text-xs mb-1 truncate w-full">
                        {song.deezer_title.length > 8 ? song.deezer_title.substring(0, 8) + '...' : song.deezer_title}
                      </div>
                      <div className="text-xs font-black">{song.release_year}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Players Overview */}
      <div className="absolute bottom-4 left-0 right-0 z-10 px-6">
        <Card className="bg-slate-800/80 backdrop-blur-md border-slate-600/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">All Players ({players.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map((player) => (
              <div
                key={player.id}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  player.id === currentTurnPlayer?.id
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-400/50"
                    : "bg-slate-700/50 border-slate-600/30"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: player.color }}
                  />
                  <div className="flex-1">
                    <div className="text-white font-bold text-sm">{player.name}</div>
                    <div className="text-slate-300 text-xs">
                      {player.timeline.length} cards • {player.score}/10 points
                    </div>
                  </div>
                  {player.id === currentTurnPlayer?.id && (
                    <div className="text-yellow-400 text-lg">👑</div>
                  )}
                </div>
                
                {/* Player's timeline preview */}
                <div className="flex gap-1 overflow-x-auto">
                  {player.timeline.slice(0, 5).map((song, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded text-xs flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: song.cardColor }}
                    >
                      '{song.release_year.slice(-2)}
                    </div>
                  ))}
                  {player.timeline.length > 5 && (
                    <div className="w-6 h-6 rounded bg-slate-600 text-xs flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0">
                      +{player.timeline.length - 5}
                    </div>
                  )}
                  {player.timeline.length === 0 && (
                    <div className="text-xs text-slate-400">No cards yet</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
