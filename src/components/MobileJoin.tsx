
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Smartphone, Wifi } from 'lucide-react';

interface MobileJoinProps {
  onJoinLobby: (lobbyCode: string, playerName: string) => void;
  onBackToMenu: () => void;
  isLoading?: boolean;
}

export function MobileJoin({ onJoinLobby, onBackToMenu, isLoading = false }: MobileJoinProps) {
  const [lobbyCode, setLobbyCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lobbyCode.trim() || !playerName.trim()) return;
    
    setError('');
    
    try {
      onJoinLobby(lobbyCode.trim().toUpperCase(), playerName.trim());
    } catch (err) {
      setError('Failed to join lobby. Please try again.');
    }
  };

  const handleLobbyCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setLobbyCode(value);
      setError('');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-6 flex flex-col">
      {/* Header with improved touch target */}
      <div className="mb-8">
        <Button
          onClick={onBackToMenu}
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 px-6 text-base"
        >
          <ArrowLeft className="h-5 w-5 mr-3" />
          Back
        </Button>
      </div>

      {/* Main content with better spacing for mobile */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <Card className="bg-white/10 border-white/20 p-8 rounded-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative mb-6">
              <Smartphone className="h-16 w-16 text-blue-400 mx-auto" />
              <Wifi className="h-6 w-6 text-green-400 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Join Game</h1>
            <p className="text-purple-200/80 text-lg leading-relaxed">
              Enter the lobby code shared by your host
            </p>
          </div>

          {/* Form with improved mobile experience */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lobby Code Input */}
            <div>
              <label htmlFor="lobbyCode" className="block text-lg font-medium text-white mb-3">
                Lobby Code
              </label>
              <Input
                id="lobbyCode"
                type="text"
                placeholder="ABC123"
                value={lobbyCode}
                onChange={handleLobbyCodeChange}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20 h-14 text-xl text-center font-mono tracking-wider"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
                inputMode="text"
              />
              <p className="text-purple-200/60 text-sm mt-2 text-center">
                6-character code from host
              </p>
            </div>

            {/* Player Name Input */}
            <div>
              <label htmlFor="playerName" className="block text-lg font-medium text-white mb-3">
                Your Name
              </label>
              <Input
                id="playerName"
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={handleNameChange}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20 h-14 text-lg"
                maxLength={20}
                autoCapitalize="words"
                autoCorrect="off"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4">
                <p className="text-red-300 text-center font-medium">{error}</p>
              </div>
            )}

            {/* Join Button with loading state */}
            <Button
              type="submit"
              disabled={!lobbyCode.trim() || !playerName.trim() || isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold h-14 text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </div>
              ) : (
                'Join Lobby'
              )}
            </Button>
          </form>

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-purple-200/60 text-sm text-center leading-relaxed">
              Ask the host to share the lobby code with you. Make sure you're connected to the internet.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
