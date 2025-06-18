
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Palette, Clock, Wifi, Check } from 'lucide-react';
import { Player } from '@/types/game';

interface MobilePlayerLobbyProps {
  player: Player;
  lobbyCode: string;
  onUpdatePlayer: (name: string, color: string) => void;
}

const playerColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export function MobilePlayerLobby({ 
  player, 
  lobbyCode, 
  onUpdatePlayer 
}: MobilePlayerLobbyProps) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(player.name);

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      onUpdatePlayer(tempName.trim(), player.color);
      setEditingName(false);
    }
  };

  const handleColorChange = (color: string) => {
    onUpdatePlayer(player.name, color);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-sm mx-auto space-y-6">
        {/* Connection Status - Enhanced for mobile */}
        <Card className="bg-white/10 border-white/20 p-6 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Wifi className="h-6 w-6 text-green-400" />
              <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-400 text-lg px-4 py-2">
                <Check className="h-4 w-4 mr-2" />
                Connected
              </Badge>
            </div>
            <div>
              <p className="text-purple-200/80 mb-3 text-lg">Lobby Code:</p>
              <Badge variant="outline" className="text-2xl font-bold px-6 py-3 bg-purple-500 text-white border-purple-400 tracking-wider">
                {lobbyCode}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Player Customization - Enhanced for touch */}
        <Card className="bg-white/10 border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <User className="h-6 w-6" />
            Your Player
          </h2>

          <div className="space-y-6">
            {/* Name Section with better mobile UX */}
            <div>
              <label className="block text-lg font-medium text-white mb-3">
                Display Name
              </label>
              {editingName ? (
                <div className="space-y-3">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white h-12 text-lg"
                    maxLength={20}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleNameSubmit}
                      className="flex-1 bg-green-500 hover:bg-green-600 h-12 text-base"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingName(false);
                        setTempName(player.name);
                      }}
                      variant="outline"
                      className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 text-base"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                  <span className="text-white font-medium text-lg flex-1">{player.name}</span>
                  <Button
                    onClick={() => setEditingName(true)}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-10 px-4"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Color Section with larger touch targets */}
            <div>
              <label className="block text-lg font-medium text-white mb-3 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Player Color
              </label>
              <div className="grid grid-cols-4 gap-4">
                {playerColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-16 h-16 rounded-full border-3 transition-all ${
                      player.color === color 
                        ? 'border-white shadow-lg scale-110 ring-2 ring-white/50' 
                        : 'border-white/30 hover:border-white/60 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Waiting Status with pulse animation */}
        <Card className="bg-white/10 border-white/20 p-8 text-center">
          <div className="space-y-4">
            <Clock className="h-12 w-12 text-purple-400 mx-auto animate-pulse" />
            <h3 className="text-xl font-bold text-white">
              Waiting for Host
            </h3>
            <p className="text-purple-200/80 text-lg leading-relaxed">
              The host will start the game when all players are ready
            </p>
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
