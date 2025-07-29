
import React, { useState, useEffect } from 'react';
import { MobileCodeEntry } from './MobileCodeEntry';
import { MobilePlayerSetup } from './MobilePlayerSetup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { GAME_CHARACTERS } from '@/constants/characters';
import { Player } from '@/types/game';

interface MobileJoinFlowProps {
  onJoinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  onBackToMenu: () => void;
  isLoading?: boolean;
  autoJoinCode?: string;
  currentPlayer?: Player;
  onUpdatePlayer?: (updates: Partial<Player>) => Promise<boolean>;
}

export function MobileJoinFlow({ 
  onJoinRoom, 
  onBackToMenu, 
  isLoading = false, 
  autoJoinCode = '',
  currentPlayer,
  onUpdatePlayer
}: MobileJoinFlowProps) {
  const [currentStep, setCurrentStep] = useState<'code' | 'setup' | 'joining'>('code');
  const [verifiedCode, setVerifiedCode] = useState<string>('');
  const [playerName, setPlayerName] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState(GAME_CHARACTERS[0]);
  const [joining, setJoining] = useState(false);
  
  console.log('🔗 MobileJoinFlow rendered with autoJoinCode:', autoJoinCode);
  console.log('🔗 Current step:', currentStep, 'Current player:', currentPlayer?.name);

  const handleCodeSubmit = (code: string) => {
    console.log('🔗 Code submitted:', code);
    setVerifiedCode(code);
    setCurrentStep('setup');
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !verifiedCode) return;
    
    console.log('🎮 Attempting to join room with:', { lobbyCode: verifiedCode, name: playerName.trim() });
    
    setJoining(true);
    setCurrentStep('joining');
    
    try {
      const success = await onJoinRoom(verifiedCode, playerName.trim());
      console.log('🔗 Join room result:', success);
      
      if (!success) {
        // Reset to setup step if join failed
        setCurrentStep('setup');
      }
      // If successful, the parent component will handle the state change
    } catch (error) {
      console.error('❌ Join room error:', error);
      setCurrentStep('setup');
    } finally {
      setJoining(false);
    }
  };

  const handleBackToCodeEntry = () => {
    setCurrentStep('code');
    setVerifiedCode('');
    setPlayerName('');
  };

  // If we have a current player and onUpdatePlayer function, show the player setup component
  if (currentPlayer && onUpdatePlayer) {
    return (
      <MobilePlayerSetup
        currentPlayer={currentPlayer}
        onUpdatePlayer={onUpdatePlayer}
      />
    );
  }

  // Show joining state
  if (currentStep === 'joining') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Joining Room...</h2>
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
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
    );
  }

  // Show manual setup if we're on setup step but don't have the required props
  if (currentStep === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Setup Your Profile</h2>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="player-name" className="text-white mb-2 block">Your Name</Label>
              <Input
                id="player-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                maxLength={20}
              />
            </div>

            <div>
              <Label className="text-white mb-4 block">Choose Your Character</Label>
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {GAME_CHARACTERS.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => setSelectedCharacter(character)}
                    className={`
                      relative p-2 rounded-xl transition-all duration-200 
                      ${selectedCharacter.id === character.id
                        ? 'ring-2 ring-yellow-400 bg-white/20'
                        : 'bg-white/10 hover:bg-white/15'
                      }
                    `}
                  >
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-full h-16 object-contain"
                    />
                    <p className="text-white text-xs mt-1 font-medium">{character.name}</p>
                    {selectedCharacter.id === character.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-black text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleJoinRoom}
              disabled={!playerName.trim() || joining}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {joining ? 'Joining...' : 'Join Game'}
            </Button>

            <Button
              variant="ghost"
              onClick={handleBackToCodeEntry}
              className="w-full text-white hover:bg-white/10"
              disabled={joining}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Code Entry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MobileCodeEntry
      onCodeSubmit={handleCodeSubmit}
      onBackToMenu={onBackToMenu}
      isLoading={isLoading}
      autoJoinCode={autoJoinCode}
    />
  );
}
