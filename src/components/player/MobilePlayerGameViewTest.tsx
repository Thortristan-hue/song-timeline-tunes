import React from 'react';
import MobilePlayerGameView from './MobilePlayerGameView';
import { Song, Player } from '@/types/game';

// Mock data for testing
const mockCurrentPlayer: Player = {
  id: 'player1',
  name: 'Test Player',
  color: '#3b82f6',
  timelineColor: '#60a5fa',
  score: 5,
  timeline: [
    {
      id: 'song1',
      deezer_title: 'Bohemian Rhapsody',
      deezer_artist: 'Queen',
      deezer_album: 'A Night at the Opera',
      release_year: '1975',
      genre: 'Rock',
      cardColor: '#ef4444',
      preview_url: 'https://example.com/preview1.mp3'
    },
    {
      id: 'song2',
      deezer_title: 'Thriller',
      deezer_artist: 'Michael Jackson',
      deezer_album: 'Thriller',
      release_year: '1982',
      genre: 'Pop',
      cardColor: '#f97316',
      preview_url: 'https://example.com/preview2.mp3'
    },
    {
      id: 'song3',
      deezer_title: 'Sweet Child O Mine',
      deezer_artist: 'Guns N Roses',
      deezer_album: 'Appetite for Destruction',
      release_year: '1987',
      genre: 'Rock',
      cardColor: '#eab308',
      preview_url: 'https://example.com/preview3.mp3'
    }
  ]
};

const mockCurrentTurnPlayer: Player = {
  id: 'player2',
  name: 'Another Player',
  color: '#10b981',
  timelineColor: '#34d399',
  score: 3,
  timeline: []
};

const mockCurrentSong: Song = {
  id: 'mystery',
  deezer_title: 'Mystery Song',
  deezer_artist: 'Mystery Artist',
  deezer_album: 'Mystery Album',
  release_year: '1990',
  genre: 'Pop',
  cardColor: '#8b5cf6',
  preview_url: 'https://example.com/mystery.mp3'
};

export default function MobilePlayerGameViewTest() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMyTurn, setIsMyTurn] = React.useState(true);
  const [cardPlacementResult, setCardPlacementResult] = React.useState<{ correct: boolean; song: Song } | null>(null);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePlaceCard = async (song: Song, position: number) => {
    console.log('Placing card:', song.deezer_title, 'at position:', position);
    
    // Simulate placement result
    const correct = Math.random() > 0.5;
    setCardPlacementResult({ correct, song });
    
    // Hide result after 3 seconds
    setTimeout(() => {
      setCardPlacementResult(null);
      setIsMyTurn(false);
    }, 3000);
    
    return { success: true };
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 bg-white shadow-md">
        <h1 className="text-xl font-bold mb-4">MobilePlayerGameView Test</h1>
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setIsMyTurn(!isMyTurn)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Toggle Turn: {isMyTurn ? 'My Turn' : 'Other Turn'}
          </button>
          <button 
            onClick={() => setCardPlacementResult({ correct: true, song: mockCurrentSong })}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Show Success
          </button>
          <button 
            onClick={() => setCardPlacementResult({ correct: false, song: mockCurrentSong })}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Show Failure
          </button>
        </div>
      </div>
      
      <MobilePlayerGameView
        currentPlayer={mockCurrentPlayer}
        currentTurnPlayer={mockCurrentTurnPlayer}
        currentSong={mockCurrentSong}
        roomCode="TEST01"
        isMyTurn={isMyTurn}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onPlaceCard={handlePlaceCard}
        mysteryCardRevealed={false}
        cardPlacementResult={cardPlacementResult}
        gameEnded={false}
      />
    </div>
  );
}