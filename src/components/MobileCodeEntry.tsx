import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Key, Check } from 'lucide-react';
import { suppressUnused } from '@/utils/suppressUnused';

interface MobileCodeEntryProps {
  onCodeSubmit: (code: string) => void;
  onBackToMenu: () => void;
  isLoading?: boolean;
  autoJoinCode?: string;
}

export function MobileCodeEntry({ 
  onCodeSubmit, 
  onBackToMenu, 
  isLoading = false, 
  autoJoinCode = '' 
}: MobileCodeEntryProps) {
  const [lobbyCode, setLobbyCode] = useState(autoJoinCode || '');
  const [error, setError] = useState('');

  // Suppress unused variables that may be used in future implementations
  suppressUnused();

  // Auto-submit when code is provided via QR scan
  useEffect(() => {
    if (autoJoinCode) {
      console.log('🔗 Auto-submitting QR code:', autoJoinCode);
      const cleanCode = autoJoinCode.trim().toUpperCase();
      const lobbyCodeRegex = /^[A-Z]{5}[0-9]$/;
      
      if (lobbyCodeRegex.test(cleanCode)) {
        setLobbyCode(cleanCode);
        // Auto-submit after a short delay for better UX
        setTimeout(() => {
          onCodeSubmit(cleanCode);
        }, 500);
      } else {
        setError('Invalid lobby code from QR scan');
      }
    }
  }, [autoJoinCode, onCodeSubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!lobbyCode.trim()) {
      setError('Please enter a lobby code');
      return;
    }

    // Validate lobby code format (5 letters + 1 digit)
    const cleanCode = lobbyCode.trim().toUpperCase();
    const lobbyCodeRegex = /^[A-Z]{5}[0-9]$/;
    
    if (!lobbyCodeRegex.test(cleanCode)) {
      setError('Invalid lobby code format. Expected format: APPLE3');
      return;
    }

    console.log('🎮 Code entry: Submitting code:', cleanCode);
    onCodeSubmit(cleanCode);
  };

  const handleLobbyCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // Only allow letters and numbers, max 6 characters
    const filtered = value.replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setLobbyCode(filtered);
    setError(''); // Clear error when typing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-[#4a4f5b]/8 rounded-full blur-2xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#107793] to-[#a53b8b] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Key className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {autoJoinCode ? 'Code Detected!' : 'Enter Lobby Code'}
          </h1>
          <p className="text-[#d9e8dd] text-lg">
            {autoJoinCode ? 'Joining room...' : 'Enter the 6-character code to join'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <Label htmlFor="lobby-code" className="text-white font-medium">
              Lobby Code
            </Label>
            <div className="relative">
              <Input
                id="lobby-code"
                type="text"
                value={lobbyCode}
                onChange={handleLobbyCodeChange}
                placeholder="APPLE3"
                className="w-full h-14 px-4 bg-white/10 border-white/20 text-white placeholder-white/50 text-center text-xl font-mono tracking-wider focus:ring-2 focus:ring-[#107793] focus:border-transparent"
                maxLength={6}
                disabled={isLoading || !!autoJoinCode}
              />
              {autoJoinCode && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
              )}
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-[#107793] to-[#a53b8b] hover:from-[#a53b8b] hover:to-[#107793] text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            disabled={isLoading || !lobbyCode.trim()}
          >
            {isLoading ? 'Joining...' : autoJoinCode ? 'Joining Room' : 'Continue'}
          </Button>
        </form>

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBackToMenu}
          className="mt-8 text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300"
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Button>
      </div>
    </div>
  );
}
