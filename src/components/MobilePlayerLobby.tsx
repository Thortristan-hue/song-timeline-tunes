
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Palette, Clock } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Status Card */}
        <Card className="bg-white/10 border-white/20 p-6 text-center">
          <div className="space-y-4">
            <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-400 text-lg px-4 py-2">
              ✓ Connected to Lobby
            </Badge>
            <div>
              <p className="text-purple-200/80 mb-2">Lobby Code:</p>
              <Badge variant="outline" className="text-xl font-bold px-4 py-2 bg-purple-500 text-white border-purple-400">
                {lobbyCode}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Player Customization */}
        <Card className="bg-white/10 border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Customize Your Player
          </h2>

          <div className="space-y-4">
            {/* Name Section */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Display Name
              </label>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    maxLength={20}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                  />
                  <Button 
                    onClick={handleNameSubmit}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    ✓
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium flex-1">{player.name}</span>
                  <Button
                    onClick={() => setEditingName(true)}
                    size="sm"
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Color Section */}
            <div>
              <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Player Color
              </label>
              <div className="grid grid-cols-4 gap-3">
                {playerColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      player.color === color 
                        ? 'border-white shadow-lg scale-110' 
                        : 'border-white/30 hover:border-white/60 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Waiting Status */}
        <Card className="bg-white/10 border-white/20 p-6 text-center">
          <Clock className="h-8 w-8 text-purple-400 mx-auto mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-white mb-2">
            Waiting for Host
          </h3>
          <p className="text-purple-200/80">
            The host will start the game when ready
          </p>
        </Card>
      </div>
    </div>
  );
}
