
import React from 'react';
import { Song, Player } from '@/types/game';
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

// Simplified Room Code Display
interface RoomCodeDisplayProps {
  roomCode: string;
}

export function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  return (
    <div className="absolute top-8 right-8 z-40">
      <div className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/20 shadow-xl">
        <div className="text-white/60 text-sm font-medium mb-1">Room Code</div>
        <div className="text-white font-mono text-3xl font-bold tracking-wider text-center">{roomCode}</div>
      </div>
    </div>
  );
}

// Main Host Game View - Simplified
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
      
      {/* Room Code */}
      <RoomCodeDisplay roomCode={roomCode} />

      {/* Cassette Player Display */}
      <CassettePlayerDisplay 
        players={players} 
        currentPlayerId={currentTurnPlayer.id}
      />
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
      
      {/* Room Code */}
      <RoomCodeDisplay roomCode={roomCode} />

      {/* Cassette Player Display */}
      <CassettePlayerDisplay 
        players={players} 
        currentPlayerId={currentTurnPlayer.id}
      />
    </div>
  );
}
