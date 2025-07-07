import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Music, Play, Pause, Volume2, VolumeX, Crown, Clock, Trophy, Star, Zap, Check, X, Radio, Disc, Power, RotateCcw } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { MysteryCard } from '@/components/MysteryCard';
import { PlayerTimeline } from '@/components/PlayerTimeline';
import { cn } from '@/lib/utils';

// Mystery Card for Players - Retro Cassette Style
interface PlayerMysteryCardProps {
  currentSong: Song;
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDragStart: (song: Song) => void;
  onDragEnd: () => void;
}

export function PlayerMysteryCard({
  currentSong,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  onDragStart,
  onDragEnd
}: PlayerMysteryCardProps) {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
      <div className="text-center space-y-6">
        {/* Cassette Radio Housing */}
        <div className="bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-8 border-4 border-gray-600 shadow-2xl relative overflow-hidden">
          {/* Radio Grill Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-20 gap-1 h-full">
              {Array.from({ length: 400 }).map((_, i) => (
                <div key={i} className="bg-gray-500 rounded-full" />
              ))}
            </div>
          </div>
          
          {/* Display Screen */}
          <div className="bg-black rounded-xl p-4 mb-6 border-2 border-gray-500 relative">
            <div className="bg-green-900/50 rounded-lg p-3 border border-green-500/30">
              <div className="text-green-400 text-lg font-mono text-center tracking-wide">
                {mysteryCardRevealed ? 'REVEALED' : 'MYSTERY TRACK'}
              </div>
              <div className="text-xs text-green-300/70 mt-1 text-center">
                {mysteryCardRevealed ? currentSong?.deezer_artist || 'Unknown' : '??? - ???'}
              </div>
            </div>
          </div>

          {/* Mystery Card with Glow */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-3xl blur-xl scale-110" />
            
            <MysteryCard
              song={currentSong}
              isRevealed={mysteryCardRevealed}
              isInteractive={true}
              className="w-48 h-60 border-4 border-gray-600 shadow-2xl"
              onDragStart={() => onDragStart(currentSong)}
              onDragEnd={onDragEnd}
            />
          </div>

          {/* Control Panel */}
          <div className="flex items-center justify-between bg-gray-800/80 rounded-2xl p-4 border-2 border-gray-600">
            {/* Tape Wells */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-500 ${isPlaying ? 'animate-spin' : ''}`}>
                <div className="w-full h-full rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-500 ${isPlaying ? 'animate-spin' : ''}`}>
                <div className="w-full h-full rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onPlayPause}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-500 flex items-center justify-center hover:from-gray-500 hover:to-gray-700 transition-all duration-200 shadow-lg"
                disabled={!currentSong?.preview_url}
              >
                {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
              </button>
              
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-500 flex items-center justify-center hover:from-gray-500 hover:to-gray-700 transition-all duration-200 shadow-lg"
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
              </button>
            </div>

            {/* Status LEDs */}
            <div className="flex flex-col gap-2">
              <div className={`w-3 h-3 rounded-full border ${isPlaying ? 'bg-green-400 border-green-300 shadow-green-400/50 shadow-lg' : 'bg-gray-600 border-gray-500'}`} />
              <div className={`w-3 h-3 rounded-full border ${mysteryCardRevealed ? 'bg-red-400 border-red-300 shadow-red-400/50 shadow-lg' : 'bg-gray-600 border-gray-500'}`} />
            </div>
          </div>
        </div>

        <div className="text-center bg-gray-800/80 px-4 py-2 rounded-full border-2 border-gray-600 text-orange-300 font-mono">
          Drag the cassette to your timeline!
        </div>
      </div>
    </div>
  );
}

// Mystery Card for Host - Retro Cassette Radio Style
interface HostMysteryCardProps {
  currentSong: Song | null;
  currentTurnPlayer: Player;
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function HostMysteryCard({
  currentSong,
  currentTurnPlayer,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: HostMysteryCardProps) {
  return (
    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
      <div className="text-center space-y-6">
        {/* Main Cassette Radio Unit */}
        <div className="bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-8 border-4 border-gray-600 shadow-2xl max-w-2xl relative overflow-hidden">
          {/* Radio Grill Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-30 gap-1 h-full">
              {Array.from({ length: 600 }).map((_, i) => (
                <div key={i} className="bg-gray-500 rounded-full" />
              ))}
            </div>
          </div>
          
          {/* Top Display Panel */}
          <div className="relative z-10 mb-6">
            <div className="bg-black rounded-xl p-4 border-2 border-gray-500 mb-4">
              <div className="bg-green-900/50 rounded-lg p-3 border border-green-500/30">
                <div className="flex items-center justify-center gap-4 mb-3">
                  <Radio className="h-6 w-6 text-green-400" />
                  <div className="text-green-400 text-2xl font-mono font-bold tracking-wide">
                    TIMELINER FM
                  </div>
                  <Radio className="h-6 w-6 text-green-400" />
                </div>
                <div className="text-sm text-green-300/70 text-center">
                  Now Playing: {mysteryCardRevealed ? (currentSong?.deezer_title || 'Unknown Track') : 'Mystery Track'}
                </div>
              </div>
            </div>

            {/* Player Info Display */}
            <div className="bg-gray-800/80 rounded-xl p-4 border-2 border-gray-600">
              <div className="flex items-center justify-center gap-6 text-white">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full border-3 border-gray-400 shadow-lg" 
                    style={{ backgroundColor: currentTurnPlayer.color }}
                  />
                  <div className="text-center">
                    <div className="font-bold text-2xl text-orange-300">{currentTurnPlayer.name}</div>
                    <div className="text-sm text-gray-300">Score: {currentTurnPlayer.score}/10</div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-orange-300 text-sm font-mono">Status</div>
                  <div className="w-4 h-4 bg-green-400 rounded-full border border-green-300 shadow-green-400/50 shadow-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Mystery Card Display */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-3xl blur-xl scale-110" />
            
            {currentSong ? (
              <MysteryCard
                song={currentSong}
                isRevealed={mysteryCardRevealed}
                isInteractive={false}
                isDestroyed={cardPlacementResult?.correct === false}
                className="w-64 h-80 border-4 border-gray-600 shadow-2xl mx-auto"
              />
            ) : (
              <Card className="relative w-64 h-80 bg-gray-800/80 border-4 border-gray-600 flex flex-col items-center justify-center mx-auto">
                <Disc className="h-16 w-16 mb-4 text-gray-400 animate-pulse" />
                <div className="text-xl text-center px-4 text-orange-300 font-mono">Loading Track...</div>
              </Card>
            )}
          </div>

          {/* Main Control Panel */}
          <div className="flex items-center justify-between bg-gray-800/80 rounded-2xl p-6 border-2 border-gray-600">
            {/* Tape Wells */}
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-500 ${isPlaying ? 'animate-spin' : ''}`}>
                <div className="w-full h-full rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                </div>
              </div>
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-500 ${isPlaying ? 'animate-spin' : ''}`}>
                <div className="w-full h-full rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Center Controls */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-orange-300 text-center font-mono">
                {currentTurnPlayer.name} is placing...
              </div>
              
              <button
                onClick={onPlayPause}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-500 flex flex-col items-center justify-center text-xs hover:from-gray-500 hover:to-gray-700 transition-all duration-200 shadow-lg"
                disabled={!currentSong?.preview_url}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-6 w-6 mb-1 text-white" />
                    <span className="text-white font-mono">PAUSE</span>
                  </>
                ) : (
                  <>
                    <Play className="h-6 w-6 mb-1 text-white" />
                    <span className="text-white font-mono">PLAY</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Panel */}
            <div className="flex flex-col items-center gap-3">
              <div className="text-orange-300 font-mono text-sm">System</div>
              <div className="flex flex-col gap-2">
                <div className={`w-3 h-3 rounded-full border ${isPlaying ? 'bg-green-400 border-green-300 shadow-green-400/50 shadow-lg' : 'bg-gray-600 border-gray-500'}`} />
                <div className={`w-3 h-3 rounded-full border ${mysteryCardRevealed ? 'bg-red-400 border-red-300 shadow-red-400/50 shadow-lg' : 'bg-gray-600 border-gray-500'}`} />
                <div className={`w-3 h-3 rounded-full border ${currentSong ? 'bg-blue-400 border-blue-300 shadow-blue-400/50 shadow-lg' : 'bg-gray-600 border-gray-500'}`} />
              </div>
            </div>
          </div>

          {/* Volume and Tone Controls */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="flex flex-col items-center gap-2">
              <div className="text-orange-300 font-mono text-sm">Volume</div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-500 shadow-lg">
                <div className="w-full h-full rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                  <div className="w-1 h-4 bg-orange-400 rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-orange-300 font-mono text-sm">Tone</div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-500 shadow-lg">
                <div className="w-full h-full rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                  <div className="w-1 h-4 bg-orange-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Player Result Display - Retro Style
interface PlayerResultDisplayProps {
  cardPlacementResult: { correct: boolean; song: Song };
}

export function PlayerResultDisplay({ cardPlacementResult }: PlayerResultDisplayProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
      <div className="text-center space-y-8 p-8">
        <div className="bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-8 border-4 border-gray-600 shadow-2xl max-w-lg">
          {/* Display Panel */}
          <div className="bg-black rounded-xl p-6 border-2 border-gray-500">
            <div className={`bg-green-900/50 rounded-lg p-6 border border-green-500/30 ${
              cardPlacementResult.correct ? 'shadow-green-400/50 shadow-2xl' : ''
            }`}>
              <div className={`text-6xl mb-4 ${
                cardPlacementResult.correct ? 'text-green-400 animate-bounce' : 'text-red-400 animate-pulse'
              }`}>
                {cardPlacementResult.correct ? '🎯' : '💥'}
              </div>
              
              <div className={`text-4xl font-mono font-black mb-4 ${
                cardPlacementResult.correct ? 'text-green-400' : 'text-red-400'
              }`}>
                {cardPlacementResult.correct ? 'PERFECT!' : 'CLOSE!'}
              </div>
              
              <div className="text-sm text-green-300/70 mb-4 font-mono">
                Track Information
              </div>
              
              <div className="space-y-2">
                <div className="text-xl font-bold text-white">
                  {cardPlacementResult.song.deezer_title}
                </div>
                <div className="text-lg text-gray-300">
                  by {cardPlacementResult.song.deezer_artist}
                </div>
                <div className="inline-block bg-gray-800/80 border-2 border-gray-600 px-4 py-2 rounded-full font-bold text-lg text-orange-300">
                  {cardPlacementResult.song.release_year}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Player Waiting Screen - Retro Style
interface PlayerWaitingScreenProps {
  currentTurnPlayer: Player;
}

export function PlayerWaitingScreen({ currentTurnPlayer }: PlayerWaitingScreenProps) {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-8 border-4 border-gray-600 shadow-2xl">
          <div className="bg-black rounded-xl p-6 border-2 border-gray-500 mb-4">
            <div className="bg-green-900/50 rounded-lg p-4 border border-green-500/30">
              <Radio className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-green-400 mb-2 font-mono">
                {currentTurnPlayer?.name} is playing
              </div>
              <div className="text-green-300/70 font-mono">
                Wait for your turn to place cards
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Game Background Component - Retro Style
export function GameBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Subtle retro grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Ambient lighting effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-orange-500/3 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-red-500/3 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/2 rounded-full blur-2xl" />
    </div>
  );
}

// Game Header Component - Retro Style
interface GameHeaderProps {
  roomCode: string;
  currentPlayer?: Player;
  currentTurnPlayer: Player;
  isMyTurn: boolean;
  gameEnded: boolean;
}

export function GameHeader({ roomCode, currentPlayer, currentTurnPlayer, isMyTurn, gameEnded }: GameHeaderProps) {
  return (
    <>
      <div className="absolute top-16 left-6 right-6 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Radio className="h-6 w-6 text-orange-300" />
            </div>
            <div>
              <div className="text-white font-semibold text-2xl tracking-tight font-mono">Timeliner FM</div>
              <div className="text-orange-300 text-base font-mono">Put the song in the right place</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-gray-600 px-6 py-3 rounded-2xl shadow-lg">
              <div className="text-orange-300 text-sm font-medium font-mono">Room Code</div>
              <div className="text-white font-mono text-xl font-bold tracking-wider">{roomCode}</div>
            </div>
          </div>
        </div>
      </div>

      {currentPlayer && (
        <div className="absolute top-32 left-6 z-30">
          <div className="bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-gray-600 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-full shadow-lg border-2 border-gray-400" 
                style={{ backgroundColor: currentPlayer.color }}
              />
              <div>
                <div className="text-white font-semibold text-lg font-mono">{currentPlayer.name}</div>
                <div className="text-orange-300 text-sm font-mono">{currentPlayer.score}/10 points</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-32 right-6 z-30">
        <div className={`bg-gradient-to-br from-gray-700 to-gray-900 border-2 rounded-2xl p-4 shadow-xl ${
          isMyTurn && !gameEnded ? 'border-green-400 shadow-green-400/30' : 
          gameEnded ? 'border-gray-500' : 'border-red-400 shadow-red-400/30'
        }`}>
          <div className="text-center">
            <div className="text-orange-300 text-sm mb-1 font-mono">Current Turn</div>
            <div className="flex items-center justify-center gap-2">
              <div 
                className="w-4 h-4 rounded-full shadow-sm border border-gray-400" 
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <div className={`font-semibold font-mono ${
                isMyTurn && !gameEnded ? 'text-green-300' : 
                gameEnded ? 'text-gray-200' : 'text-white'
              }`}>
                {gameEnded ? 'Game Over' : 
                 isMyTurn ? 'Your turn!' : currentTurnPlayer.name}
              </div>
            </div>
            {isMyTurn && !gameEnded && (
              <div className="text-xs text-green-300 mt-1 font-mono">Click to place card!</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
