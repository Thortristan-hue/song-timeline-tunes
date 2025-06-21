
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Palette, Clock, Wifi, Check, Crown, Users } from 'lucide-react';
import { Player } from '@/types/game';

interface MobilePlayerLobbyProps {
  player: Player;
  lobbyCode: string;
  onUpdatePlayer: (name: string, color: string) => void;
}

const playerColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#AED6F1', '#E8DAEF'
];

const avatarEmojis = ['🎵', '🎸', '🎤', '🎧', '🎹', '🥁', '🎺', '🎷', '🎻', '🪕'];

export function MobilePlayerLobby({ 
  player, 
  lobbyCode, 
  onUpdatePlayer 
}: MobilePlayerLobbyProps) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(player.name);
  const [selectedAvatar, setSelectedAvatar] = useState('🎵');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Connection Status */}
        <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-400/30 p-6 text-center backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <Wifi className="h-8 w-8 text-green-400 animate-pulse" />
                <div className="absolute -inset-1 bg-green-400/20 rounded-full blur animate-pulse"></div>
              </div>
              <Badge className="bg-green-500/30 text-green-300 border-green-400 text-lg px-4 py-2">
                <Check className="h-4 w-4 mr-2" />
                Connected
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-green-200/80 text-lg font-medium">Room Code</p>
              <Badge 
                variant="outline" 
                className="text-3xl font-bold px-6 py-3 bg-purple-500 text-white border-purple-400 tracking-wider font-mono"
              >
                {lobbyCode}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Player Customization */}
        <Card className="bg-white/10 border-white/20 p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <User className="h-6 w-6" />
            Customize Your Player
          </h2>

          <div className="space-y-6">
            {/* Avatar Selection */}
            <div>
              <label className="block text-lg font-medium text-white mb-3">
                Choose Avatar
              </label>
              <div className="grid grid-cols-5 gap-3">
                {avatarEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center border-2 transition-all ${
                      selectedAvatar === emoji 
                        ? 'border-purple-400 bg-purple-500/30 scale-110' 
                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Section */}
            <div>
              <label className="block text-lg font-medium text-white mb-3">
                Display Name
              </label>
              {editingName ? (
                <div className="space-y-3">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white h-14 text-lg"
                    maxLength={20}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                    autoFocus
                    placeholder="Enter your name"
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
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: player.color }}
                  >
                    {selectedAvatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-lg">{player.name}</p>
                    <p className="text-purple-200/60 text-sm">Tap to edit</p>
                  </div>
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

            {/* Color Section */}
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
                    className={`w-16 h-16 rounded-xl border-3 transition-all ${
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

        {/* Waiting Status */}
        <Card className="bg-white/10 border-white/20 p-8 text-center backdrop-blur-sm">
          <div className="space-y-6">
            <div className="relative">
              <Clock className="h-16 w-16 text-purple-400 mx-auto animate-pulse" />
              <div className="absolute -inset-2 bg-purple-400/20 rounded-full blur-lg animate-pulse"></div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white">
                Waiting for Host
              </h3>
              <p className="text-purple-200/80 text-lg leading-relaxed">
                The host will start the game when everyone is ready
              </p>
            </div>

            {/* Animated waiting dots */}
            <div className="flex justify-center gap-2 mt-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-purple-400 rounded-full animate-bounce"
                  style={{ 
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.4s'
                  }}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Room Info */}
        <Card className="bg-white/5 border-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-purple-200/70">
            <Users className="h-4 w-4" />
            <span className="text-sm">
              You're connected to room {lobbyCode}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
