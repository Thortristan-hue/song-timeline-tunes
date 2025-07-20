import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MobilePlayerGameView from '@/components/player/MobilePlayerGameView';
import { Song, Player } from '@/types/game';
import { ArrowLeft, Smartphone, Monitor } from 'lucide-react';

// Mock data for testing timeline cards visibility
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

const mockPlayerWithTimeline: Player = {
  id: 'player-1',
  name: 'TestPlayer',
  color: '#4CC9F0',
  timelineColor: '#4CC9F0',
  score: 85,
  timeline: [
    {
      id: 'song-1',
      deezer_title: 'Let It Be',
      deezer_artist: 'The Beatles',
      deezer_album: 'Let It Be',
      release_year: '1970',
      genre: 'Rock',
      cardColor: '#4CC9F0'
    },
    {
      id: 'song-2',
      deezer_title: 'Imagine',
      deezer_artist: 'John Lennon',
      deezer_album: 'Imagine',
      release_year: '1971',
      genre: 'Rock',
      cardColor: '#107793'
    },
    {
      id: 'song-3',
      deezer_title: 'Hotel California',
      deezer_artist: 'Eagles',
      deezer_album: 'Hotel California',
      release_year: '1976',
      genre: 'Rock',
      cardColor: '#a53b8b'
    }
  ]
};

const mockPlayerEmpty: Player = {
  id: 'player-2',
  name: 'EmptyPlayer',
  color: '#a53b8b',
  timelineColor: '#a53b8b',
  score: 0,
  timeline: []
};

const mockCurrentTurnPlayer: Player = {
  id: 'player-3',
  name: 'CurrentTurnPlayer',
  color: '#107793',
  timelineColor: '#107793',
  score: 42,
  timeline: []
};

export function TimelineTestDemo() {
  const [testScenario, setTestScenario] = useState<'with-timeline' | 'empty-timeline' | 'null-player'>('with-timeline');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePlaceCard = async (song: Song, position: number) => {
    console.log('Mock place card:', song.deezer_title, 'at position', position);
    return { success: true };
  };

  const getCurrentPlayer = () => {
    switch (testScenario) {
      case 'with-timeline':
        return mockPlayerWithTimeline;
      case 'empty-timeline':
        return mockPlayerEmpty;
      case 'null-player':
        return null;
      default:
        return mockPlayerWithTimeline;
    }
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
            <h1 className="text-3xl font-bold text-white mb-2">Timeline Cards Visibility Test</h1>
            <p className="text-[#d9e8dd]">Test mobile timeline cards visibility in different scenarios</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Test Scenario Selection */}
            <div className="space-y-2">
              <label className="text-white font-bold text-sm">Test Scenario</label>
              <div className="space-y-2">
                <Button
                  onClick={() => setTestScenario('with-timeline')}
                  className={`w-full justify-start text-left ${
                    testScenario === 'with-timeline' 
                      ? 'bg-[#4CC9F0] text-black' 
                      : 'bg-[#1A1A2E]/70 text-[#d9e8dd] hover:bg-[#1A1A2E]'
                  }`}
                >
                  📋 Player with Timeline
                </Button>
                <Button
                  onClick={() => setTestScenario('empty-timeline')}
                  className={`w-full justify-start text-left ${
                    testScenario === 'empty-timeline' 
                      ? 'bg-[#4CC9F0] text-black' 
                      : 'bg-[#1A1A2E]/70 text-[#d9e8dd] hover:bg-[#1A1A2E]'
                  }`}
                >
                  📄 Player with Empty Timeline
                </Button>
                <Button
                  onClick={() => setTestScenario('null-player')}
                  className={`w-full justify-start text-left ${
                    testScenario === 'null-player' 
                      ? 'bg-[#4CC9F0] text-black' 
                      : 'bg-[#1A1A2E]/70 text-[#d9e8dd] hover:bg-[#1A1A2E]'
                  }`}
                >
                  ❌ Null Player (Loading)
                </Button>
              </div>
            </div>

            {/* Game State Controls */}
            <div className="space-y-2">
              <label className="text-white font-bold text-sm">Game State</label>
              <div className="space-y-2">
                <Button
                  onClick={() => setIsMyTurn(!isMyTurn)}
                  className={`w-full justify-start ${
                    isMyTurn 
                      ? 'bg-[#10b981] text-white' 
                      : 'bg-[#1A1A2E]/70 text-[#d9e8dd] hover:bg-[#1A1A2E]'
                  }`}
                >
                  {isMyTurn ? '✅ My Turn' : '⏳ Not My Turn'}
                </Button>
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-full justify-start ${
                    isPlaying 
                      ? 'bg-[#ec4899] text-white' 
                      : 'bg-[#1A1A2E]/70 text-[#d9e8dd] hover:bg-[#1A1A2E]'
                  }`}
                >
                  {isPlaying ? '🎵 Playing' : '⏸️ Paused'}
                </Button>
              </div>
            </div>

            {/* Test Results */}
            <div className="space-y-2">
              <label className="text-white font-bold text-sm">Expected Behavior</label>
              <div className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 rounded-xl p-3">
                <div className="text-xs text-[#d9e8dd]">
                  <div className="mb-2">
                    <strong>Timeline cards should:</strong>
                  </div>
                  <div className="mb-1">✅ Always be visible to players</div>
                  <div className="mb-1">✅ Show loading state if player data missing</div>
                  <div className="mb-1">✅ Work on mobile viewport (375px)</div>
                  <div>✅ Allow audio control regardless of state</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Mobile Game View Test */}
        <div className="max-w-md mx-auto border-4 border-gray-600 rounded-3xl overflow-hidden bg-black">
          <div className="w-full h-[600px] relative">
            <MobilePlayerGameView
              currentPlayer={getCurrentPlayer()}
              currentTurnPlayer={mockCurrentTurnPlayer}
              currentSong={mockSong}
              roomCode="TEST"
              isMyTurn={isMyTurn}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onPlaceCard={handlePlaceCard}
              mysteryCardRevealed={false}
              cardPlacementResult={null}
              gameEnded={false}
              onHighlightGap={() => {}}
              onViewportChange={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}