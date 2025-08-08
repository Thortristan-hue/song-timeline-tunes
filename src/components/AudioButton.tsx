
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { unifiedAudioEngine } from '@/utils/unifiedAudioEngine';

interface AudioButtonProps {
  previewUrl?: string;
  className?: string;
  size?: 'sm' | 'lg' | 'default' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
  disabled?: boolean;
  showVolumeIcon?: boolean;
  onStateChange?: (isPlaying: boolean, isLoading: boolean, error: string | null) => void;
}

export function AudioButton({
  previewUrl,
  className,
  size = 'sm',
  variant = 'outline',
  disabled = false,
  showVolumeIcon = true,
  onStateChange
}: AudioButtonProps) {
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    isLoading: false,
    error: null as string | null
  });

  useEffect(() => {
    const unsubscribe = unifiedAudioEngine.onStateChange((state) => {
      setAudioState(state);
      onStateChange?.(state.isPlaying, state.isLoading, state.error);
    });

    return unsubscribe;
  }, [onStateChange]);

  const handleClick = async () => {
    if (!previewUrl) {
      console.warn('[AudioButton] No preview URL provided');
      return;
    }

    if (audioState.isPlaying) {
      unifiedAudioEngine.stopPreview();
    } else {
      await unifiedAudioEngine.playPreview(previewUrl);
    }
  };

  const getIcon = () => {
    if (audioState.isLoading) {
      return <Loader2 className="h-3 w-3 animate-spin" />;
    }
    
    if (audioState.error) {
      return <VolumeX className="h-3 w-3" />;
    }
    
    return audioState.isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />;
  };

  const isDisabled = disabled || !previewUrl || audioState.isLoading;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        onClick={handleClick}
        size={size}
        variant={variant}
        className={cn(
          "flex items-center gap-1 transition-all duration-200",
          audioState.isPlaying && "bg-primary/10 border-primary/30",
          audioState.error && "border-destructive/50 text-destructive"
        )}
        disabled={isDisabled}
        title={
          audioState.error ? `Error: ${audioState.error}` :
          audioState.isLoading ? "Loading preview..." :
          audioState.isPlaying ? "Stop preview" :
          "Play preview"
        }
      >
        {getIcon()}
        {audioState.isLoading && <span className="text-xs">Loading...</span>}
        {audioState.error && <span className="text-xs">Error</span>}
        {!audioState.isLoading && !audioState.error && !previewUrl && (
          <span className="text-xs">No Preview</span>
        )}
      </Button>
      
      {showVolumeIcon && (
        <Volume2 className="h-3 w-3 text-muted-foreground" />
      )}
    </div>
  );
}
