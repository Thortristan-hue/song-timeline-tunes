import React from 'react';
import { Button } from '@/components/ui/button';
import { Player, GameRoom } from '@/types/game';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobilePlayerLobbyProps {
  room: GameRoom;
  currentPlayer: Player;
  onStartGame: () => void;
  onLeaveGame: () => void;
  isConnected: boolean;
}

export function MobilePlayerLobby({
  room,
  currentPlayer,
  onStartGame,
  onLeaveGame,
  isConnected
}: MobilePlayerLobbyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
      {/* Connection Status */}
      <div className="absolute top-4 left-4 z-10">
        {isConnected ? (
          <div className="flex items-center text-green-500">
            <Wifi className="mr-2 h-4 w-4" />
            Connected
          </div>
        ) : (
          <div className="flex items-center text-red-500">
            <WifiOff className="mr-2 h-4 w-4" />
            Disconnected
          </div>
        )}
      </div>

      <div className="relative z-10 p-4 h-screen flex flex-col justify-center items-center">
        {/* Game Room Info */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome, {currentPlayer.name}!
          </h1>
          <p className="text-md text-gray-400">
            You're in Room <span className="font-mono text-blue-400">{room.lobby_code}</span>
          </p>
        </div>

        {/* Waiting for Host */}
        <div className="space-y-4">
          <p className="text-lg text-gray-300 text-center">
            Waiting for the host to start the game...
          </p>
          <div className="flex items-center justify-center">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-blue-500 animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500 font-bold text-xl">
                ...
              </div>
            </div>
          </div>
        </div>

        {/* Leave Game Button */}
        <Button 
          variant="destructive"
          onClick={onLeaveGame}
          className="absolute bottom-8 left-8 bg-red-600 hover:bg-red-500 text-white"
        >
          Leave Game
        </Button>
      </div>
    </div>
  );
}
