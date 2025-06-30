
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Users } from 'lucide-react';

interface HostHeaderProps {
  roomCode: string;
  playersCount: number;
}

export function HostHeader({ roomCode, playersCount }: HostHeaderProps) {
  return (
    <div className="absolute top-6 left-4 right-4 z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-yellow-400/50 shadow-lg">
          <Crown className="h-6 w-6 text-yellow-400" />
          <div className="text-white">
            <div className="font-bold text-lg">Host View</div>
            <div className="text-sm text-yellow-200">Timeline Tunes</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-800/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-600/30 shadow-lg">
            <Users className="h-5 w-5 text-blue-400" />
            <div className="text-white">
              <div className="text-sm text-slate-300">Players</div>
              <div className="font-bold text-lg">{playersCount}</div>
            </div>
          </div>
          
          <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400 text-lg px-6 py-3 font-mono">
            {roomCode}
          </Badge>
        </div>
      </div>
    </div>
  );
}
