import React from "react";
import { CassettePlayerDisplay } from "@/components/CassettePlayerDisplay";

interface HostGameViewProps {
  roomCode: string;
  players: Player[];
}

export function HostGameView({ roomCode, players }: HostGameViewProps) {
  return (
    <div className="relative min-h-screen bg-black">
      {/* Room Code */}
      <div className="absolute top-8 right-8 z-40">
        <div className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/20 shadow-xl">
          <div className="text-white/60 text-sm font-medium mb-1">Room Code</div>
          <div className="text-white font-mono text-3xl font-bold tracking-wider text-center">
            {roomCode}
          </div>
        </div>
      </div>
      {/* Cassette Players */}
      <div className="flex justify-center items-center h-full">
        <CassettePlayerDisplay players={players} />
      </div>
    </div>
  );
}
