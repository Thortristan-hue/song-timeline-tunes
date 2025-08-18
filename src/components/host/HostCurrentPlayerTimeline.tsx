
import { Song, Player } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { GAME_CHARACTERS } from '@/constants/characters';

interface HostCurrentPlayerTimelineProps {
  currentPlayer: Player;
  currentSong: Song | null;
  onPreviewSong?: (song: Song) => void;
  isPreviewPlaying?: boolean;
  onStopPreview?: () => void;
}

export function HostCurrentPlayerTimeline({
  currentPlayer,
  currentSong,
  onPreviewSong,
  isPreviewPlaying = false,
  onStopPreview
}: HostCurrentPlayerTimelineProps) {
  const character = GAME_CHARACTERS.find(c => c.id === currentPlayer.character);

  const timelineCards = [...currentPlayer.timeline].map((_, index) => {
    const placedSong = currentPlayer.timeline[index];
    return placedSong || null;
  });

  // Ensure we have exactly 10 slots
  while (timelineCards.length < 10) {
    timelineCards.push(null);
  }

  const handlePreviewClick = (song: Song, event: React.MouseEvent) => {
    event.stopPropagation();
    if (isPreviewPlaying) {
      onStopPreview?.();
    } else {
      onPreviewSong?.(song);
    }
  };

  return (
    <div className="space-y-4">
      {/* Player Header */}
      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
        {character && (
          <img 
            src={character.image} 
            alt={character.name}
            className="w-12 h-12 rounded-full"
          />
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{currentPlayer.name}</h3>
          <div className="flex items-center gap-2 text-white/60">
            <span>Score: {currentPlayer.score}</span>
            <Badge variant="outline" className="border-white/20 text-white/60">
              {character?.name || 'Default'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-5 lg:grid-cols-10 gap-2">
        {timelineCards.map((song, position) => (
          <div
            key={position}
            className="aspect-square relative"
          >
            {song ? (
              <Card className="h-full p-2 bg-white/10 border-white/20 hover:bg-white/15 transition-colors">
                <div className="h-full flex flex-col">
                  <div className="flex-1 min-h-0">
                    <div className="text-white text-xs font-medium truncate mb-1">
                      {song.deezer_title}
                    </div>
                    <div className="text-white/60 text-xs truncate mb-1">
                      {song.deezer_artist}
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-xs border-white/20 text-white/60"
                    >
                      {song.release_year}
                    </Badge>
                  </div>
                  
                  {song.preview_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 w-full text-white/60 hover:text-white hover:bg-white/20"
                      onClick={(e) => handlePreviewClick(song, e)}
                    >
                      {isPreviewPlaying ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                
                <div 
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: song.cardColor }}
                />
              </Card>
            ) : (
              <Card className="h-full border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center">
                <div className="text-white/40 text-xs font-medium">
                  {position + 1}
                </div>
              </Card>
            )}
          </div>
        ))}
      </div>

      {/* Current Mystery Song */}
      {currentSong && (
        <div className="mt-6">
          <h4 className="text-white text-lg font-semibold mb-2">Current Mystery Song</h4>
          <Card className="p-4 bg-purple-500/20 border-purple-500/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{currentSong.deezer_title}</div>
                <div className="text-white/70 text-sm">{currentSong.deezer_artist}</div>
                <div className="text-white/60 text-sm">{currentSong.release_year}</div>
              </div>
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: currentSong.cardColor }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
