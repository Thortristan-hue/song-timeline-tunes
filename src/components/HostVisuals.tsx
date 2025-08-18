
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { Song, Player, GameRoom } from '@/types/game';
import { Timeline } from './Timeline';
import { AudioPlayer } from './AudioPlayer';
import { suppressUnused } from '@/utils/suppressUnused';

interface HostVisualsProps {
  room: GameRoom;
  players: Player[];
  isHost: boolean;
}

export function HostVisuals({ room, isHost }: HostVisualsProps) {
  const [currentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  suppressUnused(isHost);

  const mysteryCard: Song = {
    id: 'mystery-card',
    deezer_title: 'Mystery Song',
    deezer_artist: 'Unknown Artist',
    deezer_album: 'Unknown Album',
    release_year: '2024',
    genre: 'Unknown',
    cardColor: '#purple',
    preview_url: 'https://example.com/preview.mp3'
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleCardClick = (song: Song, position: number) => {
    console.log('Card clicked:', song, position);
  };

  const handleAudioError = (e: any) => {
    console.error('Audio error:', e);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Game Header */}
      <div className="flex justify-between items-center p-4 bg-gray-800">
        <h1 className="text-2xl font-bold">Game Room: {room.lobby_code}</h1>
        <div className="flex items-center gap-4">
          <Button onClick={handlePlayPause} variant="outline">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex">
        {/* Left Side - Mystery Card */}
        <div className="w-1/3 p-6 bg-gray-800 border-r border-gray-700">
          <h2 className="text-xl font-bold mb-4">Mystery Card</h2>
          <div className="bg-purple-600 p-6 rounded-lg">
            <div className="text-lg font-semibold">{mysteryCard.deezer_title}</div>
            <div className="text-purple-200">{mysteryCard.deezer_artist}</div>
            <div className="text-purple-300 text-sm">{mysteryCard.deezer_album}</div>
            <div className="text-2xl font-bold mt-4">{mysteryCard.release_year}</div>
          </div>
        </div>

        {/* Right Side - Timeline */}
        <div className="flex-1 p-6">
          <Timeline 
            songs={room.songs} 
            onCardClick={handleCardClick}
            isProcessingMove={false}
          />
        </div>
      </div>

      {/* Audio Player */}
      {currentSong?.preview_url && (
        <AudioPlayer
          key={Date.now()}
          src={currentSong.preview_url}
          isPlaying={isPlaying}
          onError={handleAudioError}
          audioRef={audioRef}
        />
      )}
    </div>
  );
}
