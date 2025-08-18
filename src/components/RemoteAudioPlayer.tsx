
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface RemoteAudioPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  currentTime: number;
  duration: number;
  songTitle?: string;
  songArtist?: string;
}

export function RemoteAudioPlayer({
  isPlaying,
  onPlayPause,
  volume,
  onVolumeChange,
  currentTime,
  duration,
  songTitle,
  songArtist
}: RemoteAudioPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          {songTitle && (
            <div className="text-white font-medium truncate">{songTitle}</div>
          )}
          {songArtist && (
            <div className="text-white/60 text-sm truncate">{songArtist}</div>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMuteToggle}
            className="text-white hover:bg-white/10"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            className="text-white hover:bg-white/10"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-white/60">
        <span>{formatTime(currentTime)}</span>
        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/60 transition-all duration-200"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
