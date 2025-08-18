import { useState, useEffect, useCallback, useRef } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { AudioPlayer } from './AudioPlayer';
import { Timeline } from './Timeline';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { suppressUnused } from '@/utils/suppressUnused';

interface HostVisualsProps {
  room: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  customSongs: Song[];
  onSetCurrentSong: (song: Song) => Promise<void>;
  connectionStatus: {
    isConnected: boolean;
    isReconnecting: boolean;
    lastError: string | null;
    retryCount: number;
  };
}

export function HostVisuals({ 
  room, 
  players, 
  currentPlayer, 
  isHost, 
  customSongs,
  onSetCurrentSong,
  connectionStatus
}: HostVisualsProps) {
  const { toast } = useToast();
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [audioPlayerKey, setAudioPlayerKey] = useState(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Load the first song when customSongs changes
  useEffect(() => {
    if (customSongs.length > 0) {
      setPreviewUrl(customSongs[0].preview_url || null);
    }
  }, [customSongs]);

  // Update preview URL when current song changes
  useEffect(() => {
    if (room?.current_song) {
      setPreviewUrl(room.current_song.preview_url || null);
    }
  }, [room?.current_song]);

  // Function to play the audio preview
  const playPreview = useCallback(async () => {
    if (!previewUrl) {
      toast({
        title: "No Preview Available",
        description: "This song does not have an audio preview.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingPreview(true);
    setAudioError(null);

    try {
      // Reset audio player by updating the key
      setAudioPlayerKey(prevKey => prevKey + 1);
      setIsPlayingPreview(true);
    } catch (error: any) {
      console.error("Error playing preview:", error);
      handleAudioError(error.message || 'Failed to play audio');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [previewUrl, toast, handleAudioError]);

  // Function to stop the audio preview
  const stopPreview = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setIsPlayingPreview(false);
    setIsLoadingPreview(false);
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlayingPreview) {
      stopPreview();
    } else {
      playPreview();
    }
  }, [isPlayingPreview, stopPreview, playPreview]);

  // Handle audio ended event
  const handleAudioEnded = useCallback(() => {
    setIsPlayingPreview(false);
  }, []);

  // Handle audio load error
  const handleAudioLoadError = useCallback((e: any) => {
    console.error('Failed to load audio:', e);
    handleAudioError('Failed to load audio');
    setIsPlayingPreview(false);
    setIsLoadingPreview(false);
  }, [handleAudioError]);

  const handleSetCurrentSong = useCallback(async (song: Song) => {
    if (!isHost || !room) return;

    try {
      await onSetCurrentSong(song);
    } catch (error) {
      console.error('Failed to set current song:', error);
      toast({
        title: "Set Current Song Failed",
        description: "Unable to set the current song. Please try again.",
        variant: "destructive",
      });
    }
  }, [isHost, room, onSetCurrentSong, toast]);

  const handleAudioError = useCallback((error: string) => {
    console.error('Audio error in HostVisuals:', error);
    setAudioError(error);
    setIsLoadingPreview(false); // Use setIsLoadingPreview instead of setIsPlayingPreview
    suppressUnused(error); // Suppress the unused error parameter
    
    toast({
      title: "Audio Error",
      description: "Failed to load audio preview",
      variant: "destructive",
    });
  }, [toast]);

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="mb-4">
        {connectionStatus.isConnected ? (
          <span className="text-green-500">Connected</span>
        ) : (
          <span className="text-red-500">
            {connectionStatus.isReconnecting ? 'Reconnecting...' : 'Disconnected'}
          </span>
        )}
        {connectionStatus.lastError && (
          <span className="text-red-500 ml-2">Error: {connectionStatus.lastError}</span>
        )}
      </div>

      {/* Current Player Timeline */}
      {currentPlayer && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">
            {currentPlayer.name}'s Timeline
          </h2>
          <Timeline songs={currentPlayer.timeline} />
        </div>
      )}

      {/* Audio Player Controls */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Audio Preview</h3>
        {previewUrl ? (
          <>
            <AudioPlayer
              key={audioPlayerKey}
              src={previewUrl}
              isPlaying={isPlayingPreview}
              onEnded={handleAudioEnded}
              onError={handleAudioLoadError}
              audioRef={audioElementRef}
            />
            <Button onClick={togglePlayPause} disabled={isLoadingPreview}>
              {isLoadingPreview ? 'Loading...' : (isPlayingPreview ? 'Pause' : 'Play')}
            </Button>
            {audioError && <p className="text-red-500">{audioError}</p>}
          </>
        ) : (
          <p>No audio preview available.</p>
        )}
      </div>

      {/* Song Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Available Songs</h3>
        <div className="flex flex-wrap">
          {customSongs.map((song) => (
            <Button
              key={song.id}
              className="mr-2 mb-2"
              onClick={() => handleSetCurrentSong(song)}
            >
              {song.deezer_title}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
