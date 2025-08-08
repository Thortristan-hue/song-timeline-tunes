
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SprintModeHostView } from '@/components/sprint/SprintModeHostView';
import { SprintModePlayerView } from '@/components/sprint/SprintModePlayerView';
import { FiendModeHostView } from '@/components/fiend/FiendModeHostView';
import { FiendModePlayerView } from '@/components/fiend/FiendModePlayerView';
import { Play, Pause, Music } from 'lucide-react';
import { Song, Player } from '@/types/game';

interface GamemodeDemoProps {
  onBack: () => void;
}

// Mock data for demonstration
const mockSong: Song = {
  id: '1',
  deezer_title: 'Bohemian Rhapsody',
  deezer_artist: 'Queen',
  deezer_album: 'A Night at the Opera',
  release_year: '1975',
  genre: 'Rock',
  cardColor: '#FF6B9D',
  preview_url: 'https://example.com/preview.mp3'
};

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Alice',
    color: '#FF6B9D',
    timelineColor: '#FF6B9D',
    score: 3,
    timeline: [
      {
        id: '1',
        deezer_title: 'Yesterday',
        deezer_artist: 'The Beatles',
        deezer_album: 'Help!',
        release_year: '1965',
        genre: 'Pop',
        cardColor: '#4ECDC4'
      },
      {
        id: '2',
        deezer_title: 'Billie Jean',
        deezer_artist: 'Michael Jackson',
        deezer_album: 'Thriller',
        release_year: '1982',
        genre: 'Pop',
        cardColor: '#45B7D1'
      },
      {
        id: '3',
        deezer_title: 'Smells Like Teen Spirit',
        deezer_artist: 'Nirvana',
        deezer_album: 'Nevermind',
        release_year: '1991',
        genre: 'Rock',
        cardColor: '#96CEB4'
      }
    ],
    character: 'jessica'
  },
  {
    id: '2',
    name: 'Bob',
    color: '#4ECDC4',
    timelineColor: '#4ECDC4',
    score: 2,
    timeline: [
      {
        id: '4',
        deezer_title: 'Hotel California',
        deezer_artist: 'Eagles',
        deezer_album: 'Hotel California',
        release_year: '1976',
        genre: 'Rock',
        cardColor: '#FF6B9D'
      },
      {
        id: '5',
        deezer_title: 'Sweet Child O Mine',
        deezer_artist: "Guns N' Roses",
        deezer_album: 'Appetite for Destruction',
        release_year: '1987',
        genre: 'Rock',
        cardColor: '#FECA57'
      }
    ],
    character: 'mike'
  },
  {
    id: '3',
    name: 'Charlie',
    color: '#45B7D1',
    timelineColor: '#45B7D1',
    score: 1,
    timeline: [
      {
        id: '6',
        deezer_title: 'Imagine',
        deezer_artist: 'John Lennon',
        deezer_album: 'Imagine',
        release_year: '1971',
        genre: 'Rock',
        cardColor: '#96CEB4'
      }
    ],
    character: 'steve'
  }
];

export function GamemodeDemo({ onBack }: GamemodeDemoProps) {
  const [selectedMode, setSelectedMode] = useState<'sprint' | 'fiend'>('sprint');
  const [viewType, setViewType] = useState<'host' | 'player'>('host');
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePlaceCard = async () => {
    return { success: true, correct: Math.random() > 0.5 };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative z-50 p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Back to Menu
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Game Mode Demo</h1>
            <p className="text-white/70">Experience different game modes</p>
          </div>

          <div className="w-32" />
        </div>

        {/* Controls */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-4 mb-6">
          <div className="flex items-center justify-center gap-6">
            <Tabs value={selectedMode} onValueChange={(value) => setSelectedMode(value as 'sprint' | 'fiend')}>
              <TabsList className="bg-white/20">
                <TabsTrigger value="sprint">Sprint Mode</TabsTrigger>
                <TabsTrigger value="fiend">Fiend Mode</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="h-6 w-px bg-white/20" />

            <Tabs value={viewType} onValueChange={(value) => setViewType(value as 'host' | 'player')}>
              <TabsList className="bg-white/20">
                <TabsTrigger value="host">Host View</TabsTrigger>
                <TabsTrigger value="player">Player View</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="h-6 w-px bg-white/20" />

            <Button
              onClick={handlePlayPause}
              size="sm"
              className="bg-green-500 hover:bg-green-600"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Demo Content */}
      <div className="relative">
        {selectedMode === 'sprint' && viewType === 'host' && (
          <SprintModeHostView
            players={mockPlayers}
            currentSong={mockSong}
            targetCards={10}
            roomCode="DEMO"
            timeLeft={30}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
          />
        )}

        {selectedMode === 'sprint' && viewType === 'player' && (
          <SprintModePlayerView
            currentPlayer={mockPlayers[0]}
            currentSong={mockSong}
            roomCode="DEMO"
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onPlaceCard={handlePlaceCard}
            gameEnded={false}
            targetCards={10}
            timeLeft={30}
          />
        )}

        {selectedMode === 'fiend' && viewType === 'host' && (
          <FiendModeHostView
            players={mockPlayers}
            currentSong={mockSong}
            rounds={5}
            roomCode="DEMO"
            currentRound={2}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
          />
        )}

        {selectedMode === 'fiend' && viewType === 'player' && (
          <FiendModePlayerView
            currentPlayer={mockPlayers[0]}
            currentSong={mockSong}
            roomCode="DEMO"
            rounds={5}
            currentRound={2}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onPlaceCard={handlePlaceCard}
            gameEnded={false}
          />
        )}
      </div>

      {/* Demo Notice */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <Card className="bg-yellow-500/20 border-yellow-500/30 p-3">
          <div className="flex items-center gap-2 text-yellow-200">
            <Music className="h-4 w-4" />
            <span className="text-sm font-medium">Demo Mode - Audio and interactions are simulated</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
