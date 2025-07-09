import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, Pause, Users, Trophy, Star, Crown } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';

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

// Redesigned Host Header - Compact and positioned at top
interface HostHeaderProps {
  roomCode: string;
  playersCount: number;
}

export function HostHeader({ roomCode, playersCount }: HostHeaderProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/15 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/20">
            <Crown className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <div className="text-white font-bold text-2xl tracking-tight">Timeliner</div>
            <div className="text-white/70 text-sm font-medium">Host Display</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/15 backdrop-blur-2xl px-4 py-2 rounded-2xl border border-white/20">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <div className="text-white font-bold text-lg">{playersCount}</div>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-2xl px-4 py-2 rounded-2xl border border-white/20">
            <div className="text-white font-mono text-lg font-bold tracking-wider">{roomCode}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Record Player Section - Positioned at top center
interface RecordPlayerSectionProps {
  currentSong: Song | null;
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function RecordPlayerSection({
  currentSong,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: RecordPlayerSectionProps) {
  return (
    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30">
      <div className="text-center">
        {/* Record Player with Mystery Record */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/8 rounded-3xl blur-xl scale-110" />
          <div 
            className="relative cursor-pointer transition-all duration-300 hover:scale-105"
            onClick={onPlayPause}
          >
            <RecordMysteryCard
              song={currentSong}
              isRevealed={mysteryCardRevealed}
              isDestroyed={cardPlacementResult?.correct === false}
              className="relative"
            />
            
            {/* Play/Pause overlay on record */}
            {currentSong?.preview_url && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity">
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-white" />
                ) : (
                  <Play className="h-6 w-6 text-white" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Current Player Info - Positioned in center
interface CurrentPlayerInfoProps {
  currentPlayer: Player;
  currentSong: Song | null;
}

export function CurrentPlayerInfo({ currentPlayer, currentSong }: CurrentPlayerInfoProps) {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
      <div className="bg-white/12 backdrop-blur-2xl rounded-3xl p-6 shadow-xl max-w-md mx-auto">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div 
            className="w-6 h-6 rounded-full shadow-lg" 
            style={{ backgroundColor: currentPlayer.color }}
          />
          <div className="text-white text-2xl font-semibold">
            {currentPlayer.name}
          </div>
          <div className="bg-white/20 backdrop-blur-xl text-white px-4 py-2 rounded-full text-base font-semibold">
            {currentPlayer.score}/10
          </div>
        </div>
        
        <div className="text-white/70 text-lg text-center mb-4">
          {currentSong ? 
            "Thinking about where this song fits..." : 
            "Waiting for the next song..."
          }
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentPlayer.timeline.length / 10) * 100}%` }}
          />
        </div>
        <div className="text-white/60 text-sm text-center">
          {currentPlayer.timeline.length}/10 cards placed
        </div>
      </div>
    </div>
  );
}

// Leaderboard - Positioned on the right side
interface LeaderboardProps {
  players: Player[];
}

export function Leaderboard({ players }: LeaderboardProps) {
  return (
    <div className="absolute top-20 right-4 z-30 w-72">
      <div className="bg-white/12 backdrop-blur-3xl rounded-3xl p-4 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <div className="text-white font-bold text-lg">Leaderboard</div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div key={player.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-white/70 font-bold text-sm w-4">#{index + 1}</div>
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: player.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">{player.name}</div>
                  <div className="text-white/60 text-xs">{player.timeline.length} cards</div>
                </div>
                <div className="text-white font-bold text-lg">{player.score}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Timeline Display - Positioned on the left side, moved up
interface TimelineDisplayProps {
  currentPlayer: Player;
}

export function TimelineDisplay({ currentPlayer }: TimelineDisplayProps) {
  return (
    <div className="absolute top-80 left-4 z-30 w-80">
      <div className="bg-white/5 rounded-3xl p-4 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-5 h-5 rounded-full shadow-lg" 
            style={{ backgroundColor: currentPlayer.color }}
          />
          <div className="text-white font-bold text-lg">{currentPlayer.name}'s Timeline</div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {currentPlayer.timeline.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-white/50 text-sm">No cards placed yet</div>
            </div>
          ) : (
            currentPlayer.timeline.map((song, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-white/70 font-bold text-sm w-6">{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{song.deezer_title}</div>
                  <div className="text-white/70 text-xs truncate">{song.deezer_artist}</div>
                </div>
                <div className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-bold">
                  {song.release_year}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Main Host Game View - Redesigned Layout
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
      
      {/* Header */}
      <HostHeader roomCode={roomCode} playersCount={players.length} />

      {/* Record Player Section - Top Center */}
      <RecordPlayerSection 
        currentSong={currentSong}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        cardPlacementResult={cardPlacementResult}
      />

      {/* Timeline Display - Left Side, moved up */}
      <TimelineDisplay currentPlayer={currentTurnPlayer} />

      {/* Leaderboard - Right Side */}
      <Leaderboard players={players} />

      {/* Cassette Player Display - Bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <CassettePlayerDisplay 
          players={players} 
          currentPlayerId={currentTurnPlayer.id}
        />
      </div>

      {/* Result Display - Full Screen Overlay */}
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

// Alternative Simplified Host Display
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
      <HostGameBackground />
      
      {/* Header */}
      <HostHeader roomCode={roomCode} playersCount={players.length} />

      {/* Record Player Section - Top Center */}
      <RecordPlayerSection 
        currentSong={currentSong}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        cardPlacementResult={cardPlacementResult}
      />

      {/* Cassette Player Display - Bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <CassettePlayerDisplay 
          players={players} 
          currentPlayerId={currentTurnPlayer.id}
        />
      </div>
    </div>
  );
}
