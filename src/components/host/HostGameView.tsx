
import React from 'react';
import { GameRoom, Player } from '@/types/game';

interface HostGameViewProps {
  room: GameRoom;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  roomCode: string;
  playerName: string;
  gameLogic: any;
  onRestart: () => void;
  onEndGame: () => void;
}

export default function HostGameView({
  room,
  players,
  currentPlayer,
  isHost,
  roomCode,
  playerName,
  gameLogic,
  onRestart,
  onEndGame
}: HostGameViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Host Game View</h1>
        <p className="text-lg mb-2">Room Code: {roomCode}</p>
        <p className="text-lg mb-2">Players: {players.length}</p>
        <p className="text-lg mb-4">Current Song: {room.current_song?.deezer_title || 'No song'}</p>
        
        <div className="space-x-4">
          <button
            onClick={onRestart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Restart Game
          </button>
          <button
            onClick={onEndGame}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  );
}
