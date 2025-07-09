
import React from 'react';
import { Crown, Users } from 'lucide-react';
import { Player } from '@/types/game';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';

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

interface HostHeaderProps {
  roomCode: string;
  playersCount: number;
}

function HostHeader({ roomCode, playersCount }: HostHeaderProps) {
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

interface HostGameViewProps {
  roomCode: string;
  players: Player[];
  onRemovePlayer?: (playerId: string) => void;
}

export function HostGameView({
  roomCode,
  players,
  onRemovePlayer
}: HostGameViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
      <HostGameBackground />
      <HostHeader roomCode={roomCode} playersCount={players.length} />

      {/* Cassette player at normal size */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <CassettePlayerDisplay 
          players={players}
          isHost={true}
          onRemovePlayer={onRemovePlayer}
        />
      </div>
    </div>
  );
}
