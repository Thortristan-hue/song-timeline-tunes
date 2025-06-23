
import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music, Plus } from 'lucide-react';
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
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

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
    setSelectedPosition(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 flex flex-col">
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

      {/* Mystery Card Section - Compact */}
      {isMyTurn && gameState.currentSong && (
        <div className="px-3 py-2 bg-black/20 backdrop-blur-sm">
          <Card className="bg-white/10 border-white/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-purple-300" />
                <div>
                  <div className="text-sm font-bold text-white">Mystery Song</div>
                  <div className="text-xs text-purple-200">{gameState.timeLeft}s left</div>
                </div>
              </div>
              <Button
                onClick={onPlayPause}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-500"
              >
                {gameState.isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Progress 
              value={(gameState.timeLeft / 30) * 100} 
              className="mt-2 h-1"
            />
          </Card>
        </div>
      )}

      {/* Timeline Section - Always Visible */}
      <div className="flex-1 p-3">
        <div className="text-lg font-bold text-white mb-3 text-center">
          Your Timeline
        </div>
        
        <div className="space-y-3">
          {/* Timeline Cards */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {currentPlayer.timeline.length === 0 ? (
              <div className="w-full text-center py-6">
                <Music className="h-12 w-12 text-purple-300 mx-auto mb-2 opacity-60" />
                <p className="text-purple-200 text-sm">Your timeline is empty</p>
                {isMyTurn && gameState.currentSong && (
                  <p className="text-purple-300 text-xs mt-1">Place the mystery song to start!</p>
                )}
              </div>
            ) : (
              currentPlayer.timeline.map((song, index) => (
                <Card key={index} className="bg-white/10 border-white/20 p-2 flex-shrink-0 w-24">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-bold text-white">
                      '{song.release_year.slice(-2)}
                    </div>
                    <Button
                      onClick={() => playTimelineCard(song)}
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-5 w-5 p-0"
                      disabled={!song.preview_url}
                    >
                      {playingTimelineCard === song.id ? (
                        <Pause className="h-2 w-2" />
                      ) : (
                        <Play className="h-2 w-2" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-xs font-semibold text-purple-200 mb-1 line-clamp-2">
                    {song.deezer_title}
                  </div>
                  <div className="text-purple-200/60 text-xs line-clamp-1">
                    {song.deezer_artist}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Placement Controls - Only when it's player's turn */}
          {isMyTurn && gameState.currentSong && (
            <div className="mt-4">
              <div className="text-center mb-3">
                <p className="text-white text-sm font-medium">Where should the mystery song go?</p>
                <p className="text-purple-200 text-xs">Tap a position to place it</p>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {/* Before first card */}
                <Button
                  onClick={() => handlePlaceCard(0)}
                  className={cn(
                    "w-full justify-start bg-green-500/20 border-green-400 text-green-200 hover:bg-green-500/30",
                    selectedPosition === 0 && "ring-2 ring-green-300"
                  )}
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
                    className={cn(
                      "w-full justify-start bg-green-500/20 border-green-400 text-green-200 hover:bg-green-500/30",
                      selectedPosition === index + 1 && "ring-2 ring-green-300"
                    )}
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
            </div>
          )}
        </div>
      </div>

      {/* Turn info - Compact */}
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
