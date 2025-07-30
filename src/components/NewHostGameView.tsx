import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Song, Player } from '@/types/game';
import { MysterySongControls } from '@/components/MysterySongControls';
import { Badge } from '@/components/ui/badge';
import { getArtistColor, truncateText } from '@/lib/utils';

interface NewHostGameViewProps {
  currentTurnPlayer: Player | null;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  transitioning: boolean;
  highlightedGapIndex: number | null;
  mobileViewport: { startIndex: number; endIndex: number; totalCards: number } | null;
}

export function NewHostGameView({
  currentTurnPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult,
  transitioning,
  highlightedGapIndex,
  mobileViewport
}: NewHostGameViewProps) {
  const [timeline, setTimeline] = useState<Song[]>([]);

  // Update timeline when current player changes
  useEffect(() => {
    if (currentTurnPlayer?.timeline) {
      const sortedTimeline = [...currentTurnPlayer.timeline]
        .filter(song => song !== null)
        .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));
      setTimeline(sortedTimeline);
    }
  }, [currentTurnPlayer?.timeline]);

  // Handle play/pause/stop for mystery song
  const handlePlay = () => {
    if (currentSong?.preview_url) {
      onPlayPause();
    }
  };

  const handlePause = () => {
    onPlayPause();
  };

  const handleStop = () => {
    // Stop and reset audio
    onPlayPause();
  };

  // Get character image path
  const getCharacterImagePath = (character: string) => {
    return `/src/assets/char_${character}.png`;
  };

  // Get cassette image based on current song or default
  const getCassetteImage = () => {
    // You could make this dynamic based on song genre/artist
    return '/src/assets/cassette-blue.png';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 min-h-screen">
        
        {/* Top Bar - Full Width */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center">
            {/* Top Left: Rythmy Logo */}
            <div className="flex items-center">
              <img 
                src="/src/assets/ass_rythmy.png" 
                alt="Rythmy Logo"
                className="w-12 h-12"
                onError={(e) => {
                  // Fallback text if image doesn't load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-2xl font-bold text-blue-400 ml-2">RYTHMY</span>
            </div>

            {/* Top Right: Room Code and Current Player */}
            <div className="flex items-center gap-4">
              <Badge 
                variant="outline" 
                className="bg-purple-600 text-white border-purple-400 text-lg px-4 py-2 font-mono"
              >
                {roomCode}
              </Badge>
              {currentTurnPlayer && (
                <div className="text-right">
                  <div className="text-sm text-gray-400">Current Player</div>
                  <div className="text-xl font-bold">{currentTurnPlayer.name}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Middle Content */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center space-y-6">
          {/* Large Cassette Tape */}
          <div className="relative">
            <img 
              src={getCassetteImage()}
              alt="Mystery Song Cassette"
              className="w-64 h-auto"
            />
            {currentSong && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-4 rounded-b-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold">Mystery Song</div>
                  {mysteryCardRevealed && (
                    <div className="text-sm mt-1">
                      {currentSong.deezer_title} by {currentSong.deezer_artist}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mystery Song Controls */}
          <MysterySongControls
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            disabled={!currentSong?.preview_url}
            className="bg-gray-800 rounded-lg shadow-lg"
          />
        </div>

        {/* Main Timeline - Full Width */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {currentTurnPlayer ? `${currentTurnPlayer.name}'s Timeline` : 'Player Timeline'}
              </h2>
              <div className="text-gray-400">
                {timeline.length === 0 ? 'No cards placed yet' : `${timeline.length} cards placed`}
              </div>
            </div>

            {/* Animated Timeline */}
            <div className="relative">
              {timeline.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center text-gray-500">
                    <div className="text-xl mb-2">Timeline is empty</div>
                    <div className="text-sm">Waiting for the first card...</div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="flex items-center gap-4 overflow-x-auto pb-4">
                    <AnimatePresence mode="popLayout">
                      {timeline.map((song, index) => (
                        <motion.div
                          key={song.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -20 }}
                          transition={{ 
                            duration: 0.5,
                            delay: index * 0.1,
                            layout: { duration: 0.3 }
                          }}
                          className="w-32 h-40 bg-gradient-to-br rounded-lg flex-shrink-0 flex flex-col items-center justify-center text-white shadow-lg relative overflow-hidden"
                          style={{ 
                            backgroundColor: getArtistColor(song.deezer_artist).backgroundColor,
                            backgroundImage: getArtistColor(song.deezer_artist).backgroundImage
                          }}
                        >
                          {/* Card content */}
                          <div className="p-3 h-full flex flex-col items-center justify-between text-white relative z-10">
                            <div className="text-xs text-center mb-2 px-1">
                              {truncateText(song.deezer_artist, 12)}
                            </div>
                            <div className="text-2xl font-bold mb-2">
                              {song.release_year}
                            </div>
                            <div className="text-xs text-center px-1">
                              {truncateText(song.deezer_title, 12)}
                            </div>
                          </div>

                          {/* Highlight if this gap is selected on mobile */}
                          {highlightedGapIndex === index && (
                            <motion.div
                              className="absolute inset-0 border-4 border-yellow-400 rounded-lg"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            />
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Player Icons - Full Width */}
        <div className="lg:col-span-3">
          <div className="flex justify-center items-center gap-4 p-4 bg-gray-800 rounded-lg">
            {players.map((player) => (
              <div 
                key={player.id}
                className={`relative transition-all duration-300 ${
                  currentTurnPlayer?.id === player.id 
                    ? 'scale-125 ring-4 ring-yellow-400 ring-opacity-75' 
                    : 'opacity-70 hover:opacity-90'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  {/* Player Character Icon */}
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                    <img 
                      src={getCharacterImagePath(player.character)}
                      alt={`${player.name}'s character`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image doesn't load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  
                  {/* Player Name */}
                  <div className="text-sm font-medium text-center">
                    {player.name}
                  </div>
                  
                  {/* Player Score */}
                  <div className="text-xs text-gray-400">
                    Score: {player.score}
                  </div>
                  
                  {/* Current Turn Indicator */}
                  {currentTurnPlayer?.id === player.id && (
                    <motion.div
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <div className="bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                        TURN
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card Placement Result Overlay */}
      <AnimatePresence>
        {cardPlacementResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className={`bg-white rounded-lg p-8 text-center max-w-md mx-4 ${
                cardPlacementResult.correct ? 'border-green-500' : 'border-red-500'
              } border-4`}
            >
              <div className={`text-6xl mb-4 ${
                cardPlacementResult.correct ? 'text-green-500' : 'text-red-500'
              }`}>
                {cardPlacementResult.correct ? '✓' : '✗'}
              </div>
              <div className={`text-2xl font-bold mb-4 ${
                cardPlacementResult.correct ? 'text-green-700' : 'text-red-700'
              }`}>
                {cardPlacementResult.correct ? 'Correct!' : 'Incorrect'}
              </div>
              <div className="text-gray-800">
                <div className="font-semibold">{cardPlacementResult.song.deezer_title}</div>
                <div className="text-sm">{cardPlacementResult.song.deezer_artist}</div>
                <div className="text-lg font-bold mt-2">{cardPlacementResult.song.release_year}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}