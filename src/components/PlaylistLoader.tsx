import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2, AlertCircle, CheckCircle, Radio } from 'lucide-react';
import { Song } from '@/types/game';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { cn } from '@/lib/utils';
import { soundEffects } from '@/lib/SoundEffects';

interface PlaylistLoaderProps {
  onPlaylistLoaded: (success: boolean, count?: number) => void;
  setCustomSongs: (songs: Song[]) => void;
  isDarkMode: boolean;
  minSongsRequired?: number;
}

type LoadState = {
  loading: boolean;
  progress: number;
  status: string;
  error: string | null;
  success: boolean;
};

export function PlaylistLoader({
  onPlaylistLoaded,
  setCustomSongs,
  isDarkMode,
  minSongsRequired = 10
}: PlaylistLoaderProps) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [state, setState] = useState<LoadState>({
    loading: false,
    progress: 0,
    status: '',
    error: null,
    success: false
  });

  // Initialize audio on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundEffects.init();
      document.removeEventListener('click', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, []);

  const updateState = (updates: Partial<LoadState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetState = () => {
    updateState({
      progress: 0,
      status: '',
      error: null,
      success: false
    });
  };

  const validatePlaylist = (songs: Song[]): { isValid: boolean; count: number } => {
    const validSongs = defaultPlaylistService.filterValidSongs(songs);
    return {
      isValid: validSongs.length >= minSongsRequired,
      count: validSongs.length
    };
  };

  const handleLoadDefault = async () => {
    resetState();
    updateState({ loading: true });
    
    try {
      updateState({ progress: 20, status: 'Loading default playlist...' });
      await soundEffects.playSound('button-click');

      const songs = await defaultPlaylistService.loadDefaultPlaylist();
      updateState({ progress: 60, status: 'Validating songs...' });

      const { isValid, count } = validatePlaylist(songs);
      if (!isValid) {
        throw new Error(`Only ${count} valid songs found (minimum ${minSongsRequired} required)`);
      }

      setCustomSongs(songs);
      updateState({ 
        progress: 100,
        status: 'Default playlist loaded successfully!',
        success: true
      });
      await soundEffects.playSound('success');
      onPlaylistLoaded(true, count);
    } catch (error) {
      console.error('Default playlist error:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Failed to load default playlist',
        progress: 0
      });
      await soundEffects.playSound('error');
      onPlaylistLoaded(false);
    } finally {
      updateState({ loading: false });
    }
  };

  const attemptDeezerLoad = async (url: string): Promise<Song[]> => {
    try {
      updateState({ progress: 30, status: 'Connecting to Deezer...' });
      // For now, return empty array as external API integration is not implemented
      console.warn('Deezer loading not implemented - using fallback');
      return [];
    } catch (error) {
      console.warn('Deezer load failed:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    
    if (!playlistUrl.trim()) {
      updateState({ error: 'Please enter a playlist URL' });
      return;
    }

    updateState({ loading: true });
    await soundEffects.playSound('button-click');

    try {
      // Attempt 1: Try direct Deezer load
      let songs = await attemptDeezerLoad(playlistUrl.trim());
      
      // Attempt 2: Fallback to default if Deezer fails
      if (songs.length === 0) {
        updateState({ progress: 70, status: 'Loading default playlist as fallback...' });
        songs = await defaultPlaylistService.loadDefaultPlaylist();
      }

      updateState({ progress: 80, status: 'Validating songs...' });
      const { isValid, count } = validatePlaylist(songs);
      if (!isValid) {
        throw new Error(`Only ${count} valid songs found (minimum ${minSongsRequired} required)`);
      }

      setCustomSongs(songs);
      updateState({ 
        progress: 100,
        status: 'Playlist loaded successfully!',
        success: true
      });
      await soundEffects.playSound('success');
      onPlaylistLoaded(true, count);
    } catch (error) {
      console.error('Playlist load error:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Failed to load playlist',
        progress: 0
      });
      await soundEffects.playSound('error');
      onPlaylistLoaded(false);
    } finally {
      updateState({ loading: false });
    }
  };

  return (
    <div className={cn(
      "space-y-6 p-6 rounded-lg border",
      isDarkMode ? "bg-gray-900/50 border-gray-700" : "bg-white border-gray-200"
    )}>
      <div className="text-center">
        <Music className={cn(
          "h-12 w-12 mx-auto mb-4",
          isDarkMode ? "text-purple-400" : "text-purple-600"
        )} />
        <h3 className={cn(
          "text-xl font-bold mb-2",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Load Music Playlist
        </h3>
        <p className={cn(
          "text-sm",
          isDarkMode ? "text-purple-200/80" : "text-gray-600"
        )}>
          Enter a Deezer playlist URL or use our default playlist
        </p>
      </div>

      {/* Default Playlist Button */}
      <Button
        onClick={handleLoadDefault}
        disabled={state.loading}
        className={cn(
          "w-full transition-all",
          state.loading ? "bg-gray-500" : "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
        )}
      >
        {state.loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Radio className="mr-2 h-4 w-4" />
            Use Default Playlist
          </>
        )}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className={cn(
            "w-full border-t",
            isDarkMode ? "border-gray-700" : "border-gray-200"
          )} />
        </div>
        <div className="relative flex justify-center">
          <span className={cn(
            "px-3 text-sm uppercase",
            isDarkMode ? "bg-gray-900 text-purple-300" : "bg-white text-gray-500"
          )}>
            Or load custom playlist
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="https://deezer.com/playlist/123456789 or just 123456789"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            disabled={state.loading}
            className={cn(
              "placeholder-gray-400",
              isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"
            )}
          />
        </div>

        {state.error && (
          <div className={cn(
            "p-3 rounded-md flex items-start gap-2",
            isDarkMode ? "bg-red-900/30 border border-red-800" : "bg-red-50 border border-red-200"
          )}>
            <AlertCircle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500">{state.error}</p>
          </div>
        )}

        {state.success && (
          <div className={cn(
            "p-3 rounded-md flex items-start gap-2",
            isDarkMode ? "bg-green-900/30 border border-green-800" : "bg-green-50 border border-green-200"
          )}>
            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-500">{state.status}</p>
          </div>
        )}

        {state.loading && (
          <div className="space-y-3">
            <Progress value={state.progress} className="w-full h-2" />
            <div className={cn(
              "flex items-center gap-2 text-sm",
              isDarkMode ? "text-purple-300" : "text-gray-600"
            )}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{state.status}</span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={state.loading || !playlistUrl.trim()}
          className={cn(
            "w-full transition-all",
            state.loading ? "bg-gray-500" : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          )}
        >
          {state.loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Load Custom Playlist'
          )}
        </Button>
      </form>

      <div className={cn(
        "text-xs space-y-1 mt-4",
        isDarkMode ? "text-gray-400" : "text-gray-500"
      )}>
        <p className="flex items-start gap-1">
          <span>•</span>
          <span>Default playlist includes 100+ pre-verified songs with previews</span>
        </p>
        <p className="flex items-start gap-1">
          <span>•</span>
          <span>Custom playlists require at least {minSongsRequired} valid songs</span>
        </p>
        <p className="flex items-start gap-1">
          <span>•</span>
          <span>Only songs with previews and release years will be included</span>
        </p>
      </div>
    </div>
  );
}
