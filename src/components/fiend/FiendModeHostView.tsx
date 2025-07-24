import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Crown, Users, Clock, Target } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface FiendModeHostViewProps {
  players: Player[];
  currentSong: Song;
  roundNumber: number;
  totalRounds: number;
  roomCode: string;
  timeLeft?: number;
  playerGuesses?: Record<string, { year: number; accuracy: number; points: number }>;
}

export function FiendModeHostView({
  players,
  currentSong,
  roundNumber,
  totalRounds,
  roomCode,
  timeLeft = 30,
  playerGuesses = {}
}: FiendModeHostViewProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const allPlayersSubmitted = players.every(p => playerGuesses[p.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#a53b8b]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#107793]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4a4f5b]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Radio className="h-8 w-8 text-[#a53b8b]" />
            <h1 className="text-4xl font-bold text-white">Fiend Mode</h1>
          </div>
          <div className="flex items-center justify-center gap-8">
            <div className="text-[#d9e8dd]">
              <span className="text-lg font-bold">Round {roundNumber}</span>
              <span className="text-sm"> of {totalRounds}</span>
            </div>
            <div className="text-[#d9e8dd]">
              <span className="text-sm">Room:</span>
              <span className="text-lg font-bold ml-1">{roomCode}</span>
            </div>
            <div className="flex items-center gap-2 text-[#4CC9F0]">
              <Clock className="h-5 w-5" />
              <span className="text-lg font-bold">{timeLeft}s</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          {/* Current Song Display */}
          <div className="lg:col-span-2">
            <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#a53b8b]/30 p-8 rounded-3xl shadow-lg shadow-[#a53b8b]/10">
              <div className="text-center">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">Mystery Track</h2>
                  <p className="text-[#d9e8dd] text-lg">Players are guessing the year</p>
                </div>

                {/* Song Card */}
                <div className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 rounded-3xl p-8 mb-6">
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-white mb-2">{currentSong.deezer_title}</div>
                    <div className="text-2xl text-[#a53b8b] font-semibold">{currentSong.deezer_artist}</div>
                  </div>

                  {/* Actual Year (Hidden until all submit) */}
                  {allPlayersSubmitted && (
                    <div className="bg-[#a53b8b]/20 border border-[#a53b8b]/50 rounded-2xl p-4">
                      <div className="text-[#a53b8b] text-sm font-bold mb-1">ACTUAL YEAR</div>
                      <div className="text-4xl font-bold text-white">{currentSong.release_year}</div>
                    </div>
                  )}
                </div>

                {/* Submission Status */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {players.map(player => (
                    <div 
                      key={player.id}
                      className={cn(
                        "p-3 rounded-xl border transition-all duration-300",
                        playerGuesses[player.id] 
                          ? "bg-green-500/20 border-green-500/50" 
                          : "bg-[#4a4f5b]/20 border-[#4a4f5b]/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border-2 border-white/20"
                          style={{ backgroundColor: player.color }}
                        />
                        <div className="text-white font-bold text-sm truncate">{player.name}</div>
                      </div>
                      {playerGuesses[player.id] ? (
                        <div className="text-green-400 text-xs font-bold mt-1">
                          Guessed {playerGuesses[player.id].year}
                        </div>
                      ) : (
                        <div className="text-[#d9e8dd]/60 text-xs mt-1">Thinking...</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Leaderboard */}
          <div>
            <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-6 rounded-3xl shadow-lg shadow-[#107793]/10">
              <div className="flex items-center gap-3 mb-6">
                <Crown className="h-6 w-6 text-[#4CC9F0]" />
                <h3 className="text-2xl font-bold text-white">Leaderboard</h3>
              </div>
              
              <div className="space-y-3">
                {sortedPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                      index === 0 
                        ? "bg-[#4CC9F0]/20 border-[#4CC9F0]/50" 
                        : "bg-[#1A1A2E]/50 border-[#4a4f5b]/30"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      index === 0 ? "bg-[#4CC9F0] text-black" : "bg-[#4a4f5b] text-white"
                    )}>
                      {index + 1}
                    </div>
                    
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: player.color }}
                    />
                    
                    <div className="flex-1">
                      <div className="text-white font-bold">{player.name}</div>
                      {playerGuesses[player.id] && (
                        <div className="text-xs">
                          <span className="text-[#d9e8dd]/70">Guess: </span>
                          <span className="text-[#a53b8b] font-bold">{playerGuesses[player.id].year}</span>
                          {allPlayersSubmitted && (
                            <>
                              <span className="text-[#d9e8dd]/70"> • </span>
                              <span className="text-[#4CC9F0] font-bold">
                                {playerGuesses[player.id].accuracy.toFixed(1)}%
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#4CC9F0]">{player.score}</div>
                      <div className="text-[#d9e8dd] text-xs">pts</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Round Progress */}
              <div className="mt-6 pt-6 border-t border-[#4a4f5b]/30">
                <div className="text-center">
                  <div className="text-white font-bold mb-2">Round Progress</div>
                  <div className="w-full bg-[#1A1A2E]/70 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-[#a53b8b] to-[#107793] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(roundNumber / totalRounds) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-[#d9e8dd]/70 mt-1">
                    {roundNumber} of {totalRounds} rounds complete
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Results Display */}
        {allPlayersSubmitted && (
          <div className="mt-8 max-w-7xl mx-auto">
            <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#4CC9F0]/30 p-6 rounded-3xl shadow-lg shadow-[#4CC9F0]/10">
              <h3 className="text-2xl font-bold text-white text-center mb-6">Round Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(playerGuesses).map(([playerId, guess]) => {
                  const player = players.find(p => p.id === playerId);
                  if (!player) return null;
                  
                  return (
                    <div key={playerId} className="bg-[#1A1A2E]/50 border border-[#4a4f5b]/30 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white/20"
                          style={{ backgroundColor: player.color }}
                        />
                        <div className="text-white font-bold">{player.name}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[#d9e8dd] text-sm">Guess:</span>
                          <span className="text-[#a53b8b] font-bold">{guess.year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#d9e8dd] text-sm">Actual:</span>
                          <span className="text-white font-bold">{currentSong.release_year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#d9e8dd] text-sm">Accuracy:</span>
                          <span className="text-[#4CC9F0] font-bold">{guess.accuracy.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#d9e8dd] text-sm">Points:</span>
                          <span className="text-green-400 font-bold">+{guess.points}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}