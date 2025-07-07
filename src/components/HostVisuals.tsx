
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

// Host Game Background
export function HostGameBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-32 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-950/50 via-transparent to-slate-900/30 pointer-events-none" />
    </div>
  );
}

// Host Header
interface HostHeaderProps {
  roomCode: string;
  playersCount: number;
}

export function HostHeader({ roomCode, playersCount }: HostHeaderProps) {
  return (
    <div className="absolute top-8 left-8 right-8 z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-2xl rounded-3xl flex items-center justify-center border border-white/20 shadow-xl">
            <Crown className="h-8 w-8 text-yellow-400" />
          </div>
          <div>
            <div className="text-white font-bold text-4xl tracking-tight">Timeliner</div>
            <div className="text-white/70 text-xl font-medium">Host Display</div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="bg-white/15 backdrop-blur-2xl px-8 py-4 rounded-3xl border border-white/20 shadow-xl">
            <div className="text-white/70 text-sm font-medium mb-1">Players</div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <div className="text-white font-bold text-2xl">{playersCount}</div>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-2xl px-8 py-4 rounded-3xl border border-white/20 shadow-xl">
            <div className="text-white/70 text-sm font-medium mb-1">Room Code</div>
            <div className="text-white font-mono text-3xl font-bold tracking-wider">{roomCode}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Current Player Timeline for Host
interface HostCurrentPlayerTimelineProps {
  currentPlayer: Player;
}

export function HostCurrentPlayerTimeline({ currentPlayer }: HostCurrentPlayerTimelineProps) {
  return (
    <div className="absolute bottom-8 left-8 right-8 z-30">
      <div className="bg-white/12 backdrop-blur-3xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div 
            className="w-8 h-8 rounded-full shadow-lg border-2 border-white/30" 
            style={{ backgroundColor: currentPlayer.color }}
          />
          <div>
            <div className="text-white font-bold text-2xl tracking-tight">{currentPlayer.name}'s Timeline</div>
            <div className="text-white/70 text-lg">{currentPlayer.score}/10 points • {currentPlayer.timeline.length} cards placed</div>
          </div>
          <div className="ml-auto">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-6 py-3 rounded-2xl border border-white/20">
              <div className="text-white/80 text-sm font-medium">Progress</div>
              <div className="text-white font-bold text-xl">{Math.round((currentPlayer.timeline.length / 10) * 100)}%</div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {currentPlayer.timeline.length === 0 ? (
            <div className="flex-1 h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center">
              <div className="text-white/50 text-lg font-medium">No cards placed yet</div>
            </div>
          ) : (
            currentPlayer.timeline.map((song, index) => (
              <div key={index} className="flex-shrink-0 w-24 h-32 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 p-3 shadow-lg">
                <div className="text-white text-xs font-medium mb-2 truncate">{song.deezer_title}</div>
                <div className="text-white/70 text-xs mb-2 truncate">{song.deezer_artist}</div>
                <div className="bg-white text-black text-xs px-2 py-1 rounded-full font-bold text-center">{song.release_year}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// All Players Overview for Host
interface HostAllPlayersOverviewProps {
  players: Player[];
}

export function HostAllPlayersOverview({ players }: HostAllPlayersOverviewProps) {
  return (
    <div className="absolute top-32 right-8 z-30 w-80">
      <div className="bg-white/12 backdrop-blur-3xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-yellow-400" />
          <div className="text-white font-bold text-xl">Leaderboard</div>
        </div>

        <div className="space-y-4">
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div key={player.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-white/70 font-bold text-lg w-6">#{index + 1}</div>
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: player.color }}
                  />
                  <div>
                    <div className="text-white font-semibold">{player.name}</div>
                    <div className="text-white/60 text-sm">{player.timeline.length} cards</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-xl">{player.score}</div>
                  <div className="text-white/60 text-sm">points</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Main Host Game View
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
      <HostGameBackground />
      
      <HostHeader roomCode={roomCode} playersCount={players.length} />
      
      <HostAllPlayersOverview players={players} />

      {/* Mystery Card Section */}
      {currentSong && (
        <HostMysteryCard
          currentSong={currentSong}
          currentTurnPlayer={currentTurnPlayer}
          mysteryCardRevealed={mysteryCardRevealed}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          cardPlacementResult={cardPlacementResult}
        />
      )}

      {/* Players Layout */}
      <div className="absolute top-1/2 left-32 transform -translate-y-1/2 z-20">
        <CircularPlayersLayout players={players} currentTurnPlayer={currentTurnPlayer} />
      </div>

      {/* Current Player Timeline */}
      <HostCurrentPlayerTimeline currentPlayer={currentTurnPlayer} />

      {/* Result Display */}
      {cardPlacementResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl flex items-center justify-center z-50">
          <div className="text-center space-y-8 p-8">
            <div className={`text-9xl mb-6 ${
              cardPlacementResult.correct ? 'animate-bounce' : 'animate-pulse'
            }`}>
              {cardPlacementResult.correct ? '🎯' : '💫'}
            </div>
            
            <div className={`text-6xl font-black tracking-tight ${
              cardPlacementResult.correct ? 
              'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400' : 
              'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400'
            }`}>
              {cardPlacementResult.correct ? 'PERFECT MATCH!' : 'NICE TRY!'}
            </div>
            
            <div className="bg-white/10 backdrop-blur-3xl rounded-3xl p-8 border border-white/20 max-w-lg">
              <div className="text-3xl font-bold text-white mb-3">
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-2xl text-white/80 mb-6 font-medium">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold text-2xl">
                {cardPlacementResult.song.release_year}
              </div>
            </div>

            <div className="text-white/60 text-xl">
              {cardPlacementResult.correct ? 
                `${currentTurnPlayer.name} scored a point!` : 
                `Better luck next time, ${currentTurnPlayer.name}!`
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Host Display (alternative simpler layout)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      <GameBackground />
      
      {/* Header */}
      <div className="absolute top-8 left-8 right-8 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-2xl tracking-tight">Timeliner Host</div>
              <div className="text-white/60 text-base">Game in progress</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20">
              <div className="text-white/60 text-sm font-medium">Players</div>
              <div className="text-white font-bold text-xl">{players.length}</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20">
              <div className="text-white/60 text-sm font-medium">Room Code</div>
              <div className="text-white font-mono text-xl font-bold tracking-wider">{roomCode}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Players Stack */}
      <div className="absolute top-32 left-8 z-30">
        <SidePlayersStack players={players} currentTurnPlayer={currentTurnPlayer} />
      </div>

      {/* Mystery Card */}
      {currentSong && (
        <HostMysteryCard
          currentSong={currentSong}
          currentTurnPlayer={currentTurnPlayer}
          mysteryCardRevealed={mysteryCardRevealed}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          cardPlacementResult={cardPlacementResult}
        />
      )}

      {/* Current Player Timeline */}
      <HostCurrentPlayerTimeline currentPlayer={currentTurnPlayer} />

      {/* Card Placement Result */}
      {cardPlacementResult && (
        <PlayerResultDisplay cardPlacementResult={cardPlacementResult} />
      )}
    </div>
  );
}
