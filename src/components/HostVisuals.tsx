
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music, Crown, Volume2 } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { MysteryCard } from '@/components/MysteryCard';
import { cn } from '@/lib/utils';

interface HostGameViewProps {
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  transitioning: boolean;
}

export function HostGameView({
  currentTurnPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult,
  transitioning
}: HostGameViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/3 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <div className="absolute top-16 left-6 right-6 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-2xl tracking-tight">Timeliner Host</div>
              <div className="text-white/60 text-base">Centralized Audio Experience</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20">
              <div className="text-white/60 text-sm font-medium">Room Code</div>
              <div className="text-white font-mono text-xl font-bold tracking-wider">{roomCode}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Player Info */}
      <div className="absolute top-40 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-slate-800/80 backdrop-blur-md px-8 py-4 rounded-2xl border border-indigo-400/30 shadow-lg">
          <div className="flex items-center justify-center gap-4 text-white">
            <div 
              className="w-6 h-6 rounded-full border-2 border-white shadow-lg" 
              style={{ backgroundColor: currentTurnPlayer.color }}
            />
            <div className="text-center">
              <div className="font-bold text-xl">{currentTurnPlayer.name}'s Turn</div>
              <div className="text-sm text-indigo-200">Score: {currentTurnPlayer.timeline.length}/10</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mystery Card */}
      <div className="absolute top-64 left-1/2 transform -translate-x-1/2 z-30">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl scale-110" />
            
            {currentSong ? (
              <MysteryCard
                song={currentSong}
                isRevealed={mysteryCardRevealed}
                isInteractive={false}
                isDestroyed={cardPlacementResult?.correct === false}
                className="w-64 h-80"
              />
            ) : (
              <Card className="relative w-64 h-80 bg-slate-700/50 border-slate-500/50 flex flex-col items-center justify-center text-white animate-pulse">
                <Music className="h-16 w-16 mb-4 opacity-50" />
                <div className="text-xl text-center px-4 opacity-50">Loading Mystery Song...</div>
              </Card>
            )}
          </div>

          {/* ENHANCED: Centralized Audio Controls */}
          <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 border border-slate-600/50">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Volume2 className="w-5 h-5 text-blue-400" />
              <div className="text-lg text-slate-200 text-center font-semibold">
                Centralized Audio Control
              </div>
            </div>

            <div className="text-sm text-slate-400 text-center mb-4">
              Players control audio through this device
            </div>

            <div className="flex items-center justify-center">
              <Button
                onClick={onPlayPause}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl px-8 py-4 font-bold text-white shadow-lg"
                disabled={!currentSong?.preview_url}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-6 w-6 mr-3" />
                    Audio Playing
                  </>
                ) : (
                  <>
                    <Play className="h-6 w-6 mr-3" />
                    Host Override
                  </>
                )}
              </Button>
            </div>

            {isPlaying && (
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-200 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Audio streaming to host device
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div className="absolute bottom-8 left-8 right-8 z-30">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {players.map((player) => (
            <Card
              key={player.id}
              className={cn(
                "bg-white/10 backdrop-blur-xl border border-white/20 p-4 transition-all duration-300",
                player.id === currentTurnPlayer.id && "ring-2 ring-blue-400/50 bg-blue-500/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm" 
                  style={{ backgroundColor: player.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate">
                    {player.name}
                  </div>
                  <div className="text-white/60 text-sm">
                    {player.timeline.length}/10 cards
                  </div>
                </div>
                {player.id === currentTurnPlayer.id && (
                  <div className="text-blue-400 text-xs font-bold">
                    TURN
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {cardPlacementResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="text-center space-y-6 p-8">
            <div className={`text-9xl mb-4 ${
              cardPlacementResult.correct ? 'text-emerald-400 animate-bounce' : 'text-rose-400 animate-pulse'
            }`}>
              {cardPlacementResult.correct ? '🎯' : '💥'}
            </div>
            
            <div className={`text-5xl font-black ${
              cardPlacementResult.correct ? 
              'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400' : 
              'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400'
            }`}>
              {cardPlacementResult.correct ? 'PERFECT!' : 'CLOSE!'}
            </div>
            
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-600/30 max-w-md">
              <div className="text-xl font-bold text-white mb-2">
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-lg text-slate-300 mb-3">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                {cardPlacementResult.song.release_year}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
