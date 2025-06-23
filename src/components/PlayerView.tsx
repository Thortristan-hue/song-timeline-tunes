
import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music, Plus, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface PlayerViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  roomCode: string;
  isMyTurn: boolean;
  gameState: {
    currentSong: Song | null;
    isPlaying: boolean;
    timeLeft: number;
  };
  onPlaceCard: (position: number) => void;
  onPlayPause: () => void;
}

export function PlayerView({
  currentPlayer,
  currentTurnPlayer,
  roomCode,
  isMyTurn,
  gameState,
  onPlaceCard,
  onPlayPause
}: PlayerViewProps) {
  const [playingTimelineCard, setPlayingTimelineCard] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<{ [key: string]: HTMLAudioElement }>({});
  const [showPlacement, setShowPlacement] = useState(false);

  const playTimelineCard = (song: Song) => {
    if (!song.preview_url) return;

    // Stop all other timeline cards
    Object.values(audioRefs).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    setPlayingTimelineCard(null);

    // Create or get audio element for this song
    let audio = audioRefs[song.id];
    if (!audio) {
      audio = new Audio(song.preview_url);
      audio.crossOrigin = 'anonymous';
      setAudioRefs(prev => ({ ...prev, [song.id]: audio }));
    }

    if (playingTimelineCard === song.id) {
      audio.pause();
      setPlayingTimelineCard(null);
    } else {
      audio.currentTime = 0;
      audio.play().then(() => {
        setPlayingTimelineCard(song.id);
      }).catch(console.error);

      audio.onended = () => setPlayingTimelineCard(null);
    }
  };

  const handlePlaceCard = (position: number) => {
    onPlaceCard(position);
    setShowPlacement(false);
  };

  const renderTimelineCard = (song: Song, index: number) => (
    <div
      key={index}
      className="min-w-32 h-32 rounded-xl flex flex-col items-center justify-center text-white shadow-lg border border-white/20 transform transition-all hover:scale-105 relative"
      style={{ backgroundColor: song.cardColor || currentPlayer.color }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
      
      <Button
        onClick={() => playTimelineCard(song)}
        size="sm"
        variant="outline"
        className="absolute top-1 right-1 bg-white/10 border-white/20 text-white hover:bg-white/20 h-6 w-6 p-0"
        disabled={!song.preview_url}
      >
        {playingTimelineCard === song.id ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </Button>

      <Music className="h-8 w-8 mb-1 opacity-80 relative z-10" />
      <div className="text-center relative z-10 px-2">
        <div className="text-3xl font-black mb-1">
          {song.release_year}
        </div>
        <div className="text-xs opacity-90 leading-tight">
          {song.deezer_title?.slice(0, 20)}
          {song.deezer_title && song.deezer_title.length > 20 ? '...' : ''}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex flex-col relative">
      {/* Compact Header */}
      <div className="flex justify-between items-center p-3 bg-black/20 backdrop-blur-sm">
        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400 text-xs">
          {roomCode}
        </Badge>
        <Badge 
          variant="outline" 
          className={cn(
            "text-white text-xs",
            isMyTurn ? "bg-green-500/20 border-green-400" : "bg-white/10 border-white/20"
          )}
        >
          {isMyTurn ? "Your Turn!" : `${currentTurnPlayer.name}'s Turn`}
        </Badge>
      </div>

      {/* Mystery Card Section - Only when it's your turn */}
      {isMyTurn && gameState.currentSong && (
        <div className="px-3 py-2 bg-black/20 backdrop-blur-sm">
          <Card className="bg-white/10 border-white/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-purple-300" />
                <div>
                  <div className="text-sm font-bold text-white">Mystery Song</div>
                  <div className="text-xs text-purple-200 flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {gameState.timeLeft}s left
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={onPlayPause}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-8 w-8 p-0"
                >
                  {gameState.isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => setShowPlacement(!showPlacement)}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-xs px-3"
                >
                  Place Card
                </Button>
              </div>
            </div>
            <Progress 
              value={(gameState.timeLeft / 30) * 100} 
              className="mt-2 h-1"
            />
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-3 flex flex-col">
        <div className="text-lg font-bold text-white mb-3 text-center">
          Your Timeline
        </div>
        
        {/* Timeline Display - Matching Host Style */}
        <div className="flex-1 flex items-center justify-center">
          <Card className="bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-4 w-full max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: currentPlayer.color }}
              />
              <h3 className="text-xl font-bold text-white">
                {currentPlayer.name}'s Timeline
              </h3>
            </div>
            
            <div className="flex gap-3 items-center overflow-x-auto pb-2 min-h-[140px]">
              {currentPlayer.timeline.length === 0 ? (
                <div className="w-full text-center py-8">
                  <Music className="h-16 w-16 text-purple-300 mx-auto mb-4 opacity-60" />
                  <p className="text-purple-200 text-sm">Your timeline is empty</p>
                  {isMyTurn && gameState.currentSong && (
                    <p className="text-purple-300 text-xs mt-1">Place the mystery song to start!</p>
                  )}
                </div>
              ) : (
                currentPlayer.timeline.map((song, index) => renderTimelineCard(song, index))
              )}
            </div>
          </Card>
        </div>

        {/* Placement Controls */}
        {isMyTurn && gameState.currentSong && showPlacement && (
          <Card className="bg-white/10 border-white/20 p-4 mt-3">
            <div className="text-center mb-3">
              <p className="text-white text-sm font-medium">Where should the mystery song go?</p>
            </div>
            
            <div className="space-y-2">
              {/* Before first card */}
              <Button
                onClick={() => handlePlaceCard(0)}
                className="w-full justify-start bg-green-500/20 border-green-400 text-green-200 hover:bg-green-500/30"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Place at beginning {currentPlayer.timeline.length > 0 ? `(before '${currentPlayer.timeline[0]?.release_year.slice(-2)})` : '(first song)'}
              </Button>

              {/* Between cards */}
              {currentPlayer.timeline.map((song, index) => (
                <Button
                  key={`between-${index}`}
                  onClick={() => handlePlaceCard(index + 1)}
                  className="w-full justify-start bg-green-500/20 border-green-400 text-green-200 hover:bg-green-500/30"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Place after '{song.release_year.slice(-2)} 
                  {index + 1 < currentPlayer.timeline.length ? 
                    ` (before '${currentPlayer.timeline[index + 1]?.release_year.slice(-2)})` : 
                    ' (at end)'
                  }
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Turn info */}
      {!isMyTurn && (
        <div className="p-3 bg-black/20 backdrop-blur-sm">
          <div className="text-center text-purple-200 text-sm">
            Waiting for {currentTurnPlayer.name}...
          </div>
        </div>
      )}
    </div>
  );
}
