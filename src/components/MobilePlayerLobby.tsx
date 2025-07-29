
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Music, Users, User, Gamepad2, Clock } from 'lucide-react';
import { GameRoom, Player } from '@/types/game';

// Import character images
import charPlayer1 from '@/assets/char_player1.png';
import charPlayer2 from '@/assets/char_player2.png';
import charPlayer3 from '@/assets/char_player3.png';
import charPlayer4 from '@/assets/char_player4.png';
import charPlayer5 from '@/assets/char_player5.png';
import charPlayer6 from '@/assets/char_player6.png';

interface MobilePlayerLobbyProps {
  room: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
  onBackToMenu: () => void;
  onUpdatePlayer: (name: string, character: string) => Promise<void>;
}

const PLAYER_CHARACTERS = [
  { id: 'char_player1', name: 'Player 1', image: charPlayer1, color: '#007AFF' },
  { id: 'char_player2', name: 'Player 2', image: charPlayer2, color: '#FF3B30' },
  { id: 'char_player3', name: 'Player 3', image: charPlayer3, color: '#34C759' },
  { id: 'char_player4', name: 'Player 4', image: charPlayer4, color: '#FF9500' },
  { id: 'char_player5', name: 'Player 5', image: charPlayer5, color: '#AF52DE' },
  { id: 'char_player6', name: 'Player 6', image: charPlayer6, color: '#FF2D92' },
];

export default function MobilePlayerLobby({ 
  room = { 
    id: 'demo', 
    lobby_code: 'DEMO123', 
    host_id: 'demo-host',
    host_name: 'Demo Host',
    phase: 'lobby',
    songs: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    gamemode: 'classic',
    gamemode_settings: {}
  },
  players = [],
  currentPlayer = { 
    id: '1', 
    name: 'Demo Player', 
    color: PLAYER_CHARACTERS[0].color,
    timelineColor: PLAYER_CHARACTERS[0].color,
    score: 0,
    timeline: [],
    character: PLAYER_CHARACTERS[0].id
  },
  onBackToMenu = () => {},
  onUpdatePlayer = async () => {}
}: MobilePlayerLobbyProps) {
  const [name, setName] = useState(currentPlayer?.name || '');
  const [selectedCharacter, setSelectedCharacter] = useState(currentPlayer?.character || PLAYER_CHARACTERS[0].id);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (currentPlayer) {
      setName(currentPlayer.name);
      setSelectedCharacter(currentPlayer.character || PLAYER_CHARACTERS[0].id);
    }
  }, [currentPlayer]);

  useEffect(() => {
    setHasChanges(
      name !== (currentPlayer?.name || '') || 
      selectedCharacter !== (currentPlayer?.character || PLAYER_CHARACTERS[0].id)
    );
  }, [name, selectedCharacter, currentPlayer?.name, currentPlayer?.character]);

  const handleSave = () => {
    if (name.trim() && selectedCharacter) {
      // Use the character's associated color for compatibility
      const selectedCharacterData = PLAYER_CHARACTERS.find(char => char.id === selectedCharacter);
      const color = selectedCharacterData?.color || PLAYER_CHARACTERS[0].color;
      onUpdatePlayer(name.trim(), selectedCharacter);
      setHasChanges(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const getSelectedCharacterData = () => {
    return PLAYER_CHARACTERS.find(char => char.id === selectedCharacter) || PLAYER_CHARACTERS[0];
  };

  if (room?.phase === 'playing') {
    return (
      <div className="mobile-container bg-black flex items-center justify-center p-6"
           style={{ minHeight: 'var(--mobile-safe-height)' }}>
        <div className="w-full max-w-sm bg-gray-900 rounded-3xl p-8 shadow-2xl text-center border border-gray-800">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Gamepad2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Ready to play!</h2>
          <p className="text-gray-300 leading-relaxed">Time to show off your music knowledge. Good luck!</p>
        </div>
      </div>
    );
  }

  if (!room || !currentPlayer) {
    return (
      <div className="mobile-container bg-black flex items-center justify-center p-6"
           style={{ minHeight: 'var(--mobile-safe-height)' }}>
        <div className="w-full max-w-sm bg-gray-900 rounded-3xl p-8 shadow-2xl text-center border border-gray-800">
          <div className="w-16 h-16 bg-red-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-800/30">
            <Users className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-3">Connection issue</h2>
          <p className="text-gray-300 mb-6">Can't connect to the lobby right now.</p>
          <Button 
            onClick={onBackToMenu} 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-2xl active:scale-95 transition-all"
          >
            Back to menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-black"
         style={{ minHeight: 'var(--mobile-safe-height)' }}>
      {/* Safe area for iPhone */}
      <div className="pt-safe-top pb-safe-bottom">
        <div className="px-6 py-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 relative overflow-hidden mx-auto">
              <img 
                src="/Vinyl_rythm.png" 
                alt="Rythmy Logo" 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">
                Timeline Tunes
              </h1>
              <p className="text-gray-400">
                Waiting room
              </p>
              
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30">
                <span className="text-sm font-medium text-blue-300">
                  Room {room.lobby_code}
                </span>
              </div>
            </div>
          </div>

          {/* Player Setup */}
          <div className="bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Set up your player
              </h2>
            </div>
            
            <div className="space-y-6">
              
              {/* Name Input */}
              <div className="space-y-3">
                <Label htmlFor="playerName" className="text-gray-300 font-medium text-base">
                  What should we call you?
                </Label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-lg p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-gray-750 transition-all"
                  maxLength={20}
                />
              </div>

              {/* Character Selection */}
              <div className="space-y-4">
                <Label className="text-gray-300 font-medium text-base">
                  Choose your character
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  {PLAYER_CHARACTERS.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => setSelectedCharacter(character.id)}
                      className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-200 ${
                        selectedCharacter === character.id 
                          ? 'ring-4 ring-blue-400/50 scale-95 shadow-lg' 
                          : 'hover:scale-105 active:scale-95'
                      }`}
                    >
                      <img 
                        src={character.image} 
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedCharacter === character.id && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-3">Preview</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                    <img 
                      src={getSelectedCharacterData().image} 
                      alt="Selected character"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {name.trim() || 'Your name'}
                    </p>
                    <p className="text-sm text-gray-400">
                      Playing as {getSelectedCharacterData().name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSave}
                disabled={!name.trim() || !selectedCharacter || !hasChanges}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {hasChanges ? 'Save changes' : 'Saved ✓'}
              </Button>
            </div>
          </div>

          {/* Waiting Status */}
          <div className="bg-gray-900 rounded-3xl p-6 shadow-2xl text-center border border-gray-800">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto border border-green-500/30">
                <Clock className="h-6 w-6 text-green-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  Waiting for the host
                </h3>
                <p className="text-gray-300">
                  The game will start automatically once everyone's ready.
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                      style={{
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '1.2s'
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-800">
            <h3 className="font-semibold text-white mb-3">How it works</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Listen to song clips and guess when they came out</p>
              <p>• Place them in the right order on your timeline</p>
              <p>• First to get 10 right wins the round</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-800/50 rounded-2xl p-4 text-center border border-gray-700/50">
            <p className="text-xs text-gray-400 leading-relaxed">
              Timeline Tunes is an independent game created for friends to enjoy together. 
              Not affiliated with any music streaming service or record label. 
              Just good music and good times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
