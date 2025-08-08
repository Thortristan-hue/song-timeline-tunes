import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Volume2, VolumeX, RotateCcw, SkipForward } from 'lucide-react';
import { Song } from '@/types/game';
import { unifiedAudioEngine } from '@/utils/unifiedAudioEngine';

interface HostMusicControllerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  onPlayPause: () => void;
  onStop: () => void;
  onAdjustVolume: (volume: number) => void;
  onRestart: () => void;
  onSkip: () => void;
}

export function HostMusicController({
  currentSong,
  isPlaying,
  volume,
  onPlayPause,
  onStop,
  onAdjustVolume,
  onRestart,
  onSkip
}: HostMusicControllerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const handleVolumeChange = (newVolume: number[]) => {
    const parsedVolume = newVolume[0] / 100;
    onAdjustVolume(parsedVolume);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      onAdjustVolume(0);
    } else {
      onAdjustVolume(volumeRef.current);
    }
  };

  return (
    <Card className="w-full bg-white/5 backdrop-blur-lg border-white/10 p-4">
      <div className="flex items-center justify-between">
        {/* Song Information */}
        <div className="flex-grow">
          {currentSong ? (
            <>
              <div className="font-bold">{currentSong.deezer_title}</div>
              <div className="text-sm text-gray-500">{currentSong.deezer_artist}</div>
            </>
          ) : (
            <div className="text-gray-500">No song selected</div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={onRestart}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={onPlayPause}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={onStop}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={onSkip}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          {/* Volume Control */}
          <Button
            variant="outline"
            size="icon"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            defaultValue={[volume * 100]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            aria-label="Volume"
            className="w-[100px]"
          />
        </div>
      </div>
    </Card>
  );
}
