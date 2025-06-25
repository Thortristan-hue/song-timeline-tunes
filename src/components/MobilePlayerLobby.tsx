import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Music, Users, Palette, Gamepad2, Clock } from 'lucide-react';
import { Player, GameRoom } from '@/types/game';

interface MobilePlayerLobbyProps {
  room: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
  onBackToMenu: () => void;
  onUpdatePlayer: (name: string, color: string) => Promise<void>;
}

const PLAYER_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue  
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function MobilePlayerLobby({ 
  room,
  players,
  currentPlayer,
  onBackToMenu,
  onUpdatePlayer
}: MobilePlayerLobbyProps) {
  const [name, setName] = useState(currentPlayer?.name || '');
  const [selectedColor, setSelectedColor] = useState(currentPlayer?.color || PLAYER_COLORS[0]);
  const [hasChanges, setHasChanges] = useState(false);

  // Listen for game phase changes
  useEffect(() => {
    if (room?.phase === 'playing') {
      // Game has started - this will be handled by the parent component
    }
  }, [room?.phase]);

  useEffect(() => {
    if (currentPlayer) {
      setName(currentPlayer.name);
      setSelectedColor(currentPlayer.color);
    }
  }, [currentPlayer]);

  useEffect(() => {
    setHasChanges(name !== (currentPlayer?.name || '') || selectedColor !== (currentPlayer?.color || ''));
  }, [name, selectedColor, currentPlayer?.name, currentPlayer?.color]);

  const handleSave = () => {
    if (name.trim() && selectedColor) {
      onUpdatePlayer(name.trim(), selectedColor);
      setHasChanges(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  if (room?.phase === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-black/20 border-purple-400/30 backdrop-blur-sm text-center">
          <Gamepad2 className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-4">Game Starting!</h2>
          <p className="text-purple-200">Get ready to place your timeline cards...</p>
        </Card>
      </div>
    );
  }

  if (!room || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-black/20 border-red-400/30 backdrop-blur-sm text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connection Error</h2>
          <p className="text-red-200 mb-4">Unable to connect to the lobby.</p>
          <Button onClick={onBackToMenu} className="bg-red-500 hover:bg-red-600">
            Back to Menu
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            <Music className="h-4 w-4 text-purple-300 transform rotate-12" />
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl rounded-full animate-pulse"></div>
            <Users className="h-16 w-16 text-purple-400 mx-auto relative z-10" />
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Player Lobby
          </h1>
          
          <Badge 
            variant="outline" 
            className="bg-purple-500/20 text-purple-200 border-purple-400 text-lg px-4 py-2"
          >
            Room: {room.lobby_code}
          </Badge>
        </div>

        {/* Player Customization Card */}
        <Card className="bg-black/30 border-purple-400/30 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Palette className="h-5 w-5 text-purple-400" />
            Customize Your Player
          </h2>
          
          <div className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-purple-200 font-medium">
                Your Name
              </Label>
              <Input
                id="playerName"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={handleNameChange}
                className="bg-white/10 border-purple-400/30 text-white placeholder:text-white/50 text-lg p-3"
                maxLength={20}
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-3">
              <Label className="text-purple-200 font-medium">
                Choose Your Color
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {PLAYER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-16 h-16 rounded-full transition-all duration-200 ${
                      selectedColor === color 
                        ? 'ring-4 ring-white/50 scale-110 shadow-lg' 
                        : 'hover:scale-105 hover:shadow-md'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && (
                      <div className="w-full h-full rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-purple-200/70 text-sm mb-3">Preview:</p>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ backgroundColor: selectedColor }}
                >
                  {name.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {name.trim() || 'Your Name'}
                  </p>
                  <p className="text-sm text-purple-300/70">
                    Timeline Tunes Player
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave}
              disabled={!name.trim() || !selectedColor || !hasChanges}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 text-lg rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasChanges ? 'Save Changes' : 'Saved ✓'}
            </Button>
          </div>
        </Card>

        {/* Waiting Status */}
        <Card className="bg-black/20 border-green-400/30 p-6 backdrop-blur-sm text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-6 w-6 text-green-400 animate-pulse" />
              <h3 className="text-lg font-semibold text-white">
                Waiting for Host
              </h3>
            </div>
            
            <p className="text-green-200/80">
              The game will start automatically when the host begins.
            </p>
            
            <div className="flex justify-center">
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '1s'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="bg-black/10 border-white/10 p-4 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-2">How to Play:</h3>
          <ul className="text-xs text-purple-200/70 space-y-1">
            <li>• Listen to song previews</li>
            <li>• Place them in chronological order</li>
            <li>• First to 10 correct wins!</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
