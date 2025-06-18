
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Smartphone } from 'lucide-react';

interface MobileJoinProps {
  onJoinLobby: (lobbyCode: string, playerName: string) => void;
  onBackToMenu: () => void;
}

export function MobileJoin({ onJoinLobby, onBackToMenu }: MobileJoinProps) {
  const [lobbyCode, setLobbyCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lobbyCode.trim() && playerName.trim()) {
      onJoinLobby(lobbyCode.trim().toUpperCase(), playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
        </div>

        <Card className="bg-white/10 border-white/20 p-6">
          <div className="text-center mb-6">
            <Smartphone className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Join Game</h2>
            <p className="text-purple-200/80">
              Enter the lobby code from the host
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="lobbyCode" className="block text-sm font-medium text-white mb-2">
                Lobby Code
              </label>
              <Input
                id="lobbyCode"
                type="text"
                placeholder="Enter lobby code..."
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/20"
                maxLength={6}
              />
            </div>

            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-white mb-2">
                Your Name
              </label>
              <Input
                id="playerName"
                type="text"
                placeholder="Enter your name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/20"
                maxLength={20}
              />
            </div>

            <Button
              type="submit"
              disabled={!lobbyCode.trim() || !playerName.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 px-4 rounded-xl"
            >
              Join Lobby
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
