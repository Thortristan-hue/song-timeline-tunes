
import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music } from 'lucide-react';
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
  const timelineRef = useRef<HTMLDivElement>(null);
  const [playingTimelineCard, setPlayingTimelineCard] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<{ [key: string]: HTMLAudioElement }>({});

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400">
          Room: {roomCode}
        </Badge>
        <Badge 
          variant="outline" 
          className={cn(
            "text-white",
            isMyTurn ? "bg-green-500/20 border-green-400" : "bg-white/10 border-white/20"
          )}
        >
          {isMyTurn ? "Your Turn!" : `${currentTurnPlayer.name}'s Turn`}
        </Badge>
      </div>

      {/* Mystery Card - Only shown on player's turn */}
      {isMyTurn && gameState.currentSong && (
        <div className="mb-6">
          <Card className="bg-white/10 border-white/20 p-6">
            <div className="text-center mb-4">
              <Music className="h-12 w-12 mx-auto text-purple-300 mb-2" />
              <div className="text-2xl font-bold text-white mb-2">Mystery Song</div>
              <div className="text-purple-200 text-sm">Listen and place it on your timeline!</div>
            </div>
            
            <Button
              onClick={onPlayPause}
              className="w-full mb-4 bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {gameState.isPlaying ? (
                <Pause className="h-6 w-6 mr-2" />
              ) : (
                <Play className="h-6 w-6 mr-2" />
              )}
              {gameState.isPlaying ? 'Pause' : 'Play'} Mystery Song
            </Button>
            
            <Progress 
              value={(gameState.timeLeft / 30) * 100} 
              className="mb-2"
            />
            <div className="text-center text-purple-200 text-sm">
              {gameState.timeLeft} seconds remaining
            </div>
          </Card>
        </div>
      )}

      {/* Timeline View */}
      <div className="relative">
        <div className="text-xl font-bold text-white mb-4 text-center">
          Your Timeline
        </div>
        
        <div 
          ref={timelineRef}
          className="overflow-x-auto touch-pan-x pb-8"
          style={{ 
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Placement button at start */}
          {isMyTurn && gameState.currentSong && (
            <Button
              onClick={() => onPlaceCard(0)}
              className="w-full mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3"
            >
              Place Mystery Song Here (Start)
            </Button>
          )}
          
          <div className="flex gap-4 px-4">
            {currentPlayer.timeline.map((song, index) => (
              <React.Fragment key={index}>
                <div className="flex-shrink-0 w-[280px] scroll-snap-align-center">
                  <Card className="bg-white/10 border-white/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold text-white">
                        {song.release_year}
                      </div>
                      <Button
                        onClick={() => playTimelineCard(song)}
                        size="sm"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        disabled={!song.preview_url}
                      >
                        {playingTimelineCard === song.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="text-lg font-semibold text-purple-200 mb-2">
                      {song.deezer_title}
                    </div>
                    <div className="text-purple-200/60">
                      {song.deezer_artist}
                    </div>
                    <div className="text-purple-200/40 text-sm mt-2">
                      {song.deezer_album}
                    </div>
                  </Card>
                </div>
                
                {/* Placement button between cards */}
                {isMyTurn && gameState.currentSong && (
                  <div className="flex-shrink-0 flex items-center">
                    <Button
                      onClick={() => onPlaceCard(index + 1)}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-8 px-6 rounded-lg transform rotate-90 whitespace-nowrap"
                      style={{ writingMode: 'vertical-rl' }}
                    >
                      Place Here
                    </Button>
                  </div>
                )}
              </React.Fragment>
            ))}
            
            {/* Placement button at end if timeline is empty or no cards placed yet */}
            {isMyTurn && gameState.currentSong && currentPlayer.timeline.length === 0 && (
              <div className="flex-shrink-0 w-[280px] flex items-center justify-center">
                <Button
                  onClick={() => onPlaceCard(0)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-8 px-8 rounded-lg"
                >
                  Place First Song Here
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Turn info */}
      {!isMyTurn && (
        <div className="fixed bottom-4 left-4 right-4">
          <Card className="bg-white/10 border-white/20 p-4">
            <div className="text-center text-purple-200">
              Waiting for {currentTurnPlayer.name} to place their card...
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
