
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2 } from 'lucide-react';

interface PlaylistLoaderProps {
  onPlaylistLoaded: (success: boolean) => void;
  setCustomSongs: (songs: Song[]) => void;
  isDarkMode: boolean;
}

export default function PlaylistLoader({ onPlaylistLoaded, isDarkMode }: PlaylistLoaderProps) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playlistUrl.trim()) {
      setError('Please enter a Deezer playlist URL');
      return;
    }

    if (!playlistUrl.includes('deezer.com/en/playlist/')) {
      setError('Please enter a valid Deezer playlist URL');
      return;
    }

    setLoading(true);
    setError('');
    setProgress(0);
    setStatus('Loading playlist...');

    try {
      const { songService } = await import('@/services/songService');
      setStatus('Fetching playlist tracks...');
      setProgress(25);
  
      const songs = await songService.loadPlaylist(playlistUrl);
  
      if (!songs.length) {
        setError('No valid songs found in playlist.');
        onPlaylistLoaded(false);
        return;
      }
      setCustomSongs(songs); // <-- THIS IS THE KEY LINE
  
      setStatus('Playlist loaded successfully!');
      setProgress(100);
      setTimeout(() => onPlaylistLoaded(true), 500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load playlist');
      onPlaylistLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Music className="h-12 w-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Load Deezer Playlist</h3>
        <p className="text-purple-200/80">
          Enter a Deezer playlist URL to automatically fetch songs with enhanced metadata
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="url"
            placeholder="https://www.deezer.com/playlist/123456789"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            disabled={loading}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <div className="flex items-center gap-2 text-white/80">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{status}</span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !playlistUrl.trim()}
          className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600"
        >
          {loading ? 'Loading Playlist...' : 'Load Playlist'}
        </Button>
      </form>

      <div className="text-xs text-purple-200/60 space-y-1">
        <p>• Songs will be enhanced with release dates from MusicBrainz and Discogs</p>
        <p>• Only songs with valid metadata and preview will be included</p>
        <p>• This process may take a few moments due to API rate limits</p>
      </div>
    </div>
  );
}
