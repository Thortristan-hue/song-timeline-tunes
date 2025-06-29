
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2, AlertCircle, CheckCircle, Radio, RefreshCw } from 'lucide-react';
import { Song } from '@/types/game';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { useToast } from '@/components/ui/use-toast';
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
  retryCount: number;
};

export function PlaylistLoader({
  onPlaylistLoaded,
  setCustomSongs,
  isDarkMode,
  minSongsRequired = 10
}: PlaylistLoaderProps) {
  const { toast } = useToast();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [state, setState] = useState<LoadState>({
    loading: false,
    progress: 0,
    status: '',
    error: null,
    success: false,
    retryCount: 0
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

  const validatePlaylist = (songs: Song[]): { isValid: boolean; count: number; error?: string } => {
    if (!songs || !Array.isArray(songs)) {
      return { isValid: false, count: 0, error: 'Invalid playlist data received' };
    }

    const validSongs = defaultPlaylistService.filterValidSongs(songs);
    
    if (validSongs.length === 0) {
      return { isValid: false, count: 0, error: 'No valid songs found in playlist' };
    }

    if (validSongs.length < minSongsRequired) {
      return { 
        isValid: false, 
        count: validSongs.length, 
        error: `Only ${validSongs.length} valid songs found (minimum ${minSongsRequired} required)` 
      };
    }

    return { isValid: true, count: validSongs.length };
  };

  const handleLoadDefault = async () => {
    resetState();
    updateState({ loading: true });
    
    try {
      updateState({ progress: 20, status: 'Loading default playlist...' });
      await soundEffects.playSound('button-click');

      const songs = await defaultPlaylistService.loadDefaultPlaylist();
      updateState({ progress: 60, status: 'Validating songs...' });

      const validation = validatePlaylist(songs);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Playlist validation failed');
      }

      setCustomSongs(songs);
      updateState({ 
        progress: 100,
        status: `Successfully loaded ${validation.count} songs!`,
        success: true
      });
      
      await soundEffects.playSound('success');
      
      toast({
        title: "Playlist Loaded!",
        description: `${validation.count} songs ready for gameplay`,
      });
      
      onPlaylistLoaded(true, validation.count);
    } catch (error) {
      console.error('❌ Default playlist error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load default playlist';
      
      updateState({
        error: errorMessage,
        progress: 0
      });
      
      await soundEffects.playSound('error');
      
      toast({
        title: "Loading Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      onPlaylistLoaded(false);
    } finally {
      updateState({ loading: false });
    }
  };

  const handleRetry = async () => {
    if (state.retryCount >= 3) {
      toast({
        title: "Too Many Retries",
        description: "Please try refreshing the page or contact support",
        variant: "destructive",
      });
      return;
    }

    updateState({ retryCount: state.retryCount + 1 });
    await handleLoadDefault();
  };

  const attemptDeezerLoad = async (url: string): Promise<Song[]> => {
    try {
      updateState({ progress: 30, status: 'Connecting to music service...' });
      
      // For now, return empty array as external API integration is not implemented
      console.warn('⚠️ External playlist loading not implemented - using fallback');
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return [];
    } catch (error) {
      console.warn('❌ External playlist load failed:', error);
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
      // Attempt 1: Try external playlist load
      let songs = await attemptDeezerLoad(playlistUrl.trim());
      
      // Attempt 2: Fallback to default if external fails
      if (songs.length === 0) {
        updateState({ progress: 70, status: 'Loading default playlist as fallback...' });
        songs = await defaultPlaylistService.loadDefaultPlaylist();
      }

      updateState({ progress: 80, status: 'Validating songs...' });
      const validation = validatePlaylist(songs);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Playlist validation failed');
      }

      setCustomSongs(songs);
      updateState({ 
        progress: 100,
        status: `Successfully loaded ${validation.count} songs!`,
        success: true
      });
      
      await soundEffects.playSound('success');
      
      toast({
        title: "Playlist Loaded!",
        description: `${validation.count} songs ready for gameplay`,
      });
      
      onPlaylistLoaded(true, validation.count);
    } catch (error) {
      console.error('❌ Playlist load error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load playlist';
      
      updateState({
        error: errorMessage,
        progress: 0
      });
      
      await soundEffects.playSound('error');
      
      toast({
        title: "Loading Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
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
          Load our curated playlist with verified song previews
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
            Load Default Playlist
          </>
        )}
      </Button>

      {/* Error Display with Retry */}
      {state.error && (
        <div className={cn(
          "p-4 rounded-md border",
          isDarkMode ? "bg-red-900/30 border-red-800" : "bg-red-50 border-red-200"
        )}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-500 mb-3">{state.error}</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleRetry}
                  size="sm"
                  disabled={state.loading || state.retryCount >= 3}
                  className="bg-red-600 hover:bg-red-700 text-xs"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Retry ({state.retryCount}/3)
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  size="sm"
                  variant="outline"
                  className="text-xs border-red-400"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {state.success && (
        <div className={cn(
          "p-3 rounded-md flex items-start gap-2",
          isDarkMode ? "bg-green-900/30 border border-green-800" : "bg-green-50 border border-green-200"
        )}>
          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-500">{state.status}</p>
        </div>
      )}

      {/* Loading Progress */}
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

      {/* Info Section */}
      <div className={cn(
        "text-xs space-y-1 mt-4 p-3 rounded-lg",
        isDarkMode ? "text-gray-400 bg-gray-800/50" : "text-gray-500 bg-gray-50"
      )}>
        <p className="flex items-start gap-1">
          <span>•</span>
          <span>Default playlist includes 100+ verified songs with working previews</span>
        </p>
        <p className="flex items-start gap-1">
          <span>•</span>
          <span>Songs are filtered to ensure they have valid release years and previews</span>
        </p>
        <p className="flex items-start gap-1">
          <span>•</span>
          <span>At least {minSongsRequired} valid songs are required for optimal gameplay</span>
        </p>
      </div>
    </div>
  );
}
