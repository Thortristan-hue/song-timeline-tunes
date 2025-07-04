import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Music, Crown, Users, Timer, Star, Loader2, AlertTriangle } from 'lucide-react';

// Mock components and types for demo
const MysteryCard = ({ song, isRevealed, isInteractive, isDestroyed, className }) => (
  <Card className={`${className} bg-white/10 backdrop-blur-xl border-white/20 flex items-center justify-center`}>
    <div className="text-center p-6">
      <Music className="h-12 w-12 mx-auto mb-4 text-white/60" />
      <div className="text-white/80 text-sm">Mystery Song</div>
      {isRevealed && song && (
        <div className="mt-2 text-white font-medium">{song.deezer_title}</div>
      )}
    </div>
  </Card>
);

export default function HostDisplay({
  currentTurnPlayer,
  players,
  roomCode,
  currentSongProgress,
  currentSongDuration,
  gameState,
  songLoadingError,
  retryingSong,
  onRetrySong,
  audioPlaybackError,
  onRetryAudio,
  onSkipSong
}) {

  const progressPercentage = currentSongDuration > 0 ? (currentSongProgress / currentSongDuration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Subtle background elements - more Apple-like */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/3 rounded-full blur-2xl" />
      </div>

      {/* Disclaimer - Professional but friendly */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
          <p className="text-white/70 text-sm font-medium">
            Just friends having fun • Not affiliated with any music service • Educational use only
          </p>
        </div>
      </div>

      {/* Header - Cleaner, more Apple-like */}
      <div className="absolute top-16 left-6 right-6 z-40">
        <div className="flex justify-between items-center">
          {/* Game title - Simplified */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-2xl tracking-tight">Timeliner</div>
              <div className="text-white/60 text-base">Let's see how well you know music history</div>
            </div>
          </div>

          {/* Room info - More minimal */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-white">
              <Users className="h-5 w-5 text-white/60" />
              <span className="text-lg font-medium">{players.length} players</span>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20">
              <div className="text-white/60 text-sm font-medium">Room Code</div>
              <div className="text-white font-mono text-xl font-bold tracking-wider">{roomCode}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mystery Card Section - More minimal and clean */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
        <div className="text-center space-y-8">
          {/* Mystery Card - Square and smaller */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/8 rounded-3xl blur-xl scale-110" />
            <MysteryCard
              song={gameState.currentSong}
              isRevealed={gameState.mysteryCardRevealed}
              isInteractive={false}
              isDestroyed={gameState.cardPlacementCorrect === false}
              className="relative w-48 h-48 bg-white/15 backdrop-blur-2xl border border-white/30 shadow-2xl"
            />
          </div>

          {/* Current Turn Player - Simplified */}
          <div className="bg-white/12 backdrop-blur-2xl rounded-3xl p-8 shadow-xl max-w-md mx-auto">
            <div className="flex items-center justify-center gap-4">
              <div 
                className="w-6 h-6 rounded-full shadow-lg" 
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <div className="text-white text-2xl font-semibold">
                {currentTurnPlayer.name}
              </div>
              <div className="bg-white/20 backdrop-blur-xl text-white px-4 py-2 rounded-full text-base font-semibold">
                {currentTurnPlayer.score}/10
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Song progress - Cleaner design */}
      <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 z-30">
        <div className="bg-white/12 backdrop-blur-2xl rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Timer className="h-5 w-5 text-white/60" />
            <span className="text-white font-medium">Song Progress</span>
          </div>
          <div className="space-y-3">
            <div className="bg-white/15 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>{Math.round(currentSongProgress)}s</span>
              <span>{Math.round(currentSongDuration)}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current player's timeline - More Apple-like cards */}
      <div className="absolute bottom-32 left-6 right-6 z-20">
        <div className="bg-white/12 backdrop-blur-2xl rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ backgroundColor: currentTurnPlayer.color }}
            />
            <h3 className="text-white text-xl font-semibold">
              {currentTurnPlayer.name}'s Timeline
            </h3>
            <Star className="h-5 w-5 text-white/60" />
          </div>
          
          <div className="flex gap-4 items-center overflow-x-auto pb-2">
            {currentTurnPlayer.timeline.length === 0 ? (
              <div className="text-white/50 text-lg">
                No songs placed yet
              </div>
            ) : (
              currentTurnPlayer.timeline.map((song, index) => (
                <div
                  key={index}
                  className="min-w-32 h-32 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg backdrop-blur-xl transition-all hover:scale-105"
                  style={{ backgroundColor: `${song.cardColor}60` }}
                >
                  <div className="text-2xl font-bold mb-1">
                    {song.release_year}
                  </div>
                  <div className="text-xs text-center px-2 text-white/80 leading-tight">
                    {song.deezer_title?.slice(0, 18)}
                    {song.deezer_title && song.deezer_title.length > 18 ? '...' : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* All players overview - Grid layout with cleaner cards */}
      <div className="absolute bottom-6 left-6 right-6 z-10">
        <div className="grid grid-cols-4 gap-4">
          {players.map((player) => (
            <div 
              key={player.id}
              className={`bg-white/12 backdrop-blur-2xl rounded-2xl p-4 shadow-lg transition-all ${
                player.id === currentTurnPlayer.id 
                  ? 'bg-white/16 ring-2 ring-white/30' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: player.color }}
                />
                <div className="flex-1">
                  <div className="text-white font-semibold">{player.name}</div>
                  <div className="text-white/60 text-sm">{player.score}/10 points</div>
                </div>
                {player.id === currentTurnPlayer.id && (
                  <Crown className="h-4 w-4 text-white/60" />
                )}
              </div>
              
              <div className="flex gap-1 flex-wrap">
                {player.timeline.slice(0, 6).map((song, index) => (
                  <div
                    key={index}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold backdrop-blur-xl"
                    style={{ backgroundColor: `${song.cardColor}80` }}
                  >
                    '{song.release_year.slice(-2)}
                  </div>
                ))}
                {player.timeline.length > 6 && (
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs font-semibold backdrop-blur-xl">
                    +{player.timeline.length - 6}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
