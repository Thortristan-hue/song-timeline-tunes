
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, Crown, Users, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface SprintModeHostViewProps {
  players: Player[];
  currentSong: Song;
  targetCards: number;
  roomCode: string;
  timeLeft?: number;
  playerTimeouts?: Record<string, number>; // playerId -> timeout remaining
  recentPlacements?: Record<string, { correct: boolean; song: Song; timestamp: number }>;
}

export function SprintModeHostView({
  players,
  currentSong,
  targetCards,
  roomCode,
  timeLeft = 30,
  playerTimeouts = {},
  recentPlacements = {}
}: SprintModeHostViewProps) {
  // CRITICAL FIX: Add safety check for currentSong
  if (!currentSong || !currentSong.deezer_title || !currentSong.deezer_artist || !currentSong.release_year) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">⚡</div>
          <div className="text-2xl font-bold mb-3">Loading Sprint Challenge...</div>
          <div className="text-lg">Preparing the next mystery card for racing</div>
        </div>
      </div>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => b.timeline.length - a.timeline.length);
  const leader = sortedPlayers[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#107793]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#a53b8b]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4a4f5b]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Timer className="h-8 w-8 text-[#107793]" />
            <h1 className="text-4xl font-bold text-white">Sprint Mode</h1>
          </div>
          <div className="flex items-center justify-center gap-8">
            <div className="text-[#d9e8dd]">
              <span className="text-sm">Race to:</span>
              <span className="text-lg font-bold ml-1">{targetCards} cards</span>
            </div>
            <div className="text-[#d9e8dd]">
              <span className="text-sm">Room:</span>
              <span className="text-lg font-bold ml-1">{roomCode}</span>
            </div>
            <div className="flex items-center gap-2 text-[#4CC9F0]">
              <Target className="h-5 w-5" />
              <span className="text-lg font-bold">{timeLeft}s</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          
          {/* Current Song Display */}
          <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-6 rounded-3xl shadow-lg shadow-[#107793]/10 mb-8">
            <div className="text-center">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">Current Mystery Card</h2>
                <p className="text-[#d9e8dd]">All players are racing to place this correctly</p>
              </div>

              <div className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 rounded-2xl p-6">
                <div className="text-2xl font-bold text-white mb-1">{currentSong.deezer_title}</div>
                <div className="text-xl text-[#107793] font-semibold">{currentSong.deezer_artist}</div>
                <div className="text-sm text-[#d9e8dd]/70 mt-2">Released: {currentSong.release_year}</div>
              </div>
            </div>
          </Card>

          {/* Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPlayers.map((player, index) => {
              const progress = (player.timeline.length / targetCards) * 100;
              const isInTimeout = playerTimeouts[player.id] > 0;
              const recentPlacement = recentPlacements[player.id];
              const isLeader = player.id === leader?.id && player.timeline.length > 0;

              return (
                <Card 
                  key={player.id}
                  className={cn(
                    "bg-[#0e1f2f]/60 backdrop-blur-3xl border rounded-3xl shadow-lg transition-all duration-300 relative overflow-hidden",
                    isLeader ? "border-[#4CC9F0]/50 shadow-[#4CC9F0]/10 ring-2 ring-[#4CC9F0]/30" : "border-[#107793]/30 shadow-[#107793]/10",
                    isInTimeout && "border-red-500/50 shadow-red-500/10"
                  )}
                >
                  {/* Leader Crown */}
                  {isLeader && (
                    <div className="absolute top-4 right-4 z-10">
                      <Crown className="h-6 w-6 text-[#4CC9F0]" />
                    </div>
                  )}

                  {/* Timeout Overlay */}
                  {isInTimeout && (
                    <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm z-20 flex items-center justify-center">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
                        <div className="text-white font-bold">Timeout</div>
                        <div className="text-red-200 text-2xl font-bold">{playerTimeouts[player.id]}s</div>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Player Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-2xl font-bold text-white">#{index + 1}</div>
                      <div 
                        className="w-5 h-5 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: player.color }}
                      />
                      <div className="flex-1">
                        <div className="text-white font-bold text-lg">{player.name}</div>
                        <div className="text-[#d9e8dd] text-sm">
                          {player.timeline.length}/{targetCards} cards
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-[#1A1A2E]/70 rounded-full h-4">
                        <div 
                          className={cn(
                            "h-4 rounded-full transition-all duration-500",
                            isLeader 
                              ? "bg-gradient-to-r from-[#4CC9F0] to-[#107793]"
                              : "bg-gradient-to-r from-[#107793] to-[#4a4f5b]"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-center text-sm text-[#d9e8dd]/70 mt-1">
                        {progress.toFixed(0)}% Complete
                      </div>
                    </div>

                    {/* Recent Placement Result */}
                    {recentPlacement && Date.now() - recentPlacement.timestamp < 3000 && (
                      <div className={cn(
                        "flex items-center gap-2 p-3 rounded-xl mb-4 border",
                        recentPlacement.correct 
                          ? "bg-green-500/20 border-green-500/50"
                          : "bg-red-500/20 border-red-500/50"
                      )}>
                        {recentPlacement.correct ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        )}
                        <div className="text-sm">
                          <div className={cn(
                            "font-bold",
                            recentPlacement.correct ? "text-green-400" : "text-red-400"
                          )}>
                            {recentPlacement.correct ? "Correct!" : "Incorrect!"}
                          </div>
                          <div className="text-[#d9e8dd]/80 text-xs">
                            {recentPlacement.song.deezer_title}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline Display */}
                    <div>
                      <div className="text-white font-bold text-sm mb-2">Timeline</div>
                      <div className="flex gap-1 overflow-x-auto">
                        {player.timeline.length === 0 ? (
                          <div className="text-center w-full text-[#d9e8dd]/60 text-sm py-2">
                            No cards yet
                          </div>
                        ) : (
                          player.timeline
                            .filter(song => song !== null)
                            .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year))
                            .map((song, idx) => (
                              <div 
                                key={song.id}
                                className="min-w-[50px] text-center p-2 bg-[#4CC9F0]/20 border border-[#4CC9F0]/50 rounded-lg"
                              >
                                <div className="text-[#4CC9F0] font-bold text-xs">{song.release_year}</div>
                                <div className="text-white text-xs truncate">{song.deezer_title.substring(0, 6)}</div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Win Indicator */}
                    {player.timeline.length >= targetCards && (
                      <div className="mt-4 text-center">
                        <Badge className="bg-[#4CC9F0] text-black font-bold text-lg px-4 py-2">
                          🏆 WINNER!
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Game Stats */}
          <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#4a4f5b]/30 p-6 rounded-3xl shadow-lg mt-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-[#4CC9F0]">{players.length}</div>
                <div className="text-[#d9e8dd] text-sm">Players Racing</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#107793]">{leader?.timeline.length || 0}</div>
                <div className="text-[#d9e8dd] text-sm">Leader Cards</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#a53b8b]">
                  {Object.keys(playerTimeouts).filter(id => playerTimeouts[id] > 0).length}
                </div>
                <div className="text-[#d9e8dd] text-sm">In Timeout</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#4CC9F0]">
                  {Math.max(0, targetCards - (leader?.timeline.length || 0))}
                </div>
                <div className="text-[#d9e8dd] text-sm">Cards to Win</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
