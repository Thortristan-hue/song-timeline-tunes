import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Music, Crown, Users, Timer, Star, Loader2, AlertTriangle } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { MysteryCard } from './MysteryCard';
import { supabase } from '@/integrations/supabase/client';

interface HostDisplayProps {
  currentTurnPlayer: Player;
  players: Player[];
  roomCode: string;
  currentSongProgress: number;
  currentSongDuration: number;
  gameState: {
    currentSong: Song | null;
    mysteryCardRevealed?: boolean;
    cardPlacementCorrect?: boolean | null;
  };
  songLoadingError?: string | null;
  retryingSong?: boolean;
  onRetrySong?: () => void;
}

export function HostDisplay({
  currentTurnPlayer,
  players,
  roomCode,
  currentSongProgress,
  currentSongDuration,
  gameState,
  songLoadingError,
  retryingSong,
  onRetrySong
}: HostDisplayProps) {
  const progressPercentage = currentSongDuration > 0 ? (currentSongProgress / currentSongDuration) * 100 : 0;

  // Subscribe to real-time updates for current player's timeline
  useEffect(() => {
    if (!currentTurnPlayer?.id) return;

    const channel = supabase
      .channel(`player-${currentTurnPlayer.id}-timeline`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'players',
        filter: `id=eq.${currentTurnPlayer.id}`
      }, (payload) => {
        console.log('🔄 Player timeline updated:', payload);
        // The useGameRoom hook will handle the state update
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentTurnPlayer?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-400/8 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}} />

      {/* Header with room info */}
      <div className="absolute top-6 left-4 right-4 z-40">
        <div className="flex justify-between items-center">
          {/* Game title */}
          <div className="flex items-center gap-3 bg-slate-800/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-600/30 shadow-lg">
            <Crown className="h-6 w-6 text-yellow-400" />
            <div>
              <div className="text-white font-bold text-xl">Timeliner</div>
              <div className="text-slate-300 text-sm">Host Display</div>
            </div>
          </div>

          {/* Room code and player count */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-800/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-600/30 shadow-lg">
              <Users className="h-5 w-5 text-blue-400" />
              <div className="text-white">
                <div className="text-sm text-slate-300">Players</div>
                <div className="font-bold text-lg">{players.length}</div>
              </div>
            </div>
            
            <Badge 
              variant="outline" 
              className="bg-purple-500/20 text-purple-200 border-purple-400 text-lg px-6 py-3 font-mono"
            >
              {roomCode}
            </Badge>
          </div>
        </div>
      </div>

      {/* Current turn player - large and prominent */}
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
        <Card className="bg-gradient-to-br from-slate-800/60 to-indigo-800/60 backdrop-blur-md border-indigo-400/30 p-8 text-center shadow-2xl">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative">
              <div 
                className="w-8 h-8 rounded-full border-4 border-white shadow-lg" 
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Crown className="h-3 w-3 text-slate-900" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white mb-1">
                {currentTurnPlayer.name}'s Turn
              </h2>
              <div className="text-indigo-200 text-lg">
                Score: {currentTurnPlayer.score}/10
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Song progress bar */}
      <div className="absolute top-56 left-1/2 transform -translate-x-1/2 w-96 z-30">
        <Card className="bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Timer className="h-5 w-5 text-blue-400" />
            <span className="text-white font-medium">Song Progress</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-4 bg-slate-700/50"
          />
          <div className="flex justify-between text-sm text-slate-300 mt-2">
            <span>{Math.round(currentSongProgress)}s</span>
            <span>{Math.round(currentSongDuration)}s</span>
          </div>
        </Card>
      </div>

      {/* Enhanced Song Loading Error Display */}
      {songLoadingError && (
        <div className="absolute top-72 left-1/2 transform -translate-x-1/2 z-30 w-96">
          <Card className="bg-red-800/60 backdrop-blur-md border-red-600/30 p-4 text-center">
            <div className="text-red-200 mb-3 text-sm leading-relaxed">
              {songLoadingError}
            </div>
            {onRetrySong && (
              <Button
                onClick={onRetrySong}
                disabled={retryingSong}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {retryingSong ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Retry Loading Song'
                )}
              </Button>
            )}
          </Card>
        </div>
      )}

      {/* Mystery card display - Enhanced for host view */}
      <div className="absolute top-80 left-1/2 transform -translate-x-1/2 z-30">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-3xl blur-xl scale-110" />
          
          <div className="relative">
            {songLoadingError ? (
              <Card className="w-48 h-60 bg-red-500/20 border-red-400/50 flex flex-col items-center justify-center text-white">
                <AlertTriangle className="h-12 w-12 mb-4 text-red-400" />
                <div className="text-sm text-center px-4 text-red-200 leading-tight mb-4">
                  {songLoadingError}
                </div>
                {onRetrySong && (
                  <Button
                    onClick={onRetrySong}
                    disabled={retryingSong}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                  >
                    {retryingSong ? 'Retrying...' : 'Retry'}
                  </Button>
                )}
              </Card>
            ) : gameState.currentSong ? (
              <MysteryCard
                song={gameState.currentSong}
                isRevealed={gameState.mysteryCardRevealed || false}
                isInteractive={false}
                isDestroyed={gameState.cardPlacementCorrect === false}
                className="w-48 h-60"
                loadingError={songLoadingError}
              />
            ) : (
              <Card className="w-48 h-60 bg-slate-600/50 border-slate-500/50 flex flex-col items-center justify-center text-white animate-pulse">
                <Music className="h-12 w-12 mb-4 opacity-50" />
                <div className="text-lg text-center px-4 opacity-50">
                  {retryingSong ? 'Fetching song...' : 
                   songLoadingError ? 'Failed to load song' : 
                   'Loading mystery song...'}
                </div>
              </Card>
            )}
            
            {!gameState.mysteryCardRevealed && gameState.currentSong && !songLoadingError && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-sm text-purple-200 bg-purple-900/50 px-3 py-1 rounded-full">
                  {currentTurnPlayer.name} is thinking...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current player's timeline */}
      <div className="absolute bottom-40 left-4 right-4 z-20">
        <Card className="bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white"
              style={{ backgroundColor: currentTurnPlayer.color }}
            />
            <h3 className="text-2xl font-bold text-white">
              {currentTurnPlayer.name}'s Timeline
            </h3>
            <Star className="h-5 w-5 text-yellow-400" />
          </div>
          
          <div className="flex gap-3 items-center overflow-x-auto pb-2">
            {currentTurnPlayer.timeline.length === 0 ? (
              <div className="text-slate-400 text-lg italic">
                No songs placed yet...
              </div>
            ) : (
              currentTurnPlayer.timeline.map((song, index) => (
                <div
                  key={index}
                  className="min-w-32 h-32 rounded-xl flex flex-col items-center justify-center text-white shadow-lg border border-white/20 transform transition-all hover:scale-105"
                  style={{ backgroundColor: song.cardColor || currentTurnPlayer.color }}
                >
                  <div className="text-3xl font-black mb-1">
                    {song.release_year}
                  </div>
                  <div className="text-xs text-center px-2 opacity-90 leading-tight">
                    {song.deezer_title?.slice(0, 20)}
                    {song.deezer_title && song.deezer_title.length > 20 ? '...' : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* All players overview */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {players.map((player) => (
            <Card 
              key={player.id}
              className={`bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-4 transition-all ${
                player.id === currentTurnPlayer.id 
                  ? 'ring-2 ring-yellow-400 bg-yellow-400/10' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: player.color }}
                />
                <div className="flex-1">
                  <div className="text-white font-bold text-lg">{player.name}</div>
                  <div className="text-slate-300 text-sm">{player.score}/10 points</div>
                </div>
                {player.id === currentTurnPlayer.id && (
                  <Crown className="h-4 w-4 text-yellow-400" />
                )}
              </div>
              
              <div className="flex gap-1 flex-wrap">
                {player.timeline.slice(0, 6).map((song, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold border border-white/20"
                    style={{ backgroundColor: song.cardColor || player.color }}
                  >
                    '{song.release_year.slice(-2)}
                  </div>
                ))}
                {player.timeline.length > 6 && (
                  <div className="w-8 h-8 rounded-lg bg-slate-600/80 flex items-center justify-center text-white text-xs font-bold border border-white/20">
                    +{player.timeline.length - 6}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
