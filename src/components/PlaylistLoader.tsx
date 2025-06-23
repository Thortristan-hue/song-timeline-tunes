
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Music, Loader2 } from 'lucide-react';
import { Song } from '@/types/game';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { deezerLoader } from '@/utils/deezerLoader';

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

  const handleLoadDefault = async () => {
    setLoading(true);
    setError('');
    setProgress(0);
    setStatus('Loading default playlist...');

    try {
      setProgress(25);
      setStatus('Fetching fresh preview URLs...');
      
      const songs = await defaultPlaylistService.loadDefaultPlaylist();
      
      if (!songs?.length) {
        setError('No valid songs found in default playlist.');
        onPlaylistLoaded(false);
        return;
      }

      setCustomSongs(songs);
      setStatus('Default playlist loaded successfully!');
      setProgress(100);
      onPlaylistLoaded(true);
    } catch (error) {
      console.error('Default playlist load error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load default playlist');
      onPlaylistLoaded(false);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playlistUrl.trim()) {
      setError('Please enter a Deezer playlist URL');
      return;
    }

    // Use the improved validation from deezerLoader
    if (!deezerLoader.isValidDeezerUrl(playlistUrl.trim())) {
      setError('Please enter a valid Deezer playlist URL. Supported formats: deezer.com/playlist/ID or just the playlist ID number');
      return;
    }

    setLoading(true);
    setError('');
    setProgress(0);
    setStatus('Loading playlist...');

    try {
      setStatus('Fetching playlist tracks...');
      setProgress(25);
      
      // Try to load directly from Deezer first
      let songs: Song[] = [];
      
      try {
        songs = await deezerLoader.loadPlaylist(playlistUrl.trim());
        setProgress(75);
        setStatus('Processing songs...');
      } catch (deezerError) {
        console.log('Direct Deezer load failed, trying song service:', deezerError);
        // Fallback to songService if direct Deezer fails
        const { songService } = await import('@/services/songService');
        setStatus('Fetching playlist tracks via fallback...');
        setProgress(50);
        songs = await songService.loadPlaylist(playlistUrl.trim());
        setProgress(75);
        setStatus('Processing songs...');
      }
  
      if (!songs?.length) {
        setError('No valid songs found in playlist.');
        onPlaylistLoaded(false);
        return;
      }

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
          Load Music Playlist
        </h3>
        <p className={isDarkMode ? 'text-purple-200/80' : 'text-gray-600'}>
          Use the default playlist or enter a Deezer playlist URL
        </p>
      </div>

      {/* Default Playlist Button */}
      <Button
        onClick={handleLoadDefault}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white py-3"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading Default Playlist...
          </>
        ) : (
          'Use Default Playlist (Fast)'
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className={`px-2 ${isDarkMode ? 'bg-slate-900 text-purple-200/60' : 'bg-white text-gray-500'}`}>
            Or load custom playlist
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="https://www.deezer.com/playlist/123456789 or just 123456789"
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
              Loading Custom Playlist...
            </>
          ) : (
            'Load Custom Playlist'
          )}
        </Button>
      </form>

      <div className={`text-xs space-y-1 ${isDarkMode ? 'text-purple-200/60' : 'text-gray-500'}`}>
        <p>• Default playlist includes curated songs with fresh preview URLs</p>
        <p>• Custom playlists accept: deezer.com/playlist/ID or just the playlist ID number</p>
        <p>• Only songs with valid metadata and release dates will be included</p>
      </div>
    </div>
  );
}
