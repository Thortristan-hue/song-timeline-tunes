import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Users, Crown } from 'lucide-react';
import { Song, Player, GameRoom } from '@/types/game';
import { cn, getArtistColor, truncateText } from '@/lib/utils';
import { useResponsive } from '@/lib/ResponsiveManager';
import { useCassetteSelection } from '@/lib/CassetteManager';
import { characterManager } from '@/lib/CharacterManager';
import { animationManager } from '@/lib/AnimationManager';

interface ResponsiveHostViewProps {
  room: GameRoom;
  players: Player[];
  currentTurnPlayer: Player;
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  mysteryCardRevealed: boolean;
}

export default function ResponsiveHostView({
  room,
  players,
  currentTurnPlayer,
  currentSong,
  isPlaying,
  onPlayPause,
  cardPlacementResult,
  mysteryCardRevealed
}: ResponsiveHostViewProps) {
  // Responsive and asset management
  const { viewport, isDesktop, isTablet } = useResponsive();
  const { currentCassette, selectRandomCassette } = useCassetteSelection();
  
  // Component state
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect'>('correct');

  // Handle card placement feedback
  useEffect(() => {
    if (cardPlacementResult) {
      setFeedbackType(cardPlacementResult.correct ? 'correct' : 'incorrect');
      setFeedbackVisible(true);
      
      // Hide feedback after animation
      setTimeout(() => {
        setFeedbackVisible(false);
      }, 2000);
    }
  }, [cardPlacementResult]);

  // Select random cassette on room change
  useEffect(() => {
    if (room.id) {
      selectRandomCassette();
    }
  }, [room.id]);

  // Get current player timeline
  const currentPlayerTimeline = currentTurnPlayer?.timeline || [];

  // Get player character image
  const getPlayerCharacterImage = (player: Player) => {
    const character = characterManager.getSessionCharacter(player.id);
    return character?.imagePath || characterManager.getCharacterImagePath(player.name) || '/char_mike.png';
  };

  // Get card color
  const getCardColor = (song: Song) => {
    return getArtistColor(song.deezer_artist);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-indigo-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse-ultra-slow" />
      
      {/* Feedback overlay */}
      {feedbackVisible && (
        <div 
          className={cn(
            "absolute inset-0 pointer-events-none z-30 transition-all duration-1000",
            feedbackType === 'correct' 
              ? "bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-green-600/20" 
              : "bg-gradient-to-br from-red-500/20 via-red-600/15 to-red-700/20"
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "text-8xl font-bold animate-bounce drop-shadow-2xl",
              feedbackType === 'correct' ? "text-green-400" : "text-red-400"
            )}>
              {feedbackType === 'correct' ? '✓' : '✗'}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 relative">
            <img 
              src="/Vinyl_rythm.png" 
              alt="Rythmy Logo" 
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100">
            RYTHMY
          </div>
        </div>

        {/* Center: Cassette Player with controls */}
        <div className="flex flex-col items-center gap-4">
          {/* Cassette */}
          <div className="relative">
            <div 
              className={cn(
                "w-32 h-32 transition-all duration-500 relative cursor-pointer",
                isPlaying && "animate-spin-slow"
              )}
              onClick={onPlayPause}
            >
              <img 
                src={currentCassette?.imagePath || '/Vinyl_rythm.png'}
                alt="Music Player"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
              
              {/* Play/Pause overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn(
                  "w-16 h-16 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 transition-all duration-300",
                  "hover:bg-black/50 hover:scale-110"
                )}>
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-1" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onPlayPause}
              disabled={!currentSong?.preview_url}
              className={cn(
                "bg-white/15 hover:bg-white/25 border border-white/30 rounded-full px-6 py-3 text-white transition-all duration-300",
                !currentSong?.preview_url && "opacity-50 cursor-not-allowed"
              )}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Play
                </>
              )}
            </Button>
          </div>

          {/* Now playing info */}
          {currentSong && mysteryCardRevealed && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-2 border border-white/20">
              <div className="text-white text-sm font-medium text-center">
                {truncateText(currentSong.deezer_title, 30)} • {currentSong.release_year}
              </div>
            </div>
          )}
        </div>

        {/* Right: Room info and active player */}
        <div className="text-right">
          <div className="bg-white/15 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/25">
            <div className="text-white/80 text-sm mb-1">Room Code</div>
            <div className="text-2xl font-black text-white tracking-wider">
              {room.lobby_code}
            </div>
            <div className="text-white/60 text-sm mt-2 flex items-center justify-end gap-2">
              <Users className="w-4 h-4" />
              {players.length} players
            </div>
          </div>
          
          {/* Active player info */}
          <div className="mt-4 bg-white/10 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/20">
            <div className="flex items-center gap-3 justify-end">
              <div className="text-right">
                <div className="text-white font-semibold">
                  {currentTurnPlayer.name}'s Turn
                </div>
                <div className="text-white/60 text-sm">
                  Score: {currentTurnPlayer.score}/10
                </div>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
                <img 
                  src={getPlayerCharacterImage(currentTurnPlayer)}
                  alt={`${currentTurnPlayer.name}'s character`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/char_mike.png';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 pb-6">
        {/* Timeline Section */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/15 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              {currentTurnPlayer.name}'s Timeline
            </h2>
            <div className="text-white/70 text-lg">
              {currentPlayerTimeline.length} of 10 cards placed
            </div>
          </div>

          {/* Timeline Display */}
          <div className="relative">
            {currentPlayerTimeline.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4 opacity-50">🎵</div>
                <div className="text-white/60 text-xl">
                  Waiting for {currentTurnPlayer.name} to place their first card...
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4 overflow-x-auto pb-4">
                {/* Yellow centerline indicator */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30 z-10" />
                
                {currentPlayerTimeline.map((song, index) => {
                  const cardColor = getCardColor(song);
                  
                  return (
                    <div
                      key={`${song.id}-${index}`}
                      className="relative min-w-[200px] h-48 rounded-3xl shadow-xl border border-white/20 transition-all duration-300 hover:scale-105 z-20"
                      style={{ 
                        backgroundColor: cardColor.backgroundColor,
                        backgroundImage: cardColor.backgroundImage
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl" />
                      
                      <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                        <div className="text-center">
                          <div className="text-sm font-bold mb-2 leading-tight">
                            {truncateText(song.deezer_artist, 20)}
                          </div>
                          <div className="text-xs opacity-90 leading-tight">
                            {truncateText(song.deezer_title, 25)}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-4xl font-black text-white drop-shadow-lg">
                            {song.release_year}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs opacity-75">
                            Position {index + 1}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Player Roster */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {players.map((player) => {
            const isCurrentPlayer = player.id === currentTurnPlayer.id;
            
            return (
              <div
                key={player.id}
                className={cn(
                  "bg-white/10 backdrop-blur-xl rounded-2xl p-4 border transition-all duration-300",
                  isCurrentPlayer 
                    ? "border-yellow-400/60 bg-yellow-400/10 scale-105" 
                    : "border-white/20 hover:border-white/40"
                )}
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 mx-auto mb-3">
                    <img 
                      src={getPlayerCharacterImage(player)}
                      alt={`${player.name}'s character`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/char_mike.png';
                      }}
                    />
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">
                    {player.name}
                  </div>
                  <div className="text-white/60 text-xs">
                    {player.score}/10 cards
                  </div>
                  {isCurrentPlayer && (
                    <div className="mt-2">
                      <Crown className="w-4 h-4 text-yellow-400 mx-auto" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}