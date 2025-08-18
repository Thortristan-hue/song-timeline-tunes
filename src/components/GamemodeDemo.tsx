import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FiendModePlayerView } from '@/components/fiend/FiendModePlayerView';
import { FiendModeHostView } from '@/components/fiend/FiendModeHostView';
import { SprintModePlayerView } from '@/components/sprint/SprintModePlayerView';
import { SprintModeHostView } from '@/components/sprint/SprintModeHostView';
import { Song, Player } from '@/types/game';
import { ArrowLeft, Smartphone, Monitor } from 'lucide-react';

// Mock data for demonstration
const mockSong: Song = {
  id: 'mock-1',
  deezer_title: 'Bohemian Rhapsody',
  deezer_artist: 'Queen',
  deezer_album: 'A Night at the Opera',
  release_year: '1975',
  genre: 'Rock',
  cardColor: '#4CC9F0',
  preview_url: 'https://example.com/preview.mp3'
};

const mockPlayers: Player[] = [];

export function GamemodeDemo() {
  const [selectedMode, setSelectedMode] = useState<'fiend' | 'sprint'>('fiend');
  const [isHost, setIsHost] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const mockGuesses = {
    'player-1': { year: 1973, accuracy: 96, points: 96 },
    'player-2': { year: 1978, accuracy: 94, points: 94 },
    'player-3': { year: 1975, accuracy: 100, points: 100 }
  };

  const mockTimeouts = {
    'player-2': 3
  };

  const mockRecentPlacements = {
    'player-1': { correct: true, song: mockSong, timestamp: Date.now() - 1000 },
    'player-2': { correct: false, song: mockSong, timestamp: Date.now() - 500 }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFiendGuess = async (year: number) => {
    const actualYear = parseInt(mockSong.release_year);
    const yearDifference = Math.abs(year - actualYear);
    const accuracy = Math.max(0, 100 - (yearDifference * 2));
    const points = Math.round(accuracy);
    
    return { success: true, accuracy, points };
  };

  const handleSprintPlace = async (song: Song, position: number) => {
    const isCorrect = Math.random() > 0.3; // 70% chance of correct for demo
    return { success: true, correct: isCorrect };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
      </div>

      <div className="relative z-10 p-8">
        {/* Demo Controls */}
        <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-6 rounded-3xl shadow-lg shadow-[#107793]/10 mb-8 max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">New Gamemodes Demo</h1>
            <p className="text-[#d9e8dd]">Interactive preview of Fiend Mode and Sprint Mode</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gamemode Selection */}
            <div className="space-y-2">
              <label className="text-white font-bold text-sm">Game Mode</label>
              <div className="space-y-2">
                <Button
                  onClick={() => setSelectedMode('fiend')}
                  className={`w-full justify-start ${
                    selectedMode === 'fiend' 
                      ? 'bg-[#a53b8b] text-white' 
                      : 'bg-[#1A1A2E]/70 text-[#d9e8dd] hover:bg-[#1A1A2E]'
                  }`}
                >
                  🎯 Fiend Mode
                </Button>
                <Button
                  onClick={() => setSelectedMode('sprint')}
                  className={`w-full justify-start ${
                    selectedMode === 'sprint' 
                      ? 'bg-[#107793] text-white' 
                      : 'bg-[#1A1A2E]/70 text-[#d9e8dd] hover:bg-[#1A1A2E]'
                  }`}
                >
                  ⚡ Sprint Mode
                </Button>
              </div>
            </div>

            {/* View Type Selection */}
            <div className="space-y-2">
              <label className="text-white font-bold text-sm">View Type</label>
              <div className="space-y-2">
                <Button
                  onClick={() => setIsHost(false)}
                  className={`w-full justify-start ${
                    !isHost 
                      ? 'bg-[#4CC9F0] text-black' 
                      : 'bg-[#1A1A2E]/70 text-[#d9e8dd] hover:bg-[#1A1A2E]'
                  }`}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile Player
                </Button>
                <Button
                  onClick={() => setIsHost(true)}
                  className={`w-full justify-start ${
                    isHost 
                      ? 'bg-[#4CC9F0] text-black' 
                      : 'bg-[#1A1A2E]/70 text-[#d9e8dd] hover:bg-[#1A1A2E]'
                  }`}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Host Display
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2">
              <label className="text-white font-bold text-sm">Demo Info</label>
              <div className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 rounded-xl p-3">
                <div className="text-xs text-[#d9e8dd]">
                  <div className="mb-1">
                    <strong>Fiend Mode:</strong> Timeline slider interface
                  </div>
                  <div>
                    <strong>Sprint Mode:</strong> Race-based simultaneous play
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Gamemode Display */}
        <div className="max-w-7xl mx-auto">
          {selectedMode === 'fiend' ? (
            isHost ? (
              <FiendModeHostView
                players={mockPlayers}
                currentSong={mockSong}
                roundNumber={3}
                totalRounds={5}
                roomCode="DEMO"
                timeLeft={25}
                playerGuesses={mockGuesses}
              />
            ) : (
              <FiendModePlayerView
                currentPlayer={mockPlayers[0]}
                currentSong={mockSong}
                roomCode="DEMO"
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onSubmitGuess={handleFiendGuess}
                gameEnded={false}
                roundNumber={3}
                totalRounds={5}
                timeLeft={25}
              />
            )
          ) : (
            isHost ? (
              <SprintModeHostView
                players={mockPlayers}
                currentSong={mockSong}
                targetCards={10}
                roomCode="DEMO"
                timeLeft={28}
                playerTimeouts={mockTimeouts}
                recentPlacements={mockRecentPlacements}
              />
            ) : (
              <SprintModePlayerView
                currentPlayer={mockPlayers[0]}
                currentSong={mockSong}
                roomCode="DEMO"
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onPlaceCard={handleSprintPlace}
                gameEnded={false}
                targetCards={10}
                timeLeft={28}
                isInTimeout={false}
                timeoutRemaining={0}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
