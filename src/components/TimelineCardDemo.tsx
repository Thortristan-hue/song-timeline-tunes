import React from 'react';
import { Song } from '@/types/game';
import { getArtistColor, truncateText } from '@/lib/utils';

// Demo component to showcase the timeline card design consistency
export function TimelineCardDemo() {
  // Sample songs for demonstration
  const sampleSongs: Song[] = [
    {
      id: '1',
      deezer_title: 'Bohemian Rhapsody',
      deezer_artist: 'Queen',
      deezer_album: 'A Night at the Opera',
      release_year: '1975',
      genre: 'Rock',
      cardColor: '#9333ea'
    },
    {
      id: '2',
      deezer_title: 'Billie Jean',
      deezer_artist: 'Michael Jackson',
      deezer_album: 'Thriller',
      release_year: '1982',
      genre: 'Pop',
      cardColor: '#dc2626'
    },
    {
      id: '3',
      deezer_title: 'Hotel California',
      deezer_artist: 'Eagles',
      deezer_album: 'Hotel California',
      release_year: '1976',
      genre: 'Rock',
      cardColor: '#059669'
    },
    {
      id: '4',
      deezer_title: 'Sweet Child O\' Mine',
      deezer_artist: 'Guns N\' Roses',
      deezer_album: 'Appetite for Destruction',
      release_year: '1987',
      genre: 'Rock',
      cardColor: '#ea580c'
    }
  ];

  // Render card using the new consistent design
  const renderCard = (song: Song, size: 'mobile' | 'host') => {
    const cardColor = getArtistColor(song.deezer_artist);
    const dimensions = size === 'host' ? 'w-36 h-36' : 'w-32 h-32';
    const textSizes = size === 'host' ? 'text-sm text-4xl text-xs' : 'text-sm text-2xl text-xs';
    const [artistSize, yearSize, titleSize] = textSizes.split(' ');

    return (
      <div
        key={`${song.id}-${size}`}
        className={`${dimensions} rounded-2xl flex flex-col items-center justify-between text-white shadow-lg border border-white/20 transition-all duration-200 hover:scale-105 cursor-pointer relative p-4`}
        style={{
          backgroundColor: cardColor.backgroundColor,
          backgroundImage: cardColor.backgroundImage
        }}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
        
        <div className="text-center relative z-10 space-y-0.5 w-full">
          {/* Artist name - medium, white, wrapped, max 20 letters per line */}
          <div className={`${artistSize} font-medium text-white`}>
            {truncateText(song.deezer_artist, 20)}
          </div>
          
          {/* Song release year - large, white */}
          <div className={`${yearSize} font-black text-white my-auto`}>
            {song.release_year}
          </div>
          
          {/* Song title - small, italic, white, wrapped, max 20 letters per line */}
          <div className={`${titleSize} italic text-white opacity-90`}>
            {truncateText(song.deezer_title, 20)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Timeline Card Design Consistency Demo
        </h1>
        
        <div className="space-y-12">
          {/* Host Timeline Cards */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Host Timeline Cards (36x36)
            </h2>
            <div className="flex justify-center gap-4 flex-wrap">
              {sampleSongs.map(song => renderCard(song, 'host'))}
            </div>
          </div>

          {/* Mobile Timeline Cards */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Mobile Timeline Cards (32x32)
            </h2>
            <div className="flex justify-center gap-4 flex-wrap">
              {sampleSongs.map(song => renderCard(song, 'mobile'))}
            </div>
          </div>

          {/* Design Specifications */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Design Specifications</h3>
            <div className="grid md:grid-cols-2 gap-4 text-white/90">
              <div>
                <h4 className="font-medium text-white mb-2">Card Layout:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Artist name: medium weight, white, max 20 chars</li>
                  <li>• Release year: large, white, center prominent</li>
                  <li>• Song title: small, italic, white, max 20 chars</li>
                  <li>• Shape: Square with rounded corners</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Color & Animation:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Colors: Artist name-based hue calculation</li>
                  <li>• Consistent across host and mobile</li>
                  <li>• Enhanced hover and placement animations</li>
                  <li>• Gradient overlays for depth</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}