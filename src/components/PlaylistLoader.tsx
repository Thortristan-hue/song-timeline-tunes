import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2 } from 'lucide-react';
import { Song } from '@/types/game'; // Import the Song type

interface PlaylistLoaderProps {
  onPlaylistLoaded: (success: boolean) => void;
  setCustomSongs: (songs: Song[]) => void;
  isDarkMode: boolean;
}

export function PlaylistLoader({ 
  onPlaylistLoaded, 
  setCustomSongs,
  isDarkMode 
}: PlaylistLoaderProps) {
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

    if (!playlistUrl.includes('deezer.com/playlist/')) {
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
  
      if (!songs?.length) {
        setError('No valid songs found in playlist.');
        onPlaylistLoaded(false);
        return;
      }

      // Validate songs structure before setting
      if (songs.every(song => song.id && song.deezer_title)) {
        setCustomSongs(songs);
        setStatus('Playlist loaded successfully!');
        setProgress(100);
        onPlaylistLoaded(true);
      } else {
        throw new Error('Invalid song data structure received');
      }
    } catch (error) {
      console.error('Playlist load error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load playlist');
      onPlaylistLoaded(false);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Music className="h-12 w-12 text-purple-400 mx-auto mb-4" />
        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Load Deezer Playlist
        </h3>
        <p className={isDarkMode ? 'text-purple-200/80' : 'text-gray-600'}>
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
            className={`${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} placeholder:text-muted-foreground`}
          />
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <div className={`flex items-center gap-2 ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
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
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Playlist...
            </>
          ) : (
            'Load Playlist'
          )}
        </Button>
      </form>

      <div className={`text-xs space-y-1 ${isDarkMode ? 'text-purple-200/60' : 'text-gray-500'}`}>
        <p>• Songs will be enhanced with release dates from MusicBrainz and Discogs</p>
        <p>• Only songs with valid metadata and preview will be included</p>
        <p>• This process may take a few moments due to API rate limits</p>
      </div>
    </div>
  );
}