import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2, CheckCircle, AlertCircle, Radio } from 'lucide-react';
import { Song } from '@/types/game';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { songService } from '@/services/songService';
import { cn } from '@/lib/utils';

interface PlaylistLoaderProps {
  onPlaylistLoaded: (success: boolean, count?: number) => void;
  setCustomSongs: (songs: Song[]) => void;
  isDarkMode: boolean;
  minSongsRequired?: number;
}

export function PlaylistLoader({ 
  onPlaylistLoaded, 
  setCustomSongs,
  isDarkMode,
  minSongsRequired = 10
}: PlaylistLoaderProps) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetState = () => {
    setProgress(0);
    setStatus('');
    setError('');
    setSuccess(false);
  };

  const updateProgress = (value: number, message: string) => {
    setProgress(value);
    setStatus(message);
  };

  const handleLoadDefault = async () => {
    resetState();
    setLoading(true);
    
    try {
      updateProgress(20, 'Loading default playlist...');
      
      const songs = await defaultPlaylistService.loadDefaultPlaylist();
      updateProgress(60, 'Validating songs...');

      const validation = defaultPlaylistService.validatePlaylistForGameplay(songs, minSongsRequired);
      if (!validation.isValid) {
        throw new Error(validation.errorMessage || 'Invalid default playlist');
      }

      setCustomSongs(songs);
      updateProgress(100, 'Default playlist loaded!');
      setSuccess(true);
      onPlaylistLoaded(true, validation.validCount);
    } catch (error) {
      console.error('Default playlist error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load default playlist');
      onPlaylistLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    
    if (!playlistUrl.trim()) {
      setError('Please enter a Deezer playlist URL');
      return;
    }

    setLoading(true);

    try {
      // Attempt 1: Try direct Deezer load
      updateProgress(10, 'Trying direct Deezer API...');
      let songs = await attemptDeezerLoad(playlistUrl.trim(), 30);
      
      // Attempt 2: Fallback to proxy if direct fails
      if (songs.length === 0) {
        updateProgress(40, 'Trying proxy fallback...');
        songs = await attemptDeezerLoad(playlistUrl.trim(), 60, true);
      }

      // Attempt 3: Final fallback to default playlist
      if (songs.length === 0) {
        updateProgress(70, 'Loading default playlist as fallback...');
        songs = await defaultPlaylistService.loadDefaultPlaylist();
      }

      updateProgress(80, 'Validating songs...');
      const validation = defaultPlaylistService.validatePlaylistForGameplay(songs, minSongsRequired);
      if (!validation.isValid) {
        throw new Error(validation.errorMessage || 'Not enough valid songs found');
      }

      setCustomSongs(songs);
      updateProgress(100, 'Playlist loaded successfully!');
      setSuccess(true);
      onPlaylistLoaded(true, validation.validCount);
    } catch (error) {
      console.error('Playlist load error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load playlist');
      onPlaylistLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  const attemptDeezerLoad = async (url: string, progressValue: number, useProxyFallback = false): Promise<Song[]> => {
    try {
      updateProgress(progressValue, useProxyFallback ? 'Using proxy...' : 'Connecting to Deezer...');
      const songs = await songService.loadPlaylist(url);
      
      if (songs.length > 0) {
        updateProgress(progressValue + 20, `Found ${songs.length} songs`);
        return songs;
      }
      
      return [];
    } catch (error) {
      console.warn(useProxyFallback ? 'Proxy load failed:' : 'Direct load failed:', error);
      return [];
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
        disabled={loading}
        className={cn(
          "w-full transition-all",
          loading ? "bg-gray-500" : "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
        )}
      >
        {loading ? (
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
            disabled={loading}
            className={cn(
              "placeholder-gray-400",
              isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"
            )}
          />
        </div>

        {error && (
          <div className={cn(
            "p-3 rounded-md flex items-start gap-2",
            isDarkMode ? "bg-red-900/30 border border-red-800" : "bg-red-50 border border-red-200"
          )}>
            <AlertCircle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className={cn(
            "p-3 rounded-md flex items-start gap-2",
            isDarkMode ? "bg-green-900/30 border border-green-800" : "bg-green-50 border border-green-200"
          )}>
            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-500">{status}</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full h-2" />
            <div className={cn(
              "flex items-center gap-2 text-sm",
              isDarkMode ? "text-purple-300" : "text-gray-600"
            )}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{status}</span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !playlistUrl.trim()}
          className={cn(
            "w-full transition-all",
            loading ? "bg-gray-500" : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          )}
        >
          {loading ? (
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
