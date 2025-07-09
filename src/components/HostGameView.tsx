
import React from 'react';
import { Users, Star } from 'lucide-react';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';
import { Song, Player } from '@/types/game';
import { Button } from '@/components/ui/button';

interface HostGameViewProps {
  currentTurnPlayer: Player | null;
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
  if (!currentTurnPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        </div>
        <div className="text-center text-white relative z-10">
          <div className="text-6xl mb-4 animate-spin">🎵</div>
          <div className="text-2xl font-semibold mb-2">Getting things ready...</div>
          <div className="text-white/60">Setting up the next round</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/3 rounded-full blur-2xl" />
      </div>

      {/* Disclaimer */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
          <p className="text-white/70 text-sm font-medium">
            Just friends having fun • Not affiliated with any music service • Educational use only
          </p>
        </div>
      </div>

      {/* Simplified Header */}
      <div className="absolute top-16 right-6 z-40">
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

      {/* Mystery Record Section */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
        <div className="text-center space-y-8">
          {/* Record Player with Mystery Record */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/8 rounded-3xl blur-xl scale-110" />
            <RecordMysteryCard
              song={currentSong}
              isRevealed={mysteryCardRevealed}
              isDestroyed={cardPlacementResult?.correct === false}
              className="relative"
            />
          </div>

          {/* Current Turn Player */}
          <div className="bg-white/12 backdrop-blur-2xl rounded-3xl p-8 shadow-xl max-w-md mx-auto">
            <div className="flex items-center justify-center gap-4 mb-4">
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
            
            <div className="text-white/70 text-lg mb-4">
              {currentSong ? 
                "Thinking about where this song fits..." : 
                "Waiting for the next song..."
              }
            </div>

            {/* Audio Controls */}
            <Button
              onClick={onPlayPause}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-2xl px-6 py-3 font-semibold text-white shadow-lg border border-white/20"
              disabled={!currentSong?.preview_url}
            >
              {isPlaying ? "⏸️ Pause Preview" : "▶️ Play Preview"}
            </Button>
          </div>
        </div>
      </div>

      {/* Current player's timeline */}
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

      {/* Cassette Player Display */}
      <CassettePlayerDisplay 
        players={players} 
        currentPlayerId={currentTurnPlayer?.id}
      />
    </div>
  );
}
