
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Music, Star } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { MysteryCard } from '@/components/MysteryCard';
import { AudioPlayer } from '@/components/AudioPlayer';

interface HostGameDisplayProps {
  currentPlayer: Player;
  allPlayers: Player[];
  currentSong: Song | null;
  roomCode: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function HostGameDisplay({
  currentPlayer,
  allPlayers,
  currentSong,
  roomCode,
  isPlaying,
  onPlayPause,
  mysteryCardRevealed,
  cardPlacementResult
}: HostGameDisplayProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-6 left-4 right-4 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 bg-slate-800/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-600/30 shadow-lg">
            <Crown className="h-6 w-6 text-yellow-400" />
            <div>
              <div className="text-white font-bold text-xl">Timeliner</div>
              <div className="text-slate-300 text-sm">Host Display</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-800/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-600/30 shadow-lg">
              <Users className="h-5 w-5 text-blue-400" />
              <div className="text-white">
                <div className="text-sm text-slate-300">Players</div>
                <div className="font-bold text-lg">{allPlayers.length}</div>
              </div>
            </div>
            
            <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400 text-lg px-6 py-3 font-mono">
              {roomCode}
            </Badge>
          </div>
        </div>
      </div>

      {/* Mystery Card and Controls */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl scale-150" />
            
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

          {/* Current Turn Player Info */}
          <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 border border-slate-600/50">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg" 
                style={{ backgroundColor: currentPlayer?.color }}
              />
              <div className="text-3xl font-black text-white">
                {currentPlayer?.name}
              </div>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 px-4 py-2 rounded-full text-lg font-black">
                {currentPlayer?.score}/10
              </div>
            </div>
            
            <div className="text-lg text-slate-300 text-center mb-4">
              is placing their card...
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-center">
              <AudioPlayer
                src={currentSong?.preview_url || null}
                isPlaying={isPlaying}
                onPlayPause={onPlayPause}
                disabled={!currentSong?.preview_url}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Current Player Timeline */}
      <div className="absolute bottom-40 left-4 right-4 z-20">
        <Card className="bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white"
              style={{ backgroundColor: currentPlayer?.color }}
            />
            <h3 className="text-2xl font-bold text-white">
              {currentPlayer?.name}'s Timeline
            </h3>
            <Star className="h-5 w-5 text-yellow-400" />
          </div>
          
          <div className="flex gap-3 items-center overflow-x-auto pb-2">
            {currentPlayer?.timeline.length === 0 ? (
              <div className="text-slate-400 text-lg italic">
                No songs placed yet...
              </div>
            ) : (
              currentPlayer.timeline.map((song, index) => (
                <div
                  key={index}
                  className="min-w-32 h-32 rounded-xl flex flex-col items-center justify-center text-white shadow-lg border border-white/20 transform transition-all hover:scale-105"
                  style={{ backgroundColor: song.cardColor || currentPlayer.color }}
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

      {/* All Players Mini Timelines */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allPlayers.map((player) => (
            <Card 
              key={player.id}
              className={`bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-4 transition-all ${
                player.id === currentPlayer?.id 
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
                {player.id === currentPlayer?.id && (
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
