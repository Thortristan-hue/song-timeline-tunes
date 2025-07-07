import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, Pause, Crown, Users, Trophy, Star } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { HostMysteryCard, GameBackground, PlayerResultDisplay } from '@/components/GameVisuals';
import { CircularPlayersLayout } from '@/components/CircularPlayersLayout';
import { SidePlayersStack } from '@/components/SidePlayersStack';
import { cn } from '@/lib/utils';

// Enhanced Host Game Background with better visual depth
export function HostGameBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
      
      {/* Animated orbs with better positioning */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/4 rounded-full blur-3xl" />
      
      {/* Overlay gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-950/60 via-transparent to-slate-900/40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
    </div>
  );
}

// Enhanced Host Header with better spacing
interface HostHeaderProps {
  roomCode: string;
  playersCount: number;
}

export function HostHeader({ roomCode, playersCount }: HostHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-8">
      <div className="flex justify-between items-center max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/12 backdrop-blur-3xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
            <Crown className="h-10 w-10 text-yellow-400" />
          </div>
          <div>
            <div className="text-white font-bold text-5xl tracking-tight">Timeliner</div>
            <div className="text-white/70 text-xl font-medium">Host Display</div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="bg-white/12 backdrop-blur-3xl px-10 py-6 rounded-3xl border border-white/20 shadow-2xl">
            <div className="text-white/70 text-sm font-medium mb-2">Players</div>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-400" />
              <div className="text-white font-bold text-3xl">{playersCount}</div>
            </div>
          </div>

          <div className="bg-white/12 backdrop-blur-3xl px-10 py-6 rounded-3xl border border-white/20 shadow-2xl">
            <div className="text-white/70 text-sm font-medium mb-2">Room Code</div>
            <div className="text-white font-mono text-3xl font-bold tracking-wider">{roomCode}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Leaderboard with better positioning and styling
interface HostLeaderboardProps {
  players: Player[];
}

export function HostLeaderboard({ players }: HostLeaderboardProps) {
  return (
    <div className="absolute top-32 right-8 z-40 w-96 max-h-[calc(100vh-16rem)] overflow-y-auto">
      <div className="bg-white/10 backdrop-blur-3xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div className="text-white font-bold text-2xl">Leaderboard</div>
        </div>

        <div className="space-y-4">
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div key={player.id} className="flex items-center gap-4 p-5 bg-white/8 rounded-2xl border border-white/10 hover:bg-white/12 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800' :
                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-yellow-600 text-white' :
                    'bg-white/20 text-white/80'
                  }`}>
                    {index + 1}
                  </div>
                  <div 
                    className="w-5 h-5 rounded-full shadow-lg border-2 border-white/40" 
                    style={{ backgroundColor: player.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-semibold text-lg truncate">{player.name}</div>
                    <div className="text-white/60 text-sm">{player.timeline.length} cards placed</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-2xl">{player.score}</div>
                  <div className="text-white/60 text-sm">points</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Enhanced Current Player Timeline with better layout
interface HostCurrentPlayerTimelineProps {
  currentPlayer: Player;
}

export function HostCurrentPlayerTimeline({ currentPlayer }: HostCurrentPlayerTimelineProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 p-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-3xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-6 mb-8">
            <div 
              className="w-12 h-12 rounded-2xl shadow-lg border-3 border-white/40 flex items-center justify-center" 
              style={{ backgroundColor: currentPlayer.color }}
            >
              <div className="w-6 h-6 bg-white/30 rounded-full" />
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-3xl tracking-tight mb-1">{currentPlayer.name}'s Timeline</div>
              <div className="text-white/70 text-lg">{currentPlayer.score}/10 points • {currentPlayer.timeline.length} cards placed</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-8 py-4 rounded-2xl border border-white/20">
              <div className="text-white/80 text-sm font-medium mb-1">Progress</div>
              <div className="text-white font-bold text-2xl">{Math.round((currentPlayer.timeline.length / 10) * 100)}%</div>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {currentPlayer.timeline.length === 0 ? (
              <div className="flex-1 h-40 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-white/40 text-6xl mb-4">🎵</div>
                  <div className="text-white/50 text-xl font-medium">No cards placed yet</div>
                </div>
              </div>
            ) : (
              currentPlayer.timeline.map((song, index) => (
                <div key={index} className="flex-shrink-0 w-32 h-40 bg-gradient-to-br from-white/12 to-white/6 rounded-2xl border border-white/20 p-4 shadow-lg hover:bg-white/15 transition-colors">
                  <div className="text-white text-sm font-medium mb-3 line-clamp-2 leading-tight">{song.deezer_title}</div>
                  <div className="text-white/70 text-xs mb-4 line-clamp-1">{song.deezer_artist}</div>
                  <div className="bg-white text-black text-sm px-3 py-2 rounded-xl font-bold text-center">{song.release_year}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Main Host Game View with better grid layout
interface HostGameViewProps {
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function HostGameView({
  currentTurnPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: HostGameViewProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <HostGameBackground />
      
      {/* Header */}
      <HostHeader roomCode={roomCode} playersCount={players.length} />
      
      {/* Leaderboard */}
      <HostLeaderboard players={players} />

      {/* Mystery Card Section - Centered with proper spacing */}
      {currentSong && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <HostMysteryCard
            currentSong={currentSong}
            currentTurnPlayer={currentTurnPlayer}
            mysteryCardRevealed={mysteryCardRevealed}
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            cardPlacementResult={cardPlacementResult}
          />
        </div>
      )}

      {/* Players Layout - Left side with proper spacing */}
      <div className="absolute top-1/2 left-16 transform -translate-y-1/2 z-20">
        <CircularPlayersLayout 
          players={players} 
          currentPlayerId={currentTurnPlayer.id}
          isDarkMode={true}
        />
      </div>

      {/* Current Player Timeline - Bottom with full width */}
      <HostCurrentPlayerTimeline currentPlayer={currentTurnPlayer} />

      {/* Result Display Overlay */}
      {cardPlacementResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center z-50">
          <div className="text-center space-y-12 p-12 max-w-4xl mx-auto">
            <div className={`text-[12rem] leading-none ${
              cardPlacementResult.correct ? 'animate-bounce' : 'animate-pulse'
            }`}>
              {cardPlacementResult.correct ? '🎯' : '💫'}
            </div>
            
            <div className={`text-8xl font-black tracking-tight ${
              cardPlacementResult.correct ? 
              'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400' : 
              'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400'
            }`}>
              {cardPlacementResult.correct ? 'PERFECT MATCH!' : 'NICE TRY!'}
            </div>
            
            <div className="bg-white/10 backdrop-blur-3xl rounded-3xl p-12 border border-white/20 max-w-2xl mx-auto">
              <div className="text-4xl font-bold text-white mb-4 line-clamp-2">
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-3xl text-white/80 mb-8 font-medium">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-2xl font-bold text-3xl shadow-lg">
                {cardPlacementResult.song.release_year}
              </div>
            </div>

            <div className="text-white/70 text-2xl font-medium">
              {cardPlacementResult.correct ? 
                `🎉 ${currentTurnPlayer.name} scored a point!` : 
                `💪 Better luck next time, ${currentTurnPlayer.name}!`
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Alternative Host Display with cleaner layout
interface HostDisplayProps {
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function HostDisplay({
  currentTurnPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: HostDisplayProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <HostGameBackground />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-8">
        <div className="flex justify-between items-center max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/12 backdrop-blur-3xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-3xl tracking-tight">Timeliner Host</div>
              <div className="text-white/60 text-lg">Game in progress</div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="bg-white/12 backdrop-blur-3xl px-8 py-5 rounded-3xl border border-white/20 shadow-2xl">
              <div className="text-white/60 text-sm font-medium mb-1">Players</div>
              <div className="text-white font-bold text-2xl">{players.length}</div>
            </div>
            
            <div className="bg-white/12 backdrop-blur-3xl px-8 py-5 rounded-3xl border border-white/20 shadow-2xl">
              <div className="text-white/60 text-sm font-medium mb-1">Room Code</div>
              <div className="text-white font-mono text-2xl font-bold tracking-wider">{roomCode}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Players Stack - Left side with proper spacing */}
      <div className="absolute top-36 left-8 z-30 w-80">
        <SidePlayersStack 
          players={players} 
          currentId={currentTurnPlayer.id} 
          isDarkMode={true} 
        />
      </div>

      {/* Mystery Card - Center with proper spacing */}
      {currentSong && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <HostMysteryCard
            currentSong={currentSong}
            currentTurnPlayer={currentTurnPlayer}
            mysteryCardRevealed={mysteryCardRevealed}
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            cardPlacementResult={cardPlacementResult}
          />
        </div>
      )}

      {/* Current Player Timeline - Bottom with full width */}
      <HostCurrentPlayerTimeline currentPlayer={currentTurnPlayer} />

      {/* Card Placement Result */}
      {cardPlacementResult && (
        <PlayerResultDisplay cardPlacementResult={cardPlacementResult} />
      )}
    </div>
  );
}

// CSS utilities for better scrollbar styling
const scrollbarStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = scrollbarStyles;
  document.head.appendChild(styleElement);
}
